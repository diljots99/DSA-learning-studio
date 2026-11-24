import { emptyProgress, isEmptyProgress, normalizeProgress, type ProblemProgress, type ProgressMap, type ProgressPatch, type ProgressStore } from "./types";

const KEY = "dsa-studio-progress-v1";
/** The static site stored solved problems as { [problemUrl]: 1 }. */
const LEGACY_KEY = "dsa-studio-solved";

function readAll(): ProgressMap {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(Object.entries(parsed).map(([id, p]) => [id, normalizeProgress(p as Partial<ProblemProgress>)]));
  } catch {
    return {};
  }
}

function writeAll(all: ProgressMap) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable (private mode, quota): progress lasts for this visit only */
  }
}

/** Progress kept in this browser's localStorage. */
export class LocalProgressStore implements ProgressStore {
  readonly label = "Saved in this browser";
  private memory: ProgressMap | null = null;

  private all(): ProgressMap {
    if (!this.memory) this.memory = readAll();
    return this.memory;
  }

  /** Everything saved in this browser (used to copy progress into a new account). */
  entries(): ProgressMap {
    return { ...this.all() };
  }

  async load(problemIds: string[]): Promise<ProgressMap> {
    const all = this.all();
    const out: ProgressMap = {};
    for (const id of problemIds) if (all[id]) out[id] = all[id];
    return out;
  }

  async update(problemId: string, patch: ProgressPatch): Promise<ProblemProgress> {
    const all = this.all();
    const next = normalizeProgress({ ...(all[problemId] ?? emptyProgress()), ...patch, updatedAt: new Date().toISOString() });
    if (isEmptyProgress(next)) delete all[problemId];
    else all[problemId] = next;
    writeAll(all);
    return next;
  }

  /** One-time import of "solved" ticks saved by the old static site (keyed by problem URL). */
  importLegacy(problems: { id: string; url: string }[]) {
    let legacy: Record<string, unknown> = {};
    try {
      legacy = JSON.parse(window.localStorage.getItem(LEGACY_KEY) || "{}") as Record<string, unknown>;
    } catch {
      return;
    }
    const all = this.all();
    let changed = false;
    for (const p of problems) {
      if (legacy[p.url] && !all[p.id]) {
        all[p.id] = { ...emptyProgress(), solved: true, updatedAt: new Date().toISOString() };
        changed = true;
      }
    }
    if (changed) writeAll(all);
  }
}
