"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProgressStore } from "../ProgressProvider";
import { emptyProgress, type ProblemProgress } from "@/lib/progress/types";
import type { ProblemIndexEntry } from "@/lib/content";
import SolutionForm, { type Draft } from "./SolutionForm";
import s from "./Solution.module.css";

/** Full-page solution view for the problem named in ?id=. */
export default function SolutionPage({ chapters }: { chapters: ProblemIndexEntry[] }) {
  const id = useSearchParams().get("id") ?? "";
  const store = useProgressStore();
  const found = useMemo(() => {
    for (const chapter of chapters) {
      const problem = chapter.problems.find((p) => p.id === id);
      if (problem) return { problem, chapter };
    }
    return null;
  }, [chapters, id]);
  const [progress, setProgress] = useState<ProblemProgress | null>(null);

  useEffect(() => {
    let alive = true;
    setProgress(null);
    store.load([id]).then((m) => alive && setProgress(m[id] ?? emptyProgress()));
    return () => {
      alive = false;
    };
  }, [store, id]);

  const save = useCallback(
    async (d: Draft) => {
      setProgress(await store.update(id, d));
    },
    [store, id],
  );

  if (!found) {
    return (
      <main className={s.page}>
        <a href="/">← DSA Learning Studio</a>
        <h1>Problem not found</h1>
        <p className={s.muted}>This link doesn’t match a practice problem. Open “My solution” from any chapter’s practice list.</p>
      </main>
    );
  }

  const { problem, chapter } = found;
  return (
    <main className={s.page}>
      <nav className={s.crumbs}>
        <a href="/">← All chapters</a>
        <a href={`/chapters/${chapter.slug}/#practice`}>
          {String(chapter.number).padStart(2, "0")} · {chapter.title}: practice problems
        </a>
      </nav>
      <h1>{problem.name}</h1>
      <p className={s.meta}>
        <span className={`${s.d} ${s[problem.difficulty]}`}>{problem.difficulty}</span>
        <a href={problem.url} target="_blank" rel="noopener noreferrer">
          Open on {problem.platform} ↗
        </a>
        {progress && (
          <label className={s.solved}>
            <input type="checkbox" checked={progress.solved} onChange={async (e) => setProgress(await store.update(id, { solved: e.target.checked }))} />
            Solved
          </label>
        )}
        <span className={s.muted}>{store.label}</span>
      </p>
      <section className={s.card}>
        {progress ? <SolutionForm key={id} initial={progress} onSave={save} name={problem.name} editorHeight={380} /> : <p className={s.muted}>Loading your solution…</p>}
      </section>
    </main>
  );
}
