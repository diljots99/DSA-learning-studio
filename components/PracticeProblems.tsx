"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useProgressStore } from "./ProgressProvider";
import { LocalProgressStore } from "@/lib/progress/local-store";
import { emptyProgress, hasSolution, TEXT_FIELDS, TEXT_LIMITS, type ProblemProgress, type ProgressMap, type TextField } from "@/lib/progress/types";
import type { Difficulty, Level, Problem, ProblemSet } from "@/lib/types";
import s from "./PracticeProblems.module.css";

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
type Filter<T> = T | "all";

const LANGUAGES = ["Python", "Java", "C++", "C", "JavaScript", "TypeScript", "Go", "C#", "Kotlin", "Rust", "Swift", "Other"];
type Draft = Pick<ProblemProgress, TextField>;
const draftOf = (p: ProblemProgress): Draft => Object.fromEntries(TEXT_FIELDS.map((f) => [f, p[f]])) as Draft;

/** The learner's write-up for one problem: language, approach, complexity, code and revision notes. Autosaves. */
function SolutionEditor({ initial, onSave, name }: { initial: ProblemProgress; onSave: (d: Draft) => Promise<void>; name: string }) {
  const [draft, setDraft] = useState<Draft>(() => draftOf(initial));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(draft);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setStatus("saving");
    try {
      await onSave(latest.current);
      setStatus("saved");
    } catch {
      setStatus("error"); // keep the draft on screen so nothing typed is lost
    }
  }, [onSave]);

  useEffect(() => () => {
    if (timer.current) {
      clearTimeout(timer.current);
      void onSave(latest.current).catch(() => undefined);
    }
  }, [onSave]);

  const set = (f: TextField) => (e: { target: { value: string } }) => {
    const next = { ...latest.current, [f]: e.target.value };
    latest.current = next;
    setDraft(next);
    setStatus("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 700);
  };
  const onBlur = () => timer.current && void flush();
  const field = (f: TextField) => ({ value: draft[f], onChange: set(f), onBlur, maxLength: TEXT_LIMITS[f] });

  return (
    <div className={s.note}>
      <div className={s.solRow}>
        <label>
          <span>Language</span>
          <select value={draft.language} onChange={set("language")} onBlur={onBlur}>
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
      <label className={s.solField}>
        <span>Approach</span>
        <textarea {...field("approach")} rows={3} placeholder="The key idea, the pattern you used, why it works…" />
      </label>
      <label className={s.solField}>
        <span>Your code</span>
        <textarea {...field("code")} className={s.code} rows={8} spellCheck={false} autoCapitalize="off" autoCorrect="off" placeholder="Paste your accepted solution here" />
      </label>
      <label className={s.solField}>
        <span>Notes to revise</span>
        <textarea {...field("note")} rows={3} placeholder="Edge cases, mistakes to avoid, what to remember next time…" />
      </label>
      <span className={s.noteStatus} role="status" aria-label={`Save status for ${name}`}>
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : status === "error" ? "Couldn’t save. Check your connection; your text is still here." : "\u00a0"}
      </span>
    </div>
  );
}

export default function PracticeProblems({ data }: { data: ProblemSet }) {
  const store = useProgressStore();
  const all = useMemo(() => data.levels.flatMap((l) => l.topics.flatMap((t) => t.problems.map((p) => ({ ...p, level: l.level })))), [data]);
  const ids = useMemo(() => all.map((p) => p.id), [all]);
  const levels = data.levels.map((l) => l.level);
  const presentDiffs = DIFFICULTIES.filter((d) => all.some((p) => p.difficulty === d));
  const parts = presentDiffs.map((d) => `${all.filter((p) => p.difficulty === d).length} ${d.toLowerCase()}`);
  const difficultySummary = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];

  const [progress, setProgress] = useState<ProgressMap>({});
  const [loaded, setLoaded] = useState(false);
  const [level, setLevel] = useState<Filter<Level>>("all");
  const [diff, setDiff] = useState<Filter<Difficulty>>("all");
  const [hideSolved, setHideSolved] = useState(false);
  const [openNote, setOpenNote] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (store instanceof LocalProgressStore) store.importLegacy(all);
    store.load(ids).then((p) => {
      if (alive) {
        setProgress(p);
        setLoaded(true);
      }
    });
    return () => {
      alive = false;
    };
  }, [store, ids, all]);

  const get = (id: string) => progress[id] ?? emptyProgress();
  const toggle = async (p: Problem) => {
    const updated = await store.update(p.id, { solved: !get(p.id).solved });
    setProgress((cur) => ({ ...cur, [p.id]: updated }));
  };
  const saveSolution = useCallback(
    async (id: string, draft: Partial<ProblemProgress>) => {
      const updated = await store.update(id, draft);
      setProgress((cur) => ({ ...cur, [id]: updated }));
    },
    [store],
  );

  const inScope = (p: { level: Level; difficulty: Difficulty }) => (level === "all" || p.level === level) && (diff === "all" || p.difficulty === diff);
  const scoped = all.filter(inScope);
  const done = scoped.filter((p) => get(p.id).solved).length;
  const visible = (p: { id: string; level: Level; difficulty: Difficulty }) => inScope(p) && !(hideSolved && get(p.id).solved);
  const anyVisible = all.some(visible);

  const chip = (pressed: boolean, label: string, onClick: () => void) => (
    <button key={label} type="button" className={s.chip} aria-pressed={pressed} onClick={onClick}>
      {label}
    </button>
  );

  return (
    <section aria-labelledby="practice">
      <h2 id="practice">
        <span className="sec">★</span>Practice problems
      </h2>
      <p>
        {data.intro} There are <strong>{all.length}</strong> problems, grouped by level and topic: {difficultySummary}. Each link opens
        the problem on the platform where you can submit and test your solution. Tick a problem when you have solved it, and use “My solution” to save your code, approach, complexity and notes to revise later.
      </p>
      <div className={s.pp}>
        <div className={s.bar}>
          {levels.length > 1 && (
            <div className={s.row}>
              <b>Level</b>
              {chip(level === "all", "All", () => setLevel("all"))}
              {levels.map((l) => chip(level === l, l, () => setLevel(l)))}
            </div>
          )}
          <div className={s.row}>
            <b>Difficulty</b>
            {chip(diff === "all", "All", () => setDiff("all"))}
            {presentDiffs.map((d) => chip(diff === d, d, () => setDiff(d)))}
            {chip(hideSolved, "Hide solved", () => setHideSolved((v) => !v))}
          </div>
          <div className={s.prog}>
            <span>
              <b>{loaded ? done : 0}</b> / {scoped.length} solved
            </span>
            <div className={s.track}>
              <div className={s.fill} style={{ width: `${scoped.length && loaded ? Math.round((100 * done) / scoped.length) : 0}%` }} />
            </div>
            <span className={s.where}>{store.label}</span>
          </div>
        </div>

        {data.levels.map((lv) => {
          const lvVisible = lv.topics.some((t) => t.problems.some((p) => visible({ ...p, level: lv.level })));
          if (!lvVisible) return null;
          const n = lv.topics.reduce((a, t) => a + t.problems.length, 0);
          return (
            <section key={lv.level} className={s.level}>
              <h3>
                <span className={`${s.lv} ${s[lv.level]}`}>{lv.level}</span>
                <span className="small">
                  {n} problem{n === 1 ? "" : "s"}
                </span>
              </h3>
              <p className={s.lvsub}>{lv.blurb}</p>
              {lv.topics.map((t) => {
                const rows = t.problems.filter((p) => visible({ ...p, level: lv.level }));
                if (!rows.length) return null;
                return (
                  <div key={t.name} className={s.topic}>
                    <h4>{t.name}</h4>
                    <p className={s.tsub}>{t.blurb}</p>
                    <ol className={s.list}>
                      {rows.map((p) => {
                        const pr = get(p.id);
                        const open = openNote === p.id;
                        const written = hasSolution(pr) || Boolean(pr.note.trim());
                        return (
                          <li key={p.id} className={pr.solved ? s.done : undefined}>
                            <div className={s.item}>
                              <input type="checkbox" checked={pr.solved} onChange={() => void toggle(p)} aria-label={`Mark “${p.name}” as solved`} />
                              <a href={p.url} target="_blank" rel="noopener noreferrer">
                                {p.name}
                              </a>
                              <button
                                type="button"
                                className={`${s.noteBtn} ${written ? s.hasNote : ""}`}
                                aria-expanded={open}
                                onClick={() => setOpenNote(open ? null : p.id)}
                                title={written ? "View or edit your solution and notes" : "Save your solution and notes"}
                              >
                                {written ? "My solution ●" : "My solution"}
                              </button>
                              <span className={`${s.d} ${s[p.difficulty]}`}>{p.difficulty.toUpperCase()}</span>
                              <span className={s.p}>{p.platform}</span>
                            </div>
                            {open && <SolutionEditor initial={pr} name={p.name} onSave={(d) => saveSolution(p.id, d)} />}
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                );
              })}
            </section>
          );
        })}
        {!anyVisible && <p className={s.empty}>No problems match these filters.</p>}
      </div>
    </section>
  );
}
