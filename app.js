(function () {
  "use strict";

  /* Theme toggle (light default, persisted) */
  var root = document.documentElement;
  var toggle = document.getElementById("theme-toggle");
  var stored = null;
  try { stored = localStorage.getItem("theme"); } catch (e) {}
  if (stored === "dark") root.setAttribute("data-theme", "dark");

  if (toggle) {
    toggle.addEventListener("click", function () {
      var dark = root.getAttribute("data-theme") === "dark";
      if (dark) {
        root.removeAttribute("data-theme");
        try { localStorage.setItem("theme", "light"); } catch (e) {}
      } else {
        root.setAttribute("data-theme", "dark");
        try { localStorage.setItem("theme", "dark"); } catch (e) {}
      }
    });
  }

  /* Filter + search */
  var pills = [].slice.call(document.querySelectorAll(".fpill"));
  var cards = [].slice.call(document.querySelectorAll(".card"));
  var search = document.getElementById("search");
  var empty = document.getElementById("empty");
  var activeFilter = "everything";

  function apply() {
    var q = (search && search.value ? search.value : "").trim().toLowerCase();
    var shown = 0;
    cards.forEach(function (card) {
      var cat = card.getAttribute("data-cat");
      var matchCat = activeFilter === "everything" || cat === activeFilter;
      var matchText = !q || card.textContent.toLowerCase().indexOf(q) !== -1;
      var show = matchCat && matchText;
      card.style.display = show ? "" : "none";
      if (show) shown++;
    });
    if (empty) empty.hidden = shown !== 0;
  }

  pills.forEach(function (pill) {
    pill.addEventListener("click", function () {
      pills.forEach(function (p) {
        p.classList.remove("fpill-active");
        p.setAttribute("aria-selected", "false");
      });
      pill.classList.add("fpill-active");
      pill.setAttribute("aria-selected", "true");
      activeFilter = pill.getAttribute("data-filter");
      apply();
    });
  });

  if (search) search.addEventListener("input", apply);
})();
