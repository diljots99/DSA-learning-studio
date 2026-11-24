# DSA Learning Studio

Illustrated, interactive textbook chapters on Data Structures and Algorithms: whiteboard-style diagrams rendered from exact data, working step-through labs, Python implementations, inline citations, and practice problems with progress tracking and notes.

Built with Next.js (App Router) and Firebase. Every page is rendered on the server, so the full chapter text, highlighted code and problem lists are in the HTML before any JavaScript runs. Learners can sign in with email and password or Google to sync their progress and notes.

## Chapters

| # | Topic | Content folder |
|---|---|---|
| 01 | Time & Space Complexity | [`content/chapters/time-space-complexity/`](content/chapters/time-space-complexity/) |
| 02 | Arrays & Hashing | [`content/chapters/arrays-hashing/`](content/chapters/arrays-hashing/) |
| 03 | Prefix Sum | [`content/chapters/prefix-sum/`](content/chapters/prefix-sum/) |
| 04 | Two Pointers | [`content/chapters/two-pointers/`](content/chapters/two-pointers/) |
| 05 | Sliding Window | [`content/chapters/sliding-window/`](content/chapters/sliding-window/) |
| 06 | Binary Search | [`content/chapters/binary-search/`](content/chapters/binary-search/) |
| 07 | Stacks | [`content/chapters/stacks/`](content/chapters/stacks/) |

## Adding content

All content lives in [`content/`](content/README.md), one folder per chapter. To add a chapter:

```
npm run new-chapter -- <slug> path/to/chapter.html
```

See [content/README.md](content/README.md) for the file formats.

## Run locally

```
npm install
npm run dev
```

Then open http://localhost:3000. Without Firebase settings the site works fully, with progress saved in the browser and sign-in shown as "coming soon". `npm run build && npm start` runs the production build.

To work on accounts locally without a real Firebase project, use the Firebase emulators (needs Java 17+; Firebase CLI 15+ will need Java 21):

```
cp .env.example .env.local      # then uncomment the emulator block
npm run emulators               # auth on :9099, Firestore on :8080, admin UI on http://127.0.0.1:4040
npm run dev                     # in a second terminal
```

`npm run test:rules` runs the security-rule tests against the Firestore emulator.

## How it fits together

```
app/
  layout.tsx                 fonts, tokens, AuthProvider, ProgressProvider, account pill, consent prompt, cookie banner
  page.tsx                   home page, generated from content/chapters/*/meta.json
  chapters/[slug]/page.tsx   one route for every chapter, prerendered on the server
  login/ signup/ reset-password/ account/   sign-in pages and the account page
  privacy/page.tsx           privacy notice (DPDP Act), reads content/site.json
  problems/page.tsx          /problems/?id=<problem id>: one problem's solution on its own page
components/
  AuthProvider.tsx           Firebase Auth: email/password, Google, reset, verify, export, delete
  ProgressProvider.tsx       picks the progress store: Firestore when signed in with consent, else this browser
  PracticeProblems.tsx       problem list: filters, solved ticks, progress bar, "My solution" drawer
  solution/                  solution form (language, complexity, approach, notes), CodeMirror code editor,
                             side drawer and full page; the editor loads only when a solution is opened
  ConsentGate.tsx            age + consent prompt after a first Google sign-in
  CookieBanner.tsx           "Legally required cookie banner" with the Sardar ji illustration
  ChapterRuntime.tsx         runs a chapter's lab scripts after the page loads
lib/
  content.ts                 reads content/, splits each chapter, highlights code on the server
  firebase/client.ts         Firebase app, Auth and Firestore (emulators in development)
  account.ts                 profile, consent record, data export and deletion
  progress/                  ProgressStore interface, browser store, Firestore store
content/                     chapters, practice problems, site.json (operator and grievance contact)
firestore.rules              database security rules (deny by default)
scripts/test-rules.mjs       39 automated security-rule tests
```

Each chapter page keeps its original design: its own styles are scoped to its page, and its lab scripts run unchanged.

## Accounts, progress and notes

Learners can use everything without an account; solved ticks, solution write-ups and notes are then kept in the browser. With an account (email and password, or Google) they are stored in Cloud Firestore and synced across devices:

```
users/{uid}                       uid, displayName, email, createdAt, updatedAt,
                                  consent { accepted, ageConfirmed, version, acceptedAt }
users/{uid}/progress/{problemId}  problemId, solved, note (≤ 5000 chars), updatedAt,
                                  optional solution write-up: language (≤ 30), approach (≤ 5000),
                                  timeComplexity, spaceComplexity (≤ 100 each), code (≤ 20000)
```

`firestore.rules` denies everything by default, lets each signed-in user read and write only their own documents, validates every field and size, forces server timestamps, stops consent records being rewritten, and refuses progress writes until consent is recorded. On first sign-in, progress already saved in the browser is copied into the account.

### Privacy (DPDP Act, 2023)

- Plain-language privacy notice at `/privacy/`: data collected and why, processors, retention, security, rights, children, grievance redressal and complaints to the Data Protection Board.
- Accounts are for 18+ only. Sign-up needs two unticked checkboxes (age, and consent to the notice); a first Google sign-in shows the same prompt before anything is stored, and declining deletes the new sign-in record.
- The consent record (notice version and time) is stored with the profile.
- Account page: correct your name, download all your data as JSON, and withdraw consent by deleting the account, which erases every document and the sign-in record.
- Cookie banner: the site only uses strictly necessary storage, and the banner says so. It reappears when the notice version changes and can be reopened from "Cookie settings".

These features follow the Act's notice, consent and rights requirements, but they are not legal advice. Have the privacy notice reviewed before launch.

### Setting up Firebase (one time)

1. The Firebase project `dsa-learning-studio` exists. In the console (https://console.firebase.google.com), create the **Firestore database**: choose an Indian region (for example `asia-south1`, Mumbai) when you create the Firestore database, in **production mode**.
2. **Authentication → Sign-in method:** enable **Email/Password** and **Google**.
3. **Authentication → Settings:** add your domains (`dsa.diljotsingh.com` and your Vercel preview domain) under **Authorized domains**. Under **Password policy**, require at least 8 characters with a number. Keep **email enumeration protection** on.
4. The web app config for project `dsa-learning-studio` is already in `.env.production` (used by Vercel builds) and `.firebaserc`. These values are public identifiers, not secrets. Firebase Analytics is intentionally not used: it would set tracking cookies that need opt-in consent.
5. Deploy the security rules:
   ```
   npx firebase login
   npx firebase deploy --only firestore:rules
   ```
6. Put the grievance contact's name and email in `content/site.json`. Until you do, the privacy notice shows a visible placeholder.
7. Recommended: turn on **App Check** (reCAPTCHA Enterprise) for Auth and Firestore, set a billing budget alert, and set the sender name on **Authentication → Templates**.

## Deploying to Vercel

`vercel.json` sets the framework to Next.js, so the project builds with `next build`. If the Vercel project was created for the old static site, also check that **Settings → Build & Development** has no custom Output Directory (it was `.` before) and no custom build command.
