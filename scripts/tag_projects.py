#!/usr/bin/env python3
"""Add a `projects:` taxonomy entry to posts that belong to a rack unit (data/projects.yaml).

Matching is by repo links / slugs in each post, so EN, FR and IT posts are tagged the same way.
Idempotent: posts that already list the project are left alone.
"""
import pathlib, re

RULES = {
    "ai-running-coach": r"ai-running-coach",
    "ha-decision-models": r"HA-Jev|jev-router|system-one-router",
    "leanproxy-mcp": r"leanproxy",
    "arlo-self-hosted": r"arlo-base-station|arlo-cam-api",
    "home-energy": r"ha-energy-analysis|solar-analysis|^- solar-energy$|water-heater|chauffe-eau|scaldabagno",
    "proton-photos": r"gphoto2proton|proton-faces",
    "hitachi-csnet": r"home-assistant-csnet-home",
    "nexus-dev": r"github\.com/mmornati/nexus-dev",
    "cyber-code-academy": r"cyber-code-academy|Cyber Code Academy",
}

root = pathlib.Path(__file__).resolve().parent.parent / "content"
for f in sorted(root.glob("*/posts/*/index.md")):
    text = f.read_text()
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        continue
    fm, body = m.group(1), text[m.end():]
    hits = [k for k, rx in RULES.items() if re.search(rx, fm + "\n" + body, re.M)]
    if not hits:
        continue
    existing = set(re.findall(r"^projects:\n((?:- .*\n?)*)", fm + "\n", re.M))
    have = set()
    pm = re.search(r"^projects:\n((?:- .*\n?)*)", fm + "\n", re.M)
    if pm:
        have = {l[2:].strip() for l in pm.group(1).splitlines()}
        fm = fm.replace(pm.group(0).rstrip("\n"), "").rstrip("\n")
    keys = sorted(have | set(hits))
    fm = fm.rstrip("\n") + "\nprojects:\n" + "".join(f"- {k}\n" for k in keys)
    f.write_text("---\n" + fm.rstrip("\n") + "\n---\n" + body)
    print(f.relative_to(root), keys)
