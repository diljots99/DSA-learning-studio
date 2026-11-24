"use client";

import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc, type Firestore } from "firebase/firestore";
import { emptyProgress, isEmptyProgress, normalizeProgress, TEXT_FIELDS, TEXT_LIMITS, type ProblemProgress, type ProgressMap, type ProgressPatch, type ProgressStore } from "./types";

/** Firestore document ids cannot contain "/", so problem ids are URI-encoded. */
export const progressDocId = (problemId: string) => encodeURIComponent(problemId);

/** Progress for a signed-in learner, stored in users/{uid}/progress (see firestore.rules). */
export class FirestoreProgressStore implements ProgressStore {
  readonly label = "Synced to your account";
  private cache: ProgressMap | null = null;

  constructor(
    private readonly db: Firestore,
    private readonly uid: string,
  ) {}

  private col() {
    return collection(this.db, "users", this.uid, "progress");
  }

  async loadAll(): Promise<ProgressMap> {
    if (this.cache) return this.cache;
    const snap = await getDocs(this.col());
    const all: ProgressMap = {};
    snap.forEach((d) => {
      const data = d.data();
      all[data.problemId as string] = normalizeProgress({ ...data, updatedAt: data.updatedAt?.toDate?.().toISOString?.() ?? "" });
    });
    this.cache = all;
    return all;
  }

  async load(problemIds: string[]): Promise<ProgressMap> {
    const all = await this.loadAll();
    const out: ProgressMap = {};
    for (const id of problemIds) if (all[id]) out[id] = all[id];
    return out;
  }

  async update(problemId: string, patch: ProgressPatch): Promise<ProblemProgress> {
    const all = await this.loadAll();
    const next = normalizeProgress({ ...(all[problemId] ?? emptyProgress()), ...patch, updatedAt: new Date().toISOString() });
    const ref = doc(this.col(), progressDocId(problemId));
    if (isEmptyProgress(next)) {
      await deleteDoc(ref); // nothing left to keep: store no data at all
      delete all[problemId];
    } else {
      const text = Object.fromEntries(TEXT_FIELDS.map((f) => [f, next[f].slice(0, TEXT_LIMITS[f])]));
      await setDoc(ref, { problemId, solved: next.solved, ...text, updatedAt: serverTimestamp() });
      all[problemId] = next;
    }
    return next;
  }
}
