/* =========================================================
   Annie Wu — The Portfolio You Can Debug
   Plain JavaScript, no dependencies, no build step.

   The portfolio itself is plain HTML with anchor links and works
   without this file. Everything here is progressive enhancement:
   the mobile menu and the three optional Debug Playground demos.
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
    node.appendChild(el('h4', null, heading));
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

  /* ---------- playground progress ---------- */

  function createProgress() {
    var fixed = { scanner: false, journal: false, robot: false };
    var countNode = $('[data-fixed-count]');
    function render() {
      var n = 0;
      Object.keys(fixed).forEach(function (k) {
        if (fixed[k]) n++;
        var chip = $('[data-chip="' + k + '"]');
        if (!chip) return;
        chip.classList.toggle('is-fixed', fixed[k]);
        var state = $('[data-chip-state]', chip);
        if (state) state.textContent = fixed[k] ? ' (fixed)' : ' (not fixed yet)';
      });
      if (countNode) countNode.textContent = String(n);
    }
    return {
      set: function (name, value) {
        if (fixed[name] === !!value) return;
        fixed[name] = !!value;
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
      { id: 'TAG-04A7', name: 'Water bottle' },
      { id: 'TAG-19C2', name: 'Trail map' },
      { id: 'TAG-7F31', name: 'Soccer ball' }
    ];
    var RULE_LABEL = { every: 'Record every scan', dedupe: 'Ignore repeats within 2 s' };

    var tagList = $('[data-tag-list]', root);
    var rawLog = $('[data-raw-log]', root);
    var invLog = $('[data-inv-log]', root);
    var rawCount = $('[data-raw-count]', root);
    var invCount = $('[data-inv-count]', root);
    var device = $('[data-scanner-device]', root);
    var readout = $('[data-scanner-readout]', root);
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
    });

    var state, timers = [], flashTimer = null;

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
      device.classList.remove('flash-ok', 'flash-ignored');
      // force reflow so repeated flashes restart
      void device.offsetWidth;
      device.classList.add(accepted ? 'flash-ok' : 'flash-ignored');
      readout.textContent = tag.id + (accepted ? ' → RECORDED' : ' → IGNORED');
      clearTimeout(flashTimer);
      flashTimer = setTimeout(function () {
        device.classList.remove('flash-ok', 'flash-ignored');
        readout.textContent = 'READY';
      }, 600);
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

    function reset() {
      timers.forEach(clearTimeout);
      timers = [];
      clearTimeout(flashTimer);
      device.classList.remove('flash-ok', 'flash-ignored');
      readout.textContent = 'READY';
      state = freshState();
      ruleInputs.forEach(function (input) { input.checked = input.value === 'every'; });
      var first = $('input[name="scanner-tag"]', root);
      if (first) first.checked = true;
      render();
      setFeedback(feedback, '', '');
      progress.set('scanner', false);
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
    $('[data-action="reset"]', root).addEventListener('click', reset);

    reset();
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
    var CLOSE_MS = 450;
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
    var journal = $('[data-journal]', root);
    var journalState = $('[data-journal-state]', root);
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

    /* --- storage access, all guarded --- */
    function getStorage() {
      try { return window.localStorage || null; } catch (e) { return null; }
    }
    function storageWorks() {
      var s = getStorage();
      if (!s) return false;
      try {
        var probe = KEY + ':probe';
        s.setItem(probe, '1');
        s.removeItem(probe);
        return true;
      } catch (e) { return false; }
    }
    var storageOK = storageWorks();

    function readRaw(key) {
      if (!storageOK) return null;
      try { return getStorage().getItem(key); } catch (e) { return null; }
    }
    function write(key, value) {
      if (!storageOK) return false;
      try { getStorage().setItem(key, value); return true; } catch (e) { return false; }
    }
    function remove(key) {
      if (!storageOK) return;
      try { getStorage().removeItem(key); } catch (e) { /* ignore */ }
    }

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
      renderCompare(compare, 'Last close-and-reopen', ['temporary', 'persistent'].map(function (m) {
        var r = lastReopen[m];
        return {
          label: MODE_LABEL[m],
          current: m === mode,
          value: r ? plural(r.before, 'hike') + ' before closing → ' + plural(r.after, 'hike') + ' after reopening' : ''
        };
      }));
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
      journal.classList.add('is-closing');

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

        journal.classList.remove('is-closing');
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
      journal.classList.remove('is-closing');
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

    function reset() {
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
      progress.set('robot', false);
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
    $('[data-action="reset"]', root).addEventListener('click', reset);

    state = freshState();
    reset();
  }

  /* ---------- boot ---------- */

  safely('nav', initNav);

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
})();
