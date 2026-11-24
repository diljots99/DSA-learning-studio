/** What a chapter is about. Set as "kind" in content/chapters/<slug>/meta.json. */
export const CHAPTER_KINDS = ["data-structure", "algorithm", "concept", "technique"] as const;
export type ChapterKind = (typeof CHAPTER_KINDS)[number];

export interface KindInfo {
  label: string;
  /** Short explanation shown in the tooltip. */
  description: string;
  examples: string;
}

export const KIND_INFO: Record<ChapterKind, KindInfo> = {
  "data-structure": {
    label: "Data Structure",
    description: "A way of organising data in memory so that certain operations, like lookup, insert or remove, are fast.",
    examples: "Arrays, hash tables, stacks, trees",
  },
  algorithm: {
    label: "Algorithm",
    description: "A precise, step-by-step procedure that solves a specific problem, with provable correctness and cost.",
    examples: "Binary search, merge sort, Dijkstra",
  },
  concept: {
    label: "Concept",
    description: "A foundational idea you use to reason about every data structure and algorithm.",
    examples: "Time & space complexity, recursion",
  },
  technique: {
    label: "Technique",
    description: "A reusable problem-solving pattern you apply on top of data structures to turn slow solutions into fast ones.",
    examples: "Two pointers, sliding window, prefix sums",
  },
};

export const isChapterKind = (v: unknown): v is ChapterKind => typeof v === "string" && (CHAPTER_KINDS as readonly string[]).includes(v);
