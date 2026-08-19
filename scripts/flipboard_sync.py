#!/usr/bin/env python3
"""Backfill blog posts into Flipboard magazines (one per language).

Flipboard has no public API, so this drives the internal webapp endpoint used
by the "flip" bookmarklet:

    POST https://flipboard.com/api/v2/social/shareWithComment
    body:  {"url": <post url>, "target": "flipboard/mag-<magid>:m:<userid>",
            "service": "flipboard"}

The requests need the browser session: the `cookies` header string and the
`csrf-token` header value from your logged-in Flipboard session. The oauth2
access token in the cookies lasts ~1 year; when it expires the script exits
with a clear "refresh your cookies" message.

Magazines are created (if missing) via `curator/createMagazine` and looked up
via `flipboard/userInfo`. Existing flips are detected through
`curator/magazine` so re-runs are idempotent.

Because new flips land at the *top* of a magazine, posts are submitted oldest
first so the final order in the magazine is newest first (matching the RSS
feed / site archive order).

Credentials/config come from env vars or from `scripts/.flipboard_config.json`
(gitignored):

    FLIPBOARD_COOKIES    - the `Cookie:` header value ("k1=v1; k2=v2")
    FLIPBOARD_CSRF       - the `csrf-token` header value
    FLIPBOARD_USERID     - the numeric Flipboard user id

Config file keys: `cookies`, `csrf_token`, `userid`, `magazines` (name per
language), and optional `targets` (explicit `flipboard/mag-...` target per
language, skipping lookup).

Usage:
    python3 scripts/flipboard_sync.py --create-magazines
    python3 scripts/flipboard_sync.py --dry-run
    python3 scripts/flipboard_sync.py --only it --limit 3
    python3 scripts/flipboard_sync.py --verify
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
CONFIG_FILE = ROOT / "scripts" / ".flipboard_config.json"

API = "https://flipboard.com/api/v2/"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36")
LANGUAGES = ("en", "it", "fr")
LANG_LABEL = {"en": "English", "it": "Italiano", "fr": "Français"}
BASE_URL = "https://blog.mornati.net"

FM_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.S)


class FlipboardError(RuntimeError):
    """Non-2xx HTTP response or an explicit API-level failure."""


def parse_datetime(value: str) -> datetime | None:
    """Parse a frontmatter date (ISO-ish) as an aware UTC datetime."""
    value = value.strip()
    if value.endswith(("Z", "z")):
        value = value[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(value)
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


# ---------------------------------------------------------------------- config


def load_config() -> dict:
    """Merge env vars (precedence) over the gitignored JSON config file."""
    cfg = {}
    if CONFIG_FILE.exists():
        try:
            cfg = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            sys.exit(f"error: {CONFIG_FILE} is not valid JSON: {exc}")

    def pick(key: str, env: str) -> str:
        return os.environ.get(env) or cfg.get(key) or ""

    cookies = pick("cookies", "FLIPBOARD_COOKIES")
    csrf = pick("csrf_token", "FLIPBOARD_CSRF")
    userid = pick("userid", "FLIPBOARD_USERID")

    missing = []
    if not cookies:
        missing.append("cookies (FLIPBOARD_COOKIES)")
    if not csrf:
        missing.append("csrf_token (FLIPBOARD_CSRF)")
    if not userid:
        missing.append("userid (FLIPBOARD_USERID)")
    if missing:
        sys.exit(
            "error: missing Flipboard credentials: "
            + ", ".join(missing)
            + f"\n  Populate {CONFIG_FILE} (see .flipboard_config.example.json)"
            " or export the FLIPBOARD_* env vars."
        )

    magazines = cfg.get("magazines") or {
        "en": "Marco Mornati Blog (English)",
        "it": "Marco Mornati Blog (Italiano)",
        "fr": "Marco Mornati Blog (Français)",
    }
    return {
        "cookies": cookies,
        "csrf": csrf,
        "userid": str(userid),
        "magazines": magazines,
        "targets": cfg.get("targets") or {},
    }


# ---------------------------------------------------------------------- api


def api_request(cfg: dict, endpoint: str, *, params: dict | None = None,
                body: dict | None = None) -> dict:
    """Call a Flipboard api/v2 endpoint; return the parsed JSON."""
    url = API + endpoint
    if params:
        url += "?" + urllib.parse.urlencode(params)
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url, data=data, method="POST" if body is not None else "GET")
    req.add_header("accept", "application/json, text/plain, */*")
    req.add_header("cookie", cfg["cookies"])
    req.add_header("csrf-token", cfg["csrf"])
    req.add_header("origin", "https://flipboard.com")
    req.add_header("referer", "https://flipboard.com/")
    if data is not None:
        req.add_header("content-type", "application/json")
    req.add_header("user-agent", UA)

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as exc:
        if exc.code in (401, 403):
            raise FlipboardError(
                "authentication failed (HTTP %d). Refresh your cookies + "
                "csrf-token in the config file and re-run." % exc.code)
        raise FlipboardError("HTTP %d on %s" % (exc.code, endpoint))
    except urllib.error.URLError as exc:
        raise FlipboardError("network error on %s: %s" % (endpoint, exc.reason))

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}


def _unwrap(data: dict) -> dict:
    """Return the payload dict wherever the API nests it."""
    if isinstance(data, dict) and "data" in data:
        inner = data["data"]
        if isinstance(inner, dict):
            return inner
    return data


def find_magazines(cfg: dict) -> dict[str, str]:
    """Map language -> magazineTarget using the logged-in user's magazines."""
    data = _unwrap(api_request(cfg, "flipboard/userInfo"))
    user_info = data.get("userInfo", data)
    magazines = []
    for key in ("magazines", "contributorMagazines"):
        magazines.extend(user_info.get(key, []) or [])
    by_title = {}
    for mag in magazines:
        title = mag.get("name") or mag.get("title") or ""
        target = mag.get("magazineTarget") or ""
        if title and target:
            by_title[title] = target
    if not by_title:
        raise FlipboardError(
            "no magazines found for user; is the session valid?")
    return by_title


def create_magazine(cfg: dict, title: str) -> str:
    """Create a magazine, returning its magazineTarget."""
    body = {
        "title": title,
        "description": f"{title} — curated from https://blog.mornati.net",
        "magazineVisibility": "public",
    }
    data = _unwrap(api_request(cfg, "curator/createMagazine", body=body))
    mag = data.get("magazine", data)
    target = mag.get("magazineTarget", "")
    if not target:
        raise FlipboardError(f"could not resolve target for new magazine "
                             f"'{title}' (response: {json.dumps(data)[:300]})")
    return target


def resolve_targets(cfg: dict, create: bool) -> dict[str, str]:
    """Resolve magazineTarget per language, optionally creating magazines."""
    targets = dict(cfg["targets"])
    wanted = {lang: cfg["magazines"].get(lang, "")
              for lang in LANGUAGES}
    missing = [lang for lang, name in wanted.items()
               if name and lang not in targets]

    if missing:
        known = find_magazines(cfg)
        for lang in missing:
            title = wanted[lang]
            target = known.get(title)
            if target:
                targets[lang] = target
                continue
            if not create:
                sys.exit(
                    f"error: magazine '{title}' not found. Re-run with "
                    "--create-magazines to create it.")
            print(f"[flipboard] creating magazine '{title}' ...")
            targets[lang] = create_magazine(cfg, title)
    return targets


# -------------------------------------------------------------------- content


def discover_posts(cfg: dict) -> dict[str, list]:
    """Return {lang: sorted list of Post} ascending by publish date."""
    posts = {}
    for lang in LANGUAGES:
        found = []
        for index in (CONTENT / lang / "posts").glob("*/index.md"):
            m = FM_RE.match(index.read_text(encoding="utf-8"))
            if not m:
                continue
            fm = {}
            for line in m.group(1).splitlines():
                if ":" not in line or line.lstrip().startswith("-"):
                    continue
                key, _, value = line.partition(":")
                fm[key.strip()] = value.strip().strip("'\"")
            if fm.get("draft", "").lower() == "true":
                continue
            date = parse_datetime(fm.get("date", ""))
            if date is None:
                continue
            slug = fm.get("slug", index.parent.name)
            url = fm.get("url", "")
            if not url:
                url = f"{BASE_URL}/{slug}/" if lang == "en" \
                    else f"{BASE_URL}/{lang}/{slug}/"
            elif url.startswith("/"):
                url = BASE_URL + url
                if not url.endswith("/"):
                    url += "/"
            found.append({
                "lang": lang,
                "date": date,
                "slug": slug,
                "url": url,
                "title": fm.get("title", slug),
            })
        found.sort(key=lambda p: p["date"])
        posts[lang] = found
    return posts


# ------------------------------------------------------------------- existing


def target_to_section(target: str) -> str:
    """Map a magazine target (flipboard/mag-<magid>%3Am%3A<userid>) to the
    `auth/flipboard/curator%2Fmagazine%2F...` section id used by updateFeed."""
    magid = re.search(r"mag-(.+?)%3A", target)
    if not magid:
        raise FlipboardError(f"cannot parse magazine id from target: {target}")
    userid = target.rsplit("%3A", 1)[-1]
    return (f"auth/flipboard/curator%2Fmagazine%2F{magid.group(1)}"
            f"%3Am%3A{userid}")


def feed_magazine(cfg: dict, target: str) -> list:
    """Stream the items of a magazine via users/updateFeed (NDJSON).

    Returns a list of item dicts (the `post`-typed stream records).
    """
    section = target_to_section(target)
    items = []
    page_key = None
    for _ in range(50):
        params = {
            "sections": section,
            "limit": 50,
            "wantsMetadata": "true",
            "stream": "1",
        }
        if page_key:
            params["pageKey"] = page_key
        url = (API + "users/updateFeed?" +
               urllib.parse.urlencode(params, doseq=True))
        req = urllib.request.Request(url, method="GET")
        req.add_header("accept", "application/json, text/plain, */*")
        req.add_header("cookie", cfg["cookies"])
        req.add_header("csrf-token", cfg["csrf"])
        req.add_header("origin", "https://flipboard.com")
        req.add_header("referer", "https://flipboard.com/")
        req.add_header("user-agent", UA)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as exc:
            if exc.code in (401, 403):
                raise FlipboardError(
                    "authentication failed (HTTP %d). Refresh your cookies + "
                    "csrf-token in the config file and re-run." % exc.code)
            raise FlipboardError("HTTP %d on users/updateFeed" % exc.code)
        except urllib.error.URLError as exc:
            raise FlipboardError("network error on users/updateFeed: %s"
                                 % exc.reason)
        page_posts = []
        for line in raw.splitlines():
            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                continue
            if rec.get("type") == "post":
                page_posts.append(rec)
        if not page_posts:
            break
        items.extend(page_posts)
        page_key = page_posts[-1]["id"]
    return items


def _item_urls(item: dict) -> list:
    """All source URLs for a feed record (sourceURL + referredBy items)."""
    urls = []
    source = item.get("sourceURL") or ""
    if source:
        urls.append(source.split("?", 1)[0].rstrip("/"))
    for ref in item.get("referredByItems", []) or []:
        for u in ref.get("urls", []) or []:
            urls.append(u.split("?", 1)[0].rstrip("/"))
    return urls


def existing_urls(cfg: dict, target: str) -> set:
    """URLs already flipped into a magazine."""
    urls = set()
    for item in feed_magazine(cfg, target):
        urls.update(_item_urls(item))
    return urls


def list_magazine(cfg: dict, target: str) -> list:
    """Return items in display order (top of magazine first)."""
    items = feed_magazine(cfg, target)
    seen = set()
    ordered = []
    for item in items:
        urls = _item_urls(item)
        key = urls[0] if urls else item.get("id", "")
        if key in seen:
            continue
        seen.add(key)
        ordered.append({
            "url": urls[0] if urls else "",
            "title": item.get("title", ""),
            "id": item.get("id", ""),
            "dateCreated": item.get("dateCreated", ""),
        })
    return ordered


# ---------------------------------------------------------------------- flip


def flip_post(cfg: dict, target: str, url: str, delay: float,
              verbose: bool) -> None:
    body = {
        "url": url,
        "target": target,
        "service": "flipboard",
    }
    if verbose:
        print(f"    POST social/shareWithComment {url} -> {target}")
    data = api_request(cfg, "social/shareWithComment", body=body)
    ok = bool(data.get("success", True))
    if not ok:
        raise FlipboardError(f"flip of {url} rejected by Flipboard: "
                             f"{json.dumps(data)[:300]}")
    time.sleep(delay)


# ------------------------------------------------------------------- actions


def action_verify(cfg: dict, targets: dict, verbose: bool) -> int:
    for lang in LANGUAGES:
        target = targets.get(lang)
        if not target:
            continue
        print(f"[flipboard] {LANG_LABEL[lang]} magazine ({target}):")
        items = list_magazine(cfg, target)
        for item in items:
            url = item.get("url") or ""
            created = item.get("dateCreated", "")
            print(f"    {created or '?'}  {url}")
    return 0


def action_sync(cfg: dict, targets: dict, posts: dict, args) -> int:
    langs = [args.only] if args.only else LANGUAGES
    failures = []
    for lang in langs:
        target = targets.get(lang)
        name = cfg["magazines"].get(lang, lang)
        if not target:
            print(f"[flipboard] skipping {LANG_LABEL[lang]} (no magazine target)")
            continue
        lang_posts = posts[lang]
        if args.only or args.limit:
            lang_posts = lang_posts[: args.limit or None]
        existing = existing_urls(cfg, target)
        pending = [p for p in lang_posts if p["url"].rstrip("/") not in existing]
        print(f"[flipboard] {LANG_LABEL[lang]} ({name}): "
              f"{len(lang_posts)} considered, {len(existing)} already flipped, "
              f"{len(pending)} to add")
        if args.dry_run:
            for p in pending:
                print(f"    would flip {p['date'].date()} {p['url']}")
            continue
        for i, p in enumerate(pending, 1):
            print(f"    [{i}/{len(pending)}] {p['date'].date()} {p['url']}")
            try:
                flip_post(cfg, target, p["url"], args.delay, args.verbose)
            except FlipboardError as exc:
                print(f"    !! skipped: {exc}", file=sys.stderr)
                failures.append((p["url"], str(exc)))
    if failures:
        print(f"[flipboard] {len(failures)} flips failed:", file=sys.stderr)
        for url, err in failures:
            print(f"    {url}: {err}", file=sys.stderr)
        return 1
    return 0


# ---------------------------------------------------------------------- main


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--create-magazines", action="store_true",
                    help="create missing magazines (one per language)")
    ap.add_argument("--dry-run", action="store_true",
                    help="list posts that would be flipped, flip nothing")
    ap.add_argument("--limit", type=int, default=None,
                    help="only consider the first N posts per language")
    ap.add_argument("--only", choices=LANGUAGES, default=None,
                    help="only sync this language")
    ap.add_argument("--delay", type=float, default=2.0,
                    help="seconds between flips (default 2.0)")
    ap.add_argument("--verify", action="store_true",
                    help="print current magazine order and exit")
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    cfg = load_config()
    targets = resolve_targets(cfg, args.create_magazines)

    if args.verify:
        return action_verify(cfg, targets, args.verbose)

    posts = discover_posts(cfg)
    for lang in LANGUAGES:
        n = len(posts[lang])
        print(f"[flipboard] {LANG_LABEL[lang]}: {n} posts "
              f"({posts[lang][0]['date'].date() if n else '-'} -> "
              f"{posts[lang][-1]['date'].date() if n else '-'})")

    return action_sync(cfg, targets, posts, args)


if __name__ == "__main__":
    sys.exit(main())