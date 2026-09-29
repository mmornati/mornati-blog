// Hover previews for links to other posts inside an article. Loads a small per-language
// index on first intent, only on devices with a real hover, and never blocks the link.
(() => {
  const body = document.querySelector(".article-content");
  if (!body || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const m = location.pathname.match(/^\/(fr|it)\//);
  const src = (m ? `/${m[1]}` : "") + "/previews.json";
  let index = null, loading = null, timer = 0, current = null, pending = null;

  const load = () => loading || (loading = fetch(src).then((r) => (r.ok ? r.json() : {})).then((j) => (index = j)).catch(() => (index = {})));
  const keyOf = (a) => {
    try {
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || u.pathname === location.pathname) return null;
      return u.pathname.endsWith("/") ? u.pathname : u.pathname + "/";
    } catch { return null; }
  };

  const card = document.createElement("div");
  card.className = "peek";
  card.setAttribute("role", "tooltip");
  card.hidden = true;
  document.body.appendChild(card);

  function place(a) {
    const r = a.getBoundingClientRect();
    const w = card.offsetWidth, h = card.offsetHeight;
    let x = Math.min(Math.max(r.left + r.width / 2 - w / 2, 12), innerWidth - w - 12);
    let y = r.bottom + 10;
    if (y + h > innerHeight - 12) y = r.top - h - 10;
    card.style.transform = `translate(${Math.round(x + scrollX)}px, ${Math.round(y + scrollY)}px)`;
  }

  function show(a) {
    const p = index && index[keyOf(a)];
    if (!p) return;
    card.replaceChildren();
    if (p.c) {
      const img = new Image();
      img.src = p.c; img.alt = ""; img.width = 480; img.height = 270;
      card.appendChild(img);
    }
    const meta = document.createElement("p");
    meta.className = "peek__meta";
    meta.textContent = `${p.d} · ${p.r}′`;
    const t = document.createElement("p");
    t.className = "peek__title";
    t.textContent = p.t;
    card.append(meta, t);
    if (p.s) {
      const s = document.createElement("p");
      s.className = "peek__summary";
      s.textContent = p.s;
      card.appendChild(s);
    }
    card.hidden = false;
    place(a);
    card.classList.add("is-open");
    a.setAttribute("aria-describedby", "peek");
    card.id = "peek";
    current = a;
  }
  function hide() {
    clearTimeout(timer);
    pending = null;
    if (current) current.removeAttribute("aria-describedby");
    current = null;
    card.classList.remove("is-open");
    card.hidden = true;
  }

  const enter = (e) => {
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a || !body.contains(a) || !keyOf(a)) return;
    load();
    clearTimeout(timer);
    pending = a;
    timer = setTimeout(() => loading.then(() => pending === a && show(a)), 380);
  };
  body.addEventListener("pointerover", enter);
  body.addEventListener("focusin", enter);
  body.addEventListener("pointerout", (e) => { if (e.target.closest && e.target.closest("a[href]")) hide(); });
  body.addEventListener("focusout", hide);
  addEventListener("scroll", () => current && hide(), { passive: true });
  addEventListener("keydown", (e) => e.key === "Escape" && hide());
})();
