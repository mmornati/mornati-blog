#!/usr/bin/env python3
"""Ping IndexNow with the URLs that a deploy added.

Usage: indexnow.py <old-urls.txt> <new-urls.txt>

Both files come from scripts/ci/sitemap_urls.sh, taken before and after the
deploy. Only URLs in the new set and not in the old one are submitted.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

HOST = "blog.mornati.net"
KEY = "4bf0e788f76f694c10bbf95ec4569a66"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"
BATCH = 9000


def read_urls(path):
    if not os.path.exists(path):
        return set()
    with open(path) as f:
        return {ln.strip() for ln in f if ln.strip()}


def ping(batch, number):
    """Submit one batch; returns False when it failed for good."""
    payload = {"host": HOST, "key": KEY, "keyLocation": KEY_LOCATION, "urlList": batch}
    req = urllib.request.Request(
        "https://api.indexnow.org/indexnow",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                print(f"IndexNow batch {number}: HTTP {resp.status} ({len(batch)} URLs)")
                return True
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            if e.code == 429:
                wait = 10 * (attempt + 1)
                print(f"Rate limited (429); retrying in {wait}s")
                time.sleep(wait)
                continue
            if e.code == 403 and "SiteVerificationNotCompleted" in body:
                wait = 30 * (attempt + 1)
                print(f"Site verification pending (403); retrying in {wait}s")
                time.sleep(wait)
                continue
            print(f"IndexNow HTTP {e.code}: {body}")
            return False
        except Exception as e:
            print(f"IndexNow request error: {e}")
            return False
    print(f"IndexNow batch {number}: failed after retries")
    return False


def main(argv):
    if len(argv) != 3:
        print(__doc__.strip().splitlines()[2], file=sys.stderr)
        return 2
    old, new = read_urls(argv[1]), read_urls(argv[2])
    delta = sorted(new - old)
    print(f"old={len(old)} new={len(new)} delta={len(delta)}")
    if not delta:
        print("No new articles in this deploy; skipping IndexNow ping")
        return 0
    ok = all([ping(delta[i:i + BATCH], i // BATCH + 1) for i in range(0, len(delta), BATCH)])
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
