# DSA Learning Studio

Illustrated, interactive textbook chapters on Data Structures and Algorithms: whiteboard-style diagrams rendered from exact data, working step-through labs, Python implementations, inline citations, and practice problems with progress tracking and notes.

Built with Next.js (App Router). Every page is rendered on the server, so the full chapter text, highlighted code and problem lists are in the HTML before any JavaScript runs.

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

Then open http://localhost:3000. `npm run build && npm start` runs the production build.

## How it fits together

```
app/
  layout.tsx                 fonts, global tokens, ProgressProvider
  page.tsx                   home page, generated from content/chapters/*/meta.json
  chapters/[slug]/page.tsx   one route for every chapter, prerendered on the server
components/
  PracticeProblems.tsx       problem list: filters, solved ticks, notes, progress bar
  ProgressProvider.tsx       chooses where progress is stored (one place to change)
  ChapterRuntime.tsx         runs a chapter's lab scripts after the page loads
lib/
  content.ts                 reads content/, splits each chapter, highlights code on the server
  progress/types.ts          the ProgressStore interface
  progress/local-store.ts    progress kept in this browser (localStorage)
content/chapters/<slug>/     chapter.html, meta.json, problems.json
scripts/new-chapter.mjs      import a chapter page into content/
```

Each chapter page keeps its original design: its own styles are scoped to its page, and its lab scripts run unchanged. Ticks saved by the old static site are imported automatically the first time a learner opens a chapter.

## Progress, notes and sign-in

Learners can tick problems as solved and write notes for each one. Both go through one interface, `ProgressStore` (`lib/progress/types.ts`). Today the only implementation is `LocalProgressStore`, which saves in the browser.

To add Google sign-in with Supabase later:

1. Add `@supabase/supabase-js` and `@supabase/ssr`, and enable the Google provider in the Supabase dashboard.
2. Create a `problem_progress` table: `user_id uuid`, `problem_id text`, `solved boolean`, `note text`, `updated_at timestamptz`, primary key `(user_id, problem_id)`, with row-level security so users only read and write their own rows.
3. Write a `SupabaseProgressStore` that implements `ProgressStore`, and pick it in `ProgressProvider` when a user is signed in.
4. Optionally copy a learner's local progress into Supabase on their first sign-in.

The problem `id`s in `problems.json` are the keys, so they must stay stable.

## Deploying to Vercel

`vercel.json` sets the framework to Next.js, so the project builds with `next build`. If the Vercel project was created for the old static site, also check that **Settings → Build & Development** has no custom Output Directory (it was `.` before) and no custom build command.
