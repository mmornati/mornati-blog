#!/usr/bin/env python3
"""Generate root-level redirect stubs for non-default-language posts.

Hugo scopes front matter `aliases` under the page's language prefix. For a
page in Italian or French, an alias like `/blog-da-iphone` is rendered at
`/it/blog-da-iphone/` — never at the blog root. Because the old Hashnode
blog served every post from `/` root, we re-create those root URLs as
static meta-refresh redirects so no old link is lost.

Run this AFTER `hugo` produces `public/`. It reads the migrated content
front matter (`url` + `aliases`) and writes, for each root alias not
already produced by Hugo, a tiny redirect page at
`public/<alias>/index.html` pointing to the canonical URL.

Designed to be idempotent: re-running overwrites identical stubs.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "public"
CONTENT = ROOT / "content"

FM_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.S)

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="0; url={target}">
<link rel="canonical" href="{target}">
<title>Redirecting to {target}</title>
</head>
<body>
<p>Moved. <a href="{target}">Go to {target}</a>.</p>
</body>
</html>
"""


def _frontmatter(path: Path):
    m = FM_RE.match(path.read_text(encoding="utf-8"))
    if not m:
        return {}
    # Minimal TOML-ish parser only for the flat keys we need.
    fm = {}
    lines = m.group(1).splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        if ":" not in line:
            i += 1
            continue
        key, _, val = line.partition(":")
        key = key.strip()
        val = val.strip().strip("'\"")
        if key == "aliases" and not val:
            items = []
            i += 1
            while i < len(lines) and lines[i].strip().startswith("-"):
                items.append(lines[i].strip().lstrip("-").strip().strip("'\""))
                i += 1
            fm["aliases"] = items
            continue
        elif key in ("title", "slug", "url"):
            fm[key] = val
        i += 1
    return fm


def main() -> int:
    written = []
    for lang in ("it", "fr"):
        for index in sorted((CONTENT / lang / "posts").glob("*/index.md")):
            fm = _frontmatter(index)
            url = fm.get("url", "")
            if not url.startswith("/"):
                continue
            aliases = fm.get("aliases", [])
            if not aliases:
                continue
            if "/" not in url.strip("/") and not url.endswith("/"):
                url += "/"
            for alias in aliases:
                alias = alias.strip("/")
                if not alias:
                    continue
                target = url if url.endswith("/") else url + "/"
                stub = PUBLIC / alias / "index.html"
                stub.parent.mkdir(parents=True, exist_ok=True)
                stub.write_text(
                    TEMPLATE.format(target=target), encoding="utf-8")
                written.append(str(stub.relative_to(PUBLIC)))
    print(f"[redirects] wrote {len(written)} root redirect stubs")
    if written:
        print("\n".join(f"  /{w}" for w in written))
    return 0


if __name__ == "__main__":
    sys.exit(main())