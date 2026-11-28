/* Home Assistant to an agentic PR (see ../engine/engine.js and the canvas-video skill).
 * Scenes are pure functions of t; animations hang on the spoken sentences (at(cues, i)).
 * The workflow names, payload keys and YAML are the real ones of mmornati/home-assistant-csnet-home
 * and of the recipe in these docs; the beta version shown (2026.12.0b0) is the next expected release.
 */
"use strict";

const STR = {
  en: {
    k_problem: "EVERY MONTH", h_problem: "A new Home Assistant. Will the integration survive it?",
    k_before: "BEFORE", h_before: "A cron job polling PyPI.",
    every6: "every 6 h", late: "up to 6 h late", wasted: "4 runs a day, most for nothing", blind: "PyPI only",
    k_watch: "THE WATCH", h_watch: "Angelia watches home-assistant/core.",
    k_dispatch: "THE DISPATCH", h_dispatch: "One event, sent to the repository.",
    k_tests: "TESTS FIRST", h_tests: "That exact version, tested.",
    k_review: "THE REVIEW", h_review: "A model that can only write.",
    notools: "no tools · contents: read · one API call",
    k_fix: "THE FIX", h_fix: "A human approves. An agent prepares.",
    label: "ha-review:fix",
    t1: "Detect", t2: "Test", t3: "Review", t4: "Fix",
    docs: "angelia-dev.github.io/docs/recipes/home-assistant-agentic",
  },
};

const GOLD = "#fbbf24", GOLD2 = "#f59e0b", CANARY = "#fde68a", INDIGO = "#4338ca", MID = "#14123a";

/* The Angelia mark: an A as a rising peak, three gold feathers, a spark. Drawn at (x, y) top-left, size s. */
function mark(x, y, s, k = 1) {
  if (k <= 0) return;
  const f = s / 420;
  ctx.save();
  ctx.globalAlpha *= clamp(k);
  ctx.translate(x, y); ctx.scale(f, f); ctx.translate(-80, -10);
  ctx.lineJoin = "round"; ctx.lineCap = "round";
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 44;
  const p = partial([[112, 412], [256, 108], [400, 412]], outCubic(seg(k, 0, 0.7)));
  ctx.beginPath(); p.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke();
  const feathers = [
    ["M168 316 C246 318 330 298 418 236 C374 306 286 338 180 342 Z", GOLD2],
    ["M184 272 C254 270 330 246 404 186 C366 254 292 290 196 298 Z", GOLD],
    ["M202 228 C258 222 318 196 380 140 C352 206 296 240 214 254 Z", CANARY],
    ["M256 20 L266 48 L294 58 L266 68 L256 96 L246 68 L218 58 L246 48 Z", GOLD2],
  ];
  feathers.forEach(([d, c], i) => {
    ctx.save(); ctx.globalAlpha *= seg(k, 0.45 + i * 0.12, 0.7 + i * 0.12);
    ctx.fillStyle = c; ctx.fill(new Path2D(d)); ctx.restore();
  });
  ctx.restore();
}

/* Gold Baudot tape along y, scrolling with t. */
function tape(y, t, k = 1, h = 14) {
  if (k <= 0) return;
  ctx.save(); ctx.globalAlpha *= k;
  ctx.fillStyle = GOLD2; ctx.fillRect(0, y, W * outCubic(k), h);
  ctx.fillStyle = MID;
  const off = (t * 40) % 72;
  for (let x = -72 + off; x < W * outCubic(k); x += 12) {
    const col = Math.round((x - off) / 12);
    ctx.beginPath(); ctx.arc(x, y + h / 2, 1.3, 0, Math.PI * 2); ctx.fill();
    const bits = (col * 2654435761) >>> 0;
    if (bits & 1) { ctx.beginPath(); ctx.arc(x, y + h * 0.2, 1.9, 0, Math.PI * 2); ctx.fill(); }
    if (bits & 4) { ctx.beginPath(); ctx.arc(x, y + h * 0.8, 1.9, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}

function bg(t) {
  const g = ctx.createLinearGradient(0, H, W, 0);
  g.addColorStop(0, "#0d0b2a"); g.addColorStop(1, "#1e1b4b");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = 0.06; ctx.fillStyle = "#c7d2fe";
  for (let y = 40; y < H; y += 40) for (let x = 40; x < W; x += 40) ctx.fillRect(x, y, 1.5, 1.5);
  ctx.restore();
}


/* 1. Every month */
const MONTHS = ["2026.7", "2026.8", "2026.9", "2026.10", "2026.11", "2026.12"];
function sProblem(t, d, cues) {
  const a1 = at(cues, 1, 4.8);
  kicker(S.k_problem, seg(t, 0.1, 0.5));
  headline(S.h_problem, seg(t, 0.2, 0.9), 132, 38);
  MONTHS.forEach((m, i) => {
    const x = 80 + i * 190, k = seg(t, 0.6 + i * 0.35, 1.0 + i * 0.35);
    const next = i === MONTHS.length - 1;
    panel(x, 220, 170, 200, { r: 8, fill: next ? "#2a2563" : "#17153f", stroke: next ? GOLD : "#3730a3", alpha: k });
    text(m, x + 85, 262, { size: 26, weight: 800, font: SORA, align: "center", color: next ? CANARY : "#fff", alpha: k });
    for (let b = 0; b < 4; b++) dot(x + 40 + b * 30, 320, 6, next ? GOLD : "#6366f1", k * (b < 3 ? 0.6 : 1));
    text(next ? "b0 … b6, .0" : "betas, .0, .x", x + 85, 370, { size: 14, font: MONO, color: "#a5b4fc", align: "center", alpha: k });
  });
  const kb = seg(t, a1, a1 + 0.6);
  ["climate", "water_heater", "sensor", "config_entries"].forEach((s, i) => {
    pill(s, 80 + i * 230, 500, { size: 16, align: "left", alpha: seg(t, a1 + i * 0.25, a1 + i * 0.25 + 0.4), fill: "#2a1630", stroke: "#f87171", color: "#fecaca" });
  });
  void kb;
}

/* 2. Before */
function sBefore(t, d, cues) {
  const a1 = at(cues, 1, 4.6);
  kicker(S.k_before, seg(t, 0.1, 0.5));
  headline(S.h_before, seg(t, 0.2, 0.9));
  terminal(80, 200, 620, 170, t, [
    { p: "", s: "on:", a: 0.5, c: "#a5b4fc" },
    { p: "", s: "  schedule:", a: 0.7, c: "#a5b4fc" },
    { p: "", s: "    - cron: '17 */6 * * *'", a: 0.9, b: 1.8, c: CANARY },
  ], { title: "ha-release-review.yaml", size: 18, lh: 30 });
  // a timeline with polls every 6 h and a release landing just after one
  const y = 470, x0 = 80, x1 = 1200;
  const k = seg(t, 1.2, 2.2);
  line(partial([[x0, y], [x1, y]], outCubic(k)), "#3730a3", 3);
  for (let i = 0; i <= 4; i++) {
    const x = x0 + i * (x1 - x0) / 4;
    dot(x, y, 7, "#818cf8", seg(t, 1.4 + i * 0.2, 1.7 + i * 0.2));
    text(`${String(i * 6).padStart(2, "0")}:17`, x, y + 34, { size: 14, font: MONO, color: C.faint, align: "center", alpha: seg(t, 1.4 + i * 0.2, 1.7 + i * 0.2) });
  }
  const rx = x0 + 0.29 * (x1 - x0), kr = seg(t, a1, a1 + 0.4);
  dot(rx, y, 10, GOLD, kr);
  text("release", rx, y - 24, { size: 15, weight: 700, font: MONO, color: GOLD, align: "center", alpha: kr });
  const kl = seg(t, a1 + 0.5, a1 + 1.4);
  line(partial([[rx, y + 60], [x0 + 0.5 * (x1 - x0), y + 60]], outCubic(kl)), "#f87171", 3);
  text(S.late, (rx + x0 + 0.5 * (x1 - x0)) / 2, y + 90, { size: 15, font: MONO, color: "#fecaca", align: "center", alpha: kl });
  [S.wasted, S.blind].forEach((s, i) => pill(s, 1200, 230 + i * 60, { size: 16, align: "right", alpha: seg(t, a1 + 1 + i * 0.5, a1 + 1.4 + i * 0.5), fill: "#2a1630", stroke: "#f87171", color: "#fecaca" }));
}

/* 3. The watch */
const WATCH = [
  ["- name: ", "home-assistant"],
  ["  source: ", "github-release"],
  ["  coordinates: ", "{ repo: home-assistant/core }"],
  ["  scheme: ", "calver"],
  ["  interval: ", "30m"],
  ["  policy: ", "{ prerelease: include }"],
  ["# subscription", ""],
  ["  policy: ", "{ cooldown: 1h }"],
];
function sWatch(t, d, cues) {
  const a1 = at(cues, 1, 3.5), a2 = at(cues, 2, 7.5);
  kicker(S.k_watch, seg(t, 0.1, 0.5));
  headline(S.h_watch, seg(t, 0.2, 0.9));
  panel(80, 190, 700, 380, { r: 6, fill: "#0d0b2a", stroke: "#3730a3" });
  ctx.fillStyle = GOLD2; ctx.fillRect(80, 190, 700 * seg(t, 0.3, 1), 4);
  text("watches.yaml", 104, 222, { size: 13, font: MONO, color: C.faint });
  WATCH.forEach(([k, v], i) => {
    const kk = seg(t, 0.6 + i * 0.25, 1.0 + i * 0.25);
    const y = 262 + i * 38;
    text(k, 104, y, { size: 19, font: MONO, color: k.startsWith("#") ? C.faint : "#a5b4fc", alpha: kk });
    text(typed(v, kk), 104 + measure(k, 19, 400, MONO), y, { size: 19, font: MONO, color: CANARY, alpha: kk });
  });
  highlight(98, 262 + 3 * 38 - 24, 300, 34, seg(t, a1, a1 + 0.5), GOLD);
  highlight(98, 262 + 7 * 38 - 24, 360, 34, seg(t, a2, a2 + 0.5), GOLD);
  // calver ordering
  const ks = seg(t, a1 + 0.3, a1 + 1);
  ["2026.11.1", "2026.12.0b0  pre-release", "2026.12.0"].forEach((v, i) => {
    pill(v, 830, 280 + i * 64, { size: 17, align: "left", alpha: seg(t, a1 + 0.3 + i * 0.3, a1 + 0.7 + i * 0.3), fill: i === 1 ? "#2a2563" : "#1e1b4b", stroke: i === 1 ? GOLD : "#6366f1", color: i === 1 ? CANARY : "#e0e7ff" });
    if (i < 2) arrow(860, 298 + i * 64, 860, 326 + i * 64, ks, "#6366f1");
  });
  const kc = seg(t, a2 + 0.3, a2 + 1);
  text("GitHub release  →  +1 h  →  PyPI wheel ready", 830, 520, { size: 15, font: MONO, color: "#c7d2fe", alpha: kc });
}

/* 4. The dispatch */
const PAYLOAD = [
  ["event_type", "ha-release"], ["package", "home-assistant/core"], ["version", "2026.12.0b0"],
  ["previous_version", "2026.11.1"], ["bump", "minor"], ["event_id", "01KB…7Q"],
];
function sDispatch(t, d, cues) {
  const a1 = at(cues, 1, 5.5);
  kicker(S.k_dispatch, seg(t, 0.1, 0.5));
  headline(S.h_dispatch, seg(t, 0.2, 0.9));
  const ka = seg(t, 0.5, 1.1), kr = seg(t, 1.6, 2.2);
  panel(80, 280, 250, 110, { r: 10, fill: "#14123a", stroke: GOLD, alpha: ka });
  mark(96, 296, 70, ka);
  text("angelia", 180, 345, { size: 28, weight: 800, font: SORA, alpha: ka });
  text("on the VPS", 180, 372, { size: 13, font: MONO, color: C.faint, alpha: ka });
  panel(890, 280, 310, 110, { r: 10, fill: "#14123a", stroke: "#818cf8", alpha: kr });
  text("mmornati/", 914, 322, { size: 16, font: MONO, color: "#a5b4fc", alpha: kr });
  text("home-assistant-csnet-home", 914, 350, { size: 16, weight: 700, font: MONO, color: "#fff", alpha: kr });
  text("GitHub Actions", 914, 374, { size: 13, font: MONO, color: C.faint, alpha: kr });
  const kw = seg(t, 2.2, 3.2);
  arrow(335, 335, 885, 335, kw, GOLD);
  text("POST /repos/…/dispatches", 610, 318, { size: 15, font: MONO, color: GOLD, align: "center", alpha: kw });
  if (kw >= 1) packets(335, 335, 885, 335, t, { n: 2, period: 1.5, color: CANARY });
  panel(330, 410, 560, 210, { r: 6, fill: "#0d0b2a", stroke: "#3730a3", alpha: seg(t, a1, a1 + 0.4) });
  PAYLOAD.forEach(([k, v], i) => {
    const kk = seg(t, a1 + 0.2 + i * 0.3, a1 + 0.5 + i * 0.3);
    const y = 445 + i * 29;
    text(i === 0 ? k + ":" : "client_payload." + k + ":", 354, y, { size: 16, font: MONO, color: "#a5b4fc", alpha: kk });
    text(v, 866, y, { size: 16, font: MONO, color: CANARY, align: "right", alpha: kk });
  });
}

/* 5. Tests first */
const JOBS = [
  ["validate", "package + version pattern, through env:"],
  ["wait", "homeassistant 2026.12.0b0 on PyPI"],
  ["install", "scripts/ci/install_ha.sh 2026.12.0b0 tests"],
  ["smoke", "import every integration module"],
  ["pytest", "tests/ against that exact version"],
];
function sTests(t, d, cues) {
  const a1 = at(cues, 1, 5.5);
  kicker(S.k_tests, seg(t, 0.1, 0.5));
  headline(S.h_tests, seg(t, 0.2, 0.9));
  text("HA Release from Angelia", 80, 200, { size: 15, font: MONO, color: C.faint, alpha: seg(t, 0.4, 0.8) });
  JOBS.forEach(([n, s], i) => {
    const start = i < 3 ? 0.6 + i * 1.2 : a1 + (i - 3) * 1.4;
    const k = seg(t, start, start + 0.3), done = seg(t, start + 0.9, start + 1.2);
    const y = 245 + i * 70;
    panel(80, y - 26, 1120, 54, { r: 8, fill: "#17153f", stroke: done >= 1 ? "#4ade80" : "#3730a3", alpha: k });
    text(n, 140, y + 7, { size: 20, weight: 800, font: SORA, alpha: k });
    text(s, 300, y + 7, { size: 17, font: MONO, color: "#c7d2fe", alpha: k });
    if (done > 0) check(108, y, 18, "#4ade80", done);
    else if (k > 0) ring(108, y, 9, GOLD, 2, k * (0.5 + 0.5 * Math.sin(t * 6)));
  });
}

/* 6. The review */
function sReview(t, d, cues) {
  const a1 = at(cues, 1, 8);
  kicker(S.k_review, seg(t, 0.1, 0.5));
  headline(S.h_review, seg(t, 0.2, 0.9));
  const inputs = ["release-notes.md", "ha-api.diff", "import_smoke.log", "pytest.log"];
  inputs.forEach((s, i) => {
    const k = seg(t, 0.8 + i * 0.5, 1.2 + i * 0.5);
    panel(80, 210 + i * 80, 300, 56, { r: 6, fill: "#17153f", stroke: "#3730a3", alpha: k });
    text(s, 104, 245 + i * 80, { size: 17, font: MONO, color: "#e0e7ff", alpha: k });
    arrow(385, 238 + i * 80, 520, 360, seg(t, 1.2 + i * 0.5, 1.6 + i * 0.5), "#6366f1");
  });
  const kc = seg(t, 1.5, 2.1);
  panel(525, 290, 230, 140, { r: 12, fill: "#2a2563", stroke: GOLD, alpha: kc });
  text("Claude", 640, 355, { size: 30, weight: 800, font: SORA, align: "center", alpha: kc });
  text("Messages API", 640, 388, { size: 14, font: MONO, color: "#c7d2fe", align: "center", alpha: kc });
  const kn = seg(t, a1, a1 + 0.5);
  pill(S.notools, 640, 470, { size: 15, align: "center", alpha: kn, fill: "#14123a", stroke: GOLD, color: CANARY });
  const kr = seg(t, a1 + 0.8, a1 + 1.4);
  arrow(760, 360, 880, 360, kr, GOLD);
  panel(890, 230, 310, 260, { r: 6, fill: "#fef6d3", stroke: false, alpha: kr });
  ["ha-review.md", "", "| change | impact |", "| climate … | OK |", "| sensor … | CHECK |", "| … | … |"].forEach((s, i) =>
    text(s, 912, 268 + i * 32, { size: 15, font: MONO, color: i === 0 ? "#b45309" : "#2a2614", weight: i === 0 ? 700 : 400, alpha: kr }));
}

/* 7. The fix */
function sFix(t, d, cues) {
  const a1 = at(cues, 1, 2.5), a2 = at(cues, 2, 8.5);
  kicker(S.k_fix, seg(t, 0.1, 0.5));
  headline(S.h_fix, seg(t, 0.2, 0.9));
  const ki = seg(t, 0.4, 0.9);
  panel(80, 200, 520, 130, { r: 8, fill: "#17153f", stroke: "#3730a3", alpha: ki });
  dot(108, 236, 8, "#4ade80", ki);
  text("Home Assistant 2026.12 compatibility review", 126, 242, { size: 17, weight: 700, alpha: ki });
  pill("ha-release-review", 100, 290, { size: 13, align: "left", alpha: ki, fill: "#0f2a3a", stroke: "#41bdf5", color: "#bae6fd" });
  const kl = seg(t, a1, a1 + 0.5);
  pill(S.label, 300, 290, { size: 13, align: "left", alpha: kl, fill: "#0f3a1e", stroke: "#4ade80", color: "#bbf7d0" });
  text("added by the maintainer", 300, 322 + (1 - kl) * 8, { size: 13, font: MONO, color: C.faint, alpha: kl });
  // agent sandbox
  const ks = seg(t, a1 + 1.2, a1 + 1.8);
  panel(660, 200, 540, 220, { r: 8, fill: "#0d0b2a", stroke: GOLD, alpha: ks, lw: 1.5 });
  text("agent sandbox", 684, 230, { size: 13, font: MONO, color: GOLD, alpha: ks });
  ["custom_components/csnet_home/", "tests/", "pytest"].forEach((s, i) =>
    text("✓ " + s, 684, 270 + i * 34, { size: 17, font: MONO, color: "#bbf7d0", alpha: seg(t, a1 + 1.6 + i * 0.3, a1 + 2 + i * 0.3) }));
  text("✗ everything else", 684, 372, { size: 17, font: MONO, color: "#fecaca", alpha: seg(t, a1 + 2.6, a1 + 3) });
  arrow(600, 265, 655, 265, ks, "#6366f1");
  // pull request
  const kp = seg(t, a2, a2 + 0.6);
  panel(80, 460, 1120, 100, { r: 8, fill: "#17153f", stroke: "#a78bfa", alpha: kp });
  text("Pull request", 110, 500, { size: 22, weight: 800, font: SORA, alpha: kp });
  text("fix: adapt to Home Assistant 2026.12 · review requested", 110, 534, { size: 16, font: MONO, color: "#c7d2fe", alpha: kp });
  pill("never merged by a bot", 1176, 510, { size: 14, align: "right", alpha: seg(t, a2 + 0.6, a2 + 1.1), fill: "#14123a", stroke: GOLD, color: CANARY });
}

/* 8. Outro */
function sOutro(t, d, cues) {
  const a1 = at(cues, 1, 3);
  [S.t1, S.t2, S.t3, S.t4].forEach((s, i) => {
    const k = seg(t, 0.3 + i * 0.4, 0.7 + i * 0.4), x = 230 + i * 273;
    dot(x, 250, 10, i === 0 ? GOLD : "#c7d2fe", k);
    text(s, x, 300, { size: 36, weight: 800, font: SORA, align: "center", alpha: k });
    if (i < 3) arrow(x + 26, 250, x + 247, 250, seg(t, 0.5 + i * 0.4, 0.9 + i * 0.4), GOLD);
  });
  mark(80, 380, 90, seg(t, a1, a1 + 1));
  text("Angelia", 190, 450, { size: 48, weight: 800, font: SORA, alpha: seg(t, a1 + 0.2, a1 + 0.8) });
  text(S.docs, 192, 490, { size: 17, font: MONO, color: GOLD, alpha: seg(t, a1 + 0.6, a1 + 1.2) });
  tape(580, t, seg(t, a1 + 0.5, a1 + 1.6));
}

VIDEO.create({
  title: { en: "Home Assistant to an agentic PR" },
  kicker: { en: "Angelia · recipe" },
  langs: ["en"],
  theme: {
    bg: "#0d0b2a", bg2: "#1e1b4b", panel: "#1e1b4b", panel2: "#262262", line: "#3730a3",
    ink: "#ffffff", soft: "#c7d2fe", faint: "#8587bd", accent: GOLD, accent2: "#a5b4fc",
    good: "#4ade80", warn: GOLD, bad: "#f87171", deep: "#14123a", term: "#0b0a24", termInk: "#e0e7ff",
  },
  strings: STR,
  background: bg,
  poster: "dispatch",
  scenes: { problem: sProblem, before: sBefore, watch: sWatch, dispatch: sDispatch, tests: sTests, review: sReview, fix: sFix, outro: sOutro },
});
