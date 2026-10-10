(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Intro: headlights ignite, then the site opens ---------- */
  var intro = document.getElementById("intro");
  var skipBtn = document.getElementById("skipIntro");
  var OPEN_AT = 2600;   // ms: beams have flared, start the reveal
  var FADE_MS = 800;    // matches .intro.is-opening animation
  var opened = false;
  var openTimer;

  function openSite() {
    if (opened) return;
    opened = true;
    clearTimeout(openTimer);
    revealHero();
    if (!intro) { body.classList.remove("intro-active"); return; }
    intro.classList.add("is-opening");
    setTimeout(function () {
      intro.remove();
      body.classList.remove("intro-active");
    }, FADE_MS);
  }

  if (!intro || reduceMotion) {
    if (intro) intro.remove();
    body.classList.remove("intro-active");
    opened = true;
    revealHero();
  } else {
    openTimer = setTimeout(openSite, OPEN_AT);
    skipBtn.addEventListener("click", openSite);
    intro.addEventListener("click", openSite);
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        document.removeEventListener("keydown", onKey);
        openSite();
      }
    });
  }

  /* ---------- Background video (falls back to the animated track) ---------- */
  var video = document.getElementById("bgVideo");
  var toggle = document.getElementById("videoToggle");

  if (video) {
    var sources = video.querySelectorAll("source");
    var lastSource = sources[sources.length - 1];
    var userPaused = reduceMotion;

    function setPaused(paused) {
      toggle.setAttribute("aria-pressed", String(paused));
      toggle.setAttribute("aria-label", paused ? "Play background video" : "Pause background video");
    }

    function tryPlay() {
      var p = video.play();
      if (p && p.catch) p.catch(function () { setPaused(true); });
    }

    video.addEventListener("loadeddata", function () {
      root.classList.add("has-video");
      toggle.hidden = false;
      setPaused(userPaused);
      if (!userPaused) tryPlay();
    });
    video.addEventListener("play", function () { setPaused(false); });
    video.addEventListener("pause", function () { setPaused(true); });

    if (lastSource) {
      lastSource.addEventListener("error", function () {
        // No footage yet: keep the animated night-track backdrop.
        video.remove();
        toggle.remove();
      });
    }

    if (!userPaused) { video.preload = "auto"; tryPlay(); }

    toggle.addEventListener("click", function () {
      userPaused = !video.paused;
      if (video.paused) tryPlay(); else video.pause();
    });

    document.addEventListener("visibilitychange", function () {
      if (!video.isConnected) return;
      if (document.hidden) video.pause();
      else if (!userPaused) tryPlay();
    });
  }

  /* ---------- Navigation ---------- */
  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");

  function onScroll() { nav.classList.toggle("nav--solid", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    navLinks.classList.toggle("is-open", open);
    nav.classList.toggle("nav--open", open);
  }
  navToggle.addEventListener("click", function () {
    setMenu(navToggle.getAttribute("aria-expanded") !== "true");
  });
  navLinks.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && navLinks.classList.contains("is-open")) { setMenu(false); navToggle.focus(); }
  });

  /* ---------- Scroll reveals ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  reveals.forEach(function (el) {
    var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains("reveal"); });
    el.style.setProperty("--d", Math.min(siblings.indexOf(el), 5) * 90 + "ms");
  });

  function revealHero() {
    document.querySelectorAll(".hero .reveal").forEach(function (el) { el.classList.add("is-visible"); });
  }

  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    reveals.forEach(function (el) { if (!el.closest(".hero")) io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Hours: highlight today (Salem is on Pacific time) ---------- */
  try {
    var today = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "America/Los_Angeles" }).format(new Date());
    document.querySelectorAll(".hours dl div").forEach(function (row) {
      if (row.querySelector("dt").textContent.trim() === today) row.classList.add("is-today");
    });
  } catch (e) { /* older browsers: no highlight */ }

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
