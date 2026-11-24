#!/usr/bin/env node
// Add a chapter from a finished HTML page (for example a published artifact saved to disk).
//
//   npm run new-chapter -- <slug> <path/to/chapter.html> --kind <kind> [--number 8]
//
// <kind> is what the chapter is about: data-structure, algorithm, concept or technique.
//
// Creates content/chapters/<slug>/chapter.html and a meta.json pre-filled from the page.
// Review meta.json, optionally add problems.json, then run `npm run dev`.
import fs from "node:fs";
import path from "node:path";
import { parse } from "node-html-parser";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const numberArg = flag("--number");
const kind = flag("--kind");
const KINDS = ["data-structure", "algorithm", "concept", "technique"];
const [slug, source] = args;

const fail = (msg) => {
  console.error(`\n✗ ${msg}\n\nUsage: npm run new-chapter -- <slug> <path/to/chapter.html> --kind <${KINDS.join("|")}> [--number N]\n`);
  process.exit(1);
};
if (!slug || !source) fail("Missing <slug> or <path/to/chapter.html>.");
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail(`Slug "${slug}" must be lowercase words joined by hyphens, e.g. linked-lists.`);
if (!fs.existsSync(source)) fail(`File not found: ${source}`);
if (!KINDS.includes(kind)) fail(kind ? `--kind "${kind}" is not one of: ${KINDS.join(", ")}.` : `Missing --kind: say whether the chapter is a ${KINDS.join(", ")}.`);

const root = path.join(process.cwd(), "content", "chapters");
const dir = path.join(root, slug);
if (fs.existsSync(dir)) fail(`content/chapters/${slug} already exists.`);

const html = fs.readFileSync(source, "utf8");
const doc = parse(html);
const layout = doc.querySelector("div.layout");
if (!layout || !layout.querySelector("nav.toc") || !layout.querySelector("main")) {
  fail('The page must contain <div class="layout"> with <nav class="toc"> and <main> (the shared chapter design).');
}

const existing = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => JSON.parse(fs.readFileSync(path.join(root, d.name, "meta.json"), "utf8")).number);
const number = numberArg ? Number(numberArg) : Math.max(0, ...existing) + 1;
if (!Number.isInteger(number) || number < 1) fail(`--number must be a positive integer.`);
if (existing.includes(number)) fail(`Chapter number ${number} is already used.`);

const h1 = doc.querySelector("h1");
const tagline = h1?.querySelector(".hand")?.text.replace(/^\s*—\s*/, "").trim() ?? "";
const title = (h1?.childNodes.find((n) => n.nodeType === 3)?.text ?? doc.querySelector("title")?.text.split("—")[0] ?? slug).trim();
const description = doc.querySelector('meta[name="description"]')?.getAttribute("content") ?? doc.querySelector(".sub")?.text.trim() ?? "";
const pills = doc.querySelectorAll(".meta .pill").map((p) => p.text.trim());

const meta = {
  number,
  title,
  kind,
  tagline,
  summary: description,
  description,
  difficulty: pills.find((p) => /difficulty/i.test(p))?.replace(/^Difficulty:\s*/i, "").replace(/\s*\(.*\)$/, "") ?? "Beginner → Intermediate",
  readingTime: pills.find((p) => /reading/i.test(p))?.replace(/^Reading time:\s*/i, "").replace(/\s*\(.*\)$/, "").replace(/minutes?/, "min") ?? "",
  labs: `${doc.querySelectorAll(".widget").length} interactive labs`,
};

fs.mkdirSync(dir, { recursive: true });
fs.copyFileSync(source, path.join(dir, "chapter.html"));
fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 2) + "\n");
console.log(`✓ Created content/chapters/${slug}/ as chapter ${number}.\n  Check meta.json (title, tagline, summary), add problems.json if you have practice problems, then run: npm run dev`);
