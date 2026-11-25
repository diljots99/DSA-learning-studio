import { listChapters, listProblemIndex } from "@/lib/content";
import CookieSettingsLink from "@/components/CookieSettingsLink";
import { GuideLink } from "@/components/Onboarding";
import ChapterBrowser from "@/components/ChapterBrowser";
import s from "./page.module.css";

export default function Home() {
  const chapters = listChapters();
  const totalProblems = chapters.reduce((n, c) => n + c.problemCount, 0);
  const problemNames = new Map(listProblemIndex().map((e) => [e.slug, [...new Set(e.problems.map((p) => p.name))]]));
  const browsable = chapters.map((c) => ({ ...c, problemNames: problemNames.get(c.slug) ?? [] }));
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
      <ChapterBrowser chapters={browsable} />

      <footer className={s.footer}>
        DSA Learning Studio · Diljot Singh · <GuideLink /> · <a href="/privacy/">Privacy notice</a> · <CookieSettingsLink label="Cookie settings" />
      </footer>
    </main>
  );
}
