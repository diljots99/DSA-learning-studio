# Content

Everything the site shows lives here. Code in `app/`, `components/` and `lib/` reads these files; you should not need to touch code to add or edit a chapter.

```
content/chapters/<slug>/
  chapter.html    the chapter, exactly as authored (full HTML page)
  meta.json       card and page metadata
  problems.json   practice problems (optional)
```

The folder name is the URL: `content/chapters/prefix-sum/` is served at `/chapters/prefix-sum/`.

## Add a chapter

1. Save the finished chapter page (for example a published artifact) as an `.html` file.
2. Run:

   ```
   npm run new-chapter -- linked-lists path/to/linked-lists.html --kind data-structure
   ```

   This copies the page to `content/chapters/linked-lists/chapter.html`, gives it the next chapter number (or pass `--number 8`), and writes a `meta.json` pre-filled from the page.
3. Check `meta.json`, add `problems.json` if you have practice problems, and run `npm run dev`.

The chapter appears on the home page automatically, ordered by `number`.

### What `chapter.html` must contain

The shared chapter design: a `<div class="layout">` holding `<nav class="toc">` (the sidebar) and `<main>` (the chapter). Styles in `<style>` tags and inline `<script>` tags are kept and scoped to that chapter's page. Python code blocks written as `<pre><code class="language-python">` are syntax-highlighted on the server, so the highlight.js CDN script is not needed.

The practice problems section is inserted automatically just before `<h2 id="advanced">` (section N), with a sidebar link after the "Interview preparation" link. If a chapter has no `#advanced` heading, the section goes at the end.

## meta.json

```json
{
  "number": 8,
  "title": "Linked Lists",
  "kind": "data-structure",
  "tagline": "follow the pointers",
  "summary": "One or two sentences for the home page card.",
  "description": "Search-engine and social-preview description.",
  "difficulty": "Beginner → Intermediate",
  "readingTime": "~80 min",
  "labs": "5 interactive labs"
}
```

All fields are required, and each `number` must be unique; the build fails with a clear message otherwise.

`kind` sets the coloured tag shown on the home page card and at the top of the chapter, with a tooltip explaining it:

| kind | Tag | Use for |
|---|---|---|
| `data-structure` | blue | Ways of organising data: arrays, hash tables, stacks, trees |
| `algorithm` | green | Step-by-step procedures: binary search, sorting, Dijkstra |
| `concept` | purple | Foundational ideas: complexity, recursion |
| `technique` | orange | Reusable patterns: two pointers, sliding window, prefix sums |

The labels and tooltip text live in `lib/chapter-kinds.ts`.

## problems.json

```json
{
  "intro": "One or two sentences on how to approach this chapter's problems.",
  "levels": [
    {
      "level": "Basic",
      "blurb": "Direct applications of this chapter's core idea.",
      "topics": [
        {
          "name": "Linked List",
          "blurb": "One line about this group.",
          "problems": [
            {
              "id": "leetcode:reverse-linked-list",
              "name": "Reverse Linked List",
              "difficulty": "Easy",
              "platform": "LeetCode",
              "url": "https://leetcode.com/problems/reverse-linked-list/"
            }
          ]
        }
      ]
    }
  ]
}
```

- `level` is one of `Beginner`, `Basic`, `Intermediate`, `Advanced`; `difficulty` is `Easy`, `Medium` or `Hard`.
- `id` is the permanent key for a learner's progress and notes. Use `<platform>:<problem-slug>` and **never change it** once published, or saved progress for that problem is lost.
- The problem count on the home page card is computed from this file.
