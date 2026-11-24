"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { getFirebase } from "@/lib/firebase/client";
import { LocalProgressStore } from "@/lib/progress/local-store";
import { FirestoreProgressStore } from "@/lib/progress/firestore-store";
import { emptyProgress, type ProgressStore } from "@/lib/progress/types";

const ProgressContext = createContext<ProgressStore | null>(null);
const local = typeof window === "undefined" ? null : new LocalProgressStore();
/** Used while rendering on the server: nothing is loaded or saved there. */
const serverStore: ProgressStore = { label: "Saved in this browser", load: async () => ({}), update: async () => emptyProgress() };

/** Copy progress saved in this browser into the account once, keeping the best of both. */
async function syncLocalIntoAccount(remote: FirestoreProgressStore, uid: string) {
  const flag = `dsa-studio-synced:${uid}`;
  try {
    if (window.localStorage.getItem(flag)) return;
  } catch {
    return;
  }
  const mine = local?.entries() ?? {};
  const theirs = await remote.loadAll();
  for (const [id, p] of Object.entries(mine)) {
    const r = theirs[id];
    const solved = p.solved || Boolean(r?.solved);
    const note = r?.note || p.note;
    if (!r || r.solved !== solved || r.note !== note) await remote.update(id, { solved, note });
  }
  try {
    window.localStorage.setItem(flag, new Date().toISOString());
  } catch {
    /* ignore */
  }
}

/**
 * Chooses where progress is stored:
 *   signed in with recorded consent → Firestore (users/{uid}/progress), synced across devices
 *   otherwise                       → this browser only
 */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [store, setStore] = useState<ProgressStore | null>(local);
  const uid = user?.uid ?? null;
  const consented = Boolean(profile?.consent.accepted && profile.consent.ageConfirmed);

  useEffect(() => {
    let alive = true;
    const fb = getFirebase();
    if (!uid || !consented || !fb) {
      setStore(local);
      return;
    }
    const remote = new FirestoreProgressStore(fb.db, uid);
    syncLocalIntoAccount(remote, uid)
      .catch(() => undefined)
      .finally(() => {
        if (alive) setStore(remote);
      });
    return () => {
      alive = false;
    };
  }, [uid, consented]);

  return <ProgressContext.Provider value={store ?? local ?? serverStore}>{children}</ProgressContext.Provider>;
}

export function useProgressStore(): ProgressStore {
  const store = useContext(ProgressContext);
  if (!store) throw new Error("useProgressStore must be used inside <ProgressProvider>");
  return store;
}
