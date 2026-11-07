# Annie Wu — The Portfolio You Can Debug

My personal portfolio for the AWS Student Builder Challenge. It is a calm, ordinary portfolio (About, Tech Superpowers, Projects, Experience, Contact, resume) with one optional extra: a **Debug Playground** with three small interactive scenarios inspired by my projects.

- Built with plain HTML, CSS, and JavaScript: no frameworks, packages, build step, backend, or paid APIs.
- The portfolio itself is plain HTML with anchor links and works without JavaScript. The playground is progressive enhancement, and each demo runs in its own error boundary so it can't break navigation.
- Illustrations are original SVGs in `assets/`.

## Project structure

```
index.html            ← must stay at the repository root
styles.css
script.js
amplify.yml           ← Amplify build settings: no build, serve the repo root
Annie-Wu-Resume.pdf
assets/
  workshop.svg        ← hero illustration
  mountains.svg       ← footer ridge
  favicon.svg
README.md
```

These stay **local only** (listed in `.gitignore`):

- `plan.md`: private planning notes.
- `docs/submission-draft.md`: hackathon write-up draft. Paste it into Builder Center when it's final. Don't publish it here, because Amplify serves every file in the repo.

## Preview locally

Use a local HTTP server rather than opening the file directly. `file://` URLs handle things like `localStorage` and PDF links differently from the real site.

```bash
cd path/to/this/folder
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Stop the server with `Ctrl+C`.

Any static server works. If you use VS Code, the "Live Server" extension is fine too.

## Put the files on GitHub

The portfolio source repository is `https://github.com/awu0521/anniewu.dev` (public). It is a separate link from my GitHub profile.

Upload these files and folders and **keep the structure exactly as shown**, with `index.html` at the top level of the repository (not inside a subfolder):

1. `index.html`
2. `styles.css`
3. `script.js`
4. `amplify.yml`
5. `Annie-Wu-Resume.pdf`
6. the whole `assets/` folder (`workshop.svg`, `mountains.svg`, `favicon.svg`)
7. `README.md` and `.gitignore`

**Using git:**

```bash
git add index.html styles.css script.js amplify.yml Annie-Wu-Resume.pdf assets README.md .gitignore
git commit -m "Build portfolio"
git push origin main
```

**Using the GitHub website:** open the repository → **Add file → Upload files** → drag in the files and the `assets` folder → **Commit changes**. Afterwards, confirm that `index.html` appears on the repository's front page.

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
- [ ] Each header link (About, Tech Superpowers, Projects, Experience, Contact) jumps to its section, and **Resume** opens the PDF.
- [ ] **View resume** and **Download resume** both work.
- [ ] The GitHub, LinkedIn, project repository, and "This site's source" links open correctly.
- [ ] Scanner: scanning with "Record every scan" makes duplicates. Switching to "Ignore repeats within 2 seconds" and scanning again suppresses them.
- [ ] Journal: in temporary mode, a hike disappears after **Close and reopen**. In "Save to this browser" mode, it stays, even after you reload the page. **Reset this demo** clears it.
- [ ] Robot: "Always pick Seat 1" gives Seat 1 every turn. "Fewest turns first" evens the counts out.
- [ ] On a phone: the menu opens and closes, nothing scrolls sideways, and the demos work by tapping.
- [ ] The browser console (DevTools → Console) shows no errors.
- [ ] After it's verified, update the footer note in `index.html` (search for "Update this note") to say the site is hosted on AWS Amplify Hosting.

## Hackathon submission reminders

- [ ] Capture **real** screenshots: the live site, the Amplify console showing the app and a successful deployment, and each playground scenario before and after the fix. The checklist is in `docs/submission-draft.md`.
- [ ] Fill in the live URL, the source repository URL, the AWS services you actually used, and your real challenges and lessons in the draft. Then post the project entry in Builder Center under **Your project**.
- [ ] **Keep the Amplify app and the GitHub repository live and public throughout judging.** Don't delete the app, disconnect the branch, or make the repository private until judging is over.
- [ ] If you're on a paid plan with a spend limit, check **AWS Settings → Billing** so the project isn't paused during judging.
