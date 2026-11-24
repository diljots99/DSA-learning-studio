"use client";

import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch, type Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import site from "@/content/site.json";
import { normalizeProgress } from "@/lib/progress/types";

export const PRIVACY_NOTICE_VERSION = site.privacyNoticeVersion;

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  createdAt: string;
  consent: { accepted: boolean; ageConfirmed: boolean; version: string; acceptedAt: string };
}

const iso = (v: unknown) => (v && typeof (v as { toDate?: () => Date }).toDate === "function" ? (v as { toDate: () => Date }).toDate().toISOString() : "");

export async function getUserProfile(db: Firestore, uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    uid: d.uid,
    displayName: d.displayName ?? "",
    email: d.email ?? "",
    createdAt: iso(d.createdAt),
    consent: { accepted: !!d.consent?.accepted, ageConfirmed: !!d.consent?.ageConfirmed, version: d.consent?.version ?? "", acceptedAt: iso(d.consent?.acceptedAt) },
  };
}

/** Record the learner's consent and create their profile. Called only after they ticked both boxes. */
export async function createUserProfile(db: Firestore, user: User, displayName: string): Promise<void> {
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    displayName: displayName.trim().slice(0, 80),
    email: user.email ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    consent: { accepted: true, ageConfirmed: true, version: PRIVACY_NOTICE_VERSION, acceptedAt: serverTimestamp() },
  });
}

export async function updateDisplayName(db: Firestore, uid: string, displayName: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), { displayName: displayName.trim().slice(0, 80), updatedAt: serverTimestamp() });
}

/** Everything we hold about the learner, as a downloadable JSON object (right to access). */
export async function exportUserData(db: Firestore, user: User) {
  const profile = await getUserProfile(db, user.uid);
  const snap = await getDocs(collection(db, "users", user.uid, "progress"));
  const progress = snap.docs.map((d) => {
    const x = d.data();
    return { problemId: x.problemId, ...normalizeProgress(x), updatedAt: iso(x.updatedAt) };
  });
  return {
    exportedAt: new Date().toISOString(),
    service: site.siteName,
    account: {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      signInMethods: user.providerData.map((p) => p.providerId),
      accountCreated: user.metadata.creationTime,
      lastSignIn: user.metadata.lastSignInTime,
    },
    profile,
    progress,
  };
}

/** Delete every document stored for the learner (consent withdrawal / erasure). */
export async function deleteUserData(db: Firestore, uid: string): Promise<void> {
  const snap = await getDocs(collection(db, "users", uid, "progress"));
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  await deleteDoc(doc(db, "users", uid));
}
