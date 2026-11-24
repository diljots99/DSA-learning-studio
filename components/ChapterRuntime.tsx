"use client";

import { useEffect } from "react";

type Listener = [EventTarget, string, EventListenerOrEventListenerObject, boolean | AddEventListenerOptions | undefined];

/**
 * Runs a chapter's lab/figure script after the server-rendered HTML is on the page.
 * Window and document listeners the script adds while it runs are removed again when
 * the page unmounts, so leaving a chapter does not leave handlers behind.
 */
export default function ChapterRuntime({ code }: { code: string }) {
  useEffect(() => {
    if (!code) return;
    const added: Listener[] = [];
    const targets: EventTarget[] = [window, document];
    const originals = targets.map((t) => t.addEventListener);
    targets.forEach((t, i) => {
      t.addEventListener = function (type: string, fn: EventListenerOrEventListenerObject, opts?: boolean | AddEventListenerOptions) {
        added.push([t, type, fn, opts]);
        return originals[i].call(t, type, fn, opts);
      } as typeof t.addEventListener;
    });
    const el = document.createElement("script");
    el.text = code;
    try {
      document.body.appendChild(el);
    } finally {
      targets.forEach((t, i) => {
        t.addEventListener = originals[i];
      });
    }
    return () => {
      added.forEach(([t, type, fn, opts]) => t.removeEventListener(type, fn, opts));
      el.remove();
    };
  }, [code]);
  return null;
}
