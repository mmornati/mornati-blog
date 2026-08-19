#!/usr/bin/env python3
"""Cloudinary git-ops sync for the blog.

Commit images under static/images/ (source of truth in git). On every run this
script:
  1. Walks static/images/ and computes a deterministic public_id for each file:
        <folder>/<relpath>          (e.g. blog/home-assistant-x/01-pic.png)
  2. Uploads only files whose content (sha256) changed since the last sync
     (state kept in build/cloudinary.synced.json — gitignored locally, or
     restored via actions/cache in CI).
  3. Rewrites the built HTML in public/ swapping local /images/ references for
     Cloudinary delivery URLs:
        https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto/<public_id>

Credentials come from env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
CLOUDINARY_API_SECRET.

Usage:
  python3 scripts/cloudinary_sync.py [--rewrite-only] [--dry-run] [--force]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import os
import re
import sys
import time
import urllib.request
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parent.parent
IMAGES_ROOT = ROOT / "static" / "images"
PUBLIC_ROOT = ROOT / "public"
STATE_FILE = ROOT / "build" / "cloudinary.synced.json"

UPLOAD_ENDPOINT = "https://api.cloudinary.com/v1_1/{cloud}/image/upload"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def env(name: str, required: bool = False) -> str:
    val = os.environ.get(name, "")
    if required and not val:
        sys.exit(f"error: {name} is required")
    return val


def upload_image(path: Path, public_id: str, folder: str,
                 cloud: str, api_key: str, api_secret: str) -> dict:
    """Signed, unauthenticated-style upload using the REST upload endpoint."""
    timestamp = str(int(time.time()))
    params = {"folder": folder, "public_id": public_id, "timestamp": timestamp}
    sig_str = "&".join(f"{k}={params[k]}" for k in sorted(params)) + api_secret
    signature = hashlib.sha1(sig_str.encode()).hexdigest()
    params["signature"] = signature
    params["api_key"] = api_key

    boundary = "----mornati-blog" + hashlib.md5(path.name.encode()).hexdigest()
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"

    def field(name: str, value: str) -> bytes:
        return (f"--{boundary}\r\nContent-Disposition: form-data; "
                f'name="{name}"\r\n\r\n{value}\r\n').encode()

    file_header = (f"--{boundary}\r\nContent-Disposition: form-data; "
                   f'name="file"; filename="{path.name}"\r\n'
                   f"Content-Type: {mime}\r\n\r\n").encode()
    body = bytearray(b"".join(field(k, v) for k, v in params.items()))
    body += file_header + path.read_bytes() + f"\r\n--{boundary}--\r\n".encode()

    req = urllib.request.Request(
        UPLOAD_ENDPOINT.format(cloud=cloud), data=bytes(body),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        payload = resp.read().decode("utf-8", "replace")
        if resp.status != 200:
            raise RuntimeError(f"HTTP {resp.status}: {payload[:200]}")
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        return {}


def local_images() -> list[Path]:
    if not IMAGES_ROOT.exists():
        return []
    return sorted(p for p in IMAGES_ROOT.rglob("*") if p.is_file())


def is_real_image(path: Path) -> bool:
    """Reject HTML/error pages accidentally saved with an image extension."""
    try:
        with path.open("rb") as f:
            head = f.read(12)
    except OSError:
        return False
    if head[:8] == b"\x89PNG\r\n\x1a\n":
        return True
    if head[:3] in (b"\xff\xd8\xff",):
        return True
    if head[:6] in (b"GIF87a", b"GIF89a"):
        return True
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return True
    if head[:4] == b"\x00\x00\x00\x1c" or b"ftyp" in head[4:12]:
        return True
    if b"<svg" in head.lower() or b"<?xml" in head.lower():
        return True
    return False


def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    return {}


def save_state(state: dict) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2, sort_keys=True),
                          encoding="utf-8")


def state_digest(entry) -> str:
    """Old state stored plain digests; new state stores {digest, public_id, url}."""
    if isinstance(entry, dict):
        return entry.get("digest", "")
    return entry if isinstance(entry, str) else ""


def rewrite_html(cloud: str, folder: str) -> int:
    if not PUBLIC_ROOT.exists():
        print("[cloudinary] public/ missing — nothing to rewrite")
        return 0
    state = load_state()
    prefix = (f"https://res.cloudinary.com/{cloud}/image/upload/"
              f"f_auto,q_auto/{folder}/")
    count = 0
    for html in PUBLIC_ROOT.rglob("*.html"):
        if not html.is_file():
            # rglob also yields directories whose name ends in ".html";
            # those are never HTML files, skip them.
            continue
        text = html.read_text(encoding="utf-8")
        if "/images/" not in text:
            continue
        changed = False
        for m in set(re.findall(r"/images/([^\"'$<>{}]+)", text)):
            url = ""
            entry = state.get(m)
            if isinstance(entry, dict) and entry.get("url"):
                url = entry["url"]
            else:
                url = prefix + m
            old = "/images/" + m
            if old in text:
                text = text.replace(old, url)
                changed = True
        if changed:
            html.write_text(text, encoding="utf-8")
            count += 1
    return count


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--rewrite-only", action="store_true",
                    help="only rewrite built HTML (no upload); assumes images already synced")
    ap.add_argument("--dry-run", action="store_true", help="print what would change, change nothing")
    ap.add_argument("--force", action="store_true", help="re-upload everything even if unchanged")
    args = ap.parse_args()

    cloud = env("CLOUDINARY_CLOUD_NAME", required=True)
    folder = os.environ.get("CLOUDINARY_FOLDER") or "blog"

    if args.rewrite_only:
        n = rewrite_html(cloud, folder)
        print(f"[cloudinary] rewrite-only: updated {n} HTML files")
        return 0

    api_key = env("CLOUDINARY_API_KEY", required=True)
    api_secret = env("CLOUDINARY_API_SECRET", required=True)
    strict = os.environ.get("CLOUDINARY_STRICT", "").lower() in ("1", "true", "yes")

    state = load_state()
    images = local_images()
    changed = []
    skipped = []
    for img in images:
        rel = img.relative_to(IMAGES_ROOT).as_posix()
        digest = sha256_file(img)
        entry = state.get(rel)

        if not is_real_image(img):
            # Dead-link artifact (HTML page saved with an image extension):
            # not a real image, Cloudinary will always reject it. Mark it
            # forever so it is never retried.
            if isinstance(entry, dict) and entry.get("dead"):
                continue
            state[rel] = {"digest": digest, "dead": True}
            skipped.append(rel)
            continue

        needs_url = not (isinstance(entry, dict) and entry.get("url"))
        if args.force or state_digest(entry) != digest or needs_url:
            changed.append((img, rel, digest))

    if skipped:
        print(f"[cloudinary] skipped {len(skipped)} non-image artifact(s): "
              + ", ".join(skipped[:5]) + ("…" if len(skipped) > 5 else ""))

    if args.dry_run:
        for img, rel, _ in changed:
            print(f"[cloudinary] would upload {rel}")
        print(f"[cloudinary] dry-run: {len(changed)} of {len(images)} changed")
        return 0

    failures = []
    for img, rel, digest in changed:
        public_id = f"{folder}/{rel}"
        print(f"[cloudinary] upload {rel}")
        try:
            resp = upload_image(img, public_id, folder, cloud, api_key, api_secret)
            pid = resp.get("public_id") or public_id
            url = resp.get("secure_url") or resp.get("url") or ""
            if not url:
                raise RuntimeError(f"no url in upload response: {resp}")
            state[rel] = {"digest": digest, "public_id": pid, "url": url}
            print(f"[cloudinary]   → {url}")
        except Exception as exc:
            failures.append((rel, str(exc)))
            if strict:
                break

    # Remember every successfully uploaded image even when some fail, so the
    # CI cache keeps the delta and a later run only retries the failures.
    save_state(state)

    # Rewrite HTML regardless: failed uploads (e.g. dead-link artifacts saved
    # as HTML error pages) stay broken either way, but every other image must
    # point at its Cloudinary URL.
    n = rewrite_html(cloud, folder)

    if failures:
        fail_log = ROOT / "build" / "cloudinary-failure.log"
        fail_log.parent.mkdir(parents=True, exist_ok=True)
        fail_log.write_text(
            "".join(f"{rel}: {err}\n" for rel, err in failures),
            encoding="utf-8")
        print(f"[cloudinary] WARNING: {len(failures)} upload(s) failed "
              f"(see {fail_log}); state saved for {len(state)} images; "
              f"rewrote {n} HTML files")
        for rel, err in failures:
            print(f"[cloudinary]   FAILED {rel}: {err}")
        if strict:
            sys.exit(f"aborting: {len(failures)} upload(s) failed "
                     f"(CLOUDINARY_STRICT=true)")
    else:
        print(f"[cloudinary] uploaded {len(changed)}/{len(images)}; "
              f"rewrote {n} HTML files")
    return 0


if __name__ == "__main__":
    sys.exit(main())