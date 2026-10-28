/* Scenes of "One human, a board, a team of agents" (see ../engine/engine.js and the canvas-video skill).
 *
 * Each scene is fn(t, d, cues): t = local time in seconds, d = scene duration,
 * cues = the spoken sentences [{s, e, text}] from timing.js. Animations hook onto
 * at(cues, i) so they follow the voice in every language.
 * Figures: horae-dev/horae issues #10 #11 #12 #13 #15 #20 (Estimate tables, Actuals
 * comments) and docs/ESTIMATION.md, as of 2026-10-28.
 */
"use strict";

const STR = {
  en: {
    kHook: "HORAE · HOW I BUILD SOFTWARE NOW", hHook: "One human. Some agents. One board.",
    me: "me", agents: "agents", board: "GitHub Project", shared: "the only shared interface",
    kPlan: "STEP 1 · TICKETS FIRST", hPlan: "Plan together, validate, then tag.",
    chat1: "Here is the idea. Ask me what's missing.", chat2: "Backlog drafted: epics, stories, estimates.", chat3: "Validated. Put them on the board.",
    issues: "issues", breakdown: "23 epics · 90 stories · 7 human tasks · 10 risks", perTicket: "each: acceptance criteria · size · human days · agent hours",
    kBoard: "STEP 2 · FOLLOW THE BOARD", hBoard: "One instruction: follow the board.",
    bubble: "“Follow the board, in the right order.”", skipped: "Human-led: waits for me", assigned: "assigned, then In progress",
    kLoop: "STEP 3 · BUILD → REVIEW → FIX", hLoop: "Three agents per story.",
    build: "Build", review: "Review", fix: "Fix", buildSub: "Sonnet or Opus", reviewSub: "Opus, independent", fixSub: "every finding",
    findings: "findings", fixed: "fixed", merged: "merged → Done",
    kHuman: "STEP 4 · HUMAN NEEDED", hHuman: "The decisions stay mine.",
    questions: "Questions in the PR", answers: "My answers", back: "back to Ready",
    q1: "1. mcp SDK: core dependency or extra?", q2: "2. Own stdio transport: agreed?", q3: "3. Base env: should TZ be set?", q4: "6. After a crash: dead, or one restart?",
    a1: "1. Core dependency", a2: "2. Agreed", a3: "3. Add TZ too", a4: "6. One restart",
    kNum: "ESTIMATE VS REALITY", hNum: "Estimated in hours, done in minutes.",
    forecast: "Up-front forecast (likely case)", f3: "3 developers", f1: "1 human + 4 agents", weeks: "weeks", f1note: "at 15 h/week of supervision",
    est: "estimated agent time", act: "measured agent time", caught: "review findings fixed before merge",
    cond: "first 6 stories · agent wall-clock · horae-dev/horae · Oct 2026",
    kTeam: "PIZZA OR SANDWICH", hTeam: "Fewer people, fewer channels.",
    pizza: "two-pizza team", pizzaSub: "8 people · 28 channels", sandwich: "sandwich team", sandSub: "1 person + agents · 4 channels",
    bottleneck: "The bottleneck: decisions, not code.",
    kOutro: "TAKEAWAYS", t1: "Write the tickets well.", t2: "Let the board drive.", t3: "Keep the decisions human.",
    url: "mornati.net  ·  github.com/orgs/horae-dev/projects/1",
  },
  fr: {
    kHook: "HORAE · COMMENT JE DÉVELOPPE AUJOURD'HUI", hHook: "Un humain. Des agents. Un tableau.",
    me: "moi", agents: "agents", board: "GitHub Project", shared: "la seule interface partagée",
    kPlan: "ÉTAPE 1 · D'ABORD LES TICKETS", hPlan: "Planifier, valider, puis étiqueter.",
    chat1: "Voici l'idée. Demande-moi ce qui manque.", chat2: "Backlog prêt : epics, stories, estimations.", chat3: "Validé. Mets-les sur le tableau.",
    issues: "tickets", breakdown: "23 epics · 90 stories · 7 tâches humaines · 10 risques", perTicket: "chacun : critères · taille · jours humains · heures d'agent",
    kBoard: "ÉTAPE 2 · SUIS LE TABLEAU", hBoard: "Une consigne : suis le tableau.",
    bubble: "« Suis le tableau, dans le bon ordre. »", skipped: "Human-led : attend l'humain", assigned: "assignée, puis In progress",
    kLoop: "ÉTAPE 3 · CONSTRUIRE → RELIRE → CORRIGER", hLoop: "Trois agents par story.",
    build: "Construire", review: "Relire", fix: "Corriger", buildSub: "Sonnet ou Opus", reviewSub: "Opus, indépendant", fixSub: "chaque remarque",
    findings: "remarques", fixed: "corrigées", merged: "fusionnée → Done",
    kHuman: "ÉTAPE 4 · HUMAN NEEDED", hHuman: "Les décisions restent les miennes.",
    questions: "Questions dans la PR", answers: "Mes réponses", back: "retour en Ready",
    q1: "1. SDK mcp : dépendance ou extra ?", q2: "2. Transport stdio maison : d'accord ?", q3: "3. Environnement : ajouter TZ ?", q4: "6. Après un crash : mort, ou un redémarrage ?",
    a1: "1. Dépendance du cœur", a2: "2. D'accord", a3: "3. Ajouter TZ", a4: "6. Un redémarrage",
    kNum: "ESTIMATION ET RÉALITÉ", hNum: "Estimé en heures, fait en minutes.",
    forecast: "Prévision initiale (cas probable)", f3: "3 développeurs", f1: "1 humain + 4 agents", weeks: "semaines", f1note: "à 15 h/semaine de supervision",
    est: "temps d'agent estimé", act: "temps d'agent mesuré", caught: "remarques de relecture corrigées avant fusion",
    cond: "6 premières stories · durée des agents · horae-dev/horae · oct. 2026",
    kTeam: "PIZZA OU SANDWICH", hTeam: "Moins de monde, moins de canaux.",
    pizza: "équipe à deux pizzas", pizzaSub: "8 personnes · 28 canaux", sandwich: "équipe sandwich", sandSub: "1 personne + agents · 4 canaux",
    bottleneck: "Le goulot : les décisions, pas le code.",
    kOutro: "À RETENIR", t1: "Écrivez bien vos tickets.", t2: "Laissez le tableau piloter.", t3: "Gardez les décisions humaines.",
    url: "mornati.net  ·  github.com/orgs/horae-dev/projects/1",
  },
  it: {
    kHook: "HORAE · COME SVILUPPO SOFTWARE OGGI", hHook: "Un umano. Degli agenti. Una board.",
    me: "io", agents: "agenti", board: "GitHub Project", shared: "l'unica interfaccia condivisa",
    kPlan: "PASSO 1 · PRIMA I TICKET", hPlan: "Pianificare, validare, etichettare.",
    chat1: "Ecco l'idea. Chiedimi cosa manca.", chat2: "Backlog pronto: epic, story, stime.", chat3: "Validato. Mettili sulla board.",
    issues: "issue", breakdown: "23 epic · 90 story · 7 task umani · 10 rischi", perTicket: "ognuna: criteri · taglia · giorni umani · ore agente",
    kBoard: "PASSO 2 · SEGUI LA BOARD", hBoard: "Un'istruzione: segui la board.",
    bubble: "“Segui la board, nell'ordine giusto.”", skipped: "Human-led: aspetta l'umano", assigned: "assegnata, poi In progress",
    kLoop: "PASSO 3 · COSTRUIRE → RIVEDERE → CORREGGERE", hLoop: "Tre agenti per story.",
    build: "Costruire", review: "Rivedere", fix: "Correggere", buildSub: "Sonnet o Opus", reviewSub: "Opus, indipendente", fixSub: "ogni problema",
    findings: "problemi", fixed: "corretti", merged: "merge → Done",
    kHuman: "PASSO 4 · HUMAN NEEDED", hHuman: "Le decisioni restano mie.",
    questions: "Domande nella PR", answers: "Le mie risposte", back: "di nuovo in Ready",
    q1: "1. SDK mcp: dipendenza o extra?", q2: "2. Trasporto stdio nostro: ok?", q3: "3. Ambiente: aggiungere TZ?", q4: "6. Dopo un crash: morto o un riavvio?",
    a1: "1. Dipendenza del core", a2: "2. Ok", a3: "3. Aggiungere TZ", a4: "6. Un riavvio",
    kNum: "STIMA E REALTÀ", hNum: "Stimato in ore, fatto in minuti.",
    forecast: "Previsione iniziale (caso probabile)", f3: "3 sviluppatori", f1: "1 umano + 4 agenti", weeks: "settimane", f1note: "con 15 h/settimana di supervisione",
    est: "tempo agente stimato", act: "tempo agente misurato", caught: "problemi della review corretti prima del merge",
    cond: "prime 6 story · durata degli agenti · horae-dev/horae · ott. 2026",
    kTeam: "PIZZA O PANINO", hTeam: "Meno persone, meno canali.",
    pizza: "team da due pizze", pizzaSub: "8 persone · 28 canali", sandwich: "team da un panino", sandSub: "1 persona + agenti · 4 canali",
    bottleneck: "Il collo di bottiglia: decisioni, non codice.",
    kOutro: "DA RICORDARE", t1: "Scrivete bene i ticket.", t2: "Lasciate guidare la board.", t3: "Tenete umane le decisioni.",
    url: "mornati.net  ·  github.com/orgs/horae-dev/projects/1",
  },
};

/* ------------------------------------------------------------------ helpers */
const HAND = '"Shantell Sans", "Comic Neue", ' + SORA;
const COLS = [
  { name: "Backlog", c: "#8a92a0" }, { name: "Ready", c: "#2b46d6" }, { name: "In progress", c: "#d98a00" },
  { name: "In review", c: "#7c5cff" }, { name: "Human needed", c: "#e0661b" }, { name: "Done", c: "#1f9d63" },
];
const EXEC = { agent: "#2b46d6", check: "#7c5cff", human: "#e0661b" };
const BX = 87, BY = 196, CWD = 176, GAP = 10, BH = 380;
const colX = i => BX + i * (CWD + GAP);
const slot = (col, row) => [colX(col) + 8, BY + 52 + row * 50];

function paperBg(t) {
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.strokeStyle = "#dce7f3"; ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 32) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke(); }
  ctx.restore();
}

function columns(alpha = 1, hi = -1) {
  COLS.forEach((c, i) => {
    const x = colX(i);
    panel(x, BY, CWD, BH, { r: 12, fill: i === hi ? "#fff7e8" : "#f6f8fb", stroke: i === hi ? c.c : "#d3dbe6", lw: i === hi ? 2 : 1, alpha });
    dot(x + 18, BY + 24, 6, c.c, alpha);
    text(c.name, x + 32, BY + 29, { size: 14, weight: 700, color: C.ink, alpha });
  });
}

/* A card: label, executor colour strip, optional tag pill. */
function card(x, y, label, o = {}) {
  const a = o.alpha ?? 1;
  panel(x, y, CWD - 16, 40, { r: 8, fill: "#ffffff", stroke: o.ring ?? "#c9d2df", lw: o.ring ? 2 : 1, alpha: a, shadow: o.shadow });
  ctx.save(); ctx.globalAlpha *= a; rr(x, y, 6, 40, [8, 0, 0, 8]); ctx.fillStyle = o.exec ?? EXEC.agent; ctx.fill(); ctx.restore();
  text(label, x + 16, y + 25, { size: 13, weight: 600, color: C.ink, alpha: a });
  if (o.avatar) dot(x + CWD - 34, y + 20, 8 * o.avatar, C.ink, a);
}

function human(x, y, s, a = 1, col = C.ink) {
  if (a <= 0) return;
  dot(x, y - s * 0.62, s * 0.3, col, a);
  ctx.save(); ctx.globalAlpha *= a; ctx.beginPath(); ctx.arc(x, y + s * 0.42, s * 0.5, Math.PI, 0); ctx.fillStyle = col; ctx.fill(); ctx.restore();
}

function bot(x, y, s, a = 1, col = C.accent2) {
  if (a <= 0) return;
  line([[x, y - s * 0.45], [x, y - s * 0.62]], col, 3, a);
  dot(x, y - s * 0.66, s * 0.07, col, a);
  panel(x - s / 2, y - s * 0.45, s, s * 0.8, { r: s * 0.2, fill: col, stroke: false, alpha: a });
  dot(x - s * 0.18, y - s * 0.08, s * 0.08, "#ffffff", a);
  dot(x + s * 0.18, y - s * 0.08, s * 0.08, "#ffffff", a);
}

function hand(s, x, y, o = {}) { text(s, x, y, Object.assign({ font: HAND, weight: 700 }, o)); }

/* ------------------------------------------------------------------- scenes */
function sHook(t, d, cues) {
  kicker(S.kHook, seg(t, 0.1, 0.6));
  headline(S.hHook, seg(t, 0.2, 0.9), 140, 46);
  const a1 = at(cues, 1, 2.5), a2 = at(cues, 2, 6);
  const kh = outBack(seg(t, a1, a1 + 0.6)), kb = outBack(seg(t, a1 + 0.5, a1 + 1.1)), ka = outBack(seg(t, a1 + 1.0, a1 + 1.6));
  human(220, 420, 90 * kh, kh);
  hand(S.me, 220, 520, { size: 24, align: "center", alpha: kh });
  [[1000, 360], [1100, 360], [1000, 470], [1100, 470]].forEach(([x, y], i) => bot(x, y, 62 * ka, ka, i % 2 ? C.accent : C.accent2));
  hand(S.agents, 1050, 545, { size: 24, align: "center", alpha: ka });
  // mini board in the middle
  ctx.save(); ctx.globalAlpha *= kb; ctx.translate(640, 420); ctx.scale(0.3 * kb + 0.001, 0.3 * kb + 0.001); ctx.translate(-640, -BY - BH / 2);
  columns();
  [[0, 0, "#27"], [0, 1, "#28"], [1, 0, "#14"], [2, 0, "#16"], [2, 1, "#18"], [5, 0, "#10"], [5, 1, "#13"]].forEach(([c, r, l]) => { const [x, y] = slot(c, r); card(x, y, l, { exec: l === "#14" ? EXEC.human : EXEC.agent }); });
  ctx.restore();
  text(S.board, 640, 520, { size: 18, weight: 700, color: C.soft, align: "center", alpha: kb });
  if (t > a1 + 1.4) {
    packets(300, 420, 450, 420, t, { n: 3, period: 1.6, color: C.ink, r: 4 });
    packets(940, 420, 830, 420, t, { n: 3, period: 1.6, color: C.accent2, r: 4 });
  }
  arrow(290, 420, 455, 420, seg(t, a1 + 0.6, a1 + 1.2), C.line);
  arrow(950, 420, 825, 420, seg(t, a1 + 1.1, a1 + 1.7), C.line);
  const k3 = seg(t, a2, a2 + 0.6);
  highlight(455, 330, 370, 170, k3, C.accent);
  hand(S.shared, 640, 590, { size: 26, align: "center", color: C.accent, alpha: k3 });
}

function sPlan(t, d, cues) {
  kicker(S.kPlan, seg(t, 0.1, 0.6));
  headline(S.hPlan, seg(t, 0.2, 0.9), 140, 44);
  const a1 = at(cues, 1, 3), a2 = at(cues, 2, 6);
  // the conversation
  const msgs = [[S.chat1, false, 0.5], [S.chat2, true, 1.6], [S.chat3, false, a2 + 0.2]];
  msgs.forEach(([m, claude, a], i) => {
    const k = seg(t, a, a + 0.5), y = 200 + i * 86;
    if (k <= 0) return;
    const x = claude ? 150 : 90;
    panel(x, y, 430, 64, { r: 14, fill: claude ? "#f1edff" : "#eef3ff", stroke: claude ? "#c9b8ff" : "#9fb3ff", alpha: k });
    (claude ? bot : human)(x + 30, y + 36, 26, k, claude ? C.accent2 : C.ink);
    para(m, x + 60, y + 28, 355, { size: 16, lh: 20, color: C.ink, alpha: k, k: seg(t, a, a + 1.2) });
  });
  // the backlog filling up
  const kc = seg(t, a1, a1 + 2.2), n = Math.round(130 * outCubic(kc));
  text(String(n), 840, 300, { size: 110, weight: 800, font: SORA, align: "center", color: C.accent, alpha: seg(t, a1, a1 + 0.3) });
  text(S.issues, 840, 340, { size: 22, weight: 700, color: C.soft, align: "center", alpha: seg(t, a1, a1 + 0.3) });
  text(S.breakdown, 840, 380, { size: 15, font: MONO, color: C.soft, align: "center", alpha: seg(t, a1 + 1, a1 + 1.5) });
  text(S.perTicket, 840, 408, { size: 14, color: C.faint, align: "center", alpha: seg(t, a1 + 1.5, a1 + 2) });
  // tags appear when the tickets are validated
  const tags = [["Agent", EXEC.agent], ["Agent + human check", EXEC.check], ["Human-led", EXEC.human], ["Human-only", "#b5651d"]];
  let x = 640;
  tags.forEach(([s, c], i) => {
    const k = seg(t, a2 + 0.8 + i * 0.3, a2 + 1.2 + i * 0.3);
    x += pill(s, x, 480, { size: 13, fill: "#ffffff", stroke: c, color: c, alpha: k, font: INTER }) + 10;
  });
  check(1150, 300, 46, C.good, seg(t, a2 + 0.3, a2 + 0.9));
}

function sBoard(t, d, cues) {
  kicker(S.kBoard, seg(t, 0.1, 0.6));
  headline(S.hBoard, seg(t, 0.2, 0.9), 140, 44);
  const a1 = at(cues, 1, 3), a2 = at(cues, 2, 6.5);
  columns(seg(t, 0.2, 0.7), -1);
  // backlog stays put
  ["#27 Skills", "#28 Backends", "#37 HTTP API"].forEach((l, r) => { const [x, y] = slot(0, r); card(x, y, l); });
  // Ready cards move to In progress one by one, in order; #14 is Human-led and stays
  const ready = ["#10 uv scaffold", "#11 CI pipeline", "#15 AGENTS.md", "#13 Schemas"];
  ready.forEach((l, i) => {
    const k = inOut(seg(t, a1 + 0.4 + i * 0.7, a1 + 1.1 + i * 0.7));
    const [x0, y0] = slot(1, i + 1), [x1, y1] = slot(2, i);
    const lift = Math.sin(k * Math.PI) * 26;
    card(lerp(x0, x1, k), lerp(y0, y1, k) - lift, l, { shadow: k > 0 && k < 1, avatar: k > 0.5 ? 1 : 0 });
  });
  const [hx, hy] = slot(1, 0);
  const k3 = seg(t, a2, a2 + 0.6);
  card(hx, hy, "#14 Threat model", { exec: EXEC.human, ring: k3 > 0 ? EXEC.human : undefined });
  if (k3 > 0) callout(S.skipped, 330, 500, hx + 80, hy + 40, k3);
  // the instruction
  const kb = seg(t, 0.6, 1.1);
  panel(390, 596, 500, 46, { r: 23, fill: "#fff8d6", stroke: "#e6c84a", alpha: kb });
  hand(S.bubble, 640, 626, { size: 18, align: "center", alpha: kb });
  text(S.assigned, colX(2) + CWD / 2, BY + BH - 18, { size: 12, color: C.faint, align: "center", alpha: seg(t, a1 + 1, a1 + 1.5) });
}

function sLoop(t, d, cues) {
  kicker(S.kLoop, seg(t, 0.1, 0.6));
  headline(S.hLoop, seg(t, 0.2, 0.9), 140, 44);
  const a1 = at(cues, 1, 2.5), a2 = at(cues, 2, 6.5);
  const st = [[S.build, S.buildSub, C.accent], [S.review, S.reviewSub, C.accent2], [S.fix, S.fixSub, C.good]];
  st.forEach(([n, sub, c], i) => {
    const x = 170 + i * 330, k = outBack(seg(t, a1 + i * 0.9, a1 + i * 0.9 + 0.6));
    panel(x - 120, 210, 240, 150, { r: 16, fill: "#ffffff", stroke: c, lw: 2, alpha: clamp(k) });
    bot(x, 262, 54 * clamp(k), clamp(k), c);
    text(n, x, 322, { size: 22, weight: 800, font: SORA, align: "center", alpha: clamp(k) });
    text(sub, x, 346, { size: 14, color: C.soft, align: "center", alpha: clamp(k) });
    if (i < 2) arrow(x + 125, 285, x + 205, 285, seg(t, a1 + i * 0.9 + 0.5, a1 + i * 0.9 + 0.9), C.soft);
  });
  // findings counter on the review, ticking to "fixed"
  const kf = seg(t, a1 + 1.2, a1 + 2.2), kx = seg(t, a1 + 2.2, a1 + 3.2);
  if (kf > 0) {
    const n = Math.round(20 * outCubic(kf));
    pill(`${n} ${S.findings} · 8 major`, 500, 390, { size: 14, fill: "#fff1f3", stroke: C.bad, color: C.bad, align: "center", alpha: kf });
  }
  if (kx > 0) pill(`${Math.round(20 * outCubic(kx))} ${S.fixed}`, 830, 390, { size: 14, fill: "#ecfbf3", stroke: C.good, color: C.good, align: "center", alpha: kx });
  // CI checks, then merge
  const checks = ["lock", "lint", "types", "tests", "gitleaks", "CodeQL", "CI OK"];
  checks.forEach((c, i) => {
    const x = 120 + i * 150, k = seg(t, a2 + i * 0.22, a2 + i * 0.22 + 0.3);
    panel(x, 450, 136, 44, { r: 10, fill: "#ffffff", stroke: k >= 1 ? C.good : C.line, alpha: seg(t, a2 - 0.4, a2) });
    text(c, x + 46, 478, { size: 14, font: MONO, color: C.ink, alpha: seg(t, a2 - 0.4, a2) });
    check(x + 24, 472, 16, C.good, k);
  });
  const km = outBack(seg(t, a2 + 1.8, a2 + 2.4));
  if (km > 0) {
    pill("PR #81 " + S.merged, 640, 560, { size: 18, fill: "#ecfbf3", stroke: C.good, color: C.good, align: "center", alpha: clamp(km), font: INTER });
  }
}

function sHuman(t, d, cues) {
  kicker(S.kHuman, seg(t, 0.1, 0.6));
  headline(S.hHuman, seg(t, 0.2, 0.9), 140, 44);
  const a1 = at(cues, 1, 3), a2 = at(cues, 2, 6);
  // mini board strip: Ready, In progress, Human needed
  const cols = [1, 2, 4], cx = [100, 290, 480];
  cols.forEach((ci, i) => {
    panel(cx[i], 200, 176, 120, { r: 12, fill: ci === 4 ? "#fff3ea" : "#f6f8fb", stroke: COLS[ci].c, lw: ci === 4 ? 2 : 1 });
    dot(cx[i] + 18, 222, 6, COLS[ci].c); text(COLS[ci].name, cx[i] + 32, 227, { size: 14, weight: 700 });
  });
  // card: In progress -> Human needed (sentence 1), back to Ready (sentence 3)
  const k1 = inOut(seg(t, 0.8, 1.6)), k2 = inOut(seg(t, a2 + 1.2, a2 + 2.2));
  let x = lerp(cx[1] + 8, cx[2] + 8, k1), y = 250;
  if (k2 > 0) x = lerp(cx[2] + 8, cx[0] + 8, k2);
  const lift = Math.sin((k2 > 0 ? k2 : k1) * Math.PI) * 30;
  card(x, y - lift, "#24 Plugin host", { exec: EXEC.human, shadow: true });
  if (k2 > 0) hand(S.back, cx[0] + 88, 350, { size: 20, align: "center", color: C.accent, alpha: seg(t, a2 + 1.8, a2 + 2.3) });
  // the PR: questions (sentence 2) and answers (sentence 3)
  const kq = seg(t, a1, a1 + 0.5);
  panel(690, 180, 510, 400, { r: 14, fill: "#ffffff", stroke: C.line, alpha: kq, shadow: true });
  text("PR #85 · Plugin host v1: design note", 712, 212, { size: 15, weight: 700, alpha: kq });
  text(S.questions, 712, 246, { size: 13, weight: 700, font: MONO, color: C.accent, alpha: kq });
  [S.q1, S.q2, S.q3, S.q4].forEach((q, i) => text(q, 712, 276 + i * 28, { size: 15, color: C.ink, alpha: seg(t, a1 + 0.3 + i * 0.3, a1 + 0.6 + i * 0.3) }));
  const ka = seg(t, a2, a2 + 0.4);
  human(380, 500, 80, ka);
  hand(S.me, 380, 590, { size: 22, align: "center", alpha: ka });
  arrow(440, 470, 680, 470, seg(t, a2 + 0.2, a2 + 0.8), EXEC.human);
  line([[712, 400], [1178, 400]], C.line, 1, ka);
  human(724, 432, 22, ka); text(S.answers, 744, 438, { size: 13, weight: 700, font: MONO, color: EXEC.human, alpha: ka });
  [S.a1, S.a2, S.a3, S.a4].forEach((q, i) => hand(q, 712 + (i % 2) * 240, 480 + Math.floor(i / 2) * 34, { size: 17, color: C.ink, alpha: seg(t, a2 + 0.2 + i * 0.25, a2 + 0.5 + i * 0.25) }));
}

function sNumbers(t, d, cues) {
  kicker(S.kNum, seg(t, 0.1, 0.6));
  headline(S.hNum, seg(t, 0.2, 0.9), 140, 44);
  const a1 = at(cues, 1, 4.5), a2 = at(cues, 2, 9);
  // forecast card (sentence 1)
  const kf = seg(t, 0.6, 1.1);
  panel(80, 180, 360, 270, { r: 14, fill: "#fbfcfe", stroke: C.line, alpha: kf });
  text(S.forecast, 100, 212, { size: 14, weight: 700, font: MONO, color: C.soft, alpha: kf });
  const bars = [[S.f3, 22, C.soft], [S.f1, 76, "#e0661b"]];
  bars.forEach(([n, w, c], i) => {
    const k = outCubic(seg(t, 1.0 + i * 0.6, 2.0 + i * 0.6)), y = 250 + i * 90;
    text(n, 100, y, { size: 16, weight: 700, alpha: kf });
    panel(100, y + 14, 200 * (w / 76) * k + 0.1, 24, { r: 5, fill: c, stroke: false, alpha: kf });
    text(`${Math.round(w * k)} ${S.weeks}`, 110 + 200 * (w / 76) * k, y + 32, { size: 15, weight: 700, color: c, alpha: kf });
  });
  text(S.f1note, 100, 430, { size: 13, color: C.faint, alpha: seg(t, 2.4, 2.9) });
  // estimate vs actual per story (sentence 2)
  const rows = [["#10", 54, 7], ["#11", 54, 7], ["#15", 18, 12], ["#13", 222, 32], ["#12", 252, 11], ["#20", 222, 20]];
  const X = 540, MAXW = 560, MAXM = 252;
  rows.forEach(([id, est, act], i) => {
    const y = 196 + i * 50, ke = outCubic(seg(t, a1 + i * 0.15, a1 + 0.8 + i * 0.15)), ka = outCubic(seg(t, a1 + 1.4 + i * 0.15, a1 + 2.2 + i * 0.15));
    const al = seg(t, a1 - 0.3, a1);
    text(id, X - 14, y + 22, { size: 15, weight: 700, font: MONO, align: "right", alpha: al });
    panel(X, y, MAXW * est / MAXM * ke + 0.1, 16, { r: 4, fill: "#d5dbe3", stroke: false, alpha: al });
    text(est >= 60 ? `${(est / 60).toFixed(1)} h` : `${est} min`, X + MAXW * est / MAXM * ke + 8, y + 13, { size: 12, font: MONO, color: C.faint, alpha: ke });
    panel(X, y + 20, MAXW * act / MAXM * ka + 0.1, 16, { r: 4, fill: C.accent, stroke: false, alpha: al });
    text(`${act} min`, X + MAXW * act / MAXM * ka + 8, y + 33, { size: 12, font: MONO, color: C.accent, weight: 700, alpha: ka });
  });
  const kl = seg(t, a1, a1 + 0.4);
  panel(X, 508, 14, 10, { r: 2, fill: "#d5dbe3", stroke: false, alpha: kl }); text(S.est, X + 22, 518, { size: 13, color: C.soft, alpha: kl });
  panel(X + 260, 508, 14, 10, { r: 2, fill: C.accent, stroke: false, alpha: kl }); text(S.act, X + 282, 518, { size: 13, color: C.soft, alpha: kl });
  // findings caught (sentence 3)
  const kc = outCubic(seg(t, a2, a2 + 1.6));
  text(String(Math.round(97 * kc)), 260, 540, { size: 72, weight: 800, font: SORA, align: "center", color: C.good, alpha: seg(t, a2, a2 + 0.3) });
  text(S.caught, 260, 572, { size: 14, color: C.soft, align: "center", alpha: seg(t, a2, a2 + 0.3) });
  text(S.cond, 1200, 640, { size: 11, font: MONO, color: C.faint, align: "right", alpha: kl });
}

function sTeam(t, d, cues) {
  kicker(S.kTeam, seg(t, 0.1, 0.6));
  headline(S.hTeam, seg(t, 0.2, 0.9), 140, 44);
  const a1 = at(cues, 1, 3.5), a2 = at(cues, 2, 7.5);
  // left: two pizzas, 8 people, full mesh (28 channels)
  const kp = seg(t, 0.4, 1.0), cx = 330, cy = 390, R = 120;
  [[cx - 46, 215], [cx + 46, 215]].forEach(([x, y]) => { dot(x, y, 34, "#ffbf6b", kp); ring(x, y, 34, "#d98a00", 3, kp); [0, 1, 2, 3, 4].forEach(j => { const R2 = rng(j + x); dot(x + (R2() - 0.5) * 36, y + (R2() - 0.5) * 36, 5, "#d6455d", kp); }); });
  const pts = [...Array(8)].map((_, i) => [cx + Math.cos(i / 8 * Math.PI * 2) * R, cy + 20 + Math.sin(i / 8 * Math.PI * 2) * R * 0.75]);
  const km = seg(t, 0.8, 3.0);
  let e = 0;
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
    const k = seg(km, e / 28, (e + 1) / 28); e++;
    if (k > 0) line(partial([pts[i], pts[j]], k), "#d98a00", 1.2, 0.5 * kp);
  }
  pts.forEach(([x, y]) => human(x, y + 8, 30, kp));
  text(S.pizza, cx, 560, { size: 22, weight: 800, font: SORA, align: "center", alpha: kp });
  text(S.pizzaSub, cx, 588, { size: 15, font: MONO, color: C.soft, align: "center", alpha: kp });
  // right: one sandwich, one person, a hub of agents
  const ks = seg(t, a1, a1 + 0.6), sx = 920, sy = 410;
  panel(sx - 60, 200, 120, 18, { r: 9, fill: "#e8b46b", stroke: false, alpha: ks });
  panel(sx - 64, 218, 128, 8, { r: 4, fill: "#b8f07a", stroke: false, alpha: ks });
  panel(sx - 60, 226, 120, 16, { r: 8, fill: "#e8b46b", stroke: false, alpha: ks });
  const bots = [[sx - 150, sy - 70], [sx + 150, sy - 70], [sx - 150, sy + 90], [sx + 150, sy + 90]];
  bots.forEach(([x, y], i) => {
    const k = seg(t, a1 + 0.4 + i * 0.2, a1 + 0.8 + i * 0.2);
    line(partial([[sx, sy], [x, y]], k), C.accent, 2, ks);
    bot(x, y + 10, 48, k, i % 2 ? C.accent : C.accent2);
  });
  human(sx, sy + 16, 52, ks);
  text(S.sandwich, sx, 560, { size: 22, weight: 800, font: SORA, align: "center", alpha: ks });
  text(S.sandSub, sx, 588, { size: 15, font: MONO, color: C.soft, align: "center", alpha: ks });
  const kb = seg(t, a2, a2 + 0.6);
  panel(240, 618, 800, 44, { r: 22, fill: "#fff8d6", stroke: "#e6c84a", alpha: kb });
  hand(S.bottleneck, 640, 648, { size: 20, align: "center", alpha: kb });
}

function sOutro(t, d, cues) {
  kicker(S.kOutro, seg(t, 0.1, 0.6));
  [S.t1, S.t2, S.t3].forEach((s, i) => {
    const a = at(cues, i, 0.5 + i * 1.6), k = seg(t, a, a + 0.5);
    check(120, 236 + i * 110, 34, i === 2 ? EXEC.human : C.good, seg(t, a + 0.1, a + 0.6));
    text(s, 170, 252 + i * 110, { size: 50, weight: 800, font: SORA, alpha: k, color: i === 2 ? EXEC.human : C.ink });
  });
  text(S.url, 640, 610, { size: 16, font: MONO, color: C.soft, align: "center", alpha: seg(t, at(cues, 2, 3) + 0.8, at(cues, 2, 3) + 1.3) });
}

VIDEO.create({
  title: { en: "One human, a board, a team of agents", fr: "Un humain, un tableau, une équipe d'agents", it: "Un umano, una board, un team di agenti" },
  kicker: { en: "Horae · how the project is built", fr: "Horae · comment le projet est construit", it: "Horae · come viene costruito il progetto" },
  langs: ["en", "fr", "it"],
  theme: {
    bg: "#ffffff", bg2: "#f7f9fc", panel: "#ffffff", panel2: "#eef2f8", line: "#d3dbe6",
    ink: "#15171c", soft: "#4c5260", faint: "#8a92a0", accent: "#2b46d6", accent2: "#7c5cff",
    good: "#1f9d63", warn: "#d98a00", bad: "#d6455d", deep: "#e9edff", term: "#181b21", termInk: "#edf1f6",
  },
  background: paperBg,
  strings: STR,
  poster: "board",
  scenes: { hook: sHook, plan: sPlan, board: sBoard, loop: sLoop, human: sHuman, numbers: sNumbers, team: sTeam, outro: sOutro },
});
