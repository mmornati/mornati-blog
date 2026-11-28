// Home-lab notebook: remember which posts this reader has opened, and tick them in every list.
// Per-browser convenience only; everything renders correctly without storage.
(function () {
  var KEY = "nb-read";
  var read = [];
  try { read = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { read = []; }

  var article = document.querySelector("[data-nb-article]");
  if (article) {
    var path = article.getAttribute("data-nb-article");
    if (read.indexOf(path) === -1) {
      read.unshift(path);
      read = read.slice(0, 600);
      try { localStorage.setItem(KEY, JSON.stringify(read)); } catch (e) {}
    }
  }

  if (!read.length) return;
  var seen = {};
  read.forEach(function (p) { seen[p] = true; });
  document.querySelectorAll("[data-nb-post]").forEach(function (el) {
    if (seen[el.getAttribute("data-nb-post")]) el.classList.add("is-read");
  });
})();

// Mark the menu entry for the section you're in.
(function () {
  var path = location.pathname;
  document.querySelectorAll(".main-menu nav a[href]").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href && href.charAt(0) === "/" && href.length > 4 && path.indexOf(href) === 0) a.classList.add("is-current");
  });
})();


// AI recipe block: copy the prompt of the post.
document.addEventListener("click", function (e) {
  var btn = e.target.closest && e.target.closest(".ai-prompt__copy");
  if (!btn) return;
  var box = btn.closest(".ai-prompt");
  var pre = box && box.querySelector(".ai-prompt__text");
  if (!pre || !navigator.clipboard) return;
  navigator.clipboard.writeText(pre.textContent).then(function () {
    var label = btn.textContent;
    btn.textContent = btn.getAttribute("data-copied") || label;
    btn.classList.add("is-copied");
    setTimeout(function () { btn.textContent = label; btn.classList.remove("is-copied"); }, 2000);
  });
});
