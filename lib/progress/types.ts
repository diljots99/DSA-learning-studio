/** What we remember about one practice problem for one learner. */
export interface ProblemProgress {
  solved: boolean;
  note: string;
  /** ISO timestamp of the last change. */
  updatedAt: string;
}

export type ProgressMap = Record<string, ProblemProgress>;

export interface ProgressPatch {
  solved?: boolean;
  note?: string;
}

/**
 * Where progress is stored. Today: LocalProgressStore (this browser only).
 * Later: a Supabase-backed store for signed-in users, e.g. a table
 *   problem_progress(user_id uuid, problem_id text, solved bool, note text, updated_at timestamptz,
 *                    primary key (user_id, problem_id))
 * with row-level security so each user only sees their own rows. Components never
 * talk to storage directly, so swapping the store is a change in ProgressProvider only.
 */
export interface ProgressStore {
  /** Human-readable description shown under the progress bar. */
  readonly label: string;
  /** Progress for the given problem ids (missing ids mean "not started"). */
  load(problemIds: string[]): Promise<ProgressMap>;
  /** Apply a change and return the stored result. */
  update(problemId: string, patch: ProgressPatch): Promise<ProblemProgress>;
}

export const emptyProgress = (): ProblemProgress => ({ solved: false, note: "", updatedAt: "" });
