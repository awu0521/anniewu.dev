with open('script.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_js = """  safely('project-book', function () {
    var book      = $('[data-book]');
    var turningEl = $('[data-book-turning]');
    var turnFront = turningEl && $('.book-turning-front', turningEl);
    var turnBack  = turningEl && $('.book-turning-back',  turningEl);
    var leafLeft  = $('[data-leaf-left]');
    var leafRight = $('[data-leaf-right]');
    var prevBtn   = $('[data-book-prev]');
    var nextBtn   = $('[data-book-next]');
    var indicator = $('[data-book-indicator]');
    if (!book || !leafLeft || !leafRight) return;

    var COVER_LEFT =
      '<div class="book-cover-page">' +
        '<svg viewBox="0 0 160 200" aria-hidden="true">' +
          '<rect x="1" y="1" width="158" height="198" rx="4" fill="#A8C29E" stroke="#28352F" stroke-width="2"/>' +
          '<rect x="8" y="8" width="144" height="184" rx="3" fill="none" stroke="#28352F" stroke-width="1" stroke-dasharray="3 2"/>' +
          '<rect x="8" y="56" width="144" height="44" fill="#DCE8D6" stroke="#28352F" stroke-width="1"/>' +
          '<text x="80" y="76" text-anchor="middle" font-family="Iowan Old Style,Palatino Linotype,Georgia,serif" font-size="13" font-weight="700" fill="#28352F">My Projects</text>' +
          '<text x="80" y="92" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="8" fill="#4A5850">2025 \u2013 2026</text>' +
          '<rect x="62" y="118" width="36" height="30" rx="4" fill="#FFFDF9" stroke="#28352F" stroke-width="1.8"/>' +
          '<rect x="70" y="124" width="8" height="8" rx="1.5" fill="#A9CDE0" stroke="#28352F" stroke-width="1.2"/>' +
          '<rect x="82" y="124" width="8" height="8" rx="1.5" fill="#A9CDE0" stroke="#28352F" stroke-width="1.2"/>' +
          '<rect x="71" y="136" width="18" height="4" rx="2" fill="#28352F"/>' +
          '<line x1="80" y1="110" x2="80" y2="118" stroke="#28352F" stroke-width="2"/>' +
          '<rect x="74" y="104" width="12" height="8" rx="2" fill="#E9B795" stroke="#28352F" stroke-width="1.5"/>' +
          '<line x1="62" y1="128" x2="54" y2="136" stroke="#28352F" stroke-width="2" stroke-linecap="round"/>' +
          '<line x1="98" y1="128" x2="106" y2="136" stroke="#28352F" stroke-width="2" stroke-linecap="round"/>' +
          '<line x1="68" y1="148" x2="64" y2="160" stroke="#28352F" stroke-width="2" stroke-linecap="round"/>' +
          '<line x1="92" y1="148" x2="96" y2="160" stroke="#28352F" stroke-width="2" stroke-linecap="round"/>' +
          '<text x="80" y="180" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="7" fill="#4A5850">flip to read \u2192</text>' +
        '</svg>' +
      '</div>';

    var PROJECTS = [
      {
        num: '01 / 06', title: 'HATRIC: LLM/VLM Trivia Robot',
        statusClass: 'status-progress', statusText: 'In progress',
        meta: 'Oct 2026 \u2013 present',
        body: [
          ['The problem', 'A robot hosting a game for several people has to decide who to address, where to look, and how to gesture \u2014 not just what to say.'],
          ['What I\'m doing', 'Multi-party LLM agent in async Python; on-device VLM via Ollama reads webcam frames to steer gaze; FastAPI/WebSocket server with SQLite drives a web avatar and an ESP32.'],
          ['Built with', '<ul class="chips"><li>Python</li><li>Ollama</li><li>FastAPI</li><li>WebSockets</li><li>SQLite</li><li>ESP32</li></ul>']
        ],
        links: ''
      },
      {
        num: '02 / 06', title: 'IoT Inventory Tracker',
        statusClass: 'status-done', statusText: 'Built',
        meta: 'Jun \u2013 Aug 2026',
        body: [
          ['The problem', 'Logging physical items by hand is slow and error-prone.'],
          ['What I did', 'ESP32 reads RFID tags in real time; WiFi client-server turns each scan into a structured inventory record.'],
          ['Built with', '<ul class="chips"><li>C++</li><li>Arduino</li><li>ESP32</li><li>RFID</li><li>TypeScript</li></ul>']
        ],
        links: '<a class="btn btn-small" href="https://github.com/awu0521/inventory-tracker" target="_blank" rel="noopener">GitHub</a>'
      },
      {
        num: '03 / 06', title: 'FIFA 2026 Tracker and Predictor',
        statusClass: 'status-done', statusText: 'Built',
        meta: 'Jun \u2013 Jul 2026',
        body: [
          ['The problem', 'Forecast the 2026 World Cup winner without fooling myself about accuracy.'],
          ['What I did', 'Python engine: Elo ratings seeded from FIFA rankings + 200,000 Monte Carlo simulations of the remaining bracket.'],
          ['How I checked it', '<p class="stat"><span class="stat-num">83.8%</span> <span class="stat-label">of decisive matches called correctly (67/80)</span></p>']
        ],
        links: '<a class="btn btn-small" href="https://github.com/awu0521/fifa2026" target="_blank" rel="noopener">GitHub</a>'
      },
      {
        num: '04 / 06', title: 'TrackTheTrek',
        statusClass: 'status-done', statusText: 'Built',
        meta: 'Jul \u2013 Sep 2025',
        body: [
          ['The problem', 'I wanted a simple way to keep track of hikes around BC.'],
          ['What I did', 'Java desktop hiking tracker with an OOP class hierarchy; hikes saved to/loaded from JSON so the trail log persists between sessions.'],
          ['Built with', '<ul class="chips"><li>Java</li><li>OOP</li><li>JSON persistence</li></ul>']
        ],
        links: '<a class="btn btn-small" href="https://github.com/awu0521/TrackTheTrek" target="_blank" rel="noopener">GitHub</a>'
      },
      {
        num: '05 / 06', title: 'Save Our Foods',
        statusClass: 'status-done', statusText: 'Built',
        meta: '2025 \u00b7 Hackathon',
        body: [
          ['The problem', 'Food waste from near-expiry items that never get sold or used.'],
          ['What I did', 'Full-stack Next.js marketplace; Gemini AI reads item photos to suggest names, expiry dates, and fair prices; buyers get a PDF receipt on checkout.'],
          ['Built with', '<ul class="chips"><li>Next.js</li><li>Supabase</li><li>Gemini AI</li><li>TypeScript</li></ul>']
        ],
        links: '<a class="btn btn-small" href="https://github.com/hackscholar/save-our-foods" target="_blank" rel="noopener">GitHub</a>'
      },
      {
        num: '06 / 06', title: 'How Cooked Are You?',
        statusClass: 'status-done', statusText: 'Built',
        meta: '2025 \u00b7 Hackathon',
        body: [
          ['The problem', 'UBC CS students need a fun, honest way to gauge how overwhelmed they are by upcoming deadlines.'],
          ['What I did', 'Next.js app: enter assignments with weights and due dates (or import .ics), get a score, an auto-generated study schedule, and an .ics export for Google/Apple/Outlook Calendar.'],
          ['Built with', '<ul class="chips"><li>Next.js</li><li>TypeScript</li><li>iCal</li></ul>']
        ],
        links: '<a class="btn btn-small" href="https://github.com/awu0521/how-cooked-are-you" target="_blank" rel="noopener">GitHub</a>'
      }
    ];

    // page 0 = cover (left) + project 0 (right)
    // page 1 = project 1 (left) + project 2 (right)
    // page 2 = project 3 (left) + project 4 (right)
    // page 3 = project 5 (left) + blank or last
    // Left content per page: cover, proj1, proj3, proj5
    // Right content per page: proj0, proj2, proj4, (none)
    var PAGES = [
      { left: 'cover',  right: 0 },
      { left: 1,        right: 2 },
      { left: 3,        right: 4 },
      { left: 5,        right: null }
    ];
    var TOTAL = PAGES.length;
    var current = 0;
    var animating = false;

    function projectHTML(proj) {
      var dl = proj.body.map(function(r) {
        return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>';
      }).join('');
      var links = proj.links
        ? '<p class="book-links">' + proj.links + '</p>'
        : '';
      return (
        '<p class="book-page-num">' + proj.num + '</p>' +
        '<div class="book-project-head">' +
          '<h3>' + proj.title + '</h3>' +
          '<span class="status ' + proj.statusClass + '">' + proj.statusText + '</span>' +
        '</div>' +
        '<p class="book-meta">' + proj.meta + '</p>' +
        '<dl class="book-dl">' + dl + '</dl>' +
        links
      );
    }

    function pageHTML(slot) {
      if (slot === 'cover') return COVER_LEFT;
      if (slot === null) return '<div style="height:100%;display:flex;align-items:center;justify-content:center;opacity:.3;font-family:var(--font-mono);font-size:.8rem;">end</div>';
      return projectHTML(PROJECTS[slot]);
    }

    function renderPage(idx, skipAnim) {
      var pg = PAGES[idx];
      leafLeft.innerHTML  = pageHTML(pg.left);
      leafRight.innerHTML = pageHTML(pg.right);
      if (indicator) indicator.textContent = 'Page ' + (idx + 1) + ' of ' + TOTAL;
      if (prevBtn) prevBtn.disabled = idx === 0;
      if (nextBtn) nextBtn.disabled = idx === TOTAL - 1;
    }

    function flip(dir) {
      if (animating) return;
      var next = current + dir;
      if (next < 0 || next >= TOTAL) return;
      if (reducedMotion()) { current = next; renderPage(current); return; }

      animating = true;

      if (dir > 0) {
        // Forward: right page peels over to left
        // front of turning page = current right, back = next left
        turnFront.innerHTML = pageHTML(PAGES[current].right);
        turnBack.innerHTML  = pageHTML(PAGES[next].left);
        // pre-load next right into the right leaf (hidden under the turning page)
        leafRight.innerHTML = pageHTML(PAGES[next].right);
        turningEl.className = 'book-turning-page is-flipping';
      } else {
        // Backward: left page peels back to right
        // We reposition the turning page to start from the left half
        turningEl.style.left = '0';
        turningEl.style.transformOrigin = 'right center';
        turnFront.innerHTML = pageHTML(PAGES[current].left);
        turnBack.innerHTML  = pageHTML(PAGES[next].right);
        leafLeft.innerHTML  = pageHTML(PAGES[next].left);
        turningEl.className = 'book-turning-page is-flipping-back';
      }

      setTimeout(function() {
        current = next;
        renderPage(current, true);
        turningEl.className = 'book-turning-page';
        turningEl.style.left = '';
        turningEl.style.transformOrigin = '';
        animating = false;
      }, 620);
    }

    if (prevBtn) prevBtn.addEventListener('click', function() { flip(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function() { flip(1); });
    book.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); flip(1); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); flip(-1); }
    });

    renderPage(0);
  });
})();
"""

# replace from line 1832 (0-indexed 1831) to end
new_lines = lines[:1831] + [new_js]
with open('script.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print("done, lines:", len(new_lines))
