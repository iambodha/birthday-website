"use client";

import { useEffect, useState } from "react";
import { DEFAULT_NAME, loadBirthdayName } from "@/lib/birthday-content";
import { startLetterBackgroundMusic } from "@/lib/background-music";

export default function LetterPage() {
  const [birthdayName, setBirthdayName] = useState(DEFAULT_NAME);

  useEffect(() => {
    let isMounted = true;

    void loadBirthdayName().then((loadedName) => {
      if (isMounted) {
        setBirthdayName(loadedName);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    startLetterBackgroundMusic();
  }, []);

  return (
    <main
      style={{
        minHeight: "100svh",
        background:
          "radial-gradient(circle at 12% 18%, rgba(251, 146, 60, 0.28), transparent 34%), radial-gradient(circle at 84% 82%, rgba(59, 130, 246, 0.24), transparent 38%), radial-gradient(circle at 48% 24%, rgba(236, 72, 153, 0.2), transparent 44%), linear-gradient(140deg, #f8fbff 0%, #eef4ff 56%, #f9f7ff 100%)",
        display: "grid",
        placeItems: "center",
        padding: "clamp(1rem, 2.4vw, 2rem)",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "860px",
          borderRadius: "1.5rem",
          padding: "clamp(1.25rem, 3vw, 2.3rem)",
          border: "1px solid rgba(15, 23, 42, 0.14)",
          background: "rgba(255, 255, 255, 0.78)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 24px 60px rgba(30, 41, 59, 0.18)",
          overflow: "auto",
          maxHeight: "92svh",
        }}
      >
        <header style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          <h1
            style={{
              margin: 0,
              color: "#1e293b",
              fontSize: "clamp(1.7rem, 2.8vw, 2.5rem)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontWeight: 900,
              textShadow: "0 10px 22px rgba(30, 41, 59, 0.16)",
            }}
          >
            A Letter To You
          </h1>
          <p
            style={{
              margin: "0.65rem 0 0",
              color: "#475569",
              fontSize: "clamp(0.95rem, 1.6vw, 1.08rem)",
            }}
          >
            for {birthdayName}
          </p>
        </header>

        <article
          style={{
            whiteSpace: "pre-wrap",
            textAlign: "center",
            color: "#0f172a",
            fontSize: "clamp(1rem, 1.4vw, 1.15rem)",
            lineHeight: 1.9,
            fontFamily: "Georgia, Times New Roman, serif",
            letterSpacing: "0.01em",
            borderRadius: "1rem",
            border: "1px solid rgba(148, 163, 184, 0.35)",
            background: "rgba(248, 250, 252, 0.72)",
            padding: "clamp(1.1rem, 2.2vw, 1.8rem)",
            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.7)",
          }}
        >
          {`Dear ${birthdayName}, Some Yap`}
        </article>

        <footer style={{ textAlign: "center", marginTop: "1.2rem" }}>
          <p
            style={{
              color: "#64748b",
              fontSize: "0.9rem",
              margin: 0,
              fontStyle: "italic",
            }}
          >
          </p>
        </footer>
      </section>
    </main>
  );
}
