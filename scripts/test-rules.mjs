// Security-rule tests for firestore.rules. Run with: npm run test:rules
// (starts the Firestore emulator, runs these checks, then stops it).
import fs from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp, setLogLevel } from "firebase/firestore";

setLogLevel("silent"); // denied writes are expected in these tests; don't print them

const env = await initializeTestEnvironment({
  projectId: "demo-dsa",
  firestore: { rules: fs.readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
});

const alice = env.authenticatedContext("alice", { email: "alice@example.com" }).firestore();
const bob = env.authenticatedContext("bob", { email: "bob@example.com" }).firestore();
const anon = env.unauthenticatedContext().firestore();

const profile = (over = {}) => ({
  uid: "alice",
  displayName: "Alice",
  email: "alice@example.com",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  consent: { accepted: true, ageConfirmed: true, version: "2026-11-25", acceptedAt: serverTimestamp() },
  ...over,
});
const progress = (over = {}) => ({ problemId: "leetcode:two-sum", solved: true, note: "hash map", updatedAt: serverTimestamp(), ...over });
const P = (db, id = "leetcode%3Atwo-sum", uid = "alice") => doc(db, "users", uid, "progress", id);

let passed = 0;
const failures = [];
async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log("  ✓", name);
  } catch (err) {
    failures.push(name);
    console.log("  ✗", name, "\n     ", err.message.split("\n")[0]);
  }
}

console.log("Profiles");
await check("signed-out visitors cannot read a profile", () => assertFails(getDoc(doc(anon, "users/alice"))));
await check("signed-out visitors cannot create a profile", () => assertFails(setDoc(doc(anon, "users/alice"), profile())));
await check("progress cannot be saved before consent is recorded", () => assertFails(setDoc(P(alice), progress())));
await check("profile without age confirmation is rejected", () => assertFails(setDoc(doc(alice, "users/alice"), profile({ consent: { accepted: true, ageConfirmed: false, version: "v", acceptedAt: serverTimestamp() } }))));
await check("profile without consent is rejected", () => assertFails(setDoc(doc(alice, "users/alice"), profile({ consent: { accepted: false, ageConfirmed: true, version: "v", acceptedAt: serverTimestamp() } }))));
await check("profile with an extra field is rejected", () => assertFails(setDoc(doc(alice, "users/alice"), profile({ role: "admin" }))));
await check("profile with someone else's email is rejected", () => assertFails(setDoc(doc(alice, "users/alice"), profile({ email: "bob@example.com" }))));
await check("profile with a client-chosen createdAt is rejected", () => assertFails(setDoc(doc(alice, "users/alice"), profile({ createdAt: Timestamp.fromDate(new Date("2020-01-01")) }))));
await check("users cannot create a profile for another uid", () => assertFails(setDoc(doc(alice, "users/bob"), profile({ uid: "bob" }))));
await check("owner can create a valid profile", () => assertSucceeds(setDoc(doc(alice, "users/alice"), profile())));
await check("owner can read their profile", () => assertSucceeds(getDoc(doc(alice, "users/alice"))));
await check("another user cannot read the profile", () => assertFails(getDoc(doc(bob, "users/alice"))));
await check("nobody can list all users", () => assertFails(getDocs(collection(alice, "users"))));
await check("owner can change their display name", () => assertSucceeds(updateDoc(doc(alice, "users/alice"), { displayName: "Alice S", updatedAt: serverTimestamp() })));
await check("display names longer than 80 characters are rejected", () => assertFails(updateDoc(doc(alice, "users/alice"), { displayName: "x".repeat(81), updatedAt: serverTimestamp() })));
await check("recorded consent cannot be rewritten", () => assertFails(updateDoc(doc(alice, "users/alice"), { "consent.version": "forged", updatedAt: serverTimestamp() })));
await check("createdAt cannot be changed", () => assertFails(updateDoc(doc(alice, "users/alice"), { createdAt: Timestamp.fromDate(new Date("2020-01-01")), updatedAt: serverTimestamp() })));
await check("another user cannot update the profile", () => assertFails(updateDoc(doc(bob, "users/alice"), { displayName: "hacked", updatedAt: serverTimestamp() })));

console.log("Progress");
await check("owner can save progress after consent", () => assertSucceeds(setDoc(P(alice), progress())));
await check("owner can read their progress", () => assertSucceeds(getDocs(collection(alice, "users", "alice", "progress"))));
await check("another user cannot read the progress", () => assertFails(getDocs(collection(bob, "users", "alice", "progress"))));
await check("another user cannot write the progress", () => assertFails(setDoc(P(bob), progress())));
await check("signed-out visitors cannot read progress", () => assertFails(getDoc(P(anon))));
await check("notes over 5000 characters are rejected", () => assertFails(setDoc(P(alice, "big"), progress({ note: "x".repeat(5001) }))));
await check("a non-boolean solved flag is rejected", () => assertFails(setDoc(P(alice, "bad"), progress({ solved: "yes" }))));
await check("progress with an extra field is rejected", () => assertFails(setDoc(P(alice, "extra"), progress({ score: 100 }))));
await check("progress with a client-chosen timestamp is rejected", () => assertFails(setDoc(P(alice, "ts"), progress({ updatedAt: Timestamp.now() }))));
await check("owner can save a full solution write-up", () => assertSucceeds(setDoc(P(alice, "sol"), progress({ language: "Python", approach: "one pass with a dict", timeComplexity: "O(n)", spaceComplexity: "O(n)", code: "def two_sum(a, t):\n    ..." }))));
await check("code over 20000 characters is rejected", () => assertFails(setDoc(P(alice, "bigcode"), progress({ code: "x".repeat(20001) }))));
await check("a non-string code field is rejected", () => assertFails(setDoc(P(alice, "numcode"), progress({ code: 42 }))));
await check("a language over 30 characters is rejected", () => assertFails(setDoc(P(alice, "lang"), progress({ language: "x".repeat(31) }))));
await check("complexity over 100 characters is rejected", () => assertFails(setDoc(P(alice, "cx"), progress({ timeComplexity: "x".repeat(101) }))));
await check("an approach over 5000 characters is rejected", () => assertFails(setDoc(P(alice, "appr"), progress({ approach: "x".repeat(5001) }))));
await check("another user cannot write a solution", () => assertFails(setDoc(P(bob, "sol"), progress({ code: "print(1)" }))));
await check("documents outside users/ are rejected", () => assertFails(setDoc(doc(alice, "admin/config"), { open: true })));

console.log("Deletion (consent withdrawal)");
await check("another user cannot delete the progress", () => assertFails(deleteDoc(P(bob))));
await check("owner can delete their progress", () => assertSucceeds(deleteDoc(P(alice))));
await check("another user cannot delete the profile", () => assertFails(deleteDoc(doc(bob, "users/alice"))));
await check("owner can delete their profile", () => assertSucceeds(deleteDoc(doc(alice, "users/alice"))));

await env.cleanup();
console.log(`\n${passed} passed, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
