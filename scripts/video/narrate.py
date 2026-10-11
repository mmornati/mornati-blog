#!/usr/bin/env python3
"""Narrate a canvas video: script.json -> voice track, scene timing, subtitles.

A video lives in `static/videos/<name>/` (served as-is by Hugo) and carries a
`script.json`, the single source of the scene breakdown and of what is said:

    {
      "scenes": [
        {"id": "hook", "min": 6, "chapter": {"en": "The tax", "fr": "La taxe"},
         "en": ["First sentence.", {"text": "Second one, not before 3 s.", "at": 3.0}],
         "fr": ["Première phrase.", "Deuxième."]}
      ]
    }

For each language the script:
  1. synthesises every cue (sentence), after applying the pronunciation lexicon
     `lexicon.json` next to script.json — subtitles keep the original text;
     a `[[…]]` value is a raw IPA phoneme string, passed as-is to Kokoro;
  2. computes each scene's duration: max(min, lead + speech + tail).
     The voice sets the pace; the animation adapts to it;
  3. writes `audio/<lang>.m4a` (AAC mono, loudness-normalised) and `timing.js`
     (`window.VIDEO_TIMING`, read by static/videos/engine/engine.js).

Engines (`--engine`):
  - `kokoro` (default): Kokoro-82M, Apache-2.0 weights, local ONNX, CPU is enough;
  - `espeak`: espeak-ng — robotic, but GPL engine, no licence on your audio: the
    zero-cost fallback you are allowed to publish (Linux, macOS, Windows);
  - `say`: the macOS built-in voices — zero install, perfect for drafts and timing
    passes, but Apple's licence (macOS SLA §2F) only allows personal, non-commercial
    use of system voices: do not publish what it produces.

Synthesised cues are cached in ~/.cache/blog-video/tts: re-running only redoes
what changed.

Prerequisites: ffmpeg, uv, and for kokoro the model files `kokoro-v1.0.onnx` and
`voices-v1.0.bin` in ~/.cache/kokoro-onnx/ (release "model-files-v1.0" of
github.com/thewh1teagle/kokoro-onnx). Nothing gets installed in the repo:

    uv run --with kokoro-onnx --with soundfile scripts/video/narrate.py leanproxy-mcp
    uv run --with kokoro-onnx --with soundfile scripts/video/narrate.py leanproxy-mcp --lang it
    python3 scripts/video/narrate.py leanproxy-mcp --engine say      # draft voice
    python3 scripts/video/narrate.py leanproxy-mcp --engine espeak
    python3 scripts/video/narrate.py --check       # stdlib only: is timing.js up to date?
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
import wave
from array import array
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
VIDEOS = REPO / "static" / "videos"
MODEL_DIR = Path.home() / ".cache" / "kokoro-onnx"
CACHE = Path.home() / ".cache" / "blog-video" / "tts"
SR = 24000
LEAD, GAP, TAIL = 0.5, 0.35, 0.6

ENGINES = {
    "kokoro": {
        "en": {"voice": "af_heart", "lang": "en-us", "speed": 1.0},
        "fr": {"voice": "ff_siwis", "lang": "fr-fr", "speed": 1.0},
        "it": {"voice": "im_nicola", "lang": "it", "speed": 1.0},
    },
    "espeak": {
        "en": {"voice": "en-us", "speed": 165},
        "fr": {"voice": "fr-fr", "speed": 160},
        "it": {"voice": "it", "speed": 160},
    },
    "say": {
        "en": {"voice": "Daniel", "rate": 185},
        "fr": {"voice": "Thomas", "rate": 185},
        "it": {"voice": "Alice", "rate": 185},
    },
}


def load_script(video: Path) -> dict:
    data = json.loads((video / "script.json").read_text(encoding="utf-8"))
    ids = [s["id"] for s in data["scenes"]]
    if len(ids) != len(set(ids)):
        raise SystemExit(f"{video.name}/script.json: duplicate scene ids")
    return data


def langs_of(data: dict) -> list[str]:
    return data.get("langs") or ["en"]


def cues_of(scene: dict, lang: str) -> list[dict]:
    return [{"text": c, "at": None} if isinstance(c, str) else {"text": c["text"], "at": c.get("at")}
            for c in scene.get(lang, [])]


def lexicon(video: Path, lang: str, engine: str) -> dict:
    """`<lang>` entries, overridden by `<lang>@<engine>` ones; `_doc` keys are notes."""
    f = video / "lexicon.json"
    if not f.exists():
        return {}
    raw = json.loads(f.read_text(encoding="utf-8"))
    lex = {**raw.get(lang, {}), **raw.get(f"{lang}@{engine}", {})}
    return {k: v for k, v in lex.items() if not k.startswith("_")}


def pronounce(s: str, lex: dict, ipa: bool) -> str:
    """Whole-word, case-sensitive substitution, longest first, in a single pass."""
    lex = {k: (v if ipa or not v.startswith("[[") else k) for k, v in lex.items()}
    if not lex:
        return s
    alt = "|".join(re.escape(k) for k in sorted(lex, key=len, reverse=True))
    return re.sub(rf"(?<![\w/])(?:{alt})(?!\w)", lambda m: lex[m.group(0)], s)


def digest(video: Path, data: dict, lang: str, engine: str) -> str:
    """Fingerprint of everything that determines a language's timing."""
    payload = {"engine": engine, "voice": ENGINES[engine][lang], "lex": lexicon(video, lang, engine),
               "lead": LEAD, "gap": GAP, "tail": TAIL,
               "scenes": [{"id": s["id"], "min": s.get("min"), "lead": s.get("lead"), "tail": s.get("tail"),
                           "cues": cues_of(s, lang)} for s in data["scenes"]]}
    return hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]


def ffmpeg_to_pcm(src: Path, dst: Path) -> None:
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-ar", str(SR), "-ac", "1",
                    "-sample_fmt", "s16", str(dst)], check=True)


class Kokoro:
    name, ipa = "kokoro", True

    def __init__(self):
        self._k = None

    def model(self):
        if self._k is None:
            try:
                from kokoro_onnx import Kokoro as K
            except ImportError:
                raise SystemExit("kokoro-onnx missing: uv run --with kokoro-onnx --with soundfile scripts/video/narrate.py …")
            onnx, voices = MODEL_DIR / "kokoro-v1.0.onnx", MODEL_DIR / "voices-v1.0.bin"
            if not onnx.exists() or not voices.exists():
                raise SystemExit(f"Kokoro model missing from {MODEL_DIR} (see this script's header).")
            self._k = K(str(onnx), str(voices))
        return self._k

    def phonemes(self, text: str, lang: str) -> str:
        """espeak phonemes WITHOUT language-switch flags.

        By default espeak marks foreign words as `(en)kˈoʊtʃ(fr)` and kokoro-onnx only
        strips the brackets: the French voice then literally says "en … fr" around
        every English word. `remove-flags` keeps the foreign pronunciation, drops the flags."""
        import phonemizer
        from kokoro_onnx.tokenizer import Tokenizer, _espeak_lock
        tok, out = self.model().tokenizer, []
        for i, part in enumerate(re.split(r"\[\[(.+?)\]\]", text)):
            if i % 2:
                out.append(part)  # raw IPA from the lexicon
            elif part.strip():
                with _espeak_lock:
                    out.append(phonemizer.phonemize(Tokenizer.normalize_text(part), lang, preserve_punctuation=True,
                                                    with_stress=True, language_switch="remove-flags").strip())
        ph = re.sub(r"\s+", " ", " ".join(out))
        return "".join(p for p in ph if p in tok.vocab).strip()

    def synth(self, text: str, cfg: dict, out: Path) -> None:
        import soundfile as sf
        samples, sr = self.model().create(self.phonemes(text, cfg["lang"]), voice=cfg["voice"],
                                          speed=cfg["speed"], lang=cfg["lang"], is_phonemes=True)
        sf.write(out, samples, sr, subtype="PCM_16")


class Say:
    name, ipa = "say", False

    def synth(self, text: str, cfg: dict, out: Path) -> None:
        if not shutil.which("say"):
            raise SystemExit("`say` is macOS only — on Linux try espeak-ng, on Windows SAPI.")
        with tempfile.TemporaryDirectory() as tmp:
            aiff = Path(tmp) / "a.aiff"
            subprocess.run(["say", "-v", cfg["voice"], "-r", str(cfg["rate"]), "-o", str(aiff), text], check=True)
            ffmpeg_to_pcm(aiff, out)


class Espeak:
    name, ipa = "espeak", False

    def synth(self, text: str, cfg: dict, out: Path) -> None:
        exe = shutil.which("espeak-ng") or shutil.which("espeak")
        if not exe:
            raise SystemExit("espeak-ng not found (brew install espeak-ng / apt install espeak-ng).")
        subprocess.run([exe, "-v", cfg["voice"], "-s", str(cfg["speed"]), "-w", str(out), text], check=True)


def speak(engine, text: str, cfg: dict) -> array:
    """One cue -> 24 kHz mono PCM, through the cache."""
    path = CACHE / f"{hashlib.sha256(json.dumps([engine.name, text, cfg]).encode()).hexdigest()[:24]}.wav"
    if not path.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory() as tmp:
            raw = Path(tmp) / "raw.wav"
            engine.synth(text, cfg, raw)
            ffmpeg_to_pcm(raw, path)
    with wave.open(str(path), "rb") as w:
        return array("h", w.readframes(w.getnframes()))


def build_lang(video: Path, data: dict, lang: str, engine) -> dict:
    cfg, lex = ENGINES[engine.name][lang], lexicon(video, lang, engine.name)
    plan, start, clips = [], 0.0, []
    for sc in data["scenes"]:
        cur, cues = sc.get("lead", LEAD), []
        for c in cues_of(sc, lang):
            pcm = speak(engine, pronounce(c["text"], lex, engine.ipa), cfg)
            if c["at"] is not None:
                cur = max(cur, float(c["at"]))
            dur = len(pcm) / SR
            cues.append({"s": round(cur, 3), "e": round(cur + dur, 3), "text": c["text"]})
            clips.append((start + cur, pcm))
            cur += dur + GAP
        speech_end = (cues[-1]["e"] if cues else 0) + sc.get("tail", TAIL)
        d = round(max(float(sc.get("min", 3.0)), speech_end), 3)
        item = {"id": sc["id"], "start": round(start, 3), "d": d, "cues": cues}
        if sc.get("chapter"):
            item["chapter"] = sc["chapter"][lang] if isinstance(sc["chapter"], dict) else sc["chapter"]
        plan.append(item)
        start += d
    duration = round(start, 3)

    # the full track, every clip at its timeline offset
    track = array("h", bytes(2 * (int(duration * SR) + SR)))
    for at, clip in clips:
        i0 = int(at * SR)
        track[i0:i0 + len(clip)] = clip[:max(0, len(track) - i0)]
    (video / "audio").mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        wav, m4a = Path(tmp) / "voice.wav", Path(tmp) / f"{lang}.m4a"
        with wave.open(str(wav), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(track.tobytes())
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-t", f"{duration:.3f}",
                        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "1",
                        "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", str(m4a)], check=True)
        shutil.move(str(m4a), str(video / "audio" / f"{lang}.m4a"))  # atomic: never a half-written track
    return {"digest": digest(video, data, lang, engine.name), "engine": engine.name, "voice": cfg["voice"],
            "duration": duration, "scenes": plan}


PREFIX = "/* Generated by scripts/video/narrate.py — do not edit. */\nwindow.VIDEO_TIMING = "


def read_timing(video: Path) -> dict:
    p = video / "timing.js"
    txt = p.read_text(encoding="utf-8") if p.exists() else ""
    return json.loads(txt[len(PREFIX):].rstrip().rstrip(";")) if txt.startswith(PREFIX) else {}


def check(videos: list[Path]) -> int:
    bad = []
    for v in videos:
        data, timing = load_script(v), read_timing(v)
        for lang in langs_of(data):
            t = timing.get(lang)
            if not t:
                bad.append(f"{v.name} [{lang}]: no timing")
            elif t["digest"] != digest(v, data, lang, t["engine"]):
                bad.append(f"{v.name} [{lang}]: stale timing (script.json or lexicon changed)")
            if not (v / "audio" / f"{lang}.m4a").exists():
                bad.append(f"{v.name} [{lang}]: audio/{lang}.m4a missing")
    print("\n".join(bad) or "narration up to date", file=sys.stderr)
    return 1 if bad else 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("videos", nargs="*", help="video folders under static/videos (default: all)")
    ap.add_argument("--lang", action="append", help="language (repeatable, default: all in script.json)")
    ap.add_argument("--engine", choices=sorted(ENGINES), default="kokoro")
    ap.add_argument("--check", action="store_true", help="only verify timing.js and audio are up to date")
    args = ap.parse_args(argv)
    known = {p.parent.name: p.parent for p in sorted(VIDEOS.glob("*/script.json"))}
    for name in args.videos:
        if name not in known:
            raise SystemExit(f"Unknown video: {name} (known: {', '.join(known)})")
    videos = [known[n] for n in args.videos] if args.videos else list(known.values())
    if args.check:
        return check(videos)
    if not shutil.which("ffmpeg"):
        raise SystemExit("ffmpeg not found in PATH (brew install ffmpeg).")
    engine = {"kokoro": Kokoro, "espeak": Espeak, "say": Say}[args.engine]()
    for v in videos:
        data, timing = load_script(v), read_timing(v)
        for lang in args.lang or langs_of(data):
            timing[lang] = build_lang(v, data, lang, engine)
            print(f"{v.name} [{lang}] {timing[lang]['duration']:.1f} s ({engine.name}/{timing[lang]['voice']})")
        (v / "timing.js").write_text(PREFIX + json.dumps(timing, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
