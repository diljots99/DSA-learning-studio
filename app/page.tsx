import { listChapters } from "@/lib/content";
import s from "./page.module.css";

export default function Home() {
  const chapters = listChapters();
  const totalProblems = chapters.reduce((n, c) => n + c.problemCount, 0);
  return (
    <main className={s.main}>
      <header className={s.hero}>
        <div className={s.kicker}>DSA Learning Studio</div>
        <h1 className={s.h1}>
          Data Structures &amp; Algorithms <span className={s.hand}>— drawn on the whiteboard</span>
        </h1>
        <p className={s.sub}>
          Illustrated, interactive textbook chapters: hand-drawn diagrams built from real data, working labs you can step through, Python implementations, cited sources,
          and {totalProblems} practice problems with progress tracking and notes.
        </p>
      </header>

      <h2 className={s.h2}>Chapters</h2>
      <div className={s.grid}>
        {chapters.map((c) => (
          // Plain links: each chapter is a full page with its own styles and lab scripts.
          <a key={c.slug} className={s.card} href={`/chapters/${c.slug}/`}>
            <span className={s.num}>{String(c.number).padStart(2, "0")}</span>
            <h3>{c.title}</h3>
            <div className={s.tag}>{c.tagline}</div>
            <p>{c.summary}</p>
            <div className={s.meta}>
              <span className={s.pill}>{c.difficulty}</span>
              <span className={s.pill}>{c.readingTime}</span>
              <span className={s.pill}>{c.labs}</span>
              {c.problemCount > 0 && <span className={s.pill}>{c.problemCount} practice problems</span>}
            </div>
          </a>
        ))}
        <div className={s.soon}>
          <b>More chapters coming</b>Each new topic is a folder in <code>content/chapters/</code>.
        </div>
      </div>

      <footer className={s.footer}>DSA Learning Studio · Diljot Singh</footer>
    </main>
  );
}
