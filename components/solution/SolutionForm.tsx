"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { TEXT_FIELDS, TEXT_LIMITS, type ProblemProgress, type TextField } from "@/lib/progress/types";
import s from "./Solution.module.css";

// The editor is loaded only when a solution is opened, so chapter pages stay light.
const CodeEditor = dynamic(() => import("./CodeEditor"), { ssr: false, loading: () => <div className={s.editorLoading}>Loading editor…</div> });

const LANGUAGES = ["Python", "Java", "C++", "C", "JavaScript", "TypeScript", "Go", "C#", "Kotlin", "Rust", "Swift", "Other"];
export type Draft = Pick<ProblemProgress, TextField>;
const draftOf = (p: ProblemProgress): Draft => Object.fromEntries(TEXT_FIELDS.map((f) => [f, p[f]])) as Draft;

/** Link to a problem's full-page solution view. Problem ids can contain "/" and ":", so they go in the query string. */
export const solutionHref = (problemId: string) => `/problems/?id=${encodeURIComponent(problemId)}`;

/**
 * The learner's write-up for one problem: language, complexity, approach, code (in a real code editor)
 * and revision notes. Autosaves after a short pause and when a field loses focus.
 */
export default function SolutionForm({
  initial,
  onSave,
  name,
  editorHeight,
}: {
  initial: ProblemProgress;
  onSave: (d: Draft) => Promise<void>;
  name: string;
  editorHeight?: number;
}) {
  const [draft, setDraft] = useState<Draft>(() => draftOf(initial));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(draft);
  // Callers pass a new onSave on every render; keep the latest without resetting timers.
  const save = useRef(onSave);
  save.current = onSave;

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setStatus("saving");
    try {
      await save.current(latest.current);
      setStatus("saved");
    } catch {
      setStatus("error"); // keep the draft on screen so nothing typed is lost
    }
  }, []);

  // Closing the drawer or leaving the page saves anything still waiting.
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        void save.current(latest.current).catch(() => undefined);
      }
    },
    [],
  );

  const change = (f: TextField, value: string) => {
    const next = { ...latest.current, [f]: value };
    latest.current = next;
    setDraft(next);
    setStatus("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 700);
  };
  const onBlur = () => timer.current && void flush();
  const field = (f: TextField) => ({
    value: draft[f],
    onChange: (e: { target: { value: string } }) => change(f, e.target.value),
    onBlur,
    maxLength: TEXT_LIMITS[f],
  });

  return (
    <div className={s.form}>
      <div className={s.row}>
        <label>
          <span>Language</span>
          <select value={draft.language} onChange={(e) => change("language", e.target.value)} onBlur={onBlur}>
            <option value="">Choose…</option>
            {LANGUAGES.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Time</span>
          <input {...field("timeComplexity")} placeholder="O(n)" />
        </label>
        <label>
          <span>Space</span>
          <input {...field("spaceComplexity")} placeholder="O(1)" />
        </label>
      </div>
      <label className={s.field}>
        <span>Approach</span>
        <textarea {...field("approach")} rows={3} placeholder="The key idea, the pattern you used, why it works…" />
      </label>
      <div className={s.field}>
        <span>Your code</span>
        <CodeEditor
          value={draft.code}
          language={draft.language}
          onChange={(v) => change("code", v)}
          onBlur={onBlur}
          maxLength={TEXT_LIMITS.code}
          label={`Your code for ${name}`}
          minHeight={editorHeight}
        />
        <small className={s.hint}>Tab indents. Press Esc then Tab to leave the editor.</small>
      </div>
      <label className={s.field}>
        <span>Notes to revise</span>
        <textarea {...field("note")} rows={4} placeholder="Edge cases, mistakes to avoid, what to remember next time…" />
      </label>
      <span className={s.status} role="status" aria-label={`Save status for ${name}`}>
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : status === "error" ? "Couldn’t save. Check your connection; your text is still here." : " "}
      </span>
    </div>
  );
}
