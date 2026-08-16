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
                 cloud: str, api_key: str, api_secret: str) -> None:
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
        if resp.status != 200:
            sys.exit(f"upload failed for {public_id} (HTTP {resp.status})")


def local_images() -> list[Path]:
    if not IMAGES_ROOT.exists():
        return []
    return sorted(p for p in IMAGES_ROOT.rglob("*") if p.is_file())


def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    return {}


def save_state(state: dict) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2, sort_keys=True),
                          encoding="utf-8")


def rewrite_html(cloud: str, folder: str) -> int:
    if not PUBLIC_ROOT.exists():
        print("[cloudinary] public/ missing — nothing to rewrite")
        return 0
    prefix = (f"https://res.cloudinary.com/{cloud}/image/upload/"
              f"f_auto,q_auto/{folder}/")
    count = 0
    for html in PUBLIC_ROOT.rglob("*.html"):
        text = html.read_text(encoding="utf-8")
        if "/images/" not in text:
            continue
        new = text.replace('/images/', prefix)
        if new != text:
            html.write_text(new, encoding="utf-8")
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

    state = load_state()
    images = local_images()
    changed = []
    for img in images:
        rel = img.relative_to(IMAGES_ROOT).as_posix()
        digest = sha256_file(img)
        if args.force or state.get(rel) != digest:
            changed.append((img, rel, digest))

    if args.dry_run:
        for img, rel, _ in changed:
            print(f"[cloudinary] would upload {rel}")
        print(f"[cloudinary] dry-run: {len(changed)} of {len(images)} changed")
        return 0

    for img, rel, digest in changed:
        public_id = f"{folder}/{rel}"
        print(f"[cloudinary] upload {rel}")
        upload_image(img, public_id, folder, cloud, api_key, api_secret)
        state[rel] = digest

    save_state(state)
    n = rewrite_html(cloud, folder)
    print(f"[cloudinary] uploaded {len(changed)}/{len(images)}; "
          f"rewrote {n} HTML files")
    return 0


if __name__ == "__main__":
    sys.exit(main())