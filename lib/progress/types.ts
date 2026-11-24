/** What we remember about one practice problem for one learner. */
export interface ProblemProgress {
  solved: boolean;
  /** Private revision notes: what to remember next time. */
  note: string;
  /** The learner's write-up of their solution. Stored as plain text, never run or rendered as HTML. */
  language: string;
  approach: string;
  timeComplexity: string;
  spaceComplexity: string;
  code: string;
  /** ISO timestamp of the last change. */
  updatedAt: string;
}

export type ProgressMap = Record<string, ProblemProgress>;

export type ProgressPatch = Partial<Omit<ProblemProgress, "updatedAt">>;

/** Text fields, with the longest value firestore.rules accepts for each. */
export const TEXT_LIMITS = {
  note: 5000,
  language: 30,
  approach: 5000,
  timeComplexity: 100,
  spaceComplexity: 100,
  code: 20000,
} as const satisfies Record<keyof Omit<ProblemProgress, "solved" | "updatedAt">, number>;

export type TextField = keyof typeof TEXT_LIMITS;
export const TEXT_FIELDS = Object.keys(TEXT_LIMITS) as TextField[];

/**
 * Where progress is stored:
 *   LocalProgressStore      this browser only (signed out)
 *   FirestoreProgressStore  users/{uid}/progress in Cloud Firestore (signed in with recorded consent)
 * Components never talk to storage directly; ProgressProvider picks the store.
 */
export interface ProgressStore {
  /** Human-readable description shown under the progress bar. */
  readonly label: string;
  /** Progress for the given problem ids (missing ids mean "not started"). */
  load(problemIds: string[]): Promise<ProgressMap>;
  /** Apply a change and return the stored result. */
  update(problemId: string, patch: ProgressPatch): Promise<ProblemProgress>;
}

export const emptyProgress = (): ProblemProgress => ({
  solved: false,
  note: "",
  language: "",
  approach: "",
  timeComplexity: "",
  spaceComplexity: "",
  code: "",
  updatedAt: "",
});

/** Fill in missing fields (older saves only had solved + note) and clip text to the stored limits. */
export function normalizeProgress(raw: Partial<Record<keyof ProblemProgress, unknown>> | undefined): ProblemProgress {
  const out = emptyProgress();
  if (!raw) return out;
  out.solved = Boolean(raw.solved);
  for (const f of TEXT_FIELDS) if (typeof raw[f] === "string") out[f] = (raw[f] as string).slice(0, TEXT_LIMITS[f]);
  if (typeof raw.updatedAt === "string") out.updatedAt = raw.updatedAt;
  return out;
}

/** True when nothing is worth keeping, so the record can be deleted instead of stored. */
export const isEmptyProgress = (p: ProblemProgress) => !p.solved && TEXT_FIELDS.every((f) => !p[f].trim());

/** True when the learner has written up a solution (anything besides the tick and revision notes). */
export const hasSolution = (p: ProblemProgress) => TEXT_FIELDS.some((f) => f !== "note" && f !== "language" && p[f].trim() !== "");
