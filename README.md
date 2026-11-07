# Annie Wu — The Portfolio You Can Debug

My personal portfolio for the AWS Student Builder Challenge. It's a calm, ordinary portfolio (About Me, Skills, Projects, Experience, Contact, resume) with one optional extra: a **Debug Playground**, three small illustrated interactive scenarios inspired by my projects. The playground lives on its own pages (`playground/`) and opens in a new window from the portfolio.

- Built with plain HTML, CSS, and JavaScript: no frameworks, packages, build step, backend, or paid APIs.
- The portfolio content is plain HTML with anchor links and still reads without JavaScript. Every interactive feature runs in its own error boundary, so one failing demo can't break the page.
- Illustrations are original SVGs, drawn for this site.

---

# My portfolio

## Introduction

**Annie Wu**, Computer Science (Co-op) at the University of British Columbia.
*"A little curiosity. A lot of building (and debugging)."*

## About me

I'm a third-year Computer Science student in the Co-op program at UBC. I like problems that sit between people and systems: a robot deciding who to talk to, a sensor turning a physical object into a record, a model that has to be honest about what it knows.

Right now I'm a CTMS Co-op Student at Vancouver Coastal Health Research Institute, working on research data instruments and workflows, and I'm building HATRIC, a multi-party trivia robot powered by local language and vision models.

- **Studying:** B.Sc. Computer Science (Co-op), UBC · Sep 2024 – Apr 2028 · 3.75 GPA
- **Coursework:** Software Construction (CPSC 210), Data Structures & Algorithms (CPSC 221), Relational Databases (CPSC 304), Applied Machine Learning (CPSC 330)
- **Based in:** Vancouver, BC

## Skills

On the site these are the "Tech Superpowers": each one is grouped by the kind of problem and backed by a project.

| Superpower | Tools | Evidence |
| --- | --- | --- |
| Intelligent interaction | Python, LLM/VLM orchestration, Ollama, FastAPI | HATRIC |
| Physical-to-digital systems | C++, ESP32, RFID, WiFi | IoT Inventory Tracker |
| Modeling and evaluation | Python, Elo ratings, Monte Carlo simulation | FIFA 2026 Tracker and Predictor |
| Application design and dependable data | Java, OOP, JSON, validation, workflows | TrackTheTrek, VCHRI co-op |

- **Languages:** Python, Java, C++, C, JavaScript, TypeScript, SQL, R
- **Web & backend:** FastAPI, SQLite, WebSockets, React, Next.js, Expo, Firebase, HTML, CSS, Git
- **Concepts:** LLMs, VLMs, prompt engineering, agent orchestration, OOP, client-server, embedded systems
- **Tools:** Ollama, REDCap, Power Automate, Figma, Excel

## Projects

**HATRIC: LLM/VLM Trivia Robot** (Oct 2026 – present, in progress)
A robot that hosts soccer trivia for 2–4 players and has to decide who to address, where to look, and how to gesture, not just what to say. I'm building the multi-party LLM agent in async Python, integrating an on-device vision-language model (Ollama) that reads webcam frames to steer the robot's gaze, and orchestrating it all through a FastAPI/WebSocket server with SQLite that drives a web avatar and an ESP32. Vision stays on-device, and every action logs a rationale. No public repo or demo yet; the playground's robot scenario is inspired by it.

**IoT Inventory Tracker** (Jun – Aug 2026)
An ESP32 embedded system that reads RFID tags and logs items in real time, with client-server communication over WiFi that turns a tag scan into a structured inventory record. Built with C++, Arduino, ESP32-WROOM-32, RFID, and TypeScript.
→ [github.com/awu0521/inventory-tracker](https://github.com/awu0521/inventory-tracker)

**FIFA 2026 Tracker and Predictor** (Jun – Jul 2026)
A Python engine that rates teams with Elo (seeded from pre-tournament FIFA rankings, with knockout matches weighted more heavily) and runs 200,000 Monte Carlo simulations of the remaining bracket. In a chronological backtest it called **83.8% of decisive matches correctly (67 of 80)**; ratings only update after each result, so no prediction uses future data.
→ [github.com/awu0521/fifa2026](https://github.com/awu0521/fifa2026)

**TrackTheTrek** (Jul – Sep 2025)
A Java desktop hiking tracker built around an object-oriented class hierarchy, with hikes saved to and loaded from JSON so the trail log persists between sessions.
→ [github.com/awu0521/TrackTheTrek](https://github.com/awu0521/TrackTheTrek)

## Fun fact

My puppy **Mr. Oli** (adopted because I'm a lifelong Snoopy fan) is the site's Head of QA. He sits on the desk in the hero, files a QA report about the three bugs in the workshop, and guards the bug jar. Visitors can also flip the "field notes" cards in About Me to find photos of snowboarding, hiking the Chief, watching FIFA 2026 in my hometown, and Mr. Oli reviewing code.

## Style

Warm, hand-illustrated, and playful, but calm: a cozy desk in a workshop. Cream paper background with soft pastels (sage, lavender, peach, sky blue) and dark green ink outlines, original SVG drawings, and a small terminal ("command center") for a touch of retro computing. The playful bits are optional; the portfolio underneath reads like a clean, ordinary page.

## Other sections

- **Experience & Community:** a timeline that highlights one role at a time as you scroll.
  - CTMS Co-op Student, Vancouver Coastal Health Research Institute (Sep 2026 – present): REDCap instruments and data dictionaries across 100+ studies, CTMS study setup, Power Automate workflows, and user training.
  - Social Coordinator, UBC Computer Science Student Society (Sep 2025 – present): three social events per term for 3.4k+ CS students.
  - Bootcamp Volunteer, GIRLsmarts4tech (May – Jun 2025): taught JavaScript, Python, and HTML to middle school students.
- **Contact:** email (annie.wu2024@gmail.com), [LinkedIn](https://linkedin.com/in/annie-wu06), [GitHub](https://github.com/awu0521), and the resume (view or download).
- **Debug Playground:** three tiny broken systems to fix (see below).

---

## What's interactive

On the portfolio (`index.html`):

- **Windowsill books → command center.** Pulling a book off the windowsill types a command on the desk monitor, then fades to that section. The resume book opens the PDF directly.
- **Mr. Oli's QA report** pops up with "3 bugs spotted in the workshop" and links to the playground. It can be dismissed and reopened.
- **Bug jar.** "Release the bugs from the jar" lets bugs loose on the desk to catch, with a running count.
- **Field notes.** Lift a folded corner of each About Me card to see a photo.
- **Skills carousel.** Auto-scrolls; use ← → keys or the buttons, and it can be paused.
- **Experience timeline.** The role in the middle of the screen stays in focus; the others dim.

In the Debug Playground (`playground/`):

| Page | Bug | Inspired by | The fix |
| --- | --- | --- | --- |
| `scanner.html` | "The scanner has déjà vu." | IoT Inventory Tracker | Ignore repeat scans within 2 seconds |
| `journal.html` | "The trail journal forgot the hike." | TrackTheTrek | Save hikes to the browser so they persist |
| `robot.html` | "Everyone deserves a turn." | HATRIC | Pick the player with the fewest turns, not always Seat 1 |

The step chips and the hub remember which bugs you've fixed.

## Project structure

```
index.html            ← the portfolio; must stay at the repository root
styles.css            ← shared by every page
script.js             ← shared by every page
playground/
  index.html          ← Debug Playground hub
  scanner.html        ← Bug 1: "The scanner has déjà vu."
  journal.html        ← Bug 2: "The trail journal forgot the hike."
  robot.html          ← Bug 3: "Everyone deserves a turn."
amplify.yml           ← Amplify build settings: no build, serve the repo root
Annie-Wu-Resume.pdf
assets/
  mountains.svg       ← footer ridge
  pg-scanner.svg      ← playground card thumbnails
  pg-journal.svg
  pg-robot.svg
  favicon.svg
  photos/             ← field-note photos (resized, location data removed)
    oli.jpg  chief.jpg  snowboard.jpg  fifa.jpg
README.md
```

`styles.css` and `script.js` are loaded with a version query (for example `styles.css?v=20261107m`) so browsers pick up changes. When you edit either file, bump the version in all five HTML pages.

These stay **local only** (listed in `.gitignore`):

- `plan.md`: private planning notes.
- `docs/submission-draft.md`: hackathon write-up draft. Paste it into Builder Center when it's final. Don't publish it here, because Amplify serves every file in the repo.

`CLAUDE.md`, `AGENTS.md`, and `.cursor/` are also local tooling files; don't upload them.

## Preview locally

Use a local HTTP server rather than opening the file directly. `file://` URLs handle things like `localStorage` and PDF links differently from the real site.

```bash
cd path/to/this/folder
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Stop the server with `Ctrl+C`.

Any static server works. If you use VS Code, the "Live Server" extension is fine too.

## Put the files on GitHub

The portfolio source repository is [github.com/awu0521/anniewu.dev](https://github.com/awu0521/anniewu.dev) (public). It is a separate link from my GitHub profile.

Upload these files and folders and **keep the structure exactly as shown**, with `index.html` at the top level of the repository (not inside a subfolder):

1. `index.html`
2. `styles.css`
3. `script.js`
4. `amplify.yml`
5. `Annie-Wu-Resume.pdf`
6. the whole `assets/` folder (five `.svg` files plus the `photos/` folder with four `.jpg` files)
7. the whole `playground/` folder (`index.html`, `scanner.html`, `journal.html`, `robot.html`)
8. `README.md` and `.gitignore`

**Using git:**

```bash
git add index.html styles.css script.js amplify.yml Annie-Wu-Resume.pdf assets playground README.md .gitignore
git commit -m "Build portfolio"
git push origin main
```

**Using the GitHub website:** open the repository → **Add file → Upload files** → drag in the files and the `assets` and `playground` folders → **Commit changes**. Afterwards, confirm that `index.html` appears on the repository's front page and that `playground/` contains four pages.

Don't upload `plan.md`, `docs/`, `CLAUDE.md`, `AGENTS.md`, or `.cursor/`.

## Deploy with AWS Amplify Hosting (GitHub)

> Create AWS resources in your project's selected Region. You can confirm the Region in **AWS Settings → View all projects → Overview → Additional info → Region**.

1. Sign in to the AWS Management Console and open **AWS Amplify**.
2. Choose **Deploy an app** (or **Create new app**, depending on the screen).
3. Choose **GitHub** as the source and select **Next**. Authorize AWS Amplify when GitHub asks; Amplify uses a GitHub App, and you can limit it to just this repository.
4. Pick the repository (`awu0521/anniewu.dev`) and the branch (`main`). Select **Next**.
5. On **App settings**, check the build settings:
   - Amplify should pick up `amplify.yml` from the repository.
   - **Build command:** none. Leave it empty. This site has no build step.
   - **Build output directory:** the repository root (`/`).
   - Don't add npm, Vite, or a `dist` folder; none of them apply here.
   - For the service role, the default ("create and use a new service role") is fine.
6. Select **Next**, review, then **Save and deploy**. A static site like this usually deploys in a minute or two.
7. When the deployment shows **Deployed**, open the default domain. It looks like `https://main.<random-id>.amplifyapp.com`.

From then on, every push to `main` redeploys automatically.

## Verify the public site

Check these on the live `amplifyapp.com` URL, not on localhost:

- [ ] The page loads over HTTPS with styles, the hero illustration, and the favicon.
- [ ] Each header link (About Me, Skills, Projects) jumps to its section, and **Resume** opens the PDF.
- [ ] Each windowsill book types its command on the monitor and fades to the right section; the resume book opens the PDF.
- [ ] **View resume** and **Download resume** both work.
- [ ] The GitHub, LinkedIn, project repository, and "This site's source" links open correctly.
- [ ] Mr. Oli's QA report appears, can be dismissed and reopened, and **Help debug** opens the playground.
- [ ] The bug jar releases bugs and the "caught" count goes up.
- [ ] Field-note cards flip to show their photos, the skills carousel scrolls with ← → and pauses, and the experience timeline highlights one role at a time.
- [ ] **Open the Debug Playground** opens the playground in a new window, and "Back to portfolio" returns.
- [ ] Scanner page: with "Record every scan", the same object lands on the shelf several times. After switching to "Ignore repeats within 2 seconds", repeats show as crossed-out squares on the detection strip and nothing new lands on the shelf.
- [ ] Journal page: in temporary mode, a hike disappears after **Close and reopen**. In "Save to this browser" mode, it stays (the chest shows the saved count), even after you reload the page. **Reset this demo** clears it.
- [ ] Robot page: "Always pick Seat 1" gives Seat 1 every turn. "Fewest turns first" evens the counts out.
- [ ] The step chips and the hub show which bugs you've fixed.
- [ ] On a phone: the menu opens and closes, nothing scrolls sideways, and the demos work by tapping.
- [ ] The browser console (DevTools → Console) shows no errors.
- [ ] After it's verified, update the footer note in `index.html` (search for "Update this note") to say the site is hosted on AWS Amplify Hosting.

## Hackathon submission reminders

- [ ] Capture **real** screenshots: the live site, the Amplify console showing the app and a successful deployment, and each playground scenario before and after the fix. The checklist is in `docs/submission-draft.md`.
- [ ] Fill in the live URL, the source repository URL, the AWS services you actually used, and your real challenges and lessons in the draft. Then post the project entry in Builder Center under **Your project**.
- [ ] **Keep the Amplify app and the GitHub repository live and public throughout judging.** Don't delete the app, disconnect the branch, or make the repository private until judging is over.
- [ ] If you're on a paid plan with a spend limit, check **AWS Settings → Billing** so the project isn't paused during judging.
