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
      var filter = pill.getAttribute("data-filter") || "everything";
      setActivePill(pill);
      // Work history lives in the experiences timeline, not the card grid, so
      // the "work" pill opens that timeline instead of filtering to one card.
      if (filter === "work") {
        var expTab = document.querySelector(
          '#nav-tabs button[data-nav="experiences"]'
        );
        if (expTab) setActiveNav(expTab);
        setView("experiences");
        if (experiencesView) {
          experiencesView.scrollIntoView({
            behavior: reduceMotion() ? "auto" : "smooth",
            block: "start"
          });
        }
        return;
      }
      activeFilter = filter;
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
  var experiencesView = document.getElementById("experiences-view");

  // nav value -> filter applied to the card grid (used only in grid views).
  var NAV_FILTER = {
    about: "everything",
    experiences: "everything",
    research: "research",
    gallery: "everything"
  };

  // Show one of the nav views. "research", "gallery", and "experiences" reveal
  // their own sections and hide the plain grid; everything else shows the grid.
  function setView(nav) {
    var showResearch = nav === "research";
    var showGallery = nav === "gallery";
    var showExperiences = nav === "experiences";
    if (researchView) researchView.hidden = !showResearch;
    if (galleryView) galleryView.hidden = !showGallery;
    if (experiencesView) experiencesView.hidden = !showExperiences;
    if (gridView) gridView.hidden = showResearch || showGallery || showExperiences;
  }

  // Reveal the plain card grid and clear any active nav tab. Used when a filter
  // pill is clicked while another view is open.
  function showGridView() {
    if (researchView) researchView.hidden = true;
    if (galleryView) galleryView.hidden = true;
    if (experiencesView) experiencesView.hidden = true;
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
            : nav === "experiences"
            ? experiencesView
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

  // Graceful image paint: fade each image in once it has loaded and clear the
  // skeleton shimmer on its container. Handles images cached before JS runs.
  var fadeImgs = document.querySelectorAll("img.img-fade");
  fadeImgs.forEach(function (img) {
    function done() {
      img.classList.add("is-loaded");
      var host = img.closest(".img-skeleton");
      if (host) host.classList.add("is-loaded");
    }
    if (img.complete && img.naturalWidth > 0) {
      done();
    } else {
      img.addEventListener("load", done, { once: true });
      img.addEventListener(
        "error",
        function () {
          var host = img.closest(".img-skeleton");
          if (host) host.classList.add("is-loaded");
        },
        { once: true }
      );
    }
  });

  // Lightweight, dependency-free gallery lightbox. Clicking a gallery image
  // opens it enlarged; the tile's outbound link stays reachable via the caption.
  var galleryTiles = document.querySelectorAll("#gallery-view .gallery-tile");
  if (galleryTiles.length) {
    var overlay = document.createElement("div");
    overlay.className = "lb-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Image viewer");
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="lb-figure">' +
      '<button type="button" class="lb-close" aria-label="Close image viewer">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>' +
      "</button>" +
      '<img class="lb-img" alt="" />' +
      '<p class="lb-caption"></p>' +
      "</div>";
    document.body.appendChild(overlay);

    var lbImg = overlay.querySelector(".lb-img");
    var lbCaption = overlay.querySelector(".lb-caption");
    var lbClose = overlay.querySelector(".lb-close");
    var lastFocused = null;

    function focusables() {
      return overlay.querySelectorAll(
        'button, [href], [tabindex]:not([tabindex="-1"])'
      );
    }

    function openLightbox(src, alt, caption) {
      lastFocused = document.activeElement;
      lbImg.setAttribute("src", src);
      lbImg.setAttribute("alt", alt || "");
      lbCaption.textContent = caption || "";
      overlay.hidden = false;
      document.body.classList.add("lb-lock");
      // Force reflow so the opacity transition runs.
      void overlay.offsetWidth;
      overlay.classList.add("is-open");
      lbClose.focus();
    }

    function closeLightbox() {
      overlay.classList.remove("is-open");
      document.body.classList.remove("lb-lock");
      var finish = function () {
        overlay.hidden = true;
        lbImg.removeAttribute("src");
      };
      if (reduceMotion()) {
        finish();
      } else {
        window.setTimeout(finish, 220);
      }
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    }

    galleryTiles.forEach(function (tile) {
      var img = tile.querySelector(".gallery-img");
      if (!img) return;
      var nameEl = tile.querySelector(".gallery-name");
      var tagEl = tile.querySelector(".gallery-tag");
      var caption = [
        nameEl ? nameEl.textContent : "",
        tagEl ? tagEl.textContent : ""
      ]
        .filter(Boolean)
        .join(" · ");
      // Make the image itself the lightbox trigger without breaking the link.
      img.style.cursor = "zoom-in";
      img.setAttribute("role", "button");
      img.setAttribute("tabindex", "0");
      img.setAttribute("aria-label", "Open " + (nameEl ? nameEl.textContent : "image") + " enlarged");

      function trigger(e) {
        e.preventDefault();
        e.stopPropagation();
        openLightbox(img.getAttribute("src"), img.getAttribute("alt"), caption);
      }
      img.addEventListener("click", trigger);
      img.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          trigger(e);
        }
      });
    });

    lbClose.addEventListener("click", closeLightbox);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (overlay.hidden) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === "Tab") {
        // Focus trap.
        var items = focusables();
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }
})();
