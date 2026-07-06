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
      // A pill only makes sense against the card grid, so make sure it is shown
      // (in case the research or gallery view was open) and clear the nav pill.
      showGridView();
      apply();
    });
  });

  // Nav tabs. Each tab drives the same filter state as the pills, updates the
  // active nav pill, and (except for "about") scrolls to the card grid.
  var navTabs = document.querySelectorAll("#nav-tabs button");
  var grid = document.getElementById("card-grid");

  // Distinct nav views: the plain card grid, the publications list, the gallery.
  var gridView = document.getElementById("grid-view");
  var researchView = document.getElementById("research-view");
  var galleryView = document.getElementById("gallery-view");

  // nav value -> filter applied to the card grid (used only in grid views).
  var NAV_FILTER = {
    about: "everything",
    experiences: "work",
    research: "research",
    gallery: "everything"
  };

  // Show one of the three views. "research" and "gallery" reveal their own
  // sections and hide the plain grid; everything else shows the grid.
  function setView(nav) {
    var showResearch = nav === "research";
    var showGallery = nav === "gallery";
    if (researchView) researchView.hidden = !showResearch;
    if (galleryView) galleryView.hidden = !showGallery;
    if (gridView) gridView.hidden = showResearch || showGallery;
  }

  // Reveal the plain card grid and clear any active nav tab. Used when a filter
  // pill is clicked while the research or gallery view is open.
  function showGridView() {
    if (researchView) researchView.hidden = true;
    if (galleryView) galleryView.hidden = true;
    if (gridView) gridView.hidden = false;
    navTabs.forEach(function (t) {
      t.classList.remove("bg-foreground", "text-background", "font-medium");
      t.classList.add("text-muted-foreground", "hover:text-foreground");
      t.removeAttribute("aria-current");
    });
  }

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
      setView(nav);
      // Keep the grid filter state in sync so returning to a grid view is correct.
      syncPillTo(activeFilter);
      apply();
      // Scroll to whichever section is now visible (all but "about").
      if (nav !== "about") {
        var target =
          nav === "research"
            ? researchView
            : nav === "gallery"
            ? galleryView
            : grid;
        if (target) {
          target.scrollIntoView({
            behavior: reduceMotion() ? "auto" : "smooth",
            block: "start"
          });
        }
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
