#!/usr/bin/env python3
"""Refresh the /open-source/ gallery data.

For every project in data/opensource.yaml:
  * read stars, description and homepage from the GitHub API into data/opensource_stats.json
    (the fallback Hugo uses when the API does not answer at build time);
  * take a screenshot of the project's site into assets/opensource/<name>.webp when it is
    missing (or for every project with --refresh-shots).

Usage:
  python3 scripts/sync_opensource.py                  # stats + missing screenshots
  python3 scripts/sync_opensource.py --refresh-shots  # retake every screenshot
  python3 scripts/sync_opensource.py --no-shots       # stats only

Needs: a Chrome/Chromium binary and `cwebp` for screenshots. Set GITHUB_TOKEN to avoid the
unauthenticated rate limit (60 requests an hour). No third-party Python packages.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "opensource.yaml"
STATS = ROOT / "data" / "opensource_stats.json"
SHOTS = ROOT / "assets" / "opensource"
REPO_RE = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")
CHROME_CANDIDATES = (
    "google-chrome", "google-chrome-stable", "chromium", "chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
)


def read_projects() -> list[dict[str, str]]:
    """Read `repo:` and `site:` of each entry under `projects:` (flat keys only, no YAML lib)."""
    projects: list[dict[str, str]] = []
    in_projects = False
    for line in DATA.read_text(encoding="utf-8").splitlines():
        if re.match(r"^projects:\s*$", line):
            in_projects = True
            continue
        if not in_projects or line.lstrip().startswith("#"):
            continue
        m = re.match(r"^\s*-\s*repo:\s*(\S+)\s*$", line)
        if m:
            projects.append({"repo": m.group(1).strip("\"'")})
            continue
        m = re.match(r"^\s+site:\s*(\S+)\s*$", line)
        if m and projects:
            projects[-1]["site"] = m.group(1).strip("\"'")
    return projects


def github(repo: str) -> dict | None:
    req = urllib.request.Request(
        f"https://api.github.com/repos/{repo}",
        headers={"Accept": "application/vnd.github+json", "User-Agent": "blog-opensource-sync"},
    )
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.load(resp)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"  ! GitHub API failed for {repo}: {exc}", file=sys.stderr)
        return None


def find_chrome() -> str | None:
    for c in CHROME_CANDIDATES:
        path = shutil.which(c) or (c if Path(c).is_file() else None)
        if path:
            return path
    return None


def screenshot(chrome: str, url: str, out: Path) -> bool:
    with tempfile.TemporaryDirectory() as tmp:
        png = Path(tmp) / "shot.png"
        cmd = [chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox",
               "--window-size=1280,800", "--virtual-time-budget=6000", f"--screenshot={png}", url]
        try:
            subprocess.run(cmd, check=True, timeout=90, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            subprocess.run(["cwebp", "-quiet", "-q", "80", "-resize", "1200", "750", str(png), "-o", str(out)],
                           check=True, timeout=60)
        except (subprocess.SubprocessError, OSError) as exc:
            print(f"  ! screenshot failed for {url}: {exc}", file=sys.stderr)
            return False
    return out.is_file()


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--refresh-shots", action="store_true", help="retake every screenshot")
    ap.add_argument("--no-shots", action="store_true", help="only refresh the stats file")
    args = ap.parse_args()

    projects = read_projects()
    if not projects:
        print("no projects found in data/opensource.yaml", file=sys.stderr)
        return 1
    stats = json.loads(STATS.read_text(encoding="utf-8")) if STATS.is_file() else {}
    chrome = None if args.no_shots else find_chrome()
    if not args.no_shots and not (chrome and shutil.which("cwebp")):
        print("Chrome or cwebp not found: skipping screenshots", file=sys.stderr)
        chrome = None
    SHOTS.mkdir(parents=True, exist_ok=True)

    for p in projects:
        repo = p["repo"]
        if not REPO_RE.match(repo):
            print(f"skipping invalid repo {repo!r}", file=sys.stderr)
            continue
        print(repo)
        info = github(repo)
        if info:
            stats[repo] = {
                "stars": int(info.get("stargazers_count") or 0),
                "description": info.get("description") or "",
                "homepage": info.get("homepage") or "",
            }
        site = p.get("site") or stats.get(repo, {}).get("homepage") or ""
        out = SHOTS / f"{repo.split('/')[1]}.webp"
        if chrome and site.startswith("https://") and (args.refresh_shots or not out.is_file()):
            print(f"  screenshot {site}")
            screenshot(chrome, site, out)

    # Drop stats for projects that left the list; keep the file stable for clean diffs.
    keep = {p["repo"] for p in projects}
    stats = {k: stats[k] for k in sorted(stats) if k in keep}
    STATS.write_text(json.dumps(stats, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
