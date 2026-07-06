(function () {
  "use strict";

  var root = document.documentElement;

  // Theme toggle: toggle "dark" class on <html>, persisted in localStorage.
  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var isDark = root.classList.toggle("dark");
      try {
        localStorage.setItem("theme", isDark ? "dark" : "light");
      } catch (e) {}
    });
  }

  // Filter pills + search.
  var pills = document.querySelectorAll("#filter-pills button");
  var cards = document.querySelectorAll("#card-grid > [data-category]");
  var noResults = document.getElementById("no-results");
  var searchToggle = document.getElementById("search-toggle");
  var searchWrap = document.getElementById("search-wrap");
  var searchInput = document.getElementById("search-input");

  var activeFilter = "everything";
  var query = "";

  var ACTIVE = ["bg-foreground", "text-background"];
  var INACTIVE = ["text-muted-foreground", "hover:text-foreground"];

  function setActivePill(target) {
    pills.forEach(function (p) {
      if (p === target) {
        p.classList.remove.apply(p.classList, INACTIVE);
        p.classList.add.apply(p.classList, ACTIVE);
      } else {
        p.classList.remove.apply(p.classList, ACTIVE);
        p.classList.add.apply(p.classList, INACTIVE);
      }
    });
  }

  function apply() {
    var shown = 0;
    cards.forEach(function (card) {
      var cat = card.getAttribute("data-category") || "";
      var text = card.getAttribute("data-text") || "";
      var matchFilter = activeFilter === "everything" || cat === activeFilter;
      var matchQuery = query === "" || text.indexOf(query) !== -1;
      if (matchFilter && matchQuery) {
        card.hidden = false;
        shown++;
      } else {
        card.hidden = true;
      }
    });
    if (noResults) noResults.hidden = shown !== 0;
  }

  // Keep the filter pill row in sync when the filter changes from elsewhere
  // (for example a nav tab). Falls back to clearing all pills if none matches.
  function syncPillTo(filter) {
    var matched = null;
    pills.forEach(function (p) {
      if (p.getAttribute("data-filter") === filter) matched = p;
    });
    setActivePill(matched);
  }

  pills.forEach(function (pill) {
    pill.addEventListener("click", function () {
      activeFilter = pill.getAttribute("data-filter") || "everything";
      setActivePill(pill);
      apply();
    });
  });

  // Nav tabs. Each tab drives the same filter state as the pills, updates the
  // active nav pill, and (except for "about") scrolls to the card grid.
  var navTabs = document.querySelectorAll("#nav-tabs button");
  var grid = document.getElementById("card-grid");

  // nav value -> filter applied to the card grid.
  var NAV_FILTER = {
    about: "everything",
    experiences: "work",
    research: "research",
    gallery: "everything"
  };

  function setActiveNav(target) {
    navTabs.forEach(function (t) {
      if (t === target) {
        t.classList.remove("text-muted-foreground", "hover:text-foreground");
        t.classList.add("bg-foreground", "text-background", "font-medium");
        t.setAttribute("aria-current", "page");
      } else {
        t.classList.remove("bg-foreground", "text-background", "font-medium");
        t.classList.add("text-muted-foreground", "hover:text-foreground");
        t.removeAttribute("aria-current");
      }
    });
  }

  function reduceMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  navTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var nav = tab.getAttribute("data-nav") || "about";
      activeFilter = NAV_FILTER[nav] || "everything";
      setActiveNav(tab);
      syncPillTo(activeFilter);
      apply();
      if (nav !== "about" && grid) {
        grid.scrollIntoView({
          behavior: reduceMotion() ? "auto" : "smooth",
          block: "start"
        });
      }
    });
  });

  if (searchToggle && searchWrap && searchInput) {
    searchToggle.addEventListener("click", function () {
      searchWrap.hidden = !searchWrap.hidden;
      if (!searchWrap.hidden) searchInput.focus();
    });
    searchInput.addEventListener("input", function () {
      query = searchInput.value.trim().toLowerCase();
      apply();
    });
  }

  apply();
})();
