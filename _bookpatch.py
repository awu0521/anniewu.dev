import re, pathlib

# ── JS patch ──────────────────────────────────────────────────────────────────
js_path = pathlib.Path('script.js')
js = js_path.read_text()

OLD_BOOK_JS = '''  /* ---------- Project book ---------- */
  safely('project-book', function () {
    var closedEl   = $('[data-book-closed]');
    var openWrap   = $('[data-book-open-wrap]');
    var spread     = openWrap && $('.book-spread', openWrap);
    var openBtn    = $('[data-book-open]');
    var closeBtn   = $('[data-book-close]');
    var prevBtn    = $('[data-book-prev]');
    var nextBtn    = $('[data-book-next]');
    var indicator  = $('[data-book-indicator]');
    if (!closedEl || !openWrap || !spread) return;'''

NEW_BOOK_JS = r"""  /* ---------- Project book ---------- */
  safely('project-book', function () {
    var wrap      = $('[data-book-open-wrap]');
    if (!wrap) return;
    var spread    = wrap;
    var openBtn   = $('[data-book-open]', wrap);
    var prevBtn   = $('[data-book-prev]');
    var nextBtn   = $('[data-book-next]');
    var indicator = $('[data-book-indicator]');
    var coverPage = $('[data-book-cover]', wrap);
    var leftPage  = $('[data-book-left-page]', wrap);"""

# replace the old function open
js = js.replace(OLD_BOOK_JS, NEW_BOOK_JS, 1)

# replace the old SPREADS / renderSpread / flipTo / openBook / closeBook / wiring
OLD_SPREADS = """    // Spreads: pairs of project indices [left, right]
    var SPREADS = [[0, 1], [2, 3], [4, 5]];
    var currentSpread = 0;
    var animating = false;

    function fillPage(side, proj) {
      var suffix = side === 'left' ? '-left' : '-right';
      $('[data-spread-num'    + suffix + ']', openWrap).textContent = proj.num;
      $('[data-spread-title'  + suffix + ']', openWrap).textContent = proj.title;
      var st = $('[data-spread-status' + suffix + ']', openWrap);
      st.className = 'status ' + proj.statusClass;
      st.textContent = proj.statusText;
      $('[data-spread-meta'   + suffix + ']', openWrap).textContent = proj.meta;
      var dl = $('[data-spread-body' + suffix + ']', openWrap);
      dl.innerHTML = '';
      proj.body.forEach(function(row) {
        var dt = document.createElement('dt'); dt.textContent = row[0]; dl.appendChild(dt);
        var dd = document.createElement('dd'); dd.innerHTML = row[1]; dl.appendChild(dd);
      });
      $('[data-spread-links' + suffix + ']', openWrap).innerHTML = proj.links;
    }

    function renderSpread(idx) {
      var pair = SPREADS[idx];
      fillPage('left',  PROJECTS[pair[0]]);
      fillPage('right', PROJECTS[pair[1]]);
      if (indicator) indicator.textContent = 'Spread ' + (idx + 1) + ' of 3';
      if (prevBtn) prevBtn.disabled = idx === 0;
      if (nextBtn) nextBtn.disabled = idx === SPREADS.length - 1;
    }

    function flipTo(idx, dir) {
      if (animating || idx === currentSpread) return;
      animating = true;
      var cls = dir > 0 ? 'is-flipping-fwd' : 'is-flipping-back';
      spread.classList.add(cls);
      var delay = reducedMotion() ? 0 : 175;
      setTimeout(function() {
        renderSpread(idx);
        currentSpread = idx;
      }, delay);
      setTimeout(function() {
        spread.classList.remove(cls);
        animating = false;
      }, reducedMotion() ? 0 : 360);
    }

    function openBook() {
      closedEl.hidden = true;
      openWrap.hidden = false;
      renderSpread(0);
      currentSpread = 0;
    }

    function closeBook() {
      openWrap.hidden = true;
      closedEl.hidden = false;
    }

    if (openBtn)  openBtn.addEventListener('click', openBook);
    var coverSvg = $('.book-cover-svg', closedEl);
    if (coverSvg) coverSvg.addEventListener('click', openBook);
    if (closeBtn) closeBtn.addEventListener('click', closeBook);
    if (prevBtn)  prevBtn.addEventListener('click', function() { flipTo(currentSpread - 1, -1); });
    if (nextBtn)  nextBtn.addEventListener('click', function() { flipTo(currentSpread + 1,  1); });

    openWrap.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); flipTo(currentSpread + 1,  1); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); flipTo(currentSpread - 1, -1); }
    });
  });"""

NEW_SPREADS = r"""    // spread 0 = cover; spreads 1-3 = project pairs
    var SPREADS = [null, [0, 1], [2, 3], [4, 5]];
    var currentSpread = 0;
    var animating = false;

    function fillPage(side, proj) {
      var suffix = side === 'left' ? '-left' : '-right';
      $('[data-spread-num'    + suffix + ']', wrap).textContent = proj.num;
      $('[data-spread-title'  + suffix + ']', wrap).textContent = proj.title;
      var st = $('[data-spread-status' + suffix + ']', wrap);
      st.className = 'status ' + proj.statusClass;
      st.textContent = proj.statusText;
      $('[data-spread-meta'   + suffix + ']', wrap).textContent = proj.meta;
      var dl = $('[data-spread-body' + suffix + ']', wrap);
      dl.innerHTML = '';
      proj.body.forEach(function (row) {
        var dt = document.createElement('dt'); dt.textContent = row[0]; dl.appendChild(dt);
        var dd = document.createElement('dd'); dd.innerHTML = row[1]; dl.appendChild(dd);
      });
      $('[data-spread-links' + suffix + ']', wrap).innerHTML = proj.links;
    }

    function showCover(on) {
      if (coverPage) coverPage.style.display = on ? '' : 'none';
      if (leftPage)  leftPage.style.display  = on ? 'none' : '';
    }

    function renderSpread(idx) {
      var isCover = idx === 0;
      showCover(isCover);
      if (!isCover) {
        var pair = SPREADS[idx];
        fillPage('left',  PROJECTS[pair[0]]);
        fillPage('right', PROJECTS[pair[1]]);
      }
      if (indicator) indicator.textContent = isCover ? 'Cover' : 'Spread ' + idx + ' of 3';
      if (prevBtn) prevBtn.disabled = idx === 0;
      if (nextBtn) nextBtn.disabled = idx === SPREADS.length - 1;
    }

    function flipTo(idx, dir) {
      if (animating || idx === currentSpread) return;
      animating = true;
      var cls = dir > 0 ? 'is-flipping-fwd' : 'is-flipping-back';
      spread.classList.add(cls);
      var delay = reducedMotion() ? 0 : 175;
      setTimeout(function () {
        renderSpread(idx);
        currentSpread = idx;
      }, delay);
      setTimeout(function () {
        spread.classList.remove(cls);
        animating = false;
      }, reducedMotion() ? 0 : 360);
    }

    if (openBtn) openBtn.addEventListener('click', function () { flipTo(1, 1); });
    if (prevBtn) prevBtn.addEventListener('click', function () { flipTo(currentSpread - 1, -1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { flipTo(currentSpread + 1,  1); });

    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); flipTo(currentSpread + 1,  1); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); flipTo(currentSpread - 1, -1); }
    });

    renderSpread(0);
  });"""

js = js.replace(OLD_SPREADS, NEW_SPREADS, 1)
js_path.write_text(js)
print('JS patched:', OLD_SPREADS[:60] in js_path.read_text() and 'FAIL' or 'OK')
