import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getChapter, listChapters } from "@/lib/content";
import PracticeProblems from "@/components/PracticeProblems";
import ChapterRuntime from "@/components/ChapterRuntime";
import KindTag from "@/components/KindTag";

type Params = { params: Promise<{ slug: string }> };

// Every chapter is rendered on the server at build time; unknown slugs are 404s.
export const dynamicParams = false;

export function generateStaticParams() {
  return listChapters().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) return {};
  const { title, description, number } = chapter.meta;
  return {
    title: `${String(number).padStart(2, "0")} · ${title}`,
    description,
    openGraph: { title: `${title} · DSA Learning Studio`, description, type: "article" },
  };
}

/** Wrapper that keeps the chapter's own layout: contributes no box of its own. */
function Html({ html }: { html: string }) {
  return html ? <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: html }} /> : null;
}

export default async function ChapterPage({ params }: Params) {
  const { slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) notFound();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: chapter.css }} />
      <Html html={chapter.before} />
      <div className="layout">
        <nav className="toc" id="toc" dangerouslySetInnerHTML={{ __html: chapter.toc }} />
        <main>
          <div style={{ margin: "8px 0 -14px" }}>
            <KindTag kind={chapter.meta.kind} idSuffix="chapter" below />
          </div>
          <Html html={chapter.mainBefore} />
          {chapter.problems && <PracticeProblems data={chapter.problems} />}
          <Html html={chapter.mainAfter} />
        </main>
      </div>
      <Html html={chapter.after} />
      <ChapterRuntime code={chapter.script} />
    </>
  );
}
