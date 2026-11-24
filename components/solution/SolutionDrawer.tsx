"use client";

import { useEffect, useRef } from "react";
import type { ProblemProgress } from "@/lib/progress/types";
import type { Problem } from "@/lib/types";
import SolutionForm, { solutionHref, type Draft } from "./SolutionForm";
import s from "./Solution.module.css";

/** Side panel with the solution form for one problem. Esc or the backdrop closes it; edits are saved on close. */
export default function SolutionDrawer({
  problem,
  progress,
  onSave,
  onClose,
}: {
  problem: Problem;
  progress: ProblemProgress;
  onSave: (d: Draft) => Promise<void>;
  onClose: () => void;
}) {
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      // Esc inside the code editor first leaves the editor's Tab-trap; only close when focus is elsewhere.
      if (e.key === "Escape" && !(e.target as HTMLElement).closest(".cm-editor")) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      opener?.focus();
    };
  }, [onClose]);

  return (
    <>
      <div className={s.backdrop} onClick={onClose} aria-hidden="true" />
      <aside className={s.drawer} role="dialog" aria-modal="true" aria-labelledby="sol-title">
        <header className={s.head}>
          <div>
            <h2 id="sol-title">{problem.name}</h2>
            <p className={s.meta}>
              <span className={`${s.d} ${s[problem.difficulty]}`}>{problem.difficulty}</span>
              <a href={problem.url} target="_blank" rel="noopener noreferrer">
                Open on {problem.platform} ↗
              </a>
              <a href={solutionHref(problem.id)}>Open as full page</a>
            </p>
          </div>
          <button ref={closeBtn} type="button" className={s.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <SolutionForm key={problem.id} initial={progress} onSave={onSave} name={problem.name} />
      </aside>
    </>
  );
}
