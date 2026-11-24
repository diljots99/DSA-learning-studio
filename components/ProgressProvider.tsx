"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { LocalProgressStore } from "@/lib/progress/local-store";
import type { ProgressStore } from "@/lib/progress/types";

const ProgressContext = createContext<ProgressStore | null>(null);

/**
 * Supplies the progress store to every component.
 * When Supabase sign-in is added, choose the store here: a Supabase-backed store for
 * signed-in users, LocalProgressStore otherwise. Nothing else needs to change.
 */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [store] = useState<ProgressStore>(() => new LocalProgressStore());
  return <ProgressContext.Provider value={store}>{children}</ProgressContext.Provider>;
}

export function useProgressStore(): ProgressStore {
  const store = useContext(ProgressContext);
  if (!store) throw new Error("useProgressStore must be used inside <ProgressProvider>");
  return store;
}
