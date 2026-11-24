"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { firebaseEnabled, getFirebase } from "@/lib/firebase/client";
import { createUserProfile, deleteUserData, exportUserData, getUserProfile, updateDisplayName, type UserProfile } from "@/lib/account";

interface AuthContextValue {
  /** False when the Firebase config is missing: the site then works without accounts. */
  enabled: boolean;
  loading: boolean;
  user: User | null;
  profile: UserProfile | null;
  /** Signed in (e.g. with Google for the first time) but consent has not been recorded yet. */
  needsConsent: boolean;
  signUpWithEmail(name: string, email: string, password: string): Promise<void>;
  signInWithEmail(email: string, password: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  completeConsent(displayName: string): Promise<void>;
  declineConsent(): Promise<void>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  resendVerification(): Promise<void>;
  updateName(name: string): Promise<void>;
  exportData(): Promise<unknown>;
  /** Re-authenticates (password or Google), deletes all stored data, then the account itself. */
  deleteAccount(password?: string): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const googleProvider = () => {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: "select_account" });
  return p;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(firebaseEnabled);
  /** Set while an email sign-up is writing the profile, so the consent prompt does not flash. */
  const creating = useRef(false);

  useEffect(() => {
    const fb = getFirebase();
    if (!fb) return;
    return onAuthStateChanged(fb.auth, async (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }
      if (creating.current) return;
      try {
        setProfile(await getUserProfile(fb.db, u.uid));
      } catch {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const need = () => {
    const fb = getFirebase();
    if (!fb) throw Object.assign(new Error("Accounts are not configured."), { code: "app/not-configured" });
    return fb;
  };

  const signUpWithEmail = useCallback(async (name: string, email: string, password: string) => {
    const { auth, db } = need();
    creating.current = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim().slice(0, 80) });
      await createUserProfile(db, cred.user, name);
      setProfile(await getUserProfile(db, cred.user.uid));
      sendEmailVerification(cred.user).catch(() => undefined);
    } finally {
      creating.current = false;
      setLoading(false);
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(need().auth, email.trim(), password);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { auth } = need();
    try {
      await signInWithPopup(auth, googleProvider());
    } catch (err) {
      if ((err as { code?: string }).code === "auth/popup-blocked") await signInWithRedirect(auth, googleProvider());
      else throw err;
    }
  }, []);

  const completeConsent = useCallback(
    async (displayName: string) => {
      const { db } = need();
      if (!user) return;
      await createUserProfile(db, user, displayName || user.displayName || "");
      setProfile(await getUserProfile(db, user.uid));
    },
    [user],
  );

  const declineConsent = useCallback(async () => {
    const { auth } = need();
    // Nothing is stored for someone who declines. Remove the just-created sign-in record too.
    if (user) {
      try {
        await deleteUser(user);
        return;
      } catch {
        /* fall through to sign-out */
      }
    }
    await fbSignOut(auth);
  }, [user]);

  const signOut = useCallback(async () => {
    await fbSignOut(need().auth);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(need().auth, email.trim());
  }, []);

  const resendVerification = useCallback(async () => {
    if (user) await sendEmailVerification(user);
  }, [user]);

  const updateName = useCallback(
    async (name: string) => {
      const { db } = need();
      if (!user) return;
      await updateProfile(user, { displayName: name.trim().slice(0, 80) });
      await updateDisplayName(db, user.uid, name);
      setProfile(await getUserProfile(db, user.uid));
    },
    [user],
  );

  const exportData = useCallback(async () => {
    const { db } = need();
    if (!user) throw new Error("Not signed in");
    return exportUserData(db, user);
  }, [user]);

  const deleteAccount = useCallback(
    async (password?: string) => {
      const { db } = need();
      if (!user) return;
      const usesPassword = user.providerData.some((p) => p.providerId === "password");
      if (usesPassword) {
        if (!password) throw Object.assign(new Error("Password required"), { code: "auth/requires-recent-login" });
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email ?? "", password));
      } else {
        await reauthenticateWithPopup(user, googleProvider());
      }
      await deleteUserData(db, user.uid);
      await deleteUser(user);
      try {
        window.localStorage.removeItem(`dsa-studio-synced:${user.uid}`);
      } catch {
        /* ignore */
      }
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      enabled: firebaseEnabled,
      loading,
      user,
      profile,
      needsConsent: Boolean(user && !loading && !profile && !creating.current),
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      completeConsent,
      declineConsent,
      signOut,
      resetPassword,
      resendVerification,
      updateName,
      exportData,
      deleteAccount,
    }),
    [loading, user, profile, signUpWithEmail, signInWithEmail, signInWithGoogle, completeConsent, declineConsent, signOut, resetPassword, resendVerification, updateName, exportData, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
