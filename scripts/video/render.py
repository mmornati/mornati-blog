#!/usr/bin/env python3
"""Export a canvas video (static/videos/<name>/) to PNG stills or an MP4 file.

You only need this for places that cannot run JavaScript (YouTube, LinkedIn, a
release asset) or for a cover image: on the blog, the page itself *is* the video.

Each page draws every frame from elapsed time alone and exposes
`window.renderFrame(t)`. This script opens it in headless Chrome, calls
`renderFrame` frame by frame — never in real time, so no frame is ever dropped,
whatever the machine — and pipes each PNG into ffmpeg. The narration track
(`audio/<lang>.m4a`, from scripts/video/narrate.py) is then muxed in, untouched.

Prerequisites: ffmpeg, uv, and Google Chrome or Playwright's Chromium
(`uvx playwright install chromium`). Nothing is installed in the repo:

    uv run --with playwright scripts/video/render.py leanproxy-mcp --lang en
    uv run --with playwright scripts/video/render.py leanproxy-mcp --still 14 --still 33.5
    uv run --with playwright scripts/video/render.py leanproxy-mcp --burn-subs   # social media

Output: build/video/<name>-<lang>-<res>p.mp4 (or -<t>s.png), outside git.
"""

from __future__ import annotations

import argparse
import base64
import functools
import http.server
import shutil
import subprocess
import sys
import threading
import time
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
STATIC = REPO / "static"


class _Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve() -> tuple[http.server.ThreadingHTTPServer, int]:
    """Serve static/ on 127.0.0.1 (ephemeral port): fonts and audio stay local."""
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=str(STATIC)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, server.server_address[1]


def grab_png(page, t: float) -> bytes:
    url = page.evaluate("t => { window.renderFrame(t); return document.getElementById('c').toDataURL('image/png'); }", t)
    return base64.b64decode(url.split(",", 1)[1])


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("video", help="folder under static/videos/")
    ap.add_argument("--lang", default="en")
    ap.add_argument("--res", choices=("720", "1080", "1440", "2160"), default="1080")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--crf", type=int, default=18, help="x264 quality, lower = better")
    ap.add_argument("--still", type=float, action="append", help="only write a PNG at this time (s), repeatable")
    ap.add_argument("--burn-subs", action="store_true", help="burn subtitles into the image")
    ap.add_argument("-o", "--out-dir", type=Path, default=REPO / "build" / "video")
    args = ap.parse_args()

    if not (STATIC / "videos" / args.video / "index.html").exists():
        raise SystemExit(f"Unknown video: static/videos/{args.video}/")
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        raise SystemExit("Playwright missing: uv run --with playwright scripts/video/render.py …")
    if not args.still and not shutil.which("ffmpeg"):
        raise SystemExit("ffmpeg not found in PATH (brew install ffmpeg).")
    args.out_dir.mkdir(parents=True, exist_ok=True)
    base = args.out_dir / f"{args.video}-{args.lang}-{args.res}p"

    server, port = serve()
    try:
        with sync_playwright() as pw:
            try:
                browser = pw.chromium.launch(channel="chrome")
            except Exception:  # noqa: BLE001 - fall back to Playwright's Chromium
                browser = pw.chromium.launch()
            page = browser.new_page(viewport={"width": 1280, "height": 720})
            page.goto(f"http://127.0.0.1:{port}/videos/{args.video}/index.html?capture=1"
                      f"&lang={args.lang}&res={args.res}&subs={1 if args.burn_subs else 0}")
            page.evaluate("window.videoReady")
            duration = float(page.evaluate("window.DURATION"))
            if not duration:
                raise SystemExit("Zero duration: narration not built? (scripts/video/narrate.py)")
            if args.still:
                for t in args.still:
                    out = Path(f"{base}-{t:g}s.png")
                    out.write_bytes(grab_png(page, t))
                    print(out)
                return 0
            frames = int(round(duration * args.fps)) + 1
            silent = Path(f"{base}.video.mp4")
            ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-c:v", "png",
                                   "-framerate", str(args.fps), "-i", "-", "-c:v", "libx264", "-preset", "slow",
                                   "-crf", str(args.crf), "-pix_fmt", "yuv420p", str(silent)], stdin=subprocess.PIPE)
            started = time.monotonic()
            for i in range(frames):
                ff.stdin.write(grab_png(page, i / args.fps))
                if i % args.fps == 0 or i == frames - 1:
                    print(f"\r{i + 1}/{frames} frames", end="", file=sys.stderr, flush=True)
            ff.stdin.close()
            if ff.wait():
                raise SystemExit("ffmpeg failed")
            print(f"\n{frames} frames in {time.monotonic() - started:.0f} s", file=sys.stderr)
            browser.close()
    finally:
        server.shutdown()

    out = Path(f"{base}.mp4")
    audio = STATIC / "videos" / args.video / "audio" / f"{args.lang}.m4a"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(silent), "-i", str(audio), "-map", "0:v", "-map", "1:a",
                    "-c", "copy", "-shortest", "-movflags", "+faststart", str(out)], check=True)
    silent.unlink(missing_ok=True)
    print(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
