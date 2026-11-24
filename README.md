# DSA Learning Studio

Illustrated, interactive textbook chapters on Data Structures and Algorithms: whiteboard-style diagrams rendered from exact data, working step-through labs, Python implementations, and inline citations.

## Chapters

| # | Topic | Path |
|---|---|---|
| 01 | Time & Space Complexity | [`chapters/time-space-complexity/`](chapters/time-space-complexity/index.html) |
| 02 | Arrays & Hashing | [`chapters/arrays-hashing/`](chapters/arrays-hashing/index.html) |
| 03 | Prefix Sum | [`chapters/prefix-sum/`](chapters/prefix-sum/index.html) |
| 04 | Two Pointers | [`chapters/two-pointers/`](chapters/two-pointers/index.html) |

## Structure

```
index.html                    # home page listing all chapters
chapters/<topic-slug>/index.html   # one self-contained chapter per folder
vercel.json                   # static hosting config (clean URLs)
```

Each chapter is a single self-contained HTML file (inline CSS and JS; only Google Fonts and highlight.js from cdnjs are loaded externally). There is no build step.

## Adding a chapter

1. Create `chapters/<topic-slug>/index.html` using the same design system as `chapters/prefix-sum/index.html` (same `:root` colour tokens, fonts, `.fig` / `.widget` / `.callout` components and the `Sketch` SVG renderer).
2. Keep the `← All chapters` link at the top of the chapter's table of contents.
3. Add a card for it in `index.html` and a row in the table above.

## Deploying to Vercel

Import this repository in Vercel with framework preset **Other**, no build command, and output directory `.` (the repository root). Every push to `main` redeploys.

## Run locally

```
python -m http.server 8000
```

Then open http://localhost:8000.
