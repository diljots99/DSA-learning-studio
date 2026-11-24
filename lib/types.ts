export type Difficulty = "Easy" | "Medium" | "Hard";
export type Level = "Beginner" | "Basic" | "Intermediate" | "Advanced";

/** content/chapters/<slug>/meta.json */
export interface ChapterMetaFile {
  number: number;
  title: string;
  tagline: string;
  summary: string;
  description: string;
  difficulty: string;
  readingTime: string;
  labs: string;
}

export interface ChapterMeta extends ChapterMetaFile {
  slug: string;
  problemCount: number;
}

export interface Problem {
  /** Stable id, e.g. "leetcode:two-sum". Used as the key for progress and notes. */
  id: string;
  name: string;
  difficulty: Difficulty;
  platform: string;
  url: string;
}

export interface ProblemTopic {
  name: string;
  blurb: string;
  problems: Problem[];
}

export interface ProblemLevel {
  level: Level;
  blurb: string;
  topics: ProblemTopic[];
}

/** content/chapters/<slug>/problems.json */
export interface ProblemSet {
  intro: string;
  levels: ProblemLevel[];
}

export interface Chapter {
  meta: ChapterMeta;
  /** All <style> blocks of the chapter, scoped to its page. */
  css: string;
  /** Markup that sits before / after the two-column layout (e.g. shared SVG defs). */
  before: string;
  after: string;
  /** Inner HTML of the sidebar table of contents. */
  toc: string;
  /** Inner HTML of <main>, split where the practice problems are inserted. */
  mainBefore: string;
  mainAfter: string;
  /** The chapter's inline scripts (labs, figures), wrapped so they can be re-run safely. */
  script: string;
  problems: ProblemSet | null;
}
