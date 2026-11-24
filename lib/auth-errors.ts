/** Friendly messages for Firebase Auth error codes. Sign-in failures are deliberately generic
 *  so the form never reveals whether an email address has an account. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      return "That email and password don’t match an account.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in, or reset your password.";
    case "auth/invalid-email":
      return "That doesn’t look like a valid email address.";
    case "auth/weak-password":
    case "auth/password-does-not-meet-requirements":
      return "Choose a stronger password: at least 8 characters, with letters and numbers.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "The Google sign-in window was closed before finishing.";
    case "auth/account-exists-with-different-credential":
      return "This email is already registered with a different sign-in method. Sign in that way first.";
    case "auth/network-request-failed":
      return "Network problem. Check your connection and try again.";
    case "auth/requires-recent-login":
      return "For your security, please sign in again to do this.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "permission-denied":
      return "That change was blocked by the security rules.";
    default:
      return "Something went wrong. Please try again.";
  }
}
