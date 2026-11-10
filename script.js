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

  /* ---------- Experience timeline: one entry in focus at a time ---------- */
  // The entry crossing the middle band of the screen is "active"; the others are
  // greyed out (hover/focus still brings any of them back). Without JS, all are clear.
  function initTimeline() {
    var list = $('.timeline');
    if (!list) return;
    var items = $all('.role', list);
    if (!items.length) return;
    function setActive(el) { items.forEach(function (it) { it.classList.toggle('is-active', it === el); }); }
    list.classList.add('is-enhanced');
    setActive(items[0]);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) setActive(en.target); });
      }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });
      items.forEach(function (it) { io.observe(it); });
    }
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
     Debug Playground quizzes.
     Each scenario page shows a picture of the bug, a few lines of
     pseudocode, and a multiple-choice question. Choosing the right
     fix swaps the picture and the code to their fixed versions
     (the root element gets .is-fixed). Each option carries its own
     explanation in data-why.
     ========================================================= */

  function initQuiz(root, progress) {
    var name = root.getAttribute('data-scenario');
    var options = $all('[data-option]', root);
    var feedback = $('[data-feedback]', root);
    var resetBtn = $('[data-quiz-reset]', root);
    var codeTitle = $('[data-code-title]', root);
    if (!options.length || !feedback) return;

    function setCodeTitle(fixed) {
      if (codeTitle) codeTitle.textContent = fixed ? 'after your fix' : 'the buggy code';
    }

    function choose(btn) {
      var right = btn.hasAttribute('data-correct');
      var why = btn.getAttribute('data-why') || '';
      if (!right) {
        btn.classList.add('is-wrong');
        btn.disabled = true;
        setFeedback(feedback, 'bug', 'Not quite.', why);
        return;
      }
      btn.classList.add('is-right');
      options.forEach(function (o) { o.disabled = true; });
      root.classList.add('is-fixed');
      setCodeTitle(true);
      setFeedback(feedback, 'fixed', 'Fixed! ✓', why);
      progress.set(name, true);
      if (resetBtn) resetBtn.hidden = false;
    }

    function reset() {
      options.forEach(function (o) {
        o.disabled = false;
        o.classList.remove('is-wrong', 'is-right');
      });
      root.classList.remove('is-fixed');
      setCodeTitle(false);
      setFeedback(feedback, '', '');
      if (resetBtn) resetBtn.hidden = true;
      options[0].focus();
    }

    options.forEach(function (o) {
      o.addEventListener('click', function () { choose(o); });
    });
    if (resetBtn) resetBtn.addEventListener('click', reset);
    setCodeTitle(false);
  }

  /* ---------- boot ---------- */

  safely('nav', initNav);
  safely('debug-tip', initDebugTip);
  safely('desk-bug', initDeskBug);
  safely('carousel', initCarousels);
  safely('flips', initFlips);
  safely('mouse-cord', initMouseCord);
  safely('timeline', initTimeline);
  safely('book-terminal', initBookTerminal);

  var progress = { set: function () {} };
  safely('progress', function () { progress = createProgress(); });

  // Old interactive journal demo stored hikes here; the quiz no longer uses it.
  store.remove('annie-portfolio:debug-journal:v1');

  $all('[data-scenario]').forEach(function (root) {
    safely(root.getAttribute('data-scenario'), function () { initQuiz(root, progress); }, root);
  });

  safely('qa-toast', initQaToast);

  /* ---------- Project book ---------- */
  // A closed hardcover that opens and turns real 3D leaves. Each leaf has a front
  // (right-hand page) and a back (left-hand page). Pages are numbered 0..8:
  // 0 = closed cover, then [1 contents | 2 P1], [3 P2 | 4 P3], [5 P4 | 6 P5], [7 P6 | 8 end].
  // Wide screens show a whole spread; phones show one page at a time.
  safely('project-book', function () {
    var book = $('[data-pb-book]');
    if (!book) return;
    var viewport  = book.parentNode;
    var prevBtn   = $('[data-book-prev]');
    var nextBtn   = $('[data-book-next]');
    var indicator = $('[data-book-indicator]');
    var toc       = $('[data-pb-toc]', book);
    var base      = $('.pb-base', book);
    var narrowQuery = window.matchMedia ? window.matchMedia('(max-width: 640px)') : null;
    function narrow() { return !!(narrowQuery && narrowQuery.matches); }

    // Project leaves are written in index.html (so the text is in the page source).
    // Each project page is a face with an <h3>; the contents list is built from those.
    var projectTitles = $all('.pb-leaf:not(.pb-leaf-cover) .book-project-head h3', book).map(function (h) { return h.textContent; });
    function pad(n) { return (n < 10 ? '0' : '') + n; }

    var leaves = $all('[data-pb-leaf]', book);
    var L = leaves.length;            // 4 leaves (cover + 3)
    var LAST = L * 2;                 // last page index (8 = end page)

    // Contents on the inside cover: each entry jumps straight to its page.
    projectTitles.forEach(function (title, i) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pb-toc-link';
      b.innerHTML = '<span class="pb-toc-title">' + title + '</span><span class="pb-toc-dots" aria-hidden="true"></span><span class="pb-toc-num">' + pad(i + 1) + '</span>';
      b.addEventListener('click', function (e) { e.stopPropagation(); go(i + 2); });
      li.appendChild(b);
      toc.appendChild(li);
    });

    var page = 0;
    var flipped = [];                 // flipped[i] = leaf i is on the left
    var busy = false;
    var FLIP_MS = 900, STAGGER_MS = 140;

    function spreadOf(p) { return Math.ceil(p / 2); }
    function restingZ(i) { return flipped[i] ? i + 1 : L - i; }

    /** Hide pages you can't see from keyboard and screen readers. */
    function updateInert() {
      var s = spreadOf(page);
      var visible = [];
      var left  = s > 0 ? leaves[s - 1].querySelector('.pb-back') : null;
      var right = s < L ? leaves[s].querySelector('.pb-front') : base;
      if (narrow()) visible.push(page % 2 ? left : right);
      else { visible.push(right); if (left) visible.push(left); }
      $all('[data-pb-face]', book).forEach(function (f) {
        var show = visible.indexOf(f) !== -1;
        if (show) f.removeAttribute('inert'); else f.setAttribute('inert', '');
        f.setAttribute('aria-hidden', show ? 'false' : 'true');
      });
    }

    function updateUi() {
      var s = spreadOf(page);
      book.setAttribute('data-open', s > 0 ? 'true' : 'false');
      book.setAttribute('data-side', page === 0 || page % 2 === 0 ? 'right' : 'left');
      var atEnd = narrow() ? page >= LAST : s >= L;
      if (prevBtn) { prevBtn.disabled = page === 0; prevBtn.setAttribute('aria-label', s === 1 && (!narrow() || page === 1) ? 'Close the book' : 'Previous page'); }
      if (nextBtn) { nextBtn.disabled = atEnd; nextBtn.setAttribute('aria-label', page === 0 ? 'Open the book' : 'Next page'); }
      if (indicator) {
        var label;
        if (page === 0) label = (narrow() ? 'Tap' : 'Click') + ' the cover to open';
        else if (narrow()) label = 'Page ' + page + ' of ' + LAST;
        else label = 'Pages ' + (2 * s - 1) + '–' + (2 * s) + ' of ' + LAST;
        indicator.textContent = label;
      }
      updateInert();
    }

    /** Turn to page p, flipping each leaf that has to change sides one after another. */
    function go(p, instant) {
      p = Math.max(0, Math.min(LAST, p));
      if (busy && !instant) return;
      var target = spreadOf(p);
      var turning = [];
      for (var i = 0; i < L; i++) if (flipped[i] !== (i < target)) turning.push(i);
      if (target < spreadOf(page)) turning.reverse(); // turning back: top of the left pile first
      page = p;
      var still = instant || reducedMotion();
      book.classList.toggle('is-instant', !!still);

      turning.forEach(function (i, order) {
        var leaf = leaves[i];
        function flip() {
          flipped[i] = i < target;
          leaf.style.zIndex = String(50 + order);
          leaf.classList.toggle('is-flipped', flipped[i]);
          if (!still) {
            leaf.classList.remove('is-turning');
            void leaf.offsetWidth;   // restart the shading animation
            leaf.classList.add('is-turning');
          }
        }
        if (still || order === 0) flip(); else setTimeout(flip, order * STAGGER_MS);
      });

      updateUi();
      if (still || !turning.length) { settle(); return; }
      busy = true;
      setTimeout(settle, FLIP_MS + (turning.length - 1) * STAGGER_MS + 30);
    }

    function settle() {
      busy = false;
      leaves.forEach(function (leaf, i) {
        leaf.classList.remove('is-turning');
        leaf.style.zIndex = String(restingZ(i));
      });
    }

    function next() {
      if (narrow()) go(page + 1);
      else go(page === 0 ? 1 : 2 * (spreadOf(page) + 1) - 1);
    }
    function prev() {
      if (narrow()) go(page - 1);
      else go(spreadOf(page) <= 1 ? 0 : 2 * (spreadOf(page) - 1) - 1);
    }

    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);

    book.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      else if (e.key === 'Home') { e.preventDefault(); go(0); }
      else if (e.key === 'End') { e.preventDefault(); go(LAST); }
    });

    // Click a page to turn it: right half forward, left half back (phones: left third back).
    var swiped = false;
    book.addEventListener('click', function (e) {
      if (swiped) { swiped = false; return; }
      if (e.target.closest('a, button')) return;
      if (page === 0) { next(); return; }
      var r = viewport.getBoundingClientRect();
      var frac = (e.clientX - r.left) / r.width;
      if (frac < (narrow() ? 0.3 : 0.5)) prev(); else next();
    });

    // Swipe on touch screens.
    var startX = null, startY = 0;
    viewport.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    }, { passive: true });
    viewport.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      startX = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        swiped = true;
        setTimeout(function () { swiped = false; }, 400);
        if (dx < 0) next(); else prev();
      }
    }, { passive: true });

    function onResize() {
      // Phones show single pages; snap a desktop spread to its left page and vice versa.
      if (!narrow() && page > 0 && page % 2 === 0) page -= 1;
      updateUi();
    }
    if (narrowQuery) {
      if (narrowQuery.addEventListener) narrowQuery.addEventListener('change', onResize);
      else if (narrowQuery.addListener) narrowQuery.addListener(onResize);
    }

    leaves.forEach(function (leaf, i) { flipped[i] = false; leaf.style.zIndex = String(restingZ(i)); });
    updateUi();
  });
})();
