"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  startPuzzleBackgroundMusic,
  stopPuzzleBackgroundMusic,
} from "@/lib/background-music";
import {
  DEFAULT_PUZZLE_TWO_CONTENT,
  loadPrivateBirthdayContent,
  type PuzzleTwoContent,
} from "@/lib/birthday-content";

type CellData = [row: number, col: number, number: number | null];
type Direction = "across" | "down";

const ROWS = 12;
const COLS = 12;
const MISSION_SUCCESS_SOUND_SRC = "/mission accomplished.mp3";

const BASE_CELLS: CellData[] = [
  [0, 1, 3],
  [0, 4, 7],
  [0, 6, 10],
  [1, 0, 1],
  [1, 1, null],
  [1, 2, null],
  [1, 3, 4],
  [1, 4, null],
  [1, 6, null],
  [1, 9, 12],
  [2, 1, null],
  [2, 3, null],
  [2, 6, null],
  [2, 9, null],
  [3, 1, null],
  [3, 3, null],
  [3, 5, 8],
  [3, 6, null],
  [3, 7, 11],
  [3, 9, null],
  [4, 3, null],
  [4, 7, null],
  [4, 9, null],
  [5, 3, 5],
  [5, 4, null],
  [5, 5, null],
  [5, 6, null],
  [5, 7, null],
  [5, 8, null],
  [5, 9, null],
  [5, 11, 13],
  [6, 7, null],
  [6, 9, null],
  [6, 11, null],
  [7, 5, 9],
  [7, 6, null],
  [7, 7, null],
  [7, 8, null],
  [7, 9, null],
  [7, 10, null],
  [7, 11, null],
  [8, 9, null],
  [8, 11, null],
  [9, 3, 6],
  [9, 4, null],
  [9, 5, null],
  [9, 6, null],
  [9, 7, null],
  [9, 8, null],
  [9, 9, null],
  [9, 11, null],
  [10, 9, null],
  [10, 11, null],
];

function getCellData(row: number, col: number): CellData | null {
  if (row === 11 && col === 10) {
    return null;
  }

  if (row === 11) {
    if (col <= 9) {
      return [row, col, col === 0 ? 2 : null];
    }

    if (col === 11) {
      return [row, col, null];
    }

    return null;
  }

  if (col === 11) {
    if (row >= 5 && row <= 11) {
      const existing = BASE_CELLS.find((cell) => cell[0] === row && cell[1] === col);
      return existing ?? [row, col, null];
    }

    return null;
  }

  return BASE_CELLS.find((cell) => cell[0] === row && cell[1] === col) ?? null;
}

export default function PuzzleTwoPage() {
  const router = useRouter();
  const [letters, setLetters] = useState<Record<string, string>>({});
  const [puzzleContent, setPuzzleContent] = useState<PuzzleTwoContent>(DEFAULT_PUZZLE_TWO_CONTENT);
  const [isPublic, setIsPublic] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const solvedSequenceStartedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    void loadPrivateBirthdayContent()
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setPuzzleContent(data.puzzleTwo);
        setIsPublic(data.isPublic);
      })
      .catch(() => {
        // Keep placeholder content when private file is missing or malformed.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    void router.prefetch("/puzzle-3");
  }, [router]);

  useEffect(() => {
    startPuzzleBackgroundMusic();
  }, []);

  const roughQuestionCount = puzzleContent.roughQuestions.length;
  const acrossClues = puzzleContent.crosswordClues.across.map((clue) => ({
    ...clue,
    length: clue.answer.length,
  }));
  const downClues = puzzleContent.crosswordClues.down.map((clue) => ({
    ...clue,
    length: clue.answer.length,
  }));

  const expectedLettersByCell = useMemo(() => {
    const expected = new Map<string, string>();

    const clueByDirection = {
      across: new Map(acrossClues.map((clue) => [clue.number, clue.answer])),
      down: new Map(downClues.map((clue) => [clue.number, clue.answer])),
    };

    const isStart = (row: number, col: number, direction: Direction) => {
      const current = getCellData(row, col);
      if (!current || current[2] === null) {
        return false;
      }

      if (direction === "across") {
        const left = col > 0 ? getCellData(row, col - 1) : null;
        const right = col + 1 < COLS ? getCellData(row, col + 1) : null;
        return !left && Boolean(right);
      }

      const top = row > 0 ? getCellData(row - 1, col) : null;
      const bottom = row + 1 < ROWS ? getCellData(row + 1, col) : null;
      return !top && Boolean(bottom);
    };

    const paintWord = (row: number, col: number, direction: Direction, answer: string) => {
      for (let index = 0; index < answer.length; index += 1) {
        const targetRow = direction === "across" ? row : row + index;
        const targetCol = direction === "across" ? col + index : col;
        const playable = getCellData(targetRow, targetCol);

        if (!playable) {
          break;
        }

        const key = `${targetRow}-${targetCol}`;
        const letter = answer[index];
        if (letter) {
          expected.set(key, letter);
        }
      }
    };

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const data = getCellData(row, col);
        if (!data || data[2] === null) {
          continue;
        }

        const clueNumber = data[2];
        if (isStart(row, col, "across")) {
          const answer = clueByDirection.across.get(clueNumber);
          if (answer) {
            paintWord(row, col, "across", answer);
          }
        }
        if (isStart(row, col, "down")) {
          const answer = clueByDirection.down.get(clueNumber);
          if (answer) {
            paintWord(row, col, "down", answer);
          }
        }
      }
    }

    return expected;
  }, [acrossClues, downClues]);

  useEffect(() => {
    if (expectedLettersByCell.size === 0) {
      setIsSolved(false);
      setShowSuccessPopup(false);
      solvedSequenceStartedRef.current = false;
      return;
    }

    const allCorrect = Array.from(expectedLettersByCell.entries()).every(([key, expectedLetter]) => {
      return (letters[key] ?? "") === expectedLetter;
    });

    setIsSolved(allCorrect);
  }, [expectedLettersByCell, letters]);

  useEffect(() => {
    if (!isSolved || solvedSequenceStartedRef.current) {
      return;
    }

    solvedSequenceStartedRef.current = true;
    setShowSuccessPopup(true);
    void (async () => {
      await stopPuzzleBackgroundMusic(900);
      const audio = new Audio(MISSION_SUCCESS_SOUND_SRC);
      void audio.play().catch(() => {
        // Ignore autoplay interruptions.
      });
    })();
  }, [isSolved, router]);

  const onCellChange = (key: string, value: string) => {
    const cleanValue = value.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
    setLetters((prev) => ({ ...prev, [key]: cleanValue }));
  };

  const reviewerSkip = () => {
    router.push("/puzzle-3");
  };

  return (
    <main
      aria-label={isPublic ? "Puzzle 2 crossword" : `Puzzle 2 crossword with ${roughQuestionCount} source questions`}
      style={{
        minHeight: "100svh",
        padding: "clamp(1rem, 2vw, 2rem)",
        background:
          "radial-gradient(circle at 15% 20%, rgba(251, 146, 60, 0.24), transparent 38%), radial-gradient(circle at 85% 78%, rgba(59, 130, 246, 0.22), transparent 42%), linear-gradient(145deg, #0a0f1f 0%, #121a2d 48%, #090d1a 100%)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <section
        style={{
          width: "min(100%, 78rem)",
          borderRadius: "1.6rem",
          padding: "clamp(1rem, 2vw, 2rem)",
          border: "1px solid rgba(148, 163, 184, 0.18)",
          background: "rgba(11, 16, 34, 0.72)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 28px 68px rgba(2, 6, 23, 0.58)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {showSuccessPopup ? (
          <div
            role="dialog"
            aria-live="polite"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 50,
              display: "grid",
              placeItems: "center",
              background: "rgba(2, 6, 23, 0.66)",
              backdropFilter: "blur(2px)",
              padding: "1rem",
            }}
          >
            <div
              style={{
                width: "min(100%, 34rem)",
                borderRadius: "1rem",
                border: "1px solid rgba(251, 191, 36, 0.52)",
                background:
                  "linear-gradient(180deg, rgba(17, 24, 39, 0.96) 0%, rgba(3, 7, 18, 0.92) 100%)",
                boxShadow: "0 26px 70px rgba(2, 6, 23, 0.72)",
                padding: "1.1rem 1rem 1.2rem",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  margin: "0 0 0.45rem",
                  color: "#fbbf24",
                  fontSize: "clamp(1.1rem, 2.2vw, 1.5rem)",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                Mission Successful
              </p>
              <p
                style={{
                  margin: "0 0 0.8rem",
                  color: "#e2e8f0",
                  fontSize: "0.95rem",
                }}
              >
                Five stars. Ready for the final stage?
              </p>
              <div
                aria-label="Five stars"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "0.4rem",
                  color: "#facc15",
                  fontSize: "clamp(1.3rem, 2.8vw, 1.7rem)",
                  lineHeight: 1,
                  textShadow: "0 0 16px rgba(251, 191, 36, 0.45)",
                }}
              >
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
              </div>
              <button
                type="button"
                onClick={() => router.push("/puzzle-3")}
                style={{
                  marginTop: "0.95rem",
                  border: "1px solid rgba(251, 191, 36, 0.65)",
                  background: "rgba(251, 191, 36, 0.14)",
                  color: "#fde68a",
                  fontWeight: 700,
                  borderRadius: "0.7rem",
                  padding: "0.6rem 1rem",
                  cursor: "pointer",
                }}
              >
                Continue to the last stage
              </button>
            </div>
          </div>
        ) : null}

        <header style={{ textAlign: "center", marginBottom: "1.1rem" }}>
          <h1
            style={{
              margin: 0,
              color: "#e2e8f0",
              fontSize: "clamp(1.7rem, 2.5vw, 2.4rem)",
              letterSpacing: "0.03em",
              textTransform: "uppercase",
              fontWeight: 900,
            }}
          >
            Puzzle 2: Crossword
          </h1>
          {isPublic ? null : (
            <p
              style={{
                margin: "0.65rem auto 0",
                maxWidth: "42rem",
                color: "#cbd5e1",
                fontSize: "clamp(0.98rem, 1.7vw, 1.15rem)",
                lineHeight: 1.45,
                textWrap: "balance",
              }}
            >
              the last puzzle, well even 500 elo can do. use your brains on this, {puzzleContent.petName}.
            </p>
          )}
        </header>

        {isPublic ? (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <button
              type="button"
              onClick={reviewerSkip}
              style={{
                border: "1px solid rgba(96, 165, 250, 0.65)",
                background: "rgba(37, 99, 235, 0.18)",
                color: "#bfdbfe",
                fontWeight: 700,
                borderRadius: "0.6rem",
                padding: "0.55rem 1rem",
                cursor: "pointer",
                fontSize: "0.92rem",
                transition: "all 180ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(37, 99, 235, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(37, 99, 235, 0.18)";
              }}
            >
              Reviewer Skip
            </button>
          </div>
        ) : null}

        <div style={{ display: "grid", placeItems: "center" }}>
          <div
            style={{
              display: "grid",
              gap: "2px",
              gridTemplateColumns: `repeat(${COLS}, minmax(1.8rem, 2.32rem))`,
              gridTemplateRows: `repeat(${ROWS}, minmax(1.8rem, 2.32rem))`,
              padding: "0.45rem",
              borderRadius: "0.8rem",
              background: "#020617",
              border: "3px solid #334155",
              boxShadow: "0 16px 34px rgba(2, 6, 23, 0.7)",
              overflowX: "auto",
              maxWidth: "100%",
            }}
          >
            {Array.from({ length: ROWS }).map((_, row) =>
              Array.from({ length: COLS }).map((_, col) => {
                const data = getCellData(row, col);
                const isPlayable = Boolean(data);
                const number = data?.[2] ?? null;
                const key = `${row}-${col}`;
                const isLightCell = (row + col) % 2 === 0;

                return (
                  <div
                    key={key}
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      background: isPlayable
                        ? isSolved
                          ? isLightCell
                            ? "#4ade80"
                            : "#22c55e"
                          : isLightCell
                            ? "#f8fafc"
                            : "#e2e8f0"
                        : "#0f172a",
                      border: isPlayable
                        ? isSolved
                          ? "1px solid #16a34a"
                          : "1px solid #94a3b8"
                        : "1px solid #0f172a",
                      transition: "background-color 220ms ease, border-color 220ms ease",
                    }}
                  >
                    {number !== null && (
                      <span
                        style={{
                          position: "absolute",
                          top: "1px",
                          left: "3px",
                          fontSize: "0.5rem",
                          lineHeight: 1,
                          fontWeight: 800,
                          color: "#334155",
                          userSelect: "none",
                        }}
                      >
                        {number}
                      </span>
                    )}

                    {isPlayable && (
                      <input
                        type="text"
                        inputMode="text"
                        maxLength={1}
                        value={letters[key] ?? ""}
                        onChange={(event) => onCellChange(key, event.target.value)}
                        aria-label={`row ${row + 1} column ${col + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          textAlign: "center",
                          textTransform: "uppercase",
                          color: "#0f172a",
                          fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
                          fontWeight: 800,
                          border: "none",
                          background: "transparent",
                          outline: "none",
                          boxShadow: "inset 0 0 0 0 transparent",
                        }}
                      />
                    )}
                  </div>
                );
              }),
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: "1.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))",
            gap: "1rem",
          }}
        >
          <section
            style={{
              borderRadius: "1rem",
              padding: "0.95rem 1rem",
              border: "1px solid rgba(148, 163, 184, 0.28)",
              background: "linear-gradient(180deg, rgba(15, 23, 42, 0.78) 0%, rgba(15, 23, 42, 0.6) 100%)",
            }}
          >
            <h2 style={{ margin: "0 0 0.6rem", color: "#f59e0b", fontSize: "0.95rem", letterSpacing: "0.08em" }}>
              ACROSS
            </h2>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", color: "#e2e8f0", display: "grid", gap: "0.35rem" }}>
              {acrossClues.map((clue) => (
                <li key={`across-${clue.number}`} style={{ fontSize: "0.92rem" }}>
                  {clue.number}. {clue.clue} ({clue.length} letters)
                </li>
              ))}
            </ul>
          </section>

          <section
            style={{
              borderRadius: "1rem",
              padding: "0.95rem 1rem",
              border: "1px solid rgba(148, 163, 184, 0.28)",
              background: "linear-gradient(180deg, rgba(15, 23, 42, 0.78) 0%, rgba(15, 23, 42, 0.6) 100%)",
            }}
          >
            <h2 style={{ margin: "0 0 0.6rem", color: "#60a5fa", fontSize: "0.95rem", letterSpacing: "0.08em" }}>
              DOWN
            </h2>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", color: "#e2e8f0", display: "grid", gap: "0.35rem" }}>
              {downClues.map((clue) => (
                <li key={`down-${clue.number}`} style={{ fontSize: "0.92rem" }}>
                  {clue.number}. {clue.clue} ({clue.length} letters)
                </li>
              ))}
            </ul>
          </section>
        </div>

      </section>
    </main>
  );
}
