/* Scenes of "A CI that reads the release notes" (see ../engine/engine.js).
 *
 * Each scene is fn(t, d, cues): t = local time in seconds, d = scene duration,
 * cues = the spoken sentences from timing.js. Animations hook onto at(cues, i)
 * so they follow the voice in every language. Pure functions of t.
 *
 * Colour code, same as the blog post diagrams: grey = deterministic,
 * blue = a model runs, red = a human decision.
 */
"use strict";

const P = {
  paper: "#f3f2ee", card: "#fbfaf7", ink: "#1a1a1a", ink2: "#4a4945", ink3: "#85827a", rule: "#d6d3ca",
  red: "#e4002b", redSoft: "#fbe3e6", blue: "#1f8fd0", blueSoft: "#dbe9f6", grey: "#eceae4", green: "#1d8a4a",
  amber: "#b7791f",
};

const STR = {
  en: {
    k1: "HOME ASSISTANT · CUSTOM INTEGRATION", h1: "A new release every month.",
    dep: "deprecated", rem: "removed", bugT: "Bug report", bugB: "TypeError on climate platform", bugC: "“since recent Home Assistant updates”",
    k2: "THE NIGHTLY CHECK", h2: "Green, every night.", night: "night", failed: "5 failed · 7 errors", hidden: "hidden by continue-on-error",
    k3: "THE NEW CI", h3: "Three layers.",
    l1: "Nightly checks", l1a: "unit tests · import smoke", l1b: "last 4 releases + beta", l1c: "fail for real",
    l2: "Release review", l2a: "once per monthly release", l2b: "1 API call · no tools", l2c: "opens an issue",
    l3: "Fix on request", l3a: "maintainer adds a label", l3b: "6 narrow tools", l3c: "opens a PR · never merges",
    det: "deterministic", llm: "model", hum: "human decision",
    k4: "DETECT AND COLLECT", h4: "Facts first.", every: "every 6 h", newv: "new", reviewed: "issue exists? → skip",
    diffT: "diff of the base modules we inherit from",
    k5: "THE REVIEW", h5: "One call. No tools.", tools: "tools: none",
    d1: "release notes", d2: "developer blog · 20 posts", d3: "ha-api.diff", d4: "smoke + test logs", d5: "integration source",
    colC: "Change", colS: "Severity", colD: "Deadline",
    r1: "update listener + reload", r2: "water heater native_*", r3: "climate aliases", r4: "DeviceInfo dataclass",
    na: "NOT AFFECTED", depS: "DEPRECATED", cost: "per release", tok: "197,674 in · 18,742 out · Opus 5.5",
    k6: "PUBLISH, WITHOUT A MODEL", h6: "Stop at an issue.", job: "publish job · no model",
    s1: "not empty, < 60 KB", s2: "no credential-like text", s3: "@mentions neutralised",
    issueT: "Home Assistant 2026.11 compatibility review", conf: "confirmed", fp: "false positive", footer: "verify before acting",
    k7: "ONE LABEL", h7: "The label is the approval.", gate: "gate: write access?", tl: "Claude's tools",
    t1: "list_files", t2: "read_file", t3: "search", t4: "replace_in_file", t5: "write_file", t6: "run_tests",
    scope: "csnet_home/ + tests/ · HA source read-only", no1: "shell", no2: "network", no3: "git",
    k8: "THE PULL REQUEST", h8: "Never merged by a bot.",
    p1: "Claude edits", p2: "tests re-run", p3: "path check", p4: "PR, no model", p5: "CI + human review",
    ok1: "custom_components/csnet_home/", ok2: "tests/", bad1: "manifest.json", bad2: "anything else", merge: "Merge",
    k9: "THE RULE", r9a: "The model that reads untrusted text can't act.", r9b: "The model that acts doesn't decide when.",
    eco: "Same pattern, any plugin:", e1: "Home Assistant", e2: "Grafana", e3: "VS Code", e4: "WordPress", e5: "Terraform", e6: "Kubernetes operators",
    url: "blog.mornati.net",
  },
  fr: {
    k1: "HOME ASSISTANT · INTÉGRATION PERSONNALISÉE", h1: "Une nouvelle version par mois.",
    dep: "déprécié", rem: "supprimé", bugT: "Rapport de bug", bugB: "TypeError sur la plateforme climate", bugC: "« depuis les dernières mises à jour »",
    k2: "LA VÉRIFICATION NOCTURNE", h2: "Verte, chaque nuit.", night: "nuit", failed: "5 échecs · 7 erreurs", hidden: "masqués par continue-on-error",
    k3: "LE NOUVEAU CI", h3: "Trois couches.",
    l1: "Vérifs nocturnes", l1a: "tests unitaires · import", l1b: "4 dernières versions + bêta", l1c: "échouent vraiment",
    l2: "Revue de version", l2a: "une fois par version mensuelle", l2b: "1 appel d'API · sans outil", l2c: "ouvre une issue",
    l3: "Correctif à la demande", l3a: "le mainteneur ajoute un label", l3b: "6 outils restreints", l3c: "ouvre une PR · ne fusionne pas",
    det: "déterministe", llm: "modèle", hum: "décision humaine",
    k4: "DÉTECTER ET COLLECTER", h4: "Les faits d'abord.", every: "toutes les 6 h", newv: "nouvelle", reviewed: "issue existante ? → rien",
    diffT: "diff des modules de base dont on hérite",
    k5: "LA REVUE", h5: "Un appel. Aucun outil.", tools: "outils : aucun",
    d1: "notes de version", d2: "blog des développeurs · 20 billets", d3: "ha-api.diff", d4: "logs import + tests", d5: "code de l'intégration",
    colC: "Changement", colS: "Gravité", colD: "Échéance",
    r1: "update listener + reload", r2: "water heater native_*", r3: "alias climate", r4: "DeviceInfo dataclass",
    na: "NON CONCERNÉ", depS: "DÉPRÉCIÉ", cost: "par version", tok: "197 674 en entrée · 18 742 en sortie · Opus 5.5",
    k6: "PUBLIER, SANS MODÈLE", h6: "On s'arrête à une issue.", job: "job publish · sans modèle",
    s1: "non vide, < 60 Ko", s2: "aucun texte type secret", s3: "@mentions neutralisées",
    issueT: "Home Assistant 2026.11 compatibility review", conf: "confirmé", fp: "faux positif", footer: "vérifier avant d'agir",
    k7: "UN LABEL", h7: "Le label vaut approbation.", gate: "gate : droits d'écriture ?", tl: "Les outils de Claude",
    t1: "list_files", t2: "read_file", t3: "search", t4: "replace_in_file", t5: "write_file", t6: "run_tests",
    scope: "csnet_home/ + tests/ · source HA en lecture seule", no1: "shell", no2: "réseau", no3: "git",
    k8: "LA PULL REQUEST", h8: "Jamais fusionnée par un bot.",
    p1: "Claude modifie", p2: "tests relancés", p3: "contrôle des chemins", p4: "PR, sans modèle", p5: "CI + revue humaine",
    ok1: "custom_components/csnet_home/", ok2: "tests/", bad1: "manifest.json", bad2: "tout le reste", merge: "Merge",
    k9: "LA RÈGLE", r9a: "Le modèle qui lit du texte non fiable n'agit pas.", r9b: "Le modèle qui agit ne décide pas quand.",
    eco: "Même schéma, tout plugin :", e1: "Home Assistant", e2: "Grafana", e3: "VS Code", e4: "WordPress", e5: "Terraform", e6: "opérateurs Kubernetes",
    url: "blog.mornati.net",
  },
  it: {
    k1: "HOME ASSISTANT · INTEGRAZIONE PERSONALIZZATA", h1: "Una nuova versione ogni mese.",
    dep: "deprecato", rem: "rimosso", bugT: "Segnalazione", bugB: "TypeError sulla piattaforma climate", bugC: "“dagli ultimi aggiornamenti”",
    k2: "IL CONTROLLO NOTTURNO", h2: "Verde, ogni notte.", night: "notte", failed: "5 falliti · 7 errori", hidden: "nascosti da continue-on-error",
    k3: "IL NUOVO CI", h3: "Tre livelli.",
    l1: "Controlli notturni", l1a: "unit test · import smoke", l1b: "ultime 4 versioni + beta", l1c: "falliscono davvero",
    l2: "Revisione release", l2a: "una volta per versione mensile", l2b: "1 chiamata API · zero strumenti", l2c: "apre una issue",
    l3: "Fix su richiesta", l3a: "il maintainer aggiunge una label", l3b: "6 strumenti ristretti", l3c: "apre una PR · mai merge",
    det: "deterministico", llm: "modello", hum: "decisione umana",
    k4: "RILEVARE E RACCOGLIERE", h4: "Prima i fatti.", every: "ogni 6 h", newv: "nuova", reviewed: "issue esiste? → niente",
    diffT: "diff dei moduli base da cui ereditiamo",
    k5: "LA REVISIONE", h5: "Una chiamata. Zero strumenti.", tools: "strumenti: nessuno",
    d1: "note di rilascio", d2: "blog sviluppatori · 20 articoli", d3: "ha-api.diff", d4: "log import + test", d5: "codice dell'integrazione",
    colC: "Modifica", colS: "Gravità", colD: "Scadenza",
    r1: "update listener + reload", r2: "water heater native_*", r3: "alias climate", r4: "DeviceInfo dataclass",
    na: "NON COINVOLTO", depS: "DEPRECATO", cost: "per versione", tok: "197.674 in · 18.742 out · Opus 5.5",
    k6: "PUBBLICARE, SENZA MODELLO", h6: "Ci si ferma a una issue.", job: "job publish · senza modello",
    s1: "non vuoto, < 60 KB", s2: "niente testo simile a segreti", s3: "@menzioni neutralizzate",
    issueT: "Home Assistant 2026.11 compatibility review", conf: "confermato", fp: "falso positivo", footer: "verificare prima di agire",
    k7: "UNA LABEL", h7: "La label è l'approvazione.", gate: "gate: permessi di scrittura?", tl: "Gli strumenti di Claude",
    t1: "list_files", t2: "read_file", t3: "search", t4: "replace_in_file", t5: "write_file", t6: "run_tests",
    scope: "csnet_home/ + tests/ · sorgente HA in sola lettura", no1: "shell", no2: "rete", no3: "git",
    k8: "LA PULL REQUEST", h8: "Mai unita da un bot.",
    p1: "Claude modifica", p2: "test rilanciati", p3: "controllo percorsi", p4: "PR, senza modello", p5: "CI + revisione umana",
    ok1: "custom_components/csnet_home/", ok2: "tests/", bad1: "manifest.json", bad2: "tutto il resto", merge: "Merge",
    k9: "LA REGOLA", r9a: "Il modello che legge testo non fidato non agisce.", r9b: "Il modello che agisce non decide quando.",
    eco: "Stesso schema, ogni plugin:", e1: "Home Assistant", e2: "Grafana", e3: "VS Code", e4: "WordPress", e5: "Terraform", e6: "operatori Kubernetes",
    url: "blog.mornati.net",
  },
};

/* ------------------------------------------------------------------ helpers */

function bg(t) {
  ctx.fillStyle = P.paper; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.strokeStyle = P.rule; ctx.globalAlpha = 0.35; ctx.lineWidth = 1;
  for (let y = 40; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
  // the red rule of the blog covers
  panel(56, 66, 4, 70, { r: 2, fill: P.red, stroke: false });
}

function title(kick, head, t, y = 128, size = 44) {
  kicker(kick, seg(t, 0.05, 0.5), 80, 86);
  headline(head, seg(t, 0.15, 0.8), y, size);
}

/* A box in one of the three colours: kind = "det" | "llm" | "hum". */
function box(x, y, w, h, kind, o = {}) {
  const fill = kind === "llm" ? P.blueSoft : kind === "hum" ? P.redSoft : P.grey;
  const stroke = kind === "llm" ? P.blue : kind === "hum" ? P.red : P.ink3;
  panel(x, y, w, h, { r: o.r ?? 12, fill, stroke, lw: o.lw ?? 1.5, alpha: o.alpha ?? 1 });
}

function sev(s, x, y, alpha) {
  const c = s === "D" ? P.amber : s === "B" ? P.red : P.ink3;
  const label = s === "D" ? S.depS : S.na;
  pill(label, x, y, { size: 12, fill: P.card, stroke: c, color: c, alpha, h: 24 });
}

/* ------------------------------------------------------------------- scenes */

function sHook(t, d, cues) {
  title(S.k1, S.h1, t);
  const a1 = at(cues, 1, 2.5), a2 = at(cues, 2, 5);
  const months = ["2026.6", "2026.7", "2026.8", "2026.9", "2026.10", "2026.11"];
  const x0 = 120, x1 = 1160, y = 300;
  line(partial([[x0 - 30, y], [x1 + 30, y]], outCubic(seg(t, 0.4, 1.6))), P.ink3, 2);
  months.forEach((m, i) => {
    const x = lerp(x0, x1, i / (months.length - 1)), k = outBack(seg(t, 0.6 + i * 0.15, 1.0 + i * 0.15));
    dot(x, y, 9 * k, i === months.length - 1 ? P.blue : P.ink);
    text(m, x, y + 38, { size: 16, font: MONO, color: P.ink2, align: "center", alpha: k });
    // each release brings something: deprecations or removals
    const kk = seg(t, a1 + i * 0.12, a1 + 0.4 + i * 0.12);
    const tag = i % 3 === 1 ? S.rem : S.dep;
    pill(tag, x, y - 40, { size: 12, fill: P.card, stroke: i % 3 === 1 ? P.red : P.amber, color: i % 3 === 1 ? P.red : P.amber, align: "center", alpha: kk, h: 24 });
  });
  // the bug report arrives
  const kb = outCubic(seg(t, a2, a2 + 0.7));
  const bx = lerp(1300, 640, kb), by = 400;
  panel(bx, by, 540, 160, { r: 12, fill: P.card, stroke: P.red, lw: 2, alpha: kb, shadow: false });
  if (kb > 0) {
    dot(bx + 30, by + 34, 7, P.red, kb);
    text(S.bugT, bx + 48, by + 40, { size: 16, weight: 700, font: SORA, color: P.red, alpha: kb });
    text(S.bugB, bx + 24, by + 84, { size: 19, weight: 600, font: MONO, color: P.ink, alpha: kb });
    text(S.bugC, bx + 24, by + 124, { size: 17, color: P.ink2, alpha: kb });
  }
}

function sGreen(t, d, cues) {
  title(S.k2, S.h2, t);
  const a1 = at(cues, 1, 2.6), a2 = at(cues, 2, 5);
  const flip = seg(t, a2 + 0.2, a2 + 1.4);
  for (let i = 0; i < 7; i++) {
    const x = 120 + i * 150, y = 250, k = outBack(seg(t, 0.4 + i * 0.12, 0.8 + i * 0.12));
    const red = flip > i / 7;
    panel(x, y, 120, 120, { r: 14, fill: P.card, stroke: red ? P.red : P.green, lw: 2, alpha: k });
    if (red) cross(x + 60, y + 52, 18, P.red, 1, k); else check(x + 60, y + 54, 46, P.green, k, k);
    text(`${S.night} ${i + 1}`, x + 60, y + 100, { size: 14, font: MONO, color: P.ink3, align: "center", alpha: k });
  }
  // the YAML that hid everything
  const ky = seg(t, a1, a1 + 0.5);
  panel(120, 420, 600, 110, { r: 12, fill: P.ink, stroke: false, alpha: ky });
  text("- name: Run unit tests", 148, 460, { size: 19, font: MONO, color: "#e9e6de", alpha: ky });
  text("  continue-on-error: true", 148, 498, { size: 19, font: MONO, color: "#ff8a9a", alpha: ky });
  if (ky > 0) highlight(140, 476, 330, 32, seg(t, a1 + 0.5, a1 + 1.1), P.red);
  const kf = seg(t, a2 + 0.8, a2 + 1.4);
  text(S.failed, 760, 470, { size: 34, weight: 800, font: SORA, color: P.red, alpha: kf });
  text(S.hidden, 760, 506, { size: 17, font: MONO, color: P.ink2, alpha: kf });
}

function sLayers(t, d, cues) {
  title(S.k3, S.h3, t);
  const cols = [
    { k: "det", n: "1", h: S.l1, a: S.l1a, b: S.l1b, c: S.l1c, cue: 1 },
    { k: "llm", n: "2", h: S.l2, a: S.l2a, b: S.l2b, c: S.l2c, cue: 2 },
    { k: "hum", n: "3", h: S.l3, a: S.l3a, b: S.l3b, c: S.l3c, cue: 3 },
  ];
  cols.forEach((c, i) => {
    const s = at(cues, c.cue, 1.5 + i * 2), k = outCubic(seg(t, s, s + 0.6));
    const x = 80 + i * 380, y = 210 + (1 - k) * 30;
    box(x, y, 350, 300, c.k, { alpha: k });
    if (k <= 0) return;
    text(c.n, x + 28, y + 62, { size: 48, weight: 800, font: SORA, color: c.k === "llm" ? P.blue : c.k === "hum" ? P.red : P.ink3, alpha: k });
    text(c.h, x + 28, y + 112, { size: 24, weight: 700, font: SORA, color: P.ink, alpha: k });
    [c.a, c.b, c.c].forEach((s2, j) => text("· " + s2, x + 28, y + 160 + j * 38, { size: 17, color: P.ink2, alpha: k }));
    if (i < 2) arrow(x + 352, y + 150, x + 378, y + 150, seg(t, s + 0.4, s + 0.8), P.ink3);
  });
  // legend
  const kl = seg(t, at(cues, 3, 6) + 0.8, at(cues, 3, 6) + 1.3);
  [["det", S.det], ["llm", S.llm], ["hum", S.hum]].forEach(([k, s], i) => {
    box(80 + i * 260, 560, 22, 22, k, { r: 5, alpha: kl });
    text(s, 112 + i * 260, 577, { size: 15, font: MONO, color: P.ink2, alpha: kl });
  });
}

function sCollect(t, d, cues) {
  title(S.k4, S.h4, t);
  const a1 = at(cues, 1, 3), a2 = at(cues, 2, 6);
  // PyPI poll
  const kp = seg(t, 0.3, 0.8);
  box(80, 200, 300, 150, "det", { alpha: kp });
  text("PyPI · homeassistant", 104, 240, { size: 18, weight: 700, font: MONO, color: P.ink, alpha: kp });
  text("2026.10.4", 104, 280, { size: 17, font: MONO, color: P.ink2, alpha: kp });
  text("2026.11.0b1", 104, 314, { size: 17, font: MONO, color: P.blue, alpha: kp });
  pill(S.newv, 250, 309, { size: 12, fill: P.card, stroke: P.blue, color: P.blue, alpha: seg(t, 1.0, 1.4), h: 22 });
  // clock: every 6 h
  const cx = 470, cy = 270, kc = seg(t, 0.6, 1.0);
  ring(cx, cy, 36, P.ink3, 2, kc);
  const ang = -Math.PI / 2 + t * 1.6;
  line([[cx, cy], [cx + Math.cos(ang) * 26, cy + Math.sin(ang) * 26]], P.ink, 3, kc);
  text(S.every, cx, cy + 64, { size: 15, font: MONO, color: P.ink2, align: "center", alpha: kc });
  text(S.reviewed, 80, 384, { size: 15, font: MONO, color: P.ink3, alpha: seg(t, 1.4, 1.9) });
  // install and test
  terminal(560, 190, 640, 200, t, [
    { p: "$ ", s: "install_ha.sh 2026.11.0b1 tests", a: a1, b: a1 + 0.9 },
    { p: "", s: "Installed Home Assistant 2026.11.0b1", a: a1 + 1.1, c: "#9be7b4" },
    { p: "$ ", s: "import_smoke.py", a: a1 + 1.5, b: a1 + 2.0 },
    { p: "", s: "All 10 modules import", a: a1 + 2.2, c: "#9be7b4" },
  ], { title: "review job · contents: read", alpha: seg(t, a1 - 0.3, a1) });
  // diff of the base modules
  const kd = seg(t, a2, a2 + 0.5);
  panel(80, 420, 1120, 170, { r: 12, fill: P.card, stroke: P.rule, alpha: kd });
  text(S.diffT, 104, 452, { size: 16, weight: 700, font: MONO, color: P.ink, alpha: kd });
  const files = ["climate/__init__.py", "water_heater/__init__.py", "sensor/__init__.py", "number/__init__.py", "helpers/entity.py", "helpers/entity_platform.py",
                 "helpers/update_coordinator.py", "helpers/device_registry.py", "config_entries.py", "data_entry_flow.py", "climate/const.py", "const.py"];
  files.forEach((f, i) => {
    const k = seg(t, a2 + 0.3 + i * 0.08, a2 + 0.6 + i * 0.08), col = i % 3, row = Math.floor(i / 3);
    const x = 104 + col * 365, y = 488 + row * 26;
    text(i % 4 === 0 ? "±" : " ", x, y, { size: 15, font: MONO, color: P.amber, alpha: k });
    text(f, x + 18, y, { size: 15, font: MONO, color: P.ink2, alpha: k });
  });
}

function sReview(t, d, cues) {
  title(S.k5, S.h5, t);
  const a1 = at(cues, 1, 2.5), a2 = at(cues, 2, 6), a3 = at(cues, 3, 9);
  const docs = [S.d1, S.d2, S.d3, S.d4, S.d5];
  const cx = 610, cy = 250;
  docs.forEach((s, i) => {
    const k = seg(t, a1 + i * 0.25, a1 + 0.5 + i * 0.25), y = 196 + i * 50;
    box(80, y - 20, 330, 40, "det", { r: 8, alpha: k });
    text(s, 98, y + 6, { size: 15, font: MONO, color: P.ink, alpha: k });
    line([[412, y], [cx - 110, cy]], P.rule, 1.5, k);
    if (k > 0.9) packets(412, y, cx - 110, cy, t, { n: 2, period: 1.6, color: P.blue, r: 3 });
  });
  // the model box
  const km = outBack(seg(t, 0.4, 1.0));
  box(cx - 110, cy - 60, 220, 120, "llm", { alpha: km });
  text("Claude", cx, cy - 8, { size: 26, weight: 800, font: SORA, color: P.blue, align: "center", alpha: km });
  text(S.tools, cx, cy + 30, { size: 15, font: MONO, color: P.ink2, align: "center", alpha: km });
  // the table
  const kt = seg(t, a2, a2 + 0.4), tx = 760, tw = 440;
  panel(tx, 180, tw, 260, { r: 10, fill: P.card, stroke: P.rule, alpha: kt });
  text(S.colC, tx + 18, 210, { size: 13, weight: 700, font: MONO, color: P.ink3, alpha: kt });
  text(S.colS, tx + 270, 210, { size: 13, weight: 700, font: MONO, color: P.ink3, alpha: kt });
  const rows = [[S.r1, "D"], [S.r2, "D"], [S.r3, "D"], [S.r4, "N"]];
  rows.forEach(([r, s], i) => {
    const k = seg(t, a2 + 0.4 + i * 0.3, a2 + 0.8 + i * 0.3), y = 254 + i * 48;
    line([[tx + 12, y - 26], [tx + tw - 12, y - 26]], P.rule, 1, k);
    text(r, tx + 18, y + 4, { size: 14, font: MONO, color: P.ink, alpha: k });
    sev(s, tx + 262, y, k);
  });
  // cost
  const kc = seg(t, a3, a3 + 0.5);
  const dollars = 1.17 * outCubic(seg(t, a3, a3 + 0.9));
  text("$" + dollars.toFixed(2), 760, 530, { size: 64, weight: 800, font: SORA, color: P.ink, alpha: kc });
  text(S.cost, 960, 528, { size: 22, color: P.ink2, alpha: kc });
  text(S.tok, 760, 566, { size: 14, font: MONO, color: P.ink3, alpha: kc });
}

function sIssue(t, d, cues) {
  title(S.k6, S.h6, t);
  const a1 = at(cues, 1, 3.5), a2 = at(cues, 2, 6), a3 = at(cues, 3, 8);
  // sanitize job
  const kj = seg(t, 0.4, 0.9);
  box(80, 190, 420, 230, "det", { alpha: kj });
  text(S.job, 104, 228, { size: 17, weight: 700, font: MONO, color: P.ink, alpha: kj });
  [S.s1, S.s2, S.s3].forEach((s, i) => {
    const k = seg(t, 0.9 + i * 0.45, 1.3 + i * 0.45), y = 284 + i * 46;
    check(118, y - 6, 24, P.green, k, kj);
    text(s, 144, y, { size: 17, color: P.ink2, alpha: k });
  });
  arrow(504, 300, 560, 300, seg(t, 2.2, 2.7), P.ink3);
  // the issue
  const ki = outCubic(seg(t, 2.4, 3.0));
  panel(570, 180, 630, 380, { r: 12, fill: P.card, stroke: P.rule, lw: 1.5, alpha: ki });
  if (ki > 0) {
    dot(598, 214, 8, P.green, ki);
    text(S.issueT, 616, 220, { size: 17, weight: 700, font: SORA, color: P.ink, alpha: ki });
    pill("ha-release-review", 598, 256, { size: 12, fill: P.blueSoft, stroke: P.blue, color: P.blue, alpha: ki, h: 24 });
  }
  const rows = [[S.r1, "c", a1], [S.r2, "c", a1 + 0.5], [S.r3, "f", a2]];
  rows.forEach(([r, v, s], i) => {
    const k = seg(t, s, s + 0.5), y = 316 + i * 60;
    text(r, 598, y, { size: 16, font: MONO, color: P.ink, alpha: ki });
    sev("D", 598 + 290, y - 6, ki);
    if (v === "c") { check(1040, y - 6, 26, P.green, k); text(S.conf, 1062, y, { size: 15, weight: 600, color: P.green, alpha: k }); }
    else { cross(1040, y - 6, 9, P.red, k); text(S.fp, 1062, y, { size: 15, weight: 600, color: P.red, alpha: k }); }
  });
  text("— " + S.footer, 598, 520, { size: 15, font: MONO, color: P.ink3, alpha: ki });
  if (ki > 0) highlight(580, 290, 610, 200, seg(t, a3, a3 + 0.8), P.red);
}

function sLabel(t, d, cues) {
  title(S.k7, S.h7, t);
  const a1 = at(cues, 1, 3), a2 = at(cues, 2, 5.5), a3 = at(cues, 3, 9);
  // the label drops on the issue
  const ki = seg(t, 0.3, 0.8);
  panel(80, 190, 470, 130, { r: 12, fill: P.card, stroke: P.rule, alpha: ki });
  text("#216 · " + "Home Assistant 2026.11", 104, 228, { size: 16, weight: 700, font: SORA, color: P.ink, alpha: ki });
  pill("ha-release-review", 104, 268, { size: 12, fill: P.blueSoft, stroke: P.blue, color: P.blue, alpha: ki, h: 24 });
  const kl = outBack(seg(t, 0.8, 1.5));
  if (kl > 0) pill("ha-review:fix", 290, lerp(160, 268, kl), { size: 13, fill: P.redSoft, stroke: P.red, color: P.red, alpha: clamp(kl), h: 26 });
  // gate
  const kg = seg(t, a1, a1 + 0.5);
  box(80, 350, 470, 70, "det", { alpha: kg });
  text(S.gate, 104, 392, { size: 17, font: MONO, color: P.ink, alpha: kg });
  check(510, 384, 26, P.green, seg(t, a1 + 0.6, a1 + 1.1));
  // tools
  const kt = seg(t, a2, a2 + 0.4);
  box(620, 190, 580, 260, "llm", { alpha: kt });
  text(S.tl, 644, 226, { size: 17, weight: 700, font: SORA, color: P.blue, alpha: kt });
  [S.t1, S.t2, S.t3, S.t4, S.t5, S.t6].forEach((s, i) => {
    const k = seg(t, a2 + 0.3 + i * 0.18, a2 + 0.6 + i * 0.18), col = i % 2, row = Math.floor(i / 2);
    pill(s, 644 + col * 270, 270 + row * 52, { size: 15, fill: P.card, stroke: P.blue, color: P.ink, alpha: k, h: 34 });
  });
  text(S.scope, 644, 428, { size: 14, font: MONO, color: P.ink2, alpha: seg(t, a2 + 1.4, a2 + 1.9) });
  // what it does not get
  [S.no1, S.no2, S.no3].forEach((s, i) => {
    const k = seg(t, a3 + i * 0.3, a3 + 0.4 + i * 0.3), x = 640 + i * 190;
    panel(x, 490, 170, 56, { r: 10, fill: P.card, stroke: P.red, alpha: k });
    text(s, x + 85, 525, { size: 18, weight: 600, font: MONO, color: P.ink3, align: "center", alpha: k });
    if (k > 0) line([[x + 22, 518], [x + 22 + 126 * seg(t, a3 + 0.2 + i * 0.3, a3 + 0.5 + i * 0.3), 518]], P.red, 3, k);
  });
}

function sPr(t, d, cues) {
  title(S.k8, S.h8, t);
  const a1 = at(cues, 1, 3.5), a2 = at(cues, 2, 6);
  const steps = [[S.p1, "llm", 0.3], [S.p2, "det", 0.9], [S.p3, "det", 1.5], [S.p4, "det", a1], [S.p5, "hum", a2]];
  const w = 210, gap = 17;
  steps.forEach(([s, kind, st], i) => {
    const k = outCubic(seg(t, st, st + 0.5)), x = 80 + i * (w + gap);
    box(x, 200, w, 80, kind, { alpha: k });
    text(s, x + w / 2, 246, { size: 16, weight: 700, font: SORA, color: P.ink, align: "center", alpha: k });
    if (i > 0) arrow(x - gap + 2, 240, x - 2, 240, seg(t, st, st + 0.4), P.ink3);
  });
  // path check detail
  const kp = seg(t, 1.6, 2.1);
  panel(80, 320, 560, 210, { r: 12, fill: P.card, stroke: P.rule, alpha: kp });
  [[S.ok1, true], [S.ok2, true], [S.bad1, false], [S.bad2, false]].forEach(([s, ok], i) => {
    const k = seg(t, 1.9 + i * 0.3, 2.3 + i * 0.3), y = 364 + i * 44;
    if (ok) check(112, y - 6, 24, P.green, k); else cross(112, y - 6, 9, P.red, k);
    text(s, 140, y, { size: 17, font: MONO, color: ok ? P.ink : P.ink3, alpha: k });
  });
  // the PR card with a disabled merge button
  const kr = seg(t, a1 + 0.2, a1 + 0.7);
  panel(680, 320, 520, 210, { r: 12, fill: P.card, stroke: P.rule, alpha: kr });
  if (kr > 0) {
    dot(708, 356, 8, P.green, kr);
    text("fix: address HA release review #216", 726, 362, { size: 16, weight: 700, font: MONO, color: P.ink, alpha: kr });
    text("claude/ha-fix-216-…  →  main", 708, 400, { size: 15, font: MONO, color: P.ink2, alpha: kr });
  }
  const km = seg(t, a2 + 0.3, a2 + 0.8);
  panel(708, 440, 150, 50, { r: 8, fill: P.grey, stroke: P.rule, alpha: km });
  text(S.merge, 783, 472, { size: 17, weight: 700, color: P.ink3, align: "center", alpha: km });
  if (km > 0) line([[718, 465], [718 + 130 * seg(t, a2 + 0.8, a2 + 1.2), 465]], P.red, 3, km);
  text("CI ✓ · review ✓", 880, 472, { size: 16, font: MONO, color: P.ink2, alpha: seg(t, a2 + 1.0, a2 + 1.5) });
}

function sOutro(t, d, cues) {
  kicker(S.k9, seg(t, 0.05, 0.5));
  const a1 = at(cues, 1, 3), a2 = at(cues, 2, 6);
  const k1 = seg(t, 0.2, 0.8), k2 = seg(t, a1, a1 + 0.6);
  box(80, 150, 34, 34, "llm", { r: 8, alpha: k1 });
  para(S.r9a, 134, 178, 1060, { size: 34, weight: 800, font: SORA, color: P.ink, alpha: k1, lh: 44 });
  box(80, 250, 34, 34, "hum", { r: 8, alpha: k2 });
  para(S.r9b, 134, 278, 1060, { size: 34, weight: 800, font: SORA, color: P.ink, alpha: k2, lh: 44 });
  const ke = seg(t, a2, a2 + 0.5);
  text(S.eco, 80, 400, { size: 20, color: P.ink2, alpha: ke });
  let x = 80;
  [S.e1, S.e2, S.e3, S.e4, S.e5, S.e6].forEach((s, i) => {
    const k = seg(t, a2 + 0.3 + i * 0.15, a2 + 0.6 + i * 0.15);
    x += pill(s, x, 450, { size: 15, fill: P.card, stroke: i === 0 ? P.blue : P.rule, color: P.ink, alpha: k, h: 34 }) + 12;
  });
  text(S.url, 80, 560, { size: 18, weight: 700, font: MONO, color: P.red, alpha: seg(t, a2 + 1.5, a2 + 2.0) });
}

VIDEO.create({
  title: { en: "A CI that reads the release notes", fr: "Une CI qui lit les notes de version", it: "Una CI che legge le note di rilascio" },
  kicker: { en: "blog.mornati.net · Home Assistant release review", fr: "blog.mornati.net · revue des versions de Home Assistant", it: "blog.mornati.net · revisione delle release di Home Assistant" },
  langs: ["en", "fr", "it"],
  theme: { bg: P.paper, bg2: P.paper, panel: P.card, panel2: "#2a2926", line: P.rule, ink: P.ink, soft: P.ink2, faint: P.ink3,
           accent: P.red, accent2: P.blue, good: P.green, warn: P.amber, bad: P.red, deep: P.card, term: "#1f1e1b", termInk: "#e9e6de" },
  strings: STR,
  background: bg,
  poster: "layers",
  scenes: { hook: sHook, green: sGreen, layers: sLayers, collect: sCollect, review: sReview, issue: sIssue, label: sLabel, pr: sPr, outro: sOutro },
});
