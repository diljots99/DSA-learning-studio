/**
 * Server-only content loader. Every chapter lives in content/chapters/<slug>/:
 *   chapter.html   the chapter exactly as authored (a full, self-contained HTML page)
 *   meta.json      number, title, tagline, summary, ... (see ChapterMetaFile)
 *   problems.json  optional practice problems (see ProblemSet)
 * Adding a folder is all it takes: the home page, routes and metadata pick it up.
 */
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { parse, type HTMLElement, type Node } from "node-html-parser";
import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import type { Chapter, ChapterMeta, ChapterMetaFile, Problem, ProblemSet } from "./types";
import { CHAPTER_KINDS, isChapterKind } from "./chapter-kinds";

hljs.registerLanguage("python", python);

const CHAPTERS_DIR = path.join(process.cwd(), "content", "chapters");
const REQUIRED_META: (keyof ChapterMetaFile)[] = ["number", "title", "kind", "tagline", "summary", "description", "difficulty", "readingTime", "labs"];
const PRACTICE_ANCHOR = '<h2 id="advanced"';
const PRACTICE_TOC_LINK = '<a href="#practice">★ · Practice problems</a>';

function readJson<T>(file: string): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch (err) {
    throw new Error(`Could not read ${path.relative(process.cwd(), file)}: ${(err as Error).message}`);
  }
}

function readProblems(slug: string): ProblemSet | null {
  const file = path.join(CHAPTERS_DIR, slug, "problems.json");
  return fs.existsSync(file) ? readJson<ProblemSet>(file) : null;
}

function readMeta(slug: string): ChapterMeta {
  const meta = readJson<ChapterMetaFile>(path.join(CHAPTERS_DIR, slug, "meta.json"));
  const missing = REQUIRED_META.filter((k) => meta[k] === undefined || meta[k] === "");
  if (missing.length) throw new Error(`content/chapters/${slug}/meta.json is missing: ${missing.join(", ")}`);
  if (!isChapterKind(meta.kind)) {
    throw new Error(`content/chapters/${slug}/meta.json has kind "${meta.kind}"; use one of: ${CHAPTER_KINDS.join(", ")}`);
  }
  const problems = readProblems(slug);
  const problemCount = problems ? problems.levels.reduce((n, l) => n + l.topics.reduce((m, t) => m + t.problems.length, 0), 0) : 0;
  return { ...meta, slug, problemCount };
}

/** All chapters, ordered by their number. */
export const listChapters = cache((): ChapterMeta[] => {
  const slugs = fs
    .readdirSync(CHAPTERS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(CHAPTERS_DIR, d.name, "chapter.html")))
    .map((d) => d.name);
  const chapters = slugs.map(readMeta).sort((a, b) => a.number - b.number);
  const seen = new Map<number, string>();
  for (const c of chapters) {
    if (seen.has(c.number)) throw new Error(`Chapters "${seen.get(c.number)}" and "${c.slug}" both use number ${c.number}`);
    seen.set(c.number, c.slug);
  }
  return chapters;
});

/** Lightweight index of every chapter's practice problems (for progress summaries). */
export interface ProblemIndexEntry {
  slug: string;
  number: number;
  title: string;
  problems: Problem[];
}

export const listProblemIndex = cache((): ProblemIndexEntry[] =>
  listChapters()
    .filter((c) => c.problemCount > 0)
    .map((c) => ({
      slug: c.slug,
      number: c.number,
      title: c.title,
      problems: (readProblems(c.slug)?.levels ?? []).flatMap((l) => l.topics.flatMap((t) => t.problems.map(({ id, name, url, difficulty, platform }) => ({ id, name, url, difficulty, platform })))),
    })),
);

const decodeEntities = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

/** Syntax-highlight Python code blocks on the server so the HTML ships already coloured. */
function highlightCode(html: string): string {
  return html.replace(/<code class="language-python">([\s\S]*?)<\/code>/g, (_m, code: string) => {
    const out = hljs.highlight(decodeEntities(code), { language: "python" }).value;
    return `<code class="language-python hljs">${out}</code>`;
  });
}

const outerHtml = (nodes: Node[]) => nodes.map((n) => n.toString()).join("").trim();

export const getChapter = cache((slug: string): Chapter | null => {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const file = path.join(CHAPTERS_DIR, slug, "chapter.html");
  if (!fs.existsSync(file)) return null;

  const meta = readMeta(slug);
  const problems = readProblems(slug);
  const doc = parse(fs.readFileSync(file, "utf8"), { comment: false });
  const where = `content/chapters/${slug}/chapter.html`;

  const css = doc.querySelectorAll("style").map((s) => s.innerHTML).join("\n");

  // Inline scripts become the page's client runtime. External scripts (the highlight.js CDN)
  // and their init snippets are dropped: code is highlighted on the server instead.
  const scripts = doc
    .querySelectorAll("script")
    .filter((s) => !s.getAttribute("src") && !s.innerHTML.includes("hljs"))
    .map((s) => s.innerHTML);
  const script = scripts.length ? `(function(){\n${scripts.join("\n;\n")}\n})();` : "";

  doc.querySelectorAll("script, style").forEach((n) => n.remove());

  const body = doc.querySelector("body");
  const layout = body?.querySelector("div.layout");
  const nav = layout?.querySelector("nav.toc");
  const main = layout?.querySelector("main");
  if (!body || !layout || !nav || !main) throw new Error(`${where} must contain <div class="layout"> with <nav class="toc"> and <main>`);

  const kids = body.childNodes;
  const at = kids.indexOf(layout as HTMLElement);
  const before = outerHtml(kids.slice(0, at));
  const after = outerHtml(kids.slice(at + 1));

  let toc = nav.innerHTML;
  const mainHtml = highlightCode(main.innerHTML);
  let mainBefore = mainHtml;
  let mainAfter = "";
  if (problems) {
    const cut = mainHtml.indexOf(PRACTICE_ANCHOR);
    if (cut >= 0) {
      mainBefore = mainHtml.slice(0, cut);
      mainAfter = mainHtml.slice(cut);
    }
    const tocLink = /(<a[^>]*href="#interview"[^>]*>[^<]*<\/a>)/;
    toc = tocLink.test(toc) ? toc.replace(tocLink, `$1\n${PRACTICE_TOC_LINK}`) : `${toc}\n${PRACTICE_TOC_LINK}`;
  }

  return { meta, css, before, after, toc, mainBefore, mainAfter, script, problems };
});
