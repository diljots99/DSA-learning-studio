"use client";

import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { Compartment, EditorState } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { indentUnit, LanguageDescription } from "@codemirror/language";
import { languages } from "@codemirror/language-data";

const theme = EditorView.theme({
  "&": { fontSize: "13.5px", background: "#fbfaf7", border: "1.5px solid #d6d3d1", borderRadius: "10px", overflow: "hidden" },
  "&.cm-focused": { outline: "2px solid var(--purple-l)", borderColor: "var(--purple)" },
  ".cm-scroller": { fontFamily: "var(--mono)", lineHeight: "1.5" },
  ".cm-gutters": { background: "#f3f1ec", borderRight: "1px solid #e7e5e4", color: "#a8a29e" },
  ".cm-activeLine, .cm-activeLineGutter": { background: "#f5f3ff" },
});

interface Props {
  value: string;
  /** A name from the language picker ("Python", "C++", …). Highlighting loads on demand; unknown names get plain text. */
  language: string;
  onChange: (code: string) => void;
  onBlur?: () => void;
  maxLength: number;
  label: string;
  minHeight?: number;
}

/**
 * CodeMirror 6 editor: syntax highlighting, line numbers, auto-indent, bracket matching,
 * search and undo. Tab indents; press Esc then Tab to move focus out of the editor.
 * The code is only ever edited and stored as text, never run.
 */
export default function CodeEditor({ value, language, onChange, onBlur, maxLength, label, minHeight = 220 }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const lang = useRef(new Compartment());
  const handlers = useRef({ onChange, onBlur });
  handlers.current = { onChange, onBlur };

  useEffect(() => {
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          keymap.of([indentWithTab]),
          indentUnit.of("    "),
          lang.current.of([]),
          theme,
          EditorView.theme({ ".cm-content, .cm-gutter": { minHeight: `${minHeight}px` } }),
          EditorView.contentAttributes.of({ "aria-label": label, autocapitalize: "off", autocorrect: "off", spellcheck: "false" }),
          // Same limit as firestore.rules: refuse edits that would make the code too long.
          EditorState.changeFilter.of((tr) => tr.newDoc.length <= maxLength),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) handlers.current.onChange(u.state.doc.toString());
            if (u.focusChanged && !u.view.hasFocus) handlers.current.onBlur?.();
          }),
        ],
      }),
    });
    view.current = v;
    return () => v.destroy();
    // The editor owns its text after mounting; remount (change `key`) to load other code.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;
    const desc = language ? LanguageDescription.matchLanguageName(languages, language) : null;
    if (!desc) {
      view.current?.dispatch({ effects: lang.current.reconfigure([]) });
      return;
    }
    desc
      .load()
      .then((support) => alive && view.current?.dispatch({ effects: lang.current.reconfigure(support) }))
      .catch(() => undefined); // highlighting failed to load: editing still works
    return () => {
      alive = false;
    };
  }, [language]);

  return <div ref={host} />;
}
