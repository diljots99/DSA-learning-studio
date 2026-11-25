"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import KindTag from "@/components/KindTag";
import { CHAPTER_KINDS, KIND_INFO, isChapterKind, type ChapterKind } from "@/lib/chapter-kinds";
import type { ChapterMeta } from "@/lib/types";
import s from "./ChapterBrowser.module.css";

export interface BrowsableChapter extends ChapterMeta {
  /** Names of the chapter's practice problems, so search can find a chapter by a problem in it. */
  problemNames: string[];
}

const norm = (v: string) => v.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
const words = (q: string) => norm(q).split(/[^a-z0-9&+#]+/).filter(Boolean);

/** Reads ?kind= and ?q= so a filtered view can be shared or bookmarked. */
function readUrl(): { kind: ChapterKind | null; q: string } {
  try {
    const p = new URLSearchParams(window.location.search);
    const k = p.get("kind");
    return { kind: isChapterKind(k) ? k : null, q: p.get("q") ?? "" };
  } catch {
    return { kind: null, q: "" };
  }
}

function writeUrl(kind: ChapterKind | null, q: string) {
  try {
    const url = new URL(window.location.href);
    if (kind) url.searchParams.set("kind", kind);
    else url.searchParams.delete("kind");
    if (q.trim()) url.searchParams.set("q", q.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  } catch {
    /* URL sync is a convenience only */
  }
}

export default function ChapterBrowser({ chapters }: { chapters: BrowsableChapter[] }) {
  const [kind, setKind] = useState<ChapterKind | null>(null);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = readUrl();
    setKind(init.kind);
    setQuery(init.q);
  }, []);

  useEffect(() => writeUrl(kind, query), [kind, query]);

  // "/" jumps to the search box, as on most docs sites.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const index = useMemo(
    () =>
      chapters.map((c) => ({
        chapter: c,
        text: norm([c.title, c.tagline, c.summary, c.description, KIND_INFO[c.kind].label, String(c.number)].join(" ")),
        problems: c.problemNames.map((name) => ({ name, text: norm(name) })),
      })),
    [chapters],
  );

  const terms = words(query);

  // Search runs first, so the kind counts show how many matches each kind has.
  const searched = useMemo(
    () =>
      index
        .map(({ chapter, text, problems }) => {
          if (terms.length === 0) return { chapter, problemHits: [] as string[] };
          const problemHits = problems.filter((p) => terms.every((t) => p.text.includes(t))).map((p) => p.name);
          const inChapter = terms.every((t) => text.includes(t));
          return inChapter || problemHits.length > 0 ? { chapter, problemHits: inChapter ? [] : problemHits } : null;
        })
        .filter((r): r is { chapter: BrowsableChapter; problemHits: string[] } => r !== null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, terms.join(" ")],
  );

  const counts = useMemo(() => {
    const m = Object.fromEntries(CHAPTER_KINDS.map((k) => [k, 0])) as Record<ChapterKind, number>;
    for (const r of searched) m[r.chapter.kind]++;
    return m;
  }, [searched]);

  const shown = kind ? searched.filter((r) => r.chapter.kind === kind) : searched;
  const filtering = kind !== null || terms.length > 0;
  const clear = () => {
    setKind(null);
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <>
      <div className={s.toolbar}>
        <label className={s.search}>
          <span className={s.srOnly}>Search chapters and practice problems</span>
          <svg className={s.searchIcon} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M15.5 15.5 21 21" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && query) {
                e.preventDefault();
                setQuery("");
              }
            }}
            placeholder="Search chapters or problems, e.g. anagram"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className={s.kbd} aria-hidden="true">/</kbd>
        </label>

        <div className={s.filters} role="group" aria-label="Filter chapters by kind">
          <button type="button" className={`${s.all} ${kind === null ? s.allOn : ""}`} aria-pressed={kind === null} aria-label={`All kinds, ${searched.length} chapters`} onClick={() => setKind(null)}>
            All <span className={s.count}>{searched.length}</span>
          </button>
          {CHAPTER_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              className={`${s.chip} ${kind === k ? s.chipOn : ""} ${kind && kind !== k ? s.chipOff : ""}`}
              aria-pressed={kind === k}
              aria-label={`${KIND_INFO[k].label}, ${counts[k]} ${counts[k] === 1 ? "chapter" : "chapters"}`}
              aria-describedby={`kind-tip-${k}-filter`}
              onClick={() => setKind(kind === k ? null : k)}
            >
              <KindTag kind={k} idSuffix="filter" focusable={false} />
              <span className={s.count}>{counts[k]}</span>
            </button>
          ))}
        </div>
      </div>

      <p className={s.status} aria-live="polite">
        {filtering ? (
          <>
            Showing {shown.length} of {chapters.length} chapters
            {kind && (
              <>
                {" "}
                · <b>{KIND_INFO[kind].label}</b>
              </>
            )}
            {terms.length > 0 && (
              <>
                {" "}
                · matching “<b>{query.trim()}</b>”
              </>
            )}
            <button type="button" className={s.clear} onClick={clear}>
              Clear
            </button>
          </>
        ) : (
          <>Hover a tag to see what it means · click one to filter</>
        )}
      </p>

      <div className={s.grid}>
        {shown.map(({ chapter: c, problemHits }) => (
          // Plain links: each chapter is a full page with its own styles and lab scripts.
          <a key={c.slug} className={s.card} href={`/chapters/${c.slug}/`}>
            <div className={s.cardTop}>
              <span className={s.num}>{String(c.number).padStart(2, "0")}</span>
              <KindTag kind={c.kind} idSuffix={c.slug} focusable={false} alignEnd />
            </div>
            <h3>{c.title}</h3>
            <div className={s.tag}>{c.tagline}</div>
            <p>{c.summary}</p>
            {problemHits.length > 0 && (
              <div className={s.hits}>
                <b>Practice match:</b> {problemHits.slice(0, 3).join(", ")}
                {problemHits.length > 3 && ` +${problemHits.length - 3} more`}
              </div>
            )}
            <div className={s.meta}>
              <span className={s.pill}>{c.difficulty}</span>
              <span className={s.pill}>{c.readingTime}</span>
              <span className={s.pill}>{c.labs}</span>
              {c.problemCount > 0 && <span className={s.pill}>{c.problemCount} practice problems</span>}
            </div>
          </a>
        ))}

        {shown.length === 0 && (
          <div className={s.empty}>
            <b>Nothing here yet</b>
            No chapter matches {terms.length > 0 ? <>“{query.trim()}”</> : "this filter"}
            {kind && <> in {KIND_INFO[kind].label}</>}.{" "}
            <button type="button" className={s.clear} onClick={clear}>
              Clear search &amp; filter
            </button>
          </div>
        )}

        {!filtering && (
          <div className={s.soon}>
            <b>More chapters coming</b>Each new topic is a folder in <code>content/chapters/</code>.
          </div>
        )}
      </div>
    </>
  );
}
