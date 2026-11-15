// Open-source gallery: narrow the page to one GitHub account. Without JavaScript the chips stay
// hidden and every project is listed.
(function () {
  var chips = document.getElementById("oss-chips");
  if (!chips) return;
  var none = document.getElementById("oss-none");
  chips.hidden = false;
  chips.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    var owner = b.getAttribute("data-owner");
    chips.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    var shown = 0;
    document.querySelectorAll("[data-owner]:not(button)").forEach(function (el) {
      el.hidden = !!owner && el.getAttribute("data-owner") !== owner;
      if (!el.hidden) shown++;
    });
    document.querySelectorAll(".nb-fam").forEach(function (s) {
      s.hidden = !s.querySelector(".nb-oss:not([hidden])");
    });
    if (none) none.hidden = shown > 0;
  });
})();
