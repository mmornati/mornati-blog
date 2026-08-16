#!/usr/bin/env python3
"""P1 migration script: Hashnode GitHub-backup export -> Hugo/Blowfish content tree.

What it does
------------
* reads every `*.md` from a `blog-posts` export directory (clones it from GitHub if needed),
* parses the Hashnode YAML front matter,
* detects the language of each post (en / it / fr),
* downloads every remote image (Body + cover) and stores it under `static/images/`,
* rewrites markdown image references to local paths,
* applies a best-effort cleanup of old Medium-era HTML,
* writes Hugo content as page bundles:

    content/en/posts/<slug>/index.md     ->  https://blog.mornati.net/<slug>/
    content/it/posts/<slug>/index.md     ->  https://blog.mornati.net/it/<slug>/ (alias /<slug>)
    content/fr/posts/<slug>/index.md     ->  https://blog.mornati.net/fr/<slug>/ (alias /<slug>)

Covers (the featured image) keep their full-res local copy inside the post bundle so the
Blowfish theme uses them as thumbnails. Body images land in `static/images/<slug>/` and are
later uploaded to Cloudinary by the CI pipeline (public_id = `blog/<relpath>`).

Usage
-----
    python3 scripts/migrate.py [--input PATH] [--output content] [--workers 16]

Prints a summary and writes `build/migration-report.json` + `build/failures-*.log`.
"""

from __future__ import annotations

import argparse
import base64
import datetime
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from email.message import Message
from pathlib import Path
from urllib.parse import urlparse

try:
    import yaml
except ImportError:
    yaml = None

ROOT = Path(__file__).resolve().parent.parent
BLOG_POSTS_URL = "https://github.com/mmornati/blog-posts.git"

# Remote image hosts we treat as hotlinked assets regardless of file extension.
IMAGE_HOSTS = {
    "cdn.hashnode.com",
    "miro.medium.com",
    "media.licdn.com",
    "www.educative.io",
}
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".avif", ".tiff", ".bmp"}

CT_TO_EXT = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/avif": ".avif",
    "image/tiff": ".tiff",
    "image/bmp": ".bmp",
}

UA = "Mozilla/5.0 (compatible; MornatiBlog-Migration/1.0; +https://blog.mornati.net)"

# ---------------------------------------------------------------- language detection

# Token -> weight used by a naive scorer. Good enough to separate EN/IT/FR originals.
LANG_TOKENS = {
    "it": {
        "il": 3, "lo": 2, "la": 2, "le": 2, "gli": 3, "del": 2, "dello": 2, "della": 3,
        "dei": 2, "delle": 2, "nel": 2, "nella": 3, "su": 1, "per": 1, "che": 1, "con": 1,
        "sono": 3, "essere": 3, "anche": 3, "dove": 2, "questo": 3, "questa": 3,
        "perché": 3, "quando": 2, "come": 1, "è": 2, "più": 3, "tramite": 3, "utilizzo": 3,
        "nostro": 3, "nostra": 3, "c'è": 4, "può": 3, "essere": 3,
    },
    "fr": {
        "le": 3, "la": 2, "les": 3, "des": 2, "du": 2, "de": 1, "un": 1, "une": 2, "ce": 1,
        "cette": 3, "ces": 2, "et": 1, "est": 3, "sont": 3, "avec": 2, "pour": 2, "dans": 2,
        "qui": 2, "que": 1, "pas": 2, "mais": 3, "il": 1, "elle": 2, "nous": 3, "vous": 3,
        "je": 1, "c'est": 4, "ne": 1, "plus": 2, "être": 3, "avez": 3, "très": 2, "peut": 2,
    },
    "en": {
        "the": 3, "and": 2, "to": 1, "of": 1, "is": 1, "in": 1, "for": 1, "with": 2,
        "that": 2, "this": 2, "are": 1, "it's": 3, "was": 2, "have": 2, "you": 2,
        "from": 1, "your": 3, "our": 3, "we": 1, "on": 1, "how": 2, "not": 1,
    },
}


def detect_language(text: str) -> str:
    """Return 'it', 'fr' or 'en'. Heuristic, not perfect — review by hand afterwards."""
    sample = text.lower()
    # Sample the beginning (title) and a chunk of the body.
    sample = sample[:2500] + " " + sample[-1500:]
    scores = {lang: 0 for lang in LANG_TOKENS}
    for lang, tokens in LANG_TOKENS.items():
        for token, weight in tokens.items():
            scores[lang] += weight * sample.count(f" {token} ")
    ranked = sorted(scores.items(), key=lambda kv: -kv[1])
    best, best_score = ranked[0]
    second_score = ranked[1][1]
    # A confident-enough winner; otherwise assume English by default.
    if best_score >= 3 and best_score > second_score * 1.4:
        return best
    return "en"


# ---------------------------------------------------------------- content cleanup

def file_to_yaml(front: dict, body: str, lang: str, slug: str) -> str:
    """Serialize the Hugo front matter + body as a YAML-frontmatter markdown file."""
    fm = {}
    if front.get("title"):
        fm["title"] = front["title"]
    desc = front.get("seoDescription") or front.get("description") or ""
    if desc:
        fm["description"] = desc
    fm["date"] = normalize_date(front.get("datePublished") or cuid_date(slug))
    fm["slug"] = slug
    tags = front.get("tags") or []
    if tags:
        fm["tags"] = tags
    if lang != "en":
        fm["url"] = f"/{lang}/{slug}/"
        fm["aliases"] = [f"/{slug}"]
    header = {}
    header.update(fm)
    body = cleanup_body(body)
    rendered = yaml.safe_dump(header, allow_unicode=True, sort_keys=False).strip()
    return f"---\n{rendered}\n---\n\n{body.rstrip()}\n"


def cleanup_body(body: str) -> str:
    """Best-effort cleanup of Medium-era HTML found in old posts."""
    body = re.sub(r"Originally published at.*?\.medium\.com.*?$", "", body, flags=re.M | re.S)
    body = re.sub(r"\s*<noscript>(.*?)</noscript>", r"\1", body, flags=re.S)
    body = re.sub(r"<a name=\"[^\"]*\"></a>", "", body, flags=re.I)
    body = re.sub(r"<span class=\"s\"></span>", "", body)
    body = re.sub(r"<span class=\"jw--\"></span>", "", body)
    body = re.sub(r"<figcaption(?:\s[^>]*)?></figcaption>", "", body, flags=re.I)

    def img_to_md(m: "re.Match[str]") -> str:
        attrs = m.group(0)
        src = re.search(r'src\s*=\s*"([^"]+)"', attrs, flags=re.I)
        alt = re.search(r'alt\s*=\s*"([^"]*)"', attrs, flags=re.I)
        if not src:
            return m.group(0)
        return f"![{alt.group(1) if alt else ''}]({src.group(1)})"

    # Convert raw HTML <img> tags to markdown so the downloader can find them.
    body = re.sub(r"<img\b[^>]*>", img_to_md, body, flags=re.I)
    return body


IMAGE_MD_RE = re.compile(r"!\[([^\]]*)\]\(([^)]+)\)")


def normalize_image_url(raw: str) -> str:
    """Strip any trailing HTML-ish junk (e.g. ` align="left"`) that Hashnode appended
    to markdown image destinations, so only the real URL is used."""
    return raw.strip().rstrip("\\").split()[0]


def iter_markdown_images(body: str) -> "list[tuple[str, str, str]]":
    """Return list of (alt, url, whole_match) for every markdown image un URL local."""
    out = []
    for m in IMAGE_MD_RE.finditer(body):
        out.append((m.group(1), normalize_image_url(m.group(2)), m.group(0)))
    return out


def is_remote_image(url: str) -> bool:
    try:
        u = urlparse(url)
    except Exception:
        return False
    if not u.scheme or not u.netloc:
        return False
    if u.netloc in IMAGE_HOSTS:
        return True
    path = u.path.lower()
    if path.endswith((".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp")):
        return True
    return any(qparam in url for qparam in ("hashnode/image", "/image/upload/"))


# ---------------------------------------------------------------- downloads

class Downloader:
    """Thread-safe image downloader with global URL dedupe."""

    def __init__(self, base: Path, workers: int, report: dict, failures: list):
        self.base = base
        self.report = report
        self.failures = failures
        self.url_to_path: "dict[str, str]" = {}
        self.seen_slug_files: "set[Path]" = set()
        self._pool = ThreadPoolExecutor(max_workers=workers)
        self.lock = __import__("threading").Lock()

    def _fname(self, url: str, slug: str, idx: int) -> "tuple[Path, str]":
        u = urlparse(url)
        name = os.path.basename(u.path)
        name = re.sub(r"[^A-Za-z0-9._-]", "_", name)
        ext = os.path.splitext(name)[1].lower()
        if ext not in IMAGE_EXT:
            ext = ".img"
        if not name or name.startswith("."):
            name = "image" + ext
        target = self.base / slug / f"{idx:02d}-{name}"
        candidate = target
        n = 1
        while candidate in self.seen_slug_files:
            candidate = target.with_name(f"{target.stem}-{n}{target.suffix}")
            n += 1
        return candidate, f"/images/{slug}/{candidate.name}"

    def download_many(self, urls: "list[str]", slug: str) -> "dict[str, str]":
        """Download a batch of URLs concurrently.

        Returns a mapping url -> local web path. URLs already downloaded (earlier posts)
        resolve instantly from the cache; failures keep the original remote URL.
        """
        result: "dict[str, str]" = {}
        todo: "list[str]" = []
        with self.lock:
            seen = set()
            for url in urls:
                if url in self.url_to_path:
                    result[url] = self.url_to_path[url]
                elif url not in seen:
                    seen.add(url)
                    todo.append(url)
        if todo:
            pairs = [(u, i) for i, u in enumerate(todo)]
            for url, web in self._pool.map(lambda p: self._download_one(p[0], slug, p[1]), pairs):
                result[url] = web
        return result

    def _download_one(self, url: str, slug: str, idx: int) -> "tuple[str, str]":
        """Download one image. Returns (url, local web path) — original URL kept on failure."""
        try:
            dest, web = self._fname(url, slug, idx)
            dest.parent.mkdir(parents=True, exist_ok=True)
            if dest.exists() and dest.stat().st_size > 0:
                with self.lock:
                    self.url_to_path[url] = web
                return (url, web)
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as resp:
                ctype = resp.headers.get("Content-Type", "")
                data = resp.read()
            if not data:
                raise ValueError("empty response")
            actual_ext = CT_TO_EXT.get(ctype.split(";")[0].strip())
            if actual_ext and dest.suffix not in IMAGE_EXT:
                dest = dest.with_suffix(actual_ext)
                web = f"/images/{slug}/{dest.name}"
            dest.write_bytes(data)
            with self.lock:
                self.url_to_path[url] = web
                self.seen_slug_files.add(dest)
                self.report["images_downloaded"] += 1
            return (url, web)
        except Exception as exc:  # noqa: BLE001
            with self.lock:
                self.failures.append({"slug": slug, "url": url, "error": str(exc)})
                self.report["images_failed"] += 1
            return (url, url)
            return url

    def fetch_cover(self, url: str, content_dir: Path) -> "Path | None":
        """Download the cover into the post bundle (local page resource)."""
        content_dir.mkdir(parents=True, exist_ok=True)
        cover = content_dir / "cover"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read()
                ctype = resp.headers.get("Content-Type", "")
            if not data:
                return None
            ext = CT_TO_EXT.get(ctype.split(";")[0].strip(), "")
            if not ext:
                ext = os.path.splitext(urlparse(url).path)[1].lower()
                if ext not in IMAGE_EXT:
                    ext = ".jpg"
            dest = cover.with_suffix(ext)
            dest.write_bytes(data)
            return dest
        except Exception as exc:  # noqa: BLE001
            self.failures.append({
                "slug": content_dir.name,
                "kind": "cover",
                "url": url,
                "error": str(exc),
            })
            self.report["covers_failed"] += 1
            return None

    def close(self):
        self._pool.shutdown(wait=True)


# ---------------------------------------------------------------- main

def parse_frontmatter(text: str) -> "tuple[dict, str]":
    """Return (frontmatter dict, body) for a Hashnode export file."""
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            fm = parts[1]
            body = parts[2]
            if yaml is not None:
                try:
                    data = yaml.safe_load(fm) or {}
                    return data, body
                except Exception:
                    return _tolerant_frontmatter(fm), body
            return {}, body
    return {}, text


def _tolerant_frontmatter(block: str) -> dict:
    """Best-effort scalar front matter parse for exports with unescaped quotes.

    Hashnode sometimes writes `title: "foo "bar""` which is not valid YAML.
    Fall back to a line scan for the flat scalar keys we care about.
    """
    out = {}
    for line in block.splitlines():
        m = re.match(r"^\s*([A-Za-z][A-Za-z0-9_-]*)\s*:\s*", line)
        if not m:
            continue
        key = m.group(1)
        value = line[m.end():].strip()
        if not value:
            out[key] = ""
            continue
        if value.startswith('"') and value.endswith('"') and len(value) >= 2:
            value = value[1:-1]
        if key not in ("title", "seoTitle", "seoDescription", "slug", "did"):
            value = value.strip(",")
        out[key] = value
    return out


def slugify(text: str) -> str:
    """ASCII url-slug for deriving slugs from titles (fallback only)."""
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def cuid_date(cuid: str) -> str:
    """Approximate publish date from a Hashnode cuid timestamp (fallback)."""
    try:
        ms = int(cuid[1:9], 36)
        return datetime.datetime.fromtimestamp(ms / 1000, datetime.timezone.utc).strftime(
            "%Y-%m-%dT%H:%M:%S.000000+00:00"
        )
    except Exception:
        return "2000-01-01T00:00:00.000000+00:00"


_JS_DATE_RE = re.compile(
    r"^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s*"
    r"(\w{3})\s+(\d{1,2})\s+(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\s+GMT([+-]\d{2})(\d{2})$"
)


def normalize_date(val) -> str:
    """Return a Hugo-parsable RFC3339-like date string from any Hashnode format.

    Accepts ISO-8601 strings, datetime objects, and the JS `Date.toString()`
    style (`Wed Feb 25 2026 12:30:56 GMT+0000 (Coordinated Universal Time)`).
    """
    if not val:
        return ""
    if getattr(val, "isoformat", None):
        return val.isoformat()
    s = str(val).strip()
    s = re.sub(r"\s*\([^)]*\)\s*$", "", s)  # drop " (Coordinated Universal Time)"
    try:
        return datetime.datetime.fromisoformat(s).astimezone(
            datetime.timezone.utc).isoformat()
    except ValueError:
        pass
    m = _JS_DATE_RE.match(s)
    if m:
        mon, day, year, hh, mm, ss, tzH, tzM = m.groups()
        months = {mo: i for i, mo in enumerate(
            ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep",
             "Oct", "Nov", "Dec"], 1)}
        if mon in months:
            offset = datetime.timedelta(hours=int(tzH), minutes=int(tzM))
            dt = datetime.datetime(int(year), months[mon], int(day), int(hh),
                                   int(mm), int(ss), tzinfo=datetime.timezone(offset))
            return dt.isoformat()
    return ""


def parse_tags(raw) -> "list[str]":
    if isinstance(raw, list):
        return [str(t).strip() for t in raw if str(t).strip()]
    if isinstance(raw, str):
        return [t.strip() for t in re.split(r"[,|•;]", raw) if t.strip()]
    return []


def migrate_file(path: Path, out_root: Path, images_root: Path, dl: Downloader, report: dict):
    text = path.read_text(encoding="utf-8", errors="replace")
    if not text.startswith("---"):
        try:
            decoded = base64.b64decode(text.strip()).decode("utf-8", errors="replace")
            if "#" in decoded[:400]:
                text = decoded
        except Exception:
            pass
    front, body = parse_frontmatter(text)
    title = front.get("title") or ""
    if not title:
        m = re.search(r"^\s*#{1,2}\s+(.+?)\s*$", body, re.M)
        title = m.group(1).strip() if m else ""
    slug = front.get("slug") or ""
    if not slug:
        slug = slugify(title) or path.stem
    date_pub = front.get("datePublished") or ""
    if not date_pub:
        date_pub = cuid_date(path.stem)
        report["dates_estimated"] = report.get("dates_estimated", 0) + 1
    date_pub = normalize_date(date_pub)
    if not slug or not title:
        report["skipped"].append({"file": str(path), "reason": "missing slug or title"})
        return
    lang = detect_language(f"{title}\n{body}")
    written = report.get("_written")
    if written is None:
        written = report["_written"] = set()
    key = (lang, slug)
    if key in written:
        report["skipped"].append({"file": str(path), "reason": "duplicate slug", "lang": lang,
                                  "slug": slug})
        return
    written.add(key)
    report["by_lang"][lang] = report["by_lang"].get(lang, 0) + 1

    out_dir = out_root / lang / "posts" / slug
    out_dir.mkdir(parents=True, exist_ok=True)

    body = cleanup_body(body)

    # 1) collect + download body images, then rewire markdown to local paths
    remote = [normalize_image_url(m.group(2)) for m in IMAGE_MD_RE.finditer(body) if
              is_remote_image(normalize_image_url(m.group(2)))]
    mapping = dl.download_many(remote, slug)

    def rewire(m):
        alt, url, whole = m.group(1), normalize_image_url(m.group(2)), m.group(0)
        if not is_remote_image(url):
            return whole
        return f"![{alt}]({mapping.get(url, url)})"

    body = IMAGE_MD_RE.sub(rewire, body)

    # 2) cover
    cover_url = (front.get("cover") or "").strip()
    if cover_url and is_remote_image(cover_url):
        dl.fetch_cover(cover_url, out_dir)

    # 3) write page bundle
    fm_front = {k: v for k, v in front.items()
                if k not in ("cuid", "seoTitle", "seoDescription", "cover", "datePublished",
                             "did", "vuid", "_dateEstimated", "_previewImage", "views",
                             "oldSlug", "slug")}
    fmt = getattr(date_pub, "isoformat", None)
    fm_front["date"] = fmt() if fmt else str(date_pub)
    fm_front["slug"] = slug
    fm_front["title"] = title
    if front.get("seoDescription"):
        fm_front["description"] = front["seoDescription"]
    tags = parse_tags(front.get("tags"))
    if tags:
        fm_front["tags"] = tags
    if lang != "en":
        fm_front["url"] = f"/{lang}/{slug}/"
        fm_front["aliases"] = [f"/{slug}"]
    header = yaml.safe_dump(fm_front, allow_unicode=True, sort_keys=False).strip()
    (out_dir / "index.md").write_text(f"---\n{header}\n---\n\n{body.rstrip()}\n", encoding="utf-8")
    report["posts_migrated"] += 1


def main(argv: "list[str] | None" = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--input", default=None, help="Path to a blog-posts export dir (cloned if missing)")
    ap.add_argument("--output", default=str(ROOT / "content"), help="Hugo content root")
    ap.add_argument("--images", default=str(ROOT / "static/images"),
                    help="Directory for downloaded body images (default static/images)")
    ap.add_argument("--workers", type=int, default=16, help="Concurrent image downloads")
    args = ap.parse_args(argv)

    inp: Path
    if args.input:
        inp = Path(args.input)
    else:
        inp = ROOT / "_raw" / "blog-posts"
    if not (inp / ".git").exists() and not any(inp.glob("*.md")):
        print(f"[migrate] cloning {BLOG_POSTS_URL} -> {inp}")
        inp.parent.mkdir(parents=True, exist_ok=True)
        if inp.exists() and inp.is_dir():
            shutil.rmtree(inp)
        subprocess.run(["git", "clone", "--depth", "1", BLOG_POSTS_URL, str(inp)], check=True)

    files = sorted(inp.glob("*.md"))
    if not files:
        print(f"[migrate] no *.md found in {inp}", file=sys.stderr)
        return 1

    out_root = Path(args.output)
    images_root = Path(args.images)
    report = {
        "input": str(inp),
        "posts_total": len(files),
        "posts_migrated": 0,
        "by_lang": {},
        "images_downloaded": 0,
        "images_failed": 0,
        "covers_failed": 0,
        "skipped": [],
    }
    failures: "list[dict]" = []
    dl = Downloader(images_root, args.workers, report, failures)

    for path in files:
        try:
            migrate_file(path, out_root, images_root, dl, report)
        except Exception as exc:  # noqa: BLE001
            report["skipped"].append({"file": str(path), "error": str(exc)})
    dl.close()

    report.pop("_written", None)
    (ROOT / "build").mkdir(exist_ok=True)
    (ROOT / "build" / "migration-report.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    (ROOT / "build" / "failures-images.log").write_text(
        "\n".join(f"{f['slug']}\t{f.get('kind','img')}\t{f['url']}\t{f['error']}" for f in failures),
        encoding="utf-8")

    print(json.dumps(report, indent=2, ensure_ascii=False))
    print(f"[migrate] failures logged to build/failures-images.log ({len(failures)})")
    return 0


if __name__ == "__main__":
    sys.exit(main())