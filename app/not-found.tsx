export default function NotFound() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px", fontFamily: "var(--sans)" }}>
      <h1 style={{ fontWeight: 800 }}>Page not found</h1>
      <p>
        That chapter doesn’t exist (yet). <a href="/">Back to all chapters</a>
      </p>
    </main>
  );
}
