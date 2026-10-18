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

