import { KIND_INFO, type ChapterKind } from "@/lib/chapter-kinds";
import s from "./KindTag.module.css";

interface Props {
  kind: ChapterKind;
  /** Unique suffix for the tooltip id (several tags can be on one page). */
  idSuffix: string;
  /** Open the tooltip below the tag (use near the top of the page). */
  below?: boolean;
  /** Open the tooltip towards the left (use when the tag sits at a right edge). */
  alignEnd?: boolean;
  /**
   * Whether the tag can take keyboard focus. Turn off when the tag sits inside a link
   * (a focusable element inside a link is invalid); the tooltip then shows on hover.
   */
  focusable?: boolean;
}

/** Coloured "Data Structure / Algorithm / Concept / Technique" tag with an explanatory tooltip. */
export default function KindTag({ kind, idSuffix, below = false, alignEnd = false, focusable = true }: Props) {
  const info = KIND_INFO[kind];
  const tipId = `kind-tip-${kind}-${idSuffix}`;
  return (
    <span className={`${s.tag} ${s[kind]} ${below ? s.below : ""} ${alignEnd ? s.end : ""}`} tabIndex={focusable ? 0 : undefined} aria-describedby={focusable ? tipId : undefined}>
      <span className={s.dot} aria-hidden="true" />
      {info.label}
      <span role="tooltip" id={tipId} className={s.tip}>
        <b>{info.label}</b>
        {info.description}
        <span className={s.examples}>e.g. {info.examples}</span>
      </span>
    </span>
  );
}
