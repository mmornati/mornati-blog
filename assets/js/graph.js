// Topology map: a small force layout over the blog's posts, topics and projects.
// No dependencies. The network settles once on load (instantly with reduced motion),
// then hovering, focusing or filtering lights a node's connections.
(() => {
  const svg = document.querySelector("[data-graph]");
  const dataEl = document.getElementById("graph-data");
  if (!svg || !dataEl) return;

  const data = JSON.parse(dataEl.textContent);
  const nodes = data.nodes;
  const links = data.links.map((l) => [l.s, l.t]);
  const NS = "http://www.w3.org/2000/svg";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const frame = svg.parentElement;
  const tip = frame.querySelector(".graph__tip");
  const filters = document.querySelector(".graph__filters");

  // Seeded PRNG so the map lands in the same shape on every visit.
  let seed = 20260929;
  const rand = () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  nodes.forEach((n, i) => {
    n.i = i;
    n.adj = new Set();
    n.hub = n.k !== "n";
    n.r = n.hub ? 6 + Math.sqrt(n.w) * 1.5 : 2.2 + Math.sqrt(n.w || 400) / 16;
    n.vx = 0;
    n.vy = 0;
  });
  links.forEach(([a, b]) => { nodes[a].adj.add(b); nodes[b].adj.add(a); });

  // Seat each project right after its pillar topic so related hubs start as neighbours.
  const topics = nodes.filter((n) => n.k === "t");
  const projects = nodes.filter((n) => n.k === "p");
  const hubs = [];
  topics.forEach((t) => { hubs.push(t); projects.filter((p) => p.g === t.g).forEach((p) => hubs.push(p)); });
  projects.forEach((p) => { if (!hubs.includes(p)) hubs.push(p); });
  hubs.forEach((h, j) => {
    const a = (j / hubs.length) * Math.PI * 2;
    const R = h.k === "t" ? 300 : 230;
    h.x = Math.cos(a) * R;
    h.y = Math.sin(a) * R;
  });
  nodes.forEach((n) => {
    if (n.hub) return;
    const h = [...n.adj].map((i) => nodes[i]).find((m) => m.hub);
    n.x = (h ? h.x : 0) + (rand() - 0.5) * 90;
    n.y = (h ? h.y : 0) + (rand() - 0.5) * 90;
  });

  // Shape the layout to its box: a tall phone frame pulls harder sideways than vertically.
  if (filters) filters.hidden = false; // show before measuring: it shares the grid with the map
  const box = () => svg.getBoundingClientRect();
  const aspect = Math.max(0.5, Math.min(2.2, (box().height || 1) / (box().width || 1)));
  const gx = 0.006, gy = 0.006;
  // Phones label topics only; project names stay in the filter row and on hover.
  const narrow = box().width < 600;
  // In a portrait frame the (naturally landscape) network is drawn transposed.
  const flip = aspect > 1.15;
  const X = (n) => (flip ? n.y : n.x);
  const Y = (n) => (flip ? n.x : n.y);

  function tick(alpha) {
    const N = nodes.length;
    for (let i = 0; i < N; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < N; j++) {
        const b = nodes[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 > 360000) continue;
        if (d2 < 1) { dx = rand() - 0.5; dy = rand() - 0.5; d2 = 1; }
        const d = Math.sqrt(d2);
        const f = ((a.hub ? 4 : 1) * (b.hub ? 4 : 1) * 260 * alpha) / d2;
        const fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
        const min = a.r + b.r + 3;
        if (d < min) {
          const push = ((min - d) / d) * 0.5;
          a.x += dx * push; a.y += dy * push; b.x -= dx * push; b.y -= dy * push;
        }
      }
    }
    for (const [ia, ib] of links) {
      const a = nodes[ia], b = nodes[ib];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const L = a.hub || b.hub ? 80 : 50;
      const k = (a.hub || b.hub ? 0.035 : 0.02) * alpha;
      const f = (d - L) * k;
      const fx = (dx / d) * f, fy = (dy / d) * f;
      const wa = a.hub ? 0.25 : 1, wb = b.hub ? 0.25 : 1;
      a.vx += fx * wa; a.vy += fy * wa; b.vx -= fx * wb; b.vy -= fy * wb;
    }
    for (const n of nodes) {
      n.vx -= n.x * gx * alpha;
      n.vy -= n.y * gy * alpha;
      n.vx *= 0.55; n.vy *= 0.55;
      n.x += n.vx; n.y += n.vy;
    }
  }

  // ---- DOM ----
  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const gLinks = el("g", { class: "g-links" }, svg);
  const gNodes = el("g", { class: "g-nodes" }, svg);
  const gLabels = el("g", { class: "g-labels", "aria-hidden": "true" }, svg);

  const lineEls = links.map(([a, b]) => {
    const kind = nodes[a].hub || nodes[b].hub ? "hub" : "ref";
    return el("line", { class: `g-link g-link--${kind}` }, gLinks);
  });
  nodes.forEach((n) => {
    const a = el("a", { href: n.u, class: `g-node g-node--${n.k}`, "data-i": n.i }, gNodes);
    el("title", {}, a).textContent = n.d ? `${n.l} (${n.d})` : n.l;
    if (n.k === "n") n.shape = el("circle", { r: n.r.toFixed(1) }, a);
    else {
      const s = n.r * 1.7;
      n.shape = el("rect", { width: s, height: s, rx: 1.5 }, a);
      n.half = s / 2;
    }
    n.a = a;
    if (n.hub) {
      n.label = el("text", { class: `g-label g-label--${n.k}` }, gLabels);
      n.label.textContent = n.l;
      if (narrow && n.k === "p") n.label.classList.add("g-label--quiet");
    }
  });

  let vb = null;
  function draw() {
    links.forEach(([a, b], i) => {
      const l = lineEls[i];
      l.setAttribute("x1", X(nodes[a]).toFixed(1)); l.setAttribute("y1", Y(nodes[a]).toFixed(1));
      l.setAttribute("x2", X(nodes[b]).toFixed(1)); l.setAttribute("y2", Y(nodes[b]).toFixed(1));
    });
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const n of nodes) {
      const nx = X(n), ny = Y(n);
      if (n.k === "n") { n.shape.setAttribute("cx", nx.toFixed(1)); n.shape.setAttribute("cy", ny.toFixed(1)); }
      else {
        n.shape.setAttribute("x", (nx - n.half).toFixed(1));
        n.shape.setAttribute("y", (ny - n.half).toFixed(1));
        if (n.k === "p") n.shape.setAttribute("transform", `rotate(45 ${nx.toFixed(1)} ${ny.toFixed(1)})`);
        n.label.setAttribute("x", (nx + n.half + 6).toFixed(1));
        n.label.setAttribute("y", (ny + 4).toFixed(1));
      }
      x0 = Math.min(x0, nx - n.r); y0 = Math.min(y0, ny - n.r);
      x1 = Math.max(x1, nx + n.r);  y1 = Math.max(y1, ny + n.r);
    }
    const pad = 24;
    const target = [x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2];
    vb = vb ? vb.map((v, i) => v + (target[i] - v) * 0.2) : target;
    svg.setAttribute("viewBox", vb.map((v) => v.toFixed(1)).join(" "));
    // Keep hub labels at a steady on-screen size whatever the zoom.
    const b = box();
    const scale = Math.min(b.width / vb[2], b.height / vb[3]) || 1;
    const size = (narrow ? 10 : 11) / scale;
    svg.style.setProperty("--label-size", `${size.toFixed(2)}px`);
    // Labels that would run past the right edge flip to the node's left side.
    const right = vb[0] + vb[2];
    for (const n of hubs) {
      if (!n.label) continue;
      const nx = X(n), w = n.l.length * size * 0.56;
      const flipL = nx + n.half + 6 + w > right;
      n.label.setAttribute("text-anchor", flipL ? "end" : "start");
      n.label.setAttribute("x", (flipL ? nx - n.half - 6 : nx + n.half + 6).toFixed(1));
    }
  }

  // Greedy label placement: heavier hubs first; a colliding label tries the other side,
  // then small vertical nudges, and is otherwise held back until its node is lit.
  function declutter() {
    const placed = [];
    const hit = (b) => placed.some((p) => b.x < p.x + p.width && b.x + b.width > p.x && b.y < p.y + p.height && b.y + b.height > p.y);
    const order = hubs.filter((n) => n.label && !(narrow && n.k === "p")).sort((a, b) => (a.k === b.k ? b.w - a.w : a.k === "t" ? -1 : 1));
    const size = parseFloat(svg.style.getPropertyValue("--label-size")) || 11;
    for (const n of order) {
      const l = n.label;
      l.classList.remove("g-label--quiet");
      const nx = X(n), ny = Y(n);
      const tries = [];
      for (const dy of [0, -1.1, 1.1, -2.2, 2.2]) for (const side of ["start", "end"]) tries.push([side, dy]);
      let ok = false;
      for (const [side, dy] of tries) {
        l.setAttribute("text-anchor", side);
        l.setAttribute("x", (side === "start" ? nx + n.half + 6 : nx - n.half - 6).toFixed(1));
        l.setAttribute("y", (ny + 4 + dy * size).toFixed(1));
        const b = l.getBBox();
        const right = vb[0] + vb[2], left = vb[0];
        if (b.x < left || b.x + b.width > right) continue;
        if (!hit(b)) { placed.push(b); ok = true; break; }
      }
      if (!ok) l.classList.add("g-label--quiet");
    }
  }

  const TICKS = 320;
  if (reduce) {
    for (let t = 0; t < TICKS; t++) tick(1 - t / TICKS);
    vb = null;
    draw();
    declutter();
  } else {
    let t = 0;
    const step = () => {
      for (let s = 0; s < 3 && t < TICKS; s++, t++) tick(1 - t / TICKS);
      draw();
      if (t < TICKS) requestAnimationFrame(step);
      else { vb = null; draw(); declutter(); }
    };
    requestAnimationFrame(step);
  }

  // ---- Interaction: light a node and its neighbourhood ----
  let locked = null;
  function light(set) {
    svg.classList.toggle("is-focus", !!set);
    nodes.forEach((n) => n.a.classList.toggle("is-lit", !!set && set.has(n.i)));
    nodes.forEach((n) => n.label && n.label.classList.toggle("is-lit", !!set && set.has(n.i)));
    links.forEach(([a, b], i) => lineEls[i].classList.toggle("is-lit", !!set && set.has(a) && set.has(b)));
  }
  const around = (n) => new Set([n.i, ...n.adj]);
  function show(n) {
    light(around(n));
    const r = n.a.getBoundingClientRect(), f = frame.getBoundingClientRect();
    tip.hidden = false;
    tip.textContent = n.d ? `${n.d} · ${n.l}` : `${n.l} · ${n.adj.size}`;
    const x = Math.min(Math.max(r.left - f.left + r.width / 2, 120), f.width - 120);
    tip.style.transform = `translate(${x}px, ${r.top - f.top - 10}px) translate(-50%, -100%)`;
  }
  function reset() {
    tip.hidden = true;
    light(locked ? around(locked) : null);
  }
  const nodeOf = (e) => {
    const a = e.target.closest && e.target.closest(".g-node");
    return a ? nodes[+a.dataset.i] : null;
  };
  svg.addEventListener("pointerover", (e) => { const n = nodeOf(e); if (n) show(n); });
  svg.addEventListener("pointerout", (e) => { if (nodeOf(e)) reset(); });
  svg.addEventListener("focusin", (e) => { const n = nodeOf(e); if (n) show(n); });
  svg.addEventListener("focusout", reset);

  if (filters) {
    filters.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      filters.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      locked = b.dataset.hub === "" ? null : nodes[+b.dataset.hub];
      reset();
    });
  }
})();
