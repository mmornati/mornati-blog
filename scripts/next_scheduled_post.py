#!/usr/bin/env python3
"""Report whether a deploy is due to publish a scheduled (future-dated) post.

Hugo with `buildFuture=false` skips posts whose frontmatter `date` is in the
future. The hourly scheduled workflow (`publish-scheduled.yml`) uses this
script to decide whether to dispatch a deploy:

* prints ``DUE`` when at least one post became publishable since the last
  deploy (the last deploy time is the `deploy` branch HEAD commit time), and
* otherwise prints the earliest still-future post date for logging, or
  nothing when no future/scheduled post exists.

Runs in a few hundred ms and never touches the Hugo build.
"""

import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from subprocess import CalledProcessError, check_output, DEVNULL

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"

FM_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.S)


def parse_datetime(value: str):
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


def last_deploy_time() -> datetime:
    """Commit time of the `deploy` branch HEAD (epoch 0 when absent)."""
    try:
        out = check_output(
            ["git", "log", "-1", "--format=%ct",
             "refs/remotes/origin/deploy"],
            cwd=ROOT, text=True, stderr=DEVNULL).strip()
        return datetime.fromtimestamp(int(out), tz=timezone.utc)
    except (CalledProcessError, ValueError, OSError):
        return datetime.fromtimestamp(0, tz=timezone.utc)


def post_dates() -> list:
    """All non-draft post frontmatter `date` values (aware UTC)."""
    dates = []
    for lang in ("en", "it", "fr"):
        for index in (CONTENT / lang / "posts").glob("*/index.md"):
            m = FM_RE.match(index.read_text(encoding="utf-8"))
            if not m:
                continue
            draft = False
            date = None
            for line in m.group(1).splitlines():
                if line.startswith("draft:"):
                    draft = line[6:].strip().lower() == "true"
                elif line.startswith("date:"):
                    date = parse_datetime(line[5:].strip().strip("'\""))
            if draft or date is None:
                continue
            dates.append(date)
    return dates


def main() -> int:
    now = datetime.now(timezone.utc)
    deploy_at = last_deploy_time()
    if deploy_at.timestamp() == 0:
        print("[scheduler] no deploy branch yet; treating first run as due",
              file=sys.stderr)
    dates = post_dates()
    if any(deploy_at < d <= now for d in dates):
        print("DUE")
        return 0
    future = sorted(d for d in dates if d > now)
    if future:
        print(future[0].isoformat())
    return 0


if __name__ == "__main__":
    sys.exit(main())
