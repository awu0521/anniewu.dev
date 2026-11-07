/* =========================================================
   Annie Wu — The Portfolio You Can Debug
   Plain JavaScript, no dependencies, no build step.

   The portfolio itself is plain HTML with anchor links and works
   without this file. Everything here is progressive enhancement:
   the mobile menu, and the Debug Playground pages (playground/),
   where each scenario lives on its own page.
   Each piece is started inside its own try/catch so a failure in
   one demo can never break navigation or the other demos.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- small helpers ---------- */

  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reducedMotion() { return !!(motionQuery && motionQuery.matches); }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /** Create an element with text content only (never innerHTML for dynamic data). */
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  var SVG_NS = 'http://www.w3.org/2000/svg';
  /** Create an SVG element. Text goes in via textContent only. */
  function svg(tag, attrs, text) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }
  function svgUse(id, attrs) {
    var u = svg('use', attrs);
    u.setAttribute('href', '#' + id);
    u.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + id);
    return u;
  }
  /** Restart a CSS animation class on an element. */
  function pulse(node, cls) {
    node.classList.remove(cls);
    void node.getBoundingClientRect();
    node.classList.add(cls);
  }

  /** Guarded localStorage access: every call is safe when storage is blocked. */
  var store = (function () {
    var s = null;
    try {
      s = window.localStorage;
      var probe = 'annie-portfolio:probe';
      s.setItem(probe, '1');
      s.removeItem(probe);
    } catch (e) { s = null; }
    return {
      ok: !!s,
      get: function (k) { if (!s) return null; try { return s.getItem(k); } catch (e) { return null; } },
      set: function (k, v) { if (!s) return false; try { s.setItem(k, v); return true; } catch (e) { return false; } },
      remove: function (k) { if (!s) return; try { s.removeItem(k); } catch (e) { /* ignore */ } }
    };
  })();

  /** Write a status message. Only touches the live region when the text actually changes. */
  function setFeedback(node, kind, title, detail) {
    var key = kind + '|' + (title || '') + '|' + (detail || '');
    if (node.getAttribute('data-key') === key) return;
    node.setAttribute('data-key', key);
    node.className = 'feedback' + (kind ? ' is-' + kind : '');
    clear(node);
    if (!title) return;
    node.appendChild(el('span', 'fb-title', title));
    if (detail) node.appendChild(el('span', 'fb-detail', detail));
  }

  /** Build a small before/after table: rows = [{label, value, current}] */
  function renderCompare(node, heading, rows) {
    clear(node);
    var shown = rows.filter(function (r) { return r.value; });
    if (!shown.length) return;
    node.appendChild(el('p', 'compare-title', heading));
    var table = el('table');
    var tbody = el('tbody');
    shown.forEach(function (r) {
      var tr = el('tr', r.current ? 'is-current' : '');
      tr.appendChild(el('th', null, r.label));
      tr.appendChild(el('td', null, r.value));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    node.appendChild(table);
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }

  /** Run a feature; if it throws, contain the damage to its own panel. */
  function safely(name, fn, container) {
    try {
      fn();
    } catch (err) {
      if (window.console && console.error) console.error('[' + name + '] disabled:', err);
      if (container) {
        var note = el('p', 'pg-error', 'This demo hit a snag and has been switched off. The rest of the page works normally.');
        container.appendChild(note);
        $all('button, input', container).forEach(function (c) { c.disabled = true; });
      }
    }
  }

  /* ---------- mobile navigation ---------- */

  function initNav() {
    var toggle = $('.nav-toggle');
    var nav = $('#site-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('is-open', open);
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (toggle.getAttribute('aria-expanded') === 'true' && !nav.contains(e.target) && !toggle.contains(e.target)) {
        setOpen(false);
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) setOpen(false);
    });
  }

  /* ---------- hero: the floating "!" tooltip ---------- */
  // The tip shows on hover and keyboard focus (CSS). Escape hides it, per WCAG 1.4.13.
  function initDebugTip() {
    var bang = $('.debug-bang');
    var tip = $('#debug-tip');
    if (!bang || !tip) return;
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') tip.classList.add('is-dismissed');
    });
    function reset() { tip.classList.remove('is-dismissed'); }
    bang.addEventListener('mouseleave', reset);
    bang.addEventListener('blur', reset);
  }

  /* ---------- hero: a little bug crawling around the desk ---------- */
  // It wanders the desk top and sometimes dodges the cursor. Over the desk the
  // cursor is a magnifying glass (CSS); clicking/tapping the bug catches it: it
  // turns into a checkmark, a bug drops into the jar, and the count is kept in
  // this browser (localStorage) so it survives refreshes. A new bug wanders in.
  // Reduced motion: the bug sits still (but can still be caught).
  var BUG_SVG =
    '<svg viewBox="0 0 24 28" width="24" height="28">' +
      '<g class="legs-l" stroke="#28352F" stroke-width="1.6" stroke-linecap="round" fill="none">' +
        '<path d="M7 12 2.5 9M6.5 16H1.5M7 20l-4.5 3.5"/></g>' +
      '<g class="legs-r" stroke="#28352F" stroke-width="1.6" stroke-linecap="round" fill="none">' +
        '<path d="M17 12l4.5-3M17.5 16h5M17 20l4.5 3.5"/></g>' +
      '<g class="antennae" stroke="#28352F" stroke-width="1.4" stroke-linecap="round" fill="none">' +
        '<path d="M10.5 5 8 1.5M13.5 5 16 1.5"/></g>' +
      '<ellipse cx="12" cy="16.5" rx="6.2" ry="8" fill="#E9B795" stroke="#28352F" stroke-width="1.6"/>' +
      '<path d="M12 9.5v15" stroke="#28352F" stroke-width="1.2"/>' +
      '<rect x="7.6" y="13" width="2.4" height="2.4" fill="#84442A"/><rect x="14" y="18" width="2.4" height="2.4" fill="#84442A"/>' +
      '<circle cx="12" cy="7.2" r="3.3" fill="#28352F"/>' +
    '</svg>';

  function initDeskBug() {
    var stage = $('[data-desk]');
    if (!stage) return;
    var bug = document.createElement('span');
    bug.className = 'desk-bug';
    bug.setAttribute('aria-hidden', 'true');
    bug.innerHTML = BUG_SVG;
    stage.appendChild(bug);

    /* --- the jar --- */
    var JAR_KEY = 'annie-portfolio:bugs-caught';
    var JAR_SHOWN = 15; // tiny bugs drawn inside; the label always has the real count
    var jarBugs = $('[data-jar-bugs]');
    var jarCount = $('[data-jar-count]');
    var jarStatus = $('[data-jar-status]');
    var caughtTotal = parseInt(store.get(JAR_KEY), 10);
    if (!isFinite(caughtTotal) || caughtTotal < 0) caughtTotal = 0;

    function jarBug(i, isNew) {
      var s = el('span', 'jar-bug' + (isNew ? ' is-new' : ''));
      s.innerHTML = BUG_SVG;
      // Deterministic "random" spots so the pile looks the same after a refresh.
      var col = (i * 37) % 60, row = Math.floor(i / 3);
      s.style.left = (4 + col) + '%';
      s.style.bottom = (3 + row * 15) + '%';
      s.style.rotate = ((i * 71) % 160 - 80) + 'deg';
      return s;
    }
    function renderJar(added) {
      if (jarCount) jarCount.textContent = String(caughtTotal);
      if (!jarBugs) return;
      if (!added) {
        clear(jarBugs);
        for (var i = 0; i < Math.min(caughtTotal, JAR_SHOWN); i++) jarBugs.appendChild(jarBug(i, false));
      } else if (caughtTotal <= JAR_SHOWN) {
        jarBugs.appendChild(jarBug(caughtTotal - 1, true));
      }
    }
    renderJar(false);

    /* --- releasing: click the lid to empty the jar --- */
    var jarEl = $('.item-jar');
    var lid = $('[data-jar-lid]');
    var jarTip = $('#jar-tip');
    var releasing = false;
    if (lid && jarEl) {
      lid.addEventListener('click', function () {
        if (releasing) return;
        releasing = true;
        var n = caughtTotal;
        jarEl.classList.add('is-open');
        // Each bug walks to the middle of the jar, climbs to the opening, then flies out the top.
        var jr = jarEl.getBoundingClientRect();
        var mouthX = jr.left + jr.width / 2;
        var mouthY = jr.top + jr.height * 0.19; // just below the neck
        $all('.jar-bug', jarBugs).forEach(function (b, i) {
          var br = b.getBoundingClientRect();
          var x1 = mouthX - (br.left + br.width / 2);
          var y1 = mouthY - (br.top + br.height / 2);
          b.classList.remove('is-new');
          b.style.setProperty('--x1', x1 + 'px');
          b.style.setProperty('--y1', y1 + 'px');
          b.style.setProperty('--x2', (x1 + ((i * 53) % 60 - 30)) + 'px');
          b.style.setProperty('--y2', (y1 - 90 - (i % 3) * 14) + 'px');
          b.style.setProperty('--spin', ((i * 97) % 300 - 150) + 'deg');
          b.style.animationDelay = (150 + i * 90) + 'ms';
          b.classList.add('is-escaping');
        });
        caughtTotal = 0;
        store.set(JAR_KEY, '0');
        if (jarCount) jarCount.textContent = '0';
        if (jarStatus) jarStatus.textContent = n ? 'Released ' + n + (n === 1 ? ' bug' : ' bugs') + '. The jar is empty.' : 'The jar is already empty.';
        var bugsShown = $all('.jar-bug', jarBugs).length;
        setTimeout(function () {
          clear(jarBugs);
          jarEl.classList.remove('is-open');
          releasing = false;
        }, reducedMotion() ? 0 : 1300 + bugsShown * 90);
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && jarTip) jarTip.classList.add('is-dismissed'); });
      lid.addEventListener('mouseleave', function () { if (jarTip) jarTip.classList.remove('is-dismissed'); });
      lid.addEventListener('blur', function () { if (jarTip) jarTip.classList.remove('is-dismissed'); });
    }

    /* --- wandering --- */
    var B = { x0: 0.03, x1: 0.97, y0: 0.18, y1: 0.88 }; // desk top, as fractions
    var p = { x: 0.5, y: 0.6 }, t = null, ang = -60, last = 0;
    var waitUntil = 0, fleeUntil = 0, decideUntil = 0, boostUntil = 0, onScreen = true, caught = false;
    var still = reducedMotion();

    function rand(a, b) { return a + Math.random() * (b - a); }
    function place() {
      var w = stage.clientWidth, h = stage.clientHeight;
      bug.style.transform = 'translate(' + (p.x * w - bug.offsetWidth / 2) + 'px,' +
        (p.y * h - bug.offsetHeight / 2) + 'px) rotate(' + ang + 'deg)';
    }
    function flee(mx, my) {
      fleeUntil = performance.now() + 800;
      waitUntil = 0;
      var w = stage.clientWidth, h = stage.clientHeight, best = null, bestD = -1;
      for (var i = 0; i < 10; i++) {
        var c = { x: rand(B.x0, B.x1), y: rand(B.y0, B.y1) };
        var d = Math.pow((c.x - mx) * w, 2) + Math.pow((c.y - my) * h, 2);
        if (d > bestD) { bestD = d; best = c; }
      }
      t = best;
    }
    function bugCenter() {
      var r = stage.getBoundingClientRect();
      return { x: r.left + p.x * r.width, y: r.top + p.y * r.height, r: r };
    }
    // When the cursor gets close it always speeds up, and sometimes runs off,
    // so it's a chase but still catchable.
    function nearPointer(e) {
      if (still || caught) return;
      var c = bugCenter();
      var d = Math.sqrt(Math.pow(e.clientX - c.x, 2) + Math.pow(e.clientY - c.y, 2));
      var now = performance.now();
      if (d < 80) {
        boostUntil = now + 500;
        waitUntil = 0;
        if (now > decideUntil) {
          decideUntil = now + 1100;
          if (Math.random() < 0.35) flee((e.clientX - c.r.left) / c.r.width, (e.clientY - c.r.top) / c.r.height);
        }
      }
    }

    /* --- catching --- */
    function catchBug() {
      caught = true;
      var c = bugCenter();
      var check = el('span', 'catch-check');
      check.setAttribute('aria-hidden', 'true');
      check.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#FFFDF9" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      check.style.left = (c.x - c.r.left) + 'px';
      check.style.top = (c.y - c.r.top) + 'px';
      stage.appendChild(check);
      bug.classList.add('is-caught');
      setTimeout(function () { if (check.parentNode) check.parentNode.removeChild(check); }, 1200);

      caughtTotal++;
      store.set(JAR_KEY, String(caughtTotal));
      renderJar(true);
      if (jarStatus) jarStatus.textContent = 'Caught a bug! ' + caughtTotal + ' in the jar.';

      setTimeout(respawn, still ? 900 : 1600);
    }
    function respawn() {
      // A new bug wanders in from one side of the desk.
      p = { x: Math.random() < 0.5 ? B.x0 : B.x1, y: rand(B.y0, B.y1) };
      ang = p.x < 0.5 ? 90 : -90;
      t = null; waitUntil = 0; fleeUntil = 0;
      bug.classList.remove('is-caught');
      caught = false;
      if (still) p.x = rand(0.3, 0.7);
      place();
    }
    stage.addEventListener('pointermove', nearPointer);
    stage.addEventListener('pointerdown', function (e) {
      if (caught) return;
      if (e.target.closest && e.target.closest('a, button')) return;
      var c = bugCenter();
      var d = Math.sqrt(Math.pow(e.clientX - c.x, 2) + Math.pow(e.clientY - c.y, 2));
      if (d <= Math.max(24, bug.offsetWidth * 1.15)) catchBug();
      else nearPointer(e);
    });

    if (still) {
      place();
      window.addEventListener('resize', place);
      return;
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; }).observe(stage);
    }

    function tick(ts) {
      requestAnimationFrame(tick);
      var dt = last ? Math.min(ts - last, 64) : 16;
      last = ts;
      if (!onScreen || document.hidden || caught) return;
      var w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      if (ts < waitUntil) { bug.classList.remove('is-walking'); return; }
      if (!t) t = { x: rand(B.x0, B.x1), y: rand(B.y0, B.y1) };

      var dx = (t.x - p.x) * w, dy = (t.y - p.y) * h;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var fleeing = ts < fleeUntil;
      var hurried = fleeing || ts < boostUntil;
      var step = (fleeing ? 120 : hurried ? 90 : 34) * dt / 1000;

      var want = Math.atan2(dx, -dy) * 180 / Math.PI; // 0° = facing up
      var diff = ((want - ang + 540) % 360) - 180;
      ang += diff * Math.min(1, dt / (fleeing ? 60 : 140));

      if (dist <= step) {
        p.x = t.x; p.y = t.y; t = null;
        if (!fleeing && Math.random() < 0.6) waitUntil = ts + rand(500, 2200);
      } else if (Math.abs(diff) < 100 || fleeing) {
        p.x += (dx / dist) * step / w;
        p.y += (dy / dist) * step / h;
      }
      bug.classList.toggle('is-walking', true);
      bug.classList.toggle('is-fleeing', hurried);
      place();
    }
    place();
    requestAnimationFrame(tick);
  }

  /* ---------- Desk: the mouse cord runs back to the computer ---------- */
  function initMouseCord() {
    var path = $('[data-mouse-cord]');
    var layer = path && path.ownerSVGElement;
    var mouse = $('.item-mouse svg');
    var base = $('.monitor-base');
    if (!path || !layer || !mouse || !base) return;
    function draw() {
      if (getComputedStyle(mouse.parentNode).display === 'none') { path.setAttribute('d', ''); return; }
      var L = layer.getBoundingClientRect(), m = mouse.getBoundingClientRect(), b = base.getBoundingClientRect();
      var sx = m.left + m.width * 0.5 - L.left, sy = m.top + 3 - L.top;         // top of the mouse
      var ex = b.right - b.width * 0.18 - L.left, ey = b.top + b.height * 0.5 - L.top; // into the computer's base
      var d = 'M' + sx + ' ' + sy +
        ' C' + (sx + 6) + ' ' + (sy - 34) + ' ' + (ex + 70) + ' ' + (ey + 46) + ' ' + ex + ' ' + ey;
      path.setAttribute('d', d);
    }
    draw();
    window.addEventListener('resize', draw);
    window.addEventListener('load', draw);
    if ('ResizeObserver' in window) new ResizeObserver(draw).observe(layer);
  }

  /* ---------- Books → command center → fade to the section ---------- */
  // Clicking a book types a command on the monitor, then fades the page into the
  // matching section. The resume book still opens the PDF right away (a delayed
  // window.open would be blocked as a pop-up); the monitor just narrates it.
  // Reduced motion: the command prints instantly and the jump has no fade.
  function initBookTerminal() {
    var dyn = $('[data-term-dynamic]');
    if (!dyn) return;
    var cmdEl = $('[data-term-cmd]', dyn);
    var outEl = $('[data-term-out]', dyn);
    var IDLE = outEl.textContent;
    var COMMANDS = {
      '#about': ['cd ~/about-me && cat intro.md', '→ opening About me…'],
      '#superpowers': ['ls ~/skills --all', '→ loading Tech Superpowers…'],
      '#projects': ['open ~/projects', '→ opening Projects…']
    };
    var RESUME = ['open Annie-Wu-Resume.pdf', '→ opened in a new tab ↗'];
    var busy = false, timers = [];
    var fade = null;

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function type(text, done) {
      if (reducedMotion()) { cmdEl.textContent = text; done(); return; }
      var i = 0;
      (function step() {
        i++;
        cmdEl.textContent = text.slice(0, i);
        if (i < text.length) later(step, 24 + Math.random() * 34);
        else later(done, 200);
      })();
    }
    function run(cmd, out, then) {
      clearTimers();
      outEl.classList.remove('is-dim');
      outEl.textContent = '';
      cmdEl.textContent = '';
      type(cmd, function () {
        outEl.textContent = out;
        later(then, reducedMotion() ? 0 : 420);
      });
    }
    function backToIdle(delay) {
      busy = false; // the books work again right away; the screen tidies up a bit later
      later(function () {
        cmdEl.textContent = '';
        outEl.textContent = IDLE;
        outEl.classList.add('is-dim');
      }, delay);
    }

    function jumpTo(target, hash) {
      try { history.pushState(null, '', hash); } catch (e) { /* file:// etc. */ }
      var root = document.documentElement;
      var prev = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      target.scrollIntoView({ block: 'start' });
      root.style.scrollBehavior = prev;
      // Move keyboard / screen-reader focus to the section's heading.
      var h = target.querySelector('h2') || target;
      if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
    function fadeTo(hash, done) {
      var target = document.getElementById(hash.slice(1));
      if (!target) { done(); return; }
      if (reducedMotion()) { jumpTo(target, hash); done(); return; }
      if (!fade) {
        fade = document.createElement('div');
        fade.className = 'page-fade';
        fade.setAttribute('aria-hidden', 'true');
        document.body.appendChild(fade);
        void fade.offsetWidth;
      }
      fade.classList.add('is-on');
      later(function () {
        jumpTo(target, hash);
        target.classList.remove('is-entering');
        void target.offsetWidth;
        target.classList.add('is-entering');
        fade.classList.remove('is-on');
        later(function () { target.classList.remove('is-entering'); done(); }, 750);
      }, 400);
    }

    $all('a.book').forEach(function (book) {
      book.addEventListener('click', function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var href = book.getAttribute('href') || '';
        if (href.charAt(0) === '#') {
          e.preventDefault();
          if (busy) return;
          busy = true;
          var c = COMMANDS[href] || ['cd ' + href.slice(1), '→ opening…'];
          run(c[0], c[1], function () { fadeTo(href, function () { backToIdle(2500); }); });
        } else {
          // Let the browser open the PDF now. The visitor is about to switch tabs (where
          // timers get throttled), so the monitor prints the command instantly instead
          // of typing it; it's waiting there when they come back.
          if (busy) return;
          clearTimers();
          cmdEl.textContent = RESUME[0];
          outEl.classList.remove('is-dim');
          outEl.textContent = RESUME[1];
          backToIdle(6000);
        }
      });
    });
  }

  /* ---------- Field notes: flip cards ---------- */
  // Hovering the folded corner flips the card; moving off the card flips it back.
  // Clicking / tapping / Enter on the corner pins it (and unpins it).
  function initFlips() {
    $all('[data-flip]').forEach(function (card) {
      var flap = $('.flap', card);
      if (!flap) return;
      var pinned = false;
      function set(on) {
        card.classList.toggle('is-flipped', on);
        flap.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
      flap.addEventListener('mouseenter', function () { set(true); });
      card.addEventListener('mouseleave', function () { if (!pinned) set(false); });
      flap.addEventListener('click', function () { pinned = !pinned; set(pinned); });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && card.classList.contains('is-flipped')) { pinned = false; set(false); }
      });
    });
  }

  /* ---------- Mr. Oli's QA pop-up ---------- */
  // Appears once the visitor scrolls past the hero. Closing it shrinks it to a
  // small "!" square in the corner (it gives a little shake every 3 s); clicking
  // the "!" opens the report again. The minimized state lasts for this visit.
  function initQaToast() {
    var toast = $('#qa-toast');
    var bang = $('#qa-bang');
    var hero = $('.hero');
    if (!toast || !hero) return;
    var MIN_KEY = 'annie-portfolio:qa-toast-minimized';
    var session = null;
    try { session = window.sessionStorage; } catch (e) { session = null; }
    function remember(on) {
      try { if (session) { if (on) session.setItem(MIN_KEY, '1'); else session.removeItem(MIN_KEY); } } catch (e) { /* ignore */ }
    }
    var minimized = false;
    try { minimized = !!(session && session.getItem(MIN_KEY)); } catch (e) { minimized = false; }

    var remaining = 3;
    try {
      var saved = JSON.parse(store.get('annie-portfolio:playground-progress') || '{}');
      remaining = ['scanner', 'journal', 'robot'].filter(function (k) { return saved[k] !== true; }).length;
    } catch (e) { /* keep 3 */ }
    var countText = remaining === 1 ? '1 bug' : remaining + ' bugs';
    if (remaining === 0) {
      $('.qa-text', toast).textContent = 'All 3 bugs fixed. Mr. Oli approves. Thank you!';
      $('[data-qa-go]', toast).firstChild.textContent = 'Visit the playground ';
    } else {
      $('[data-qa-count]', toast).textContent = countText;
    }
    if (bang) {
      $('[data-bang-label]', bang).textContent = remaining === 0
        ? 'Open Mr. Oli’s QA report (all bugs fixed)'
        : 'Open Mr. Oli’s QA report (' + countText + ' to fix)';
      if (remaining === 0) bang.classList.add('is-calm');
    }

    var pastHero = false, teaserVisible = false;
    var peek = false, peekTimer = null, quietFocus = false;
    var timers = new WeakMap();
    function fade(node, show) {
      if (!node) return;
      clearTimeout(timers.get(node));
      if (show) {
        if (node.hidden) {
          node.hidden = false;
          requestAnimationFrame(function () { node.classList.add('is-visible'); });
        } else {
          node.classList.add('is-visible');
        }
      } else if (!node.hidden) {
        node.classList.remove('is-visible');
        timers.set(node, setTimeout(function () { node.hidden = true; }, reducedMotion() ? 0 : 260));
      }
    }
    function update() {
      var inPlay = pastHero && !teaserVisible;
      if (!inPlay) peek = false;
      toast.classList.toggle('is-peek', minimized && peek);
      fade(toast, inPlay && (!minimized || peek));
      fade(bang, inPlay && minimized);
    }
    // Hovering or focusing the "!" previews the report just above it.
    function setPeek(on) {
      clearTimeout(peekTimer);
      if (peek === on) return;
      peek = on;
      update();
    }
    function peekOffSoon() {
      clearTimeout(peekTimer);
      peekTimer = setTimeout(function () { setPeek(false); }, 300);
    }
    function minimize() {
      var hadFocus = toast.contains(document.activeElement);
      minimized = true;
      peek = false;
      remember(true);
      update();
      // Keep keyboard users oriented: focus moves to the "!" that replaced the pop-up
      // (without immediately re-opening the preview).
      if (hadFocus && bang) { quietFocus = true; bang.focus({ preventScroll: true }); quietFocus = false; }
    }
    function restore() {
      clearTimeout(peekTimer);
      peek = false;
      minimized = false;
      remember(false);
      update();
      var go = $('[data-qa-go]', toast);
      if (go) setTimeout(function () { go.focus({ preventScroll: true }); }, 30);
    }
    $('[data-qa-close]', toast).addEventListener('click', minimize);
    $('[data-qa-go]', toast).addEventListener('click', function () { setTimeout(minimize, 0); });
    toast.addEventListener('keydown', function (e) { if (e.key === 'Escape') minimize(); });
    if (bang) {
      bang.addEventListener('click', restore);
      bang.addEventListener('mouseenter', function () { setPeek(true); });
      bang.addEventListener('mouseleave', peekOffSoon);
      bang.addEventListener('focus', function () { if (!quietFocus) setPeek(true); });
      bang.addEventListener('blur', function (e) { if (!toast.contains(e.relatedTarget)) peekOffSoon(); });
      bang.addEventListener('keydown', function (e) { if (e.key === 'Escape') setPeek(false); });
    }
    toast.addEventListener('mouseenter', function () { if (minimized) clearTimeout(peekTimer); });
    toast.addEventListener('mouseleave', function () { if (minimized) peekOffSoon(); });
    toast.addEventListener('focusout', function (e) {
      if (minimized && !toast.contains(e.relatedTarget) && e.relatedTarget !== bang) peekOffSoon();
    });

    // "Past the hero" = the hero's bottom edge has moved above the middle of the screen.
    var ticking = false;
    function measure() {
      ticking = false;
      pastHero = hero.getBoundingClientRect().bottom < window.innerHeight * 0.5;
      var teaser = $('#playground');
      if (teaser) {
        var r = teaser.getBoundingClientRect();
        var visiblePx = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
        teaserVisible = visiblePx > Math.min(r.height, window.innerHeight) * 0.25;
      }
      update();
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(measure); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    measure();
  }

  /* ---------- Tech Superpowers carousel ---------- */
  // An endless strip: the cards are cloned once after the originals, and the
  // strip drifts slowly on its own, jumping back by one set-width when it passes
  // the end (the clones look identical, so the jump is invisible).
  // It keeps moving under a resting cursor. Any manual use (arrow buttons, ← / →
  // keys, swiping, sideways scrolling, dragging) pauses it and flips the button to
  // ▶ so the visitor can resume. Keyboard focus inside it holds it briefly.
  // Nothing is remembered: every page load starts at the first card, playing. There's a pause button
  // (WCAG 2.2.2), and it starts paused for prefers-reduced-motion.
  // ← / → work when focus is in the carousel, or when it's on screen and nothing
  // else (like a text field) has focus.
  function initCarousels() {
    $all('[data-carousel]').forEach(function (car) {
      var track = $('.carousel-track', car);
      var prev = $('[data-carousel-prev]', car);
      var next = $('[data-carousel-next]', car);
      var toggle = $('[data-carousel-toggle]', car);
      var bar = $('[data-carousel-progress]', car);
      if (!track || !prev || !next) return;
      var originals = Array.prototype.slice.call(track.children);
      if (!originals.length) return;

      originals.forEach(function (li) {
        var c = li.cloneNode(true);
        c.classList.add('is-clone');
        c.setAttribute('aria-hidden', 'true');
        c.setAttribute('inert', '');
        $all('[id]', c).forEach(function (n) { n.removeAttribute('id'); });
        $all('a, button, input, [tabindex]', c).forEach(function (n) { n.setAttribute('tabindex', '-1'); });
        track.appendChild(c);
      });
      car.classList.add('is-looping');

      var SPEED = 30;            // px per second
      var pos = 0, last = 0;
      var paused = reducedMotion();
      track.scrollLeft = 0; // browsers may restore an old scroll position on reload
      var hold = false;          // pointer over it, or focus inside it
      var idleUntil = 0;         // quiet period after the visitor scrolls it themselves
      var navUntil = 0;          // while a button/arrow animation is running
      var onScreen = true, mostlyOnScreen = false;

      function setWidth() { return track.children[originals.length].offsetLeft - originals[0].offsetLeft; }
      function stepSize() {
        var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        return originals[0].getBoundingClientRect().width + gap;
      }
      function now() { return performance.now(); }

      function go(dir) {
        var w = setWidth(), s = stepSize();
        var cur = track.scrollLeft;
        if (cur >= w) { cur -= w; track.scrollLeft = cur; }
        var target = (Math.round(cur / s) + dir) * s;
        if (target < 0) { track.scrollLeft = cur + w; target += w; }
        navUntil = now() + 800;
        pause();
        track.scrollTo({ left: target, behavior: reducedMotion() ? 'auto' : 'smooth' });
      }

      function sync() {
        var w = setWidth();
        if (!w) return;
        // Visitor swiped past the originals: hop back to the identical spot.
        if (now() > navUntil && track.scrollLeft >= w) track.scrollLeft -= w;
        if (bar) {
          bar.style.width = Math.min(100, track.clientWidth / w * 100) + '%';
          bar.style.marginLeft = ((track.scrollLeft % w) / w * 100) + '%';
        }
      }

      function tick(t) {
        requestAnimationFrame(tick);
        var dt = last ? Math.min(t - last, 64) : 0;
        last = t;
        if (paused || hold || !onScreen || t < idleUntil) { pos = track.scrollLeft; return; }
        var w = setWidth();
        if (!w) return;
        pos += SPEED * dt / 1000;
        if (pos >= w) pos -= w;
        track.scrollLeft = pos;
      }

      function pause() {
        if (paused) return;
        paused = true;
        renderToggle();
      }

      function renderToggle() {
        if (!toggle) return;
        $('[data-toggle-icon]', toggle).textContent = paused ? '▶' : '❚❚';
        $('[data-toggle-label]', toggle).textContent = paused ? 'Play auto-scroll' : 'Pause auto-scroll';
      }

      prev.addEventListener('click', function () { go(-1); });
      next.addEventListener('click', function () { go(1); });
      if (toggle) toggle.addEventListener('click', function () { paused = !paused; idleUntil = 0; renderToggle(); });

      car.addEventListener('focusin', function (e) {
        // Mouse clicks on the buttons shouldn't freeze it; keyboard focus should.
        if (!e.target.matches || !e.target.matches(':focus-visible')) return;
        hold = true;
      });
      car.addEventListener('focusout', function (e) { if (!car.contains(e.relatedTarget)) hold = false; });
      track.addEventListener('touchstart', pause, { passive: true });
      track.addEventListener('wheel', function (e) {
        // Only sideways swipes count; scrolling the page past it shouldn't pause it.
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) pause();
      }, { passive: true });
      track.addEventListener('pointerdown', pause);
      track.addEventListener('scroll', sync, { passive: true });
      window.addEventListener('resize', sync);

      document.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
        var a = document.activeElement;
        if (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable)) return;
        var neutral = !a || a === document.body || a === document.documentElement || a.id === 'main';
        if (!car.contains(a) && !(neutral && mostlyOnScreen)) return;
        e.preventDefault();
        go(e.key === 'ArrowLeft' ? -1 : 1);
      });

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            onScreen = en.isIntersecting;
            mostlyOnScreen = en.intersectionRatio >= 0.5;
          });
        }, { threshold: [0, 0.5, 1] }).observe(car);
      }

      window.addEventListener('pageshow', function (e) {
        if (!e.persisted) return;
        paused = reducedMotion(); pos = 0; track.scrollLeft = 0; renderToggle();
      });

      renderToggle();
      sync();
      requestAnimationFrame(tick);
    });
  }

  /* ---------- playground progress ---------- */

  /* Which scenarios the visitor has fixed. Remembered in this browser so the
     playground hub and the step chips on every page agree. */
  function createProgress() {
    var KEY = 'annie-portfolio:playground-progress';
    var fixed = { scanner: false, journal: false, robot: false };
    try {
      var saved = JSON.parse(store.get(KEY) || '{}');
      Object.keys(fixed).forEach(function (k) { fixed[k] = saved[k] === true; });
    } catch (e) { /* ignore bad data */ }

    function render() {
      var n = 0;
      Object.keys(fixed).forEach(function (k) {
        if (fixed[k]) n++;
        $all('[data-chip="' + k + '"]').forEach(function (chip) {
          chip.classList.toggle('is-fixed', fixed[k]);
          var state = $('[data-chip-state]', chip);
          if (state) state.textContent = fixed[k] ? ' (fixed)' : ' (not fixed yet)';
        });
        $all('[data-status="' + k + '"]').forEach(function (badge) {
          badge.textContent = fixed[k] ? 'Fixed ✓' : 'Not fixed yet';
          badge.classList.toggle('is-fixed', fixed[k]);
        });
      });
      $all('[data-fixed-count]').forEach(function (c) { c.textContent = String(n); });
    }
    render();
    return {
      set: function (name, value) {
        if (fixed[name] === !!value) return;
        fixed[name] = !!value;
        store.set(KEY, JSON.stringify(fixed));
        render();
      }
    };
  }

  /* =========================================================
     Scenario A — "The scanner has déjà vu."
     Rule "dedupe": a detection is accepted only if the same tag
     has no accepted entry within the last WINDOW_MS milliseconds.
     ========================================================= */

  function initScanner(root, progress) {
    var WINDOW_MS = 2000;
    var STUTTER_GAP_MS = 150;
    var TAGS = [
      { id: 'TAG-04A7', name: 'Water bottle', icon: 'icon-bottle' },
      { id: 'TAG-19C2', name: 'Trail map', icon: 'icon-map' },
      { id: 'TAG-7F31', name: 'Soccer ball', icon: 'icon-ball' }
    ];
    var RULE_LABEL = { every: 'Record every scan', dedupe: 'Ignore repeats within 2 s' };

    var tagList = $('[data-tag-list]', root);
    var rawLog = $('[data-raw-log]', root);
    var invLog = $('[data-inv-log]', root);
    var rawCount = $('[data-raw-count]', root);
    var invCount = $('[data-inv-count]', root);
    var tape = $('[data-tape]', root);
    var shelf = $('[data-shelf]', root);
    var shelfMore = $('[data-shelf-more]', root);
    var item = $('[data-item]', root);
    var itemSlot = $('[data-item-slot]', root);
    var itemLabel = $('[data-item-label]', root);
    var waves = $('[data-waves]', root);
    var led = $('[data-led]', root);
    var readout = $('[data-readout]', root);
    var sceneDesc = $('[data-scene-desc]', root);
    var compare = $('[data-compare]', root);
    var feedback = $('[data-feedback]', root);
    var ruleInputs = $all('input[name="scanner-rule"]', root);

    // Build the tag picker
    tagList.classList.add('tag-options');
    TAGS.forEach(function (tag, i) {
      var label = el('label', 'radio');
      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'scanner-tag';
      input.value = tag.id;
      if (i === 0) input.checked = true;
      var span = el('span');
      span.appendChild(el('strong', null, tag.name));
      span.appendChild(el('small', null, tag.id));
      label.appendChild(input);
      label.appendChild(document.createTextNode(' '));
      label.appendChild(span);
      tagList.appendChild(label);
      input.addEventListener('change', showItem);
    });

    var LED = { idle: '#6E7F76', ok: '#7FC77A', ignored: '#E9A27B' };
    var TAPE_MAX = 15, SHELF_COLS = 4, SHELF_ROWS = 3;
    var state, timers = [], flashTimer = null;

    /** Put the selected object on the scanning pad. */
    function showItem() {
      var tag = currentTag();
      clear(itemSlot);
      itemSlot.appendChild(svgUse(tag.icon, { x: 0, y: 0, width: 84, height: 84 }));
      itemLabel.textContent = tag.id;
    }

    function freshState() {
      return {
        rule: 'every',
        t0: null,
        detections: 0,
        raw: [],         // {n, t, tag, accepted, entryNo, reason, ruleBreak}
        entries: [],      // {n, t, tag, dupeOf}
        lastAccepted: {}, // tagId -> timestamp (ms)
        stats: { every: { det: 0, ent: 0, tags: {} }, dedupe: { det: 0, ent: 0, tags: {} } },
        segIgnored: 0     // duplicates ignored since the dedupe rule was last switched on
      };
    }

    function currentTag() {
      var checked = $('input[name="scanner-tag"]:checked', root);
      var id = checked ? checked.value : TAGS[0].id;
      for (var i = 0; i < TAGS.length; i++) if (TAGS[i].id === id) return TAGS[i];
      return TAGS[0];
    }

    function secs(ms) { return (ms / 1000).toFixed(2) + ' s'; }

    /** The actual rule. Returns {accepted, reason}. */
    function decide(tag, now) {
      var last = state.lastAccepted[tag.id];
      var gap = last === undefined ? null : now - last;
      if (state.rule === 'dedupe' && gap !== null && gap < WINDOW_MS) {
        return { accepted: false, reason: 'ignored: same tag ' + secs(gap) + ' after its last entry (< 2.00 s)' };
      }
      return { accepted: true, gap: gap };
    }

    function detect(tag) {
      var now = performance.now();
      if (state.t0 === null) state.t0 = now;
      var t = now - state.t0;
      var d = decide(tag, now);
      var s = state.stats[state.rule];
      s.det++;
      s.tags[tag.id] = true;

      state.detections++;
      var rawItem = { n: state.detections, t: t, tag: tag, accepted: d.accepted, reason: d.reason };
      if (d.accepted) {
        var entry = {
          n: state.entries.length + 1, t: t, tag: tag,
          // In "record every scan" mode, flag entries that are visibly the same object again
          dupeOf: d.gap !== null && d.gap < WINDOW_MS
        };
        state.entries.push(entry);
        state.lastAccepted[tag.id] = now;
        rawItem.entryNo = entry.n;
        s.ent++;
      } else {
        state.segIgnored++;
      }
      state.raw.push(rawItem);
      flash(d.accepted, tag);
    }

    function flash(accepted, tag) {
      if (reducedMotion()) {
        waves.classList.add('is-static-on'); // brief, motion-free signal
      } else {
        pulse(item, 'is-scanning');
        pulse(waves, 'is-on');
      }
      led.setAttribute('fill', accepted ? LED.ok : LED.ignored);
      readout.textContent = accepted ? 'RECORDED' : 'IGNORED';
      clearTimeout(flashTimer);
      flashTimer = setTimeout(function () {
        led.setAttribute('fill', LED.idle);
        readout.textContent = 'READY';
        waves.classList.remove('is-static-on');
      }, 700);
    }

    /** Draw the detection tape and the inventory shelf from state. */
    function renderScene() {
      // Tape: newest detections on the right; a dashed post marks a rule change.
      clear(tape);
      var recent = state.raw.slice(-TAPE_MAX);
      var x = 0;
      recent.forEach(function (r) {
        if (r.ruleBreak) {
          tape.appendChild(svg('line', { x1: x + 2, y1: -4, x2: x + 2, y2: 18, class: 'tape-break' }));
          x += 8;
          return;
        }
        var g = svg('g', { transform: 'translate(' + x + ' 0)', class: r.accepted ? 'tape-ok' : 'tape-ignored' });
        g.appendChild(svg('rect', { width: 14, height: 14, rx: 1 }));
        if (!r.accepted) g.appendChild(svg('path', { d: 'M3 3l8 8M11 3l-8 8' }));
        tape.appendChild(g);
        x += 18;
      });

      // Shelf: one icon per inventory entry; repeats get a warning badge.
      clear(shelf);
      var total = state.entries.length;
      var cap = SHELF_COLS * SHELF_ROWS;
      var shown = state.entries.slice(Math.max(0, total - cap));
      shown.forEach(function (e, i) {
        var col = i % SHELF_COLS, row = Math.floor(i / SHELF_COLS);
        var g = svg('g', { transform: 'translate(' + (col * 40) + ' ' + (row * 52) + ')', class: 'shelf-item' + (e.dupeOf ? ' is-dupe' : '') });
        g.appendChild(svg('rect', { x: -2, y: -2, width: 38, height: 38, rx: 3, class: 'shelf-slot' }));
        g.appendChild(svgUse(e.tag.icon, { x: 1, y: 1, width: 32, height: 32 }));
        if (e.dupeOf) {
          g.appendChild(svg('circle', { cx: 33, cy: 1, r: 7, class: 'dupe-badge' }));
          g.appendChild(svg('text', { x: 33, y: 5, 'text-anchor': 'middle', class: 'dupe-mark' }, '!'));
        }
        shelf.appendChild(g);
      });
      shelfMore.textContent = total > cap ? '+' + (total - cap) + ' earlier' : '';

      sceneDesc.textContent = state.detections
        ? plural(state.detections, 'detection') + ' so far; ' + plural(total, 'inventory entry', 'inventory entries') + ' on the shelf.'
        : 'No scans yet. The shelf is empty.';
    }

    function render() {
      clear(rawLog);
      clear(invLog);
      rawCount.textContent = String(state.detections);
      invCount.textContent = String(state.entries.length);

      if (!state.detections) rawLog.appendChild(el('li', 'log-empty', 'No detections yet.'));
      if (!state.entries.length) invLog.appendChild(el('li', 'log-empty', 'No entries yet.'));

      // newest first, with rule-change markers
      for (var i = state.raw.length - 1; i >= 0; i--) {
        var r = state.raw[i];
        if (r.ruleBreak) {
          rawLog.appendChild(el('li', 'log-empty', '— rule changed to “' + RULE_LABEL[r.ruleBreak] + '” —'));
          continue;
        }
        var li = el('li', r.accepted ? 'ok' : 'ignored');
        li.appendChild(document.createTextNode('#' + r.n + ' · +' + secs(r.t) + ' · ' + r.tag.id));
        li.appendChild(el('span', 'verdict', r.accepted ? '→ recorded as entry ' + r.entryNo : '→ ' + r.reason));
        rawLog.appendChild(li);
      }
      for (var j = state.entries.length - 1; j >= 0; j--) {
        var e = state.entries[j];
        var item = el('li', e.dupeOf ? 'dupe' : 'ok');
        item.appendChild(document.createTextNode('Entry ' + e.n + ' · ' + e.tag.name));
        item.appendChild(el('span', 'verdict', e.tag.id + ' · +' + secs(e.t) + (e.dupeOf ? ' · same object again!' : '')));
        invLog.appendChild(item);
      }

      var rows = ['every', 'dedupe'].map(function (rule) {
        var s = state.stats[rule];
        var objects = Object.keys(s.tags).length;
        return {
          label: RULE_LABEL[rule],
          current: rule === state.rule,
          value: s.det ? plural(s.det, 'detection') + ' → ' + plural(s.ent, 'entry', 'entries') + ' for ' + plural(objects, 'object') : ''
        };
      });
      renderCompare(compare, 'Before and after', rows);
      renderScene();
    }

    function updateFeedback() {
      var fixed = false;
      if (state.rule === 'every') {
        var dupes = state.entries.filter(function (e) { return e.dupeOf; }).length;
        if (dupes > 0) {
          setFeedback(feedback, 'bug', 'Déjà vu: ' + plural(state.entries.length, 'inventory entry', 'inventory entries') + ', ' + plural(dupes, 'of them a repeat', 'of them repeats') + '.',
            'Every detection becomes an entry, so one object lingering at the reader is counted again. Try switching the rule to “Ignore repeats within 2 seconds”.');
        } else if (state.detections) {
          setFeedback(feedback, 'info', 'Recorded.', 'Now scan the same tag again quickly, or press “Reader stutter”.');
        }
      } else {
        if (state.segIgnored > 0) {
          fixed = true;
          var s = state.stats.dedupe;
          setFeedback(feedback, 'fixed', 'One object. One inventory entry. A little validation goes a long way.',
            'Under the new rule the reader saw ' + plural(s.det, 'detection') + ' and recorded ' + plural(s.ent, 'entry', 'entries') + '; ' +
            plural(state.segIgnored, 'repeat was', 'repeats were') + ' ignored.');
        } else {
          setFeedback(feedback, 'info', 'New rule active: repeats of the same tag within 2 seconds are ignored.',
            'Scan the same tag twice quickly, or press “Reader stutter”, to test it. A different tag, or the same tag after 2 seconds, still gets recorded.');
        }
      }
      progress.set('scanner', fixed);
    }

    function scan(times) {
      var tag = currentTag();
      detect(tag);
      render();
      if (times > 1) {
        // A stuttering reader: extra detections a moment apart, then one status update.
        for (var k = 1; k < times; k++) {
          (function (delay, last) {
            timers.push(setTimeout(function () {
              detect(tag);
              render();
              if (last) updateFeedback();
            }, delay));
          })(k * STUTTER_GAP_MS, k === times - 1);
        }
      } else {
        updateFeedback();
      }
    }

    function reset(initial) {
      timers.forEach(clearTimeout);
      timers = [];
      clearTimeout(flashTimer);
      led.setAttribute('fill', LED.idle);
      readout.textContent = 'READY';
      state = freshState();
      ruleInputs.forEach(function (input) { input.checked = input.value === 'every'; });
      var first = $('input[name="scanner-tag"]', root);
      if (first) first.checked = true;
      showItem();
      render();
      setFeedback(feedback, '', '');
      // A fresh page load starts buggy but keeps the visitor's earlier progress.
      if (initial !== true) progress.set('scanner', false);
    }

    ruleInputs.forEach(function (input) {
      input.addEventListener('change', function () {
        if (!input.checked || input.value === state.rule) return;
        state.rule = input.value;
        state.segIgnored = 0;
        if (state.raw.length) state.raw.push({ ruleBreak: input.value });
        render();
        updateFeedback();
      });
    });

    $('[data-action="scan"]', root).addEventListener('click', function () { scan(1); });
    $('[data-action="stutter"]', root).addEventListener('click', function () { scan(3); });
    $('[data-action="reset"]', root).addEventListener('click', function () { reset(); });

    reset(true);
  }

  /* =========================================================
     Scenario B — "The trail journal forgot the hike."
     Temporary mode keeps hikes in a JS variable only.
     Persistent mode writes JSON to localStorage under demo-specific keys.
     ========================================================= */

  function initJournal(root, progress) {
    var KEY = 'annie-portfolio:debug-journal:v1';
    var MODE_KEY = 'annie-portfolio:debug-journal:mode';
    var MAX_HIKES = 12;
    var MAX_NAME = 48;
    var CLOSE_MS = 700;
    var SUGGESTIONS = [
      ['Mossy Switchback Loop', '4.2'],
      ['Sleepy Cedar Trail', '6.8'],
      ['Pocket Lake Ramble', '3.1'],
      ['Fern Gully Steps', '5.5'],
      ['Little Fog Saddle', '9.4'],
      ['Salal Hollow Walk', '2.7']
    ];
    var MODE_LABEL = { temporary: 'Temporary memory', persistent: 'Save to this browser' };

    var form = $('[data-journal-form]', root);
    var trailInput = $('[data-trail-input]', root);
    var kmInput = form.elements.km;
    var formError = $('[data-form-error]', root);
    var list = $('[data-journal-list]', root);
    var scene = $('[data-journal-scene]', root);
    var journalState = $('[data-journal-state]', root);
    var pageLines = $('[data-page-lines]', root);
    var cloudText = $('[data-cloud-text]', root);
    var cloudDots = $('[data-cloud-dots]', root);
    var chestCount = $('[data-chest-count]', root);
    var pipeLabel = $('[data-pipe-label]', root);
    var modeNote = $('[data-mode-note]', root);
    var sceneDesc = $('[data-scene-desc]', root);
    var storageView = $('[data-storage-view]', root);
    var storageWarning = $('[data-storage-warning]', root);
    var persistentRadio = $('[data-persistent-radio]', root);
    var modeInputs = $all('input[name="journal-mode"]', root);
    var reopenBtn = $('[data-action="reopen"]', root);
    var compare = $('[data-compare]', root);
    var feedback = $('[data-feedback]', root);

    var memory = [];          // the open journal's in-memory entries
    var mode = 'temporary';
    var busy = false;
    var closeTimer = null;
    var suggestIndex = 0;
    var lastReopen = { temporary: null, persistent: null };

    /* --- storage access, all guarded (see `store`) --- */
    var storageOK = store.ok;
    function readRaw(key) { return store.get(key); }
    function write(key, value) { return store.set(key, value); }
    function remove(key) { store.remove(key); }

    /** Parse and validate stored data. Anything malformed is dropped, never rendered as markup. */
    function load() {
      var raw = readRaw(KEY);
      if (!raw) return { hikes: [], corrupt: false };
      try {
        var data = JSON.parse(raw);
        var hikes = (data && Array.isArray(data.hikes)) ? data.hikes : [];
        var clean = [];
        hikes.forEach(function (h) {
          if (!h || typeof h.name !== 'string') return;
          var name = h.name.trim().slice(0, MAX_NAME);
          if (!name) return;
          var km = (typeof h.km === 'number' && isFinite(h.km) && h.km > 0 && h.km < 100) ? Math.round(h.km * 10) / 10 : null;
          clean.push({ name: name, km: km });
        });
        return { hikes: clean.slice(0, MAX_HIKES), corrupt: false };
      } catch (e) {
        return { hikes: [], corrupt: true };
      }
    }

    function save() {
      return write(KEY, JSON.stringify({ version: 1, hikes: memory }));
    }

    /* --- rendering --- */
    function render() {
      clear(list);
      if (!memory.length) {
        list.appendChild(el('li', 'log-empty', 'No hikes logged yet.'));
      } else {
        memory.forEach(function (h) {
          var li = el('li');
          li.appendChild(el('span', null, h.name));
          li.appendChild(el('span', 'km', h.km !== null ? h.km.toFixed(1) + ' km' : '—'));
          list.appendChild(li);
        });
      }
      if (!storageOK) {
        storageView.textContent = '(storage is unavailable in this browser)';
      } else {
        var raw = readRaw(KEY);
        if (!raw) {
          storageView.textContent = '(nothing stored)';
        } else {
          try { storageView.textContent = JSON.stringify(JSON.parse(raw), null, 1); }
          catch (e) { storageView.textContent = raw; }
        }
      }
      renderScene();
      renderCompare(compare, 'Last close-and-reopen', ['temporary', 'persistent'].map(function (m) {
        var r = lastReopen[m];
        return {
          label: MODE_LABEL[m],
          current: m === mode,
          value: r ? plural(r.before, 'hike') + ' before closing → ' + plural(r.after, 'hike') + ' after reopening' : ''
        };
      }));
    }

    function storedCount() {
      var raw = readRaw(KEY);
      if (!raw) return 0;
      try { var d = JSON.parse(raw); return d && Array.isArray(d.hikes) ? d.hikes.length : 0; } catch (e) { return 0; }
    }

    function shorten(text, max) { return text.length > max ? text.slice(0, max - 1) + '…' : text; }

    /** Draw the notebook pages, the memory cloud, and the storage chest. */
    function renderScene() {
      clear(pageLines);
      if (!memory.length) {
        pageLines.appendChild(svg('text', { x: 52, y: 126, class: 'page-empty' }, '(no hikes yet)'));
      }
      memory.forEach(function (h, i) {
        var left = i < 6;
        var y = 126 + (i % 6) * 22;
        var x0 = left ? 52 : 200, x1 = left ? 176 : 324;
        pageLines.appendChild(svg('text', { x: x0, y: y, class: 'page-entry' }, shorten(h.name, h.km !== null ? 12 : 18)));
        if (h.km !== null) pageLines.appendChild(svg('text', { x: x1, y: y, 'text-anchor': 'end', class: 'page-km' }, h.km.toFixed(1) + ' km'));
      });

      cloudText.textContent = 'in memory: ' + plural(memory.length, 'hike');
      clear(cloudDots);
      for (var d = 0; d < Math.min(memory.length, 12); d++) {
        cloudDots.appendChild(svg('rect', { x: d * 11, y: 0, width: 8, height: 8, rx: 1 }));
      }

      var persistent = mode === 'persistent';
      scene.classList.toggle('is-persistent', persistent);
      scene.classList.toggle('is-blocked', !storageOK);
      pipeLabel.textContent = !storageOK ? 'blocked' : (persistent ? 'saving' : 'not saving');
      modeNote.textContent = persistent ? 'save to browser' : 'temporary';
      var n = storageOK ? storedCount() : 0;
      chestCount.textContent = !storageOK ? 'locked' : (n ? n + ' saved' : 'empty');

      sceneDesc.textContent = 'The journal shows ' + plural(memory.length, 'hike') + '. ' +
        (storageOK ? 'This browser’s storage holds ' + plural(n, 'saved hike') + '. ' : 'This browser blocks storage. ') +
        (persistent ? 'The journal is saving to storage.' : 'The journal is not saving.');
    }

    function setMode(next, opts) {
      mode = next;
      modeInputs.forEach(function (i) { i.checked = i.value === next; });
      if (!opts || !opts.silent) write(MODE_KEY, next);
    }

    /* --- actions --- */
    function addHike(e) {
      e.preventDefault();
      if (busy) return;
      var name = trailInput.value.replace(/\s+/g, ' ').trim();
      var kmText = String(kmInput.value || '').trim();
      var km = null;
      var problem = '';

      if (!name) problem = 'Give the hike a name first.';
      else if (name.length > MAX_NAME) problem = 'Keep the name under ' + MAX_NAME + ' characters.';
      else if (kmText) {
        km = Number(kmText);
        if (!isFinite(km) || km < 0.1 || km > 99) problem = 'Distance should be between 0.1 and 99 km, or left blank.';
        else km = Math.round(km * 10) / 10;
      }
      if (!problem && memory.length >= MAX_HIKES) problem = 'This little journal holds ' + MAX_HIKES + ' hikes. Reset the demo to start over.';

      if (problem) {
        formError.textContent = problem;
        formError.hidden = false;
        trailInput.setAttribute('aria-invalid', name ? 'false' : 'true');
        trailInput.setAttribute('aria-describedby', 'journal-form-error');
        formError.id = 'journal-form-error';
        (name ? kmInput : trailInput).focus();
        return;
      }
      formError.hidden = true;
      trailInput.removeAttribute('aria-invalid');
      trailInput.removeAttribute('aria-describedby');

      memory.push({ name: name, km: km });
      var saved = mode === 'persistent' ? save() : null;
      form.reset();
      render();

      if (saved === false) {
        setFeedback(feedback, 'bug', 'Couldn’t write to storage.',
          'The browser refused to save (storage may be full or blocked), so this hike exists only in temporary memory.');
      } else if (mode === 'persistent') {
        setFeedback(feedback, 'info', 'Logged “' + name + '” and saved it to this browser.', 'Now press “Close and reopen journal”.');
      } else {
        setFeedback(feedback, 'info', 'Logged “' + name + '”.', 'Now press “Close and reopen journal” and see what the journal remembers.');
      }
    }

    function reopen() {
      if (busy) return;
      busy = true;
      reopenBtn.setAttribute('aria-disabled', 'true');
      var before = memory.length;
      journalState.textContent = 'closed';
      journalState.classList.add('is-closed');
      scene.classList.add('is-closed');
      if (mode === 'temporary') scene.classList.add('is-poof');

      closeTimer = setTimeout(function () {
        // "Closing the app": in-memory state is gone. Reopening rebuilds it from scratch.
        memory = [];
        var corrupt = false;
        if (mode === 'persistent') {
          var loaded = load();
          memory = loaded.hikes;
          corrupt = loaded.corrupt;
        }
        var after = memory.length;
        lastReopen[mode] = { before: before, after: after };

        scene.classList.remove('is-closed', 'is-poof');
        journalState.textContent = 'open';
        journalState.classList.remove('is-closed');
        busy = false;
        reopenBtn.removeAttribute('aria-disabled');
        render();

        var fixed = false;
        if (corrupt) {
          setFeedback(feedback, 'bug', 'The stored journal was unreadable, so it was safely ignored.', 'Reset the demo to clear it.');
        } else if (mode === 'temporary') {
          if (before > 0) {
            setFeedback(feedback, 'bug', 'Reopened… and the journal is empty. ' + plural(before, 'hike was', 'hikes were') + ' forgotten.',
              storageOK
                ? 'Temporary memory doesn’t survive closing. Switch to “Save to this browser”, log a hike, and reopen again.'
                : 'Temporary memory doesn’t survive closing. Your browser is blocking storage, so the persistent fix can’t run here.');
          } else {
            setFeedback(feedback, 'info', 'Reopened an empty journal.', 'Log a hike first so there’s something to remember (or forget).');
          }
        } else {
          if (after > 0 && after >= before) {
            fixed = true;
            setFeedback(feedback, 'fixed', 'The walk is over. The memory stays.',
              plural(after, 'hike was', 'hikes were') + ' read back from localStorage after reopening. They’ll even survive a full page reload.');
          } else if (before > 0) {
            setFeedback(feedback, 'bug', 'Some hikes didn’t come back.', 'The browser may have refused to save them.');
          } else {
            setFeedback(feedback, 'info', 'Reopened an empty journal.', 'Log a hike in this mode, then close and reopen again.');
          }
        }
        progress.set('journal', fixed);
      }, reducedMotion() ? 0 : CLOSE_MS);
      if (!reducedMotion()) renderSceneClosed();
    }

    /** While the book is closed, the in-memory cloud empties in temporary mode. */
    function renderSceneClosed() {
      if (mode === 'temporary') {
        cloudText.textContent = 'in memory: (gone)';
        clear(cloudDots);
      }
    }

    function onModeChange(input) {
      if (!input.checked || input.value === mode) return;
      if (input.value === 'persistent' && !storageOK) { setMode('temporary', { silent: true }); return; }
      setMode(input.value);
      if (mode === 'persistent') {
        var ok = save();
        render();
        setFeedback(feedback, ok ? 'info' : 'bug',
          ok ? 'Now saving to this browser.' : 'Couldn’t write to storage.',
          ok ? (memory.length ? 'Your ' + plural(memory.length, 'current hike was', 'current hikes were') + ' written to storage. Close and reopen to test it.'
                              : 'Log a hike, then close and reopen the journal.')
             : 'The browser refused to save, so the journal can’t persist here.');
      } else {
        render();
        progress.set('journal', false);
        setFeedback(feedback, 'info', 'Back to temporary memory.', 'Anything already stored stays put until you reset, but this mode won’t read it when reopening.');
      }
    }

    function reset() {
      clearTimeout(closeTimer);
      busy = false;
      reopenBtn.removeAttribute('aria-disabled');
      scene.classList.remove('is-closed', 'is-poof');
      journalState.textContent = 'open';
      journalState.classList.remove('is-closed');
      remove(KEY);
      remove(MODE_KEY);
      memory = [];
      lastReopen = { temporary: null, persistent: null };
      setMode('temporary', { silent: true });
      form.reset();
      formError.hidden = true;
      trailInput.removeAttribute('aria-invalid');
      render();
      setFeedback(feedback, '', '');
      progress.set('journal', false);
    }

    /* --- wire up --- */
    form.addEventListener('submit', addHike);
    reopenBtn.addEventListener('click', reopen);
    $('[data-action="suggest"]', root).addEventListener('click', function () {
      var s = SUGGESTIONS[suggestIndex % SUGGESTIONS.length];
      suggestIndex++;
      trailInput.value = s[0];
      kmInput.value = s[1];
      formError.hidden = true;
    });
    $('[data-action="reset"]', root).addEventListener('click', reset);
    modeInputs.forEach(function (input) {
      input.addEventListener('change', function () { onModeChange(input); });
    });

    if (!storageOK) {
      persistentRadio.disabled = true;
      storageWarning.hidden = false;
      storageWarning.textContent = 'Your browser is blocking storage (for example, a private window or strict privacy settings), so the “Save to this browser” fix can’t be demonstrated here. Everything else on the page works normally.';
    }

    // Restore a journal saved on a previous visit — real persistence across page loads.
    var savedMode = readRaw(MODE_KEY);
    if (storageOK && savedMode === 'persistent') {
      setMode('persistent', { silent: true });
      var loaded = load();
      memory = loaded.hikes;
      render();
      if (memory.length) {
        setFeedback(feedback, 'fixed', 'The walk is over. The memory stays.',
          'Welcome back: ' + plural(memory.length, 'hike', 'hikes') + ' from your earlier visit came back from localStorage. “Reset this demo” clears it.');
        progress.set('journal', true);
      }
    } else {
      setMode('temporary', { silent: true });
      render();
    }
  }

  /* =========================================================
     Scenario C — "Everyone deserves a turn."
     A scripted selection rule. Not a language model.
     ========================================================= */

  function initRobot(root, progress) {
    var PLAYERS = [
      { name: 'Juniper', seat: 1 },
      { name: 'Ollie', seat: 2 },
      { name: 'Sam', seat: 3 }
    ];
    var QUESTIONS = [
      'how many players does each team have on the field?',
      'how long is a regular-time soccer match?',
      'what do you call it when one player scores three goals in a game?',
      'which players are allowed to handle the ball inside their own penalty area?',
      'what colour card sends a player off?',
      'how many points is a win worth in most league tables?'
    ];
    var RULE_LABEL = { first: 'Always pick Seat 1', fair: 'Fewest turns first' };
    // Gaze toward each seat: head tilt (deg) and eye offset (x, y)
    var GAZE = [
      { rot: -14, ex: -6, ey: 4 },
      { rot: 0, ex: 0, ey: 6 },
      { rot: 14, ex: 6, ey: 4 }
    ];
    var STEP_MS = 320;

    var toggles = $('[data-player-toggles]', root);
    var bars = $('[data-turn-bars]', root);
    var speech = $('[data-speech]', root);
    var head = $('[data-robot-head]', root);
    var eyes = $('[data-robot-eyes]', root);
    var compare = $('[data-compare]', root);
    var feedback = $('[data-feedback]', root);
    var ruleInputs = $all('input[name="robot-rule"]', root);
    var seats = $all('[data-seat]', root);
    var turnBtn = $('[data-action="turn"]', root);
    var turnsBtn = $('[data-action="turns"]', root);

    var state, timers = [], busy = false;

    function freshState() {
      return {
        rule: 'first',
        present: [true, true, true],
        turns: [0, 0, 0],
        lastTurn: [-1, -1, -1],   // turn number of each player's last turn (-1 = never)
        turnNo: 0,
        byRule: { first: { turns: [0, 0, 0], empty: 0, total: 0 }, fair: { turns: [0, 0, 0], empty: 0, total: 0 } },
        since: { total: 0, picked: [false, false, false] }, // since the current rule was chosen
        lastPick: null
      };
    }

    // Player toggles
    PLAYERS.forEach(function (p, i) {
      var label = el('label', 'check');
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = true;
      input.setAttribute('data-present', String(i));
      var span = el('span');
      span.appendChild(el('strong', null, p.name + ' · Seat ' + p.seat));
      span.appendChild(el('small', null, 'At the table'));
      label.appendChild(input);
      label.appendChild(document.createTextNode(' '));
      label.appendChild(span);
      toggles.appendChild(label);
      input.addEventListener('change', function () {
        state.present[i] = input.checked;
        $('small', label).textContent = input.checked ? 'At the table' : 'Stepped away';
        render();
      });
    });

    /** The selection rule. Returns a player index, or -1 if nobody can be chosen. */
    function pick() {
      if (state.rule === 'first') return 0; // the bug: constant, ignores everything
      var eligible = [];
      for (var i = 0; i < PLAYERS.length; i++) if (state.present[i]) eligible.push(i);
      if (!eligible.length) return -1;
      eligible.sort(function (a, b) {
        if (state.turns[a] !== state.turns[b]) return state.turns[a] - state.turns[b];   // fewest turns
        if (state.lastTurn[a] !== state.lastTurn[b]) return state.lastTurn[a] - state.lastTurn[b]; // waited longest
        return a - b;                                                                     // lowest seat
      });
      return eligible[0];
    }

    function runTurn() {
      var idx = pick();
      var r = state.byRule[state.rule];
      if (idx === -1) {
        state.lastPick = { idx: -1 };
        speech.textContent = 'Nobody’s at the table, so I’ll wait. (The fair rule never asks an empty seat.)';
        return;
      }
      var q = QUESTIONS[state.turnNo % QUESTIONS.length];
      state.turnNo++;
      r.total++;
      state.since.total++;
      if (!state.present[idx]) {
        // Seat 1 is empty, but the buggy rule asks anyway.
        r.empty++;
        state.lastPick = { idx: idx, empty: true };
        speech.textContent = 'Seat 1, ' + q + ' … Seat 1? (Nobody is sitting there.)';
      } else {
        state.turns[idx]++;
        r.turns[idx]++;
        state.lastTurn[idx] = state.turnNo;
        state.since.picked[idx] = true;
        state.lastPick = { idx: idx, empty: false };
        speech.textContent = PLAYERS[idx].name + ', ' + q;
      }
    }

    function render() {
      // seats + gaze
      seats.forEach(function (s, i) {
        s.classList.toggle('is-away', !state.present[i]);
        var lp = state.lastPick;
        s.classList.toggle('is-picked', !!(lp && lp.idx === i && !lp.empty));
        s.classList.toggle('is-empty-picked', !!(lp && lp.idx === i && lp.empty));
      });
      var g = state.lastPick && state.lastPick.idx >= 0 ? GAZE[state.lastPick.idx] : null;
      head.style.transform = g ? 'rotate(' + g.rot + 'deg)' : '';
      eyes.style.transform = g ? 'translate(' + g.ex + 'px,' + g.ey + 'px)' : '';

      // participation bars
      clear(bars);
      var max = Math.max.apply(null, state.turns.concat([1]));
      PLAYERS.forEach(function (p, i) {
        var li = el('li', state.present[i] ? '' : 'is-away-row');
        li.appendChild(el('span', null, p.name + (state.present[i] ? '' : ' (away)')));
        var bar = el('span', 'bar');
        bar.setAttribute('aria-hidden', 'true');
        var fill = el('i');
        fill.style.width = (state.turns[i] / max * 100) + '%';
        bar.appendChild(fill);
        li.appendChild(bar);
        var num = el('span', 'num', state.turns[i]);
        num.setAttribute('aria-label', plural(state.turns[i], 'turn'));
        li.appendChild(num);
        bars.appendChild(li);
      });

      renderCompare(compare, 'Turns under each rule', ['first', 'fair'].map(function (rule) {
        var r = state.byRule[rule];
        var parts = PLAYERS.map(function (p, i) { return p.name + ' ' + r.turns[i]; }).join(' · ');
        return {
          label: RULE_LABEL[rule],
          current: rule === state.rule,
          value: r.total ? plural(r.total, 'turn') + ' → ' + parts + (r.empty ? ' (+' + plural(r.empty, 'question') + ' to an empty seat)' : '') : ''
        };
      }));
    }

    function updateFeedback() {
      var fixed = false;
      var names = function (idxs) {
        var n = idxs.map(function (i) { return PLAYERS[i].name; });
        return n.length < 3 ? n.join(' and ') : n.slice(0, -1).join(', ') + ', and ' + n[n.length - 1];
      };
      if (state.rule === 'first') {
        var r = state.byRule.first;
        if (state.lastPick && state.lastPick.empty) {
          setFeedback(feedback, 'bug', 'The robot asked an empty seat.', 'The rule always returns Seat 1. It never checks who is actually at the table.');
        } else if (r.total >= 2) {
          var waiting = [1, 2].filter(function (i) { return state.present[i] && state.turns[i] === 0; });
          setFeedback(feedback, 'bug', 'Juniper has had ' + plural(state.turns[0], 'turn') + '.' + (waiting.length ? ' ' + names(waiting) + ' haven’t had one.' : ''),
            'The rule always picks Seat 1. Try “Fewest turns first”, then run a few more turns.');
        } else if (r.total === 1) {
          setFeedback(feedback, 'info', 'Turn 1 went to Juniper (Seat 1).', 'Run a few more turns and watch who gets picked.');
        }
      } else {
        var eligible = [0, 1, 2].filter(function (i) { return state.present[i]; });
        var pickedSince = [0, 1, 2].filter(function (i) { return state.since.picked[i]; });
        var lp = state.lastPick;
        if (!eligible.length) {
          setFeedback(feedback, 'info', 'Nobody is at the table.', 'The fair rule waits instead of asking an empty seat. Bring a player back.');
        } else if (eligible.length < 2) {
          setFeedback(feedback, 'info', 'Only one player is at the table.', 'Bring someone back to see the rule share turns.');
        } else if (state.since.total >= 3 && pickedSince.length >= 2) {
          fixed = true;
          setFeedback(feedback, 'fixed', 'Better conversations start with noticing who hasn’t spoken.',
            'Since switching rules, turns went to ' + names(pickedSince) + '. Turn counts now: ' +
            PLAYERS.map(function (p, i) { return p.name + ' ' + state.turns[i]; }).join(', ') + '.');
        } else if (state.since.total === 0) {
          setFeedback(feedback, 'info', 'New rule active: fewest turns first.', 'Run some turns. Whoever has had the fewest turns goes next.');
        } else {
          setFeedback(feedback, 'info', (lp && lp.idx >= 0 ? PLAYERS[lp.idx].name + ' was picked' : 'Turn taken') + ': the fewest turns among players at the table.',
            'Run a few more turns to watch the counts even out.');
        }
      }
      progress.set('robot', fixed);
    }

    function setBusy(on) {
      busy = on;
      [turnBtn, turnsBtn].forEach(function (b) {
        if (on) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled');
      });
    }

    function run(n) {
      if (busy) return;
      if (n === 1 || reducedMotion()) {
        for (var i = 0; i < n; i++) runTurn();
        render();
        updateFeedback();
        return;
      }
      setBusy(true);
      var step = 0;
      (function next() {
        runTurn();
        render();
        step++;
        if (step < n) {
          timers.push(setTimeout(next, STEP_MS));
        } else {
          setBusy(false);
          updateFeedback();
        }
      })();
    }

    function reset(initial) {
      timers.forEach(clearTimeout);
      timers = [];
      setBusy(false);
      state = freshState();
      ruleInputs.forEach(function (input) { input.checked = input.value === 'first'; });
      $all('input[data-present]', root).forEach(function (input) {
        input.checked = true;
        var small = input.parentNode.querySelector('small');
        if (small) small.textContent = 'At the table';
      });
      speech.textContent = 'Hi! I’m a pretend trivia host. Press “Run 1 turn” to ask a question.';
      render();
      setFeedback(feedback, '', '');
      if (initial !== true) progress.set('robot', false);
    }

    ruleInputs.forEach(function (input) {
      input.addEventListener('change', function () {
        if (!input.checked || input.value === state.rule) return;
        state.rule = input.value;
        state.since = { total: 0, picked: [false, false, false] };
        render();
        updateFeedback();
      });
    });
    turnBtn.addEventListener('click', function () { run(1); });
    turnsBtn.addEventListener('click', function () { run(6); });
    $('[data-action="reset"]', root).addEventListener('click', function () { reset(); });

    state = freshState();
    reset(true);
  }

  /* ---------- boot ---------- */

  safely('nav', initNav);
  safely('debug-tip', initDebugTip);
  safely('desk-bug', initDeskBug);
  safely('carousel', initCarousels);
  safely('flips', initFlips);
  safely('mouse-cord', initMouseCord);
  safely('book-terminal', initBookTerminal);

  var progress = { set: function () {} };
  safely('progress', function () { progress = createProgress(); });

  [
    ['scanner', initScanner],
    ['journal', initJournal],
    ['robot', initRobot]
  ].forEach(function (pair) {
    var root = document.querySelector('[data-scenario="' + pair[0] + '"]');
    if (!root) return;
    safely(pair[0], function () { pair[1](root, progress); }, root);
  });

  safely('qa-toast', initQaToast);
})();
