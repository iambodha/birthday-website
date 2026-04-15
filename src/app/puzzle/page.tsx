"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_NAME, loadBirthdayName } from "@/lib/birthday-content";
import {
  startPuzzleBackgroundMusic,
  stopPuzzleBackgroundMusic,
} from "@/lib/background-music";
import {
  createGame,
  getAllSquares,
  getBoardPieces,
  getLegalMovesFrom,
  getStatusText,
  getTurnLabel,
  isDarkSquare,
  requiresPromotion,
  toSpriteClass,
  type PromotionChoice,
} from "@/lib/chess";
import type { Square } from "chess.js";

export default function PuzzlePage() {
  const router = useRouter();
  const PUZZLE_FEN = "5rbk/2pq3p/5PQR/p7/3p3R/1P4N1/P5PP/6K1 w - - 0 1";
  const PUZZLE_SOLUTION = ["g3f5", "f8f7", "h4g4", "f7f8", "g6g7", "d7g7", "f6g7"];
  const CLAPPING_SOUND_SRC = "/clapping sound.mp3";
  const GOOD_GIRL_SOUND_SRC = "/good_girl.mp3";
  const [fen, setFen] = useState(PUZZLE_FEN);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [showSolvedConfetti, setShowSolvedConfetti] = useState(false);
  const [showSolvedPopup, setShowSolvedPopup] = useState(false);
  const [lastError, setLastError] = useState(false);
  const [birthdayName, setBirthdayName] = useState(DEFAULT_NAME);
  const [fenHistory, setFenHistory] = useState<string[]>([PUZZLE_FEN]);
  const solvedSequenceStartedRef = useRef(false);
  const confettiTimerRef = useRef<number | null>(null);
  const game = useMemo(() => createGame(fen), [fen]);
  const boardSquares = useMemo(() => getAllSquares(), []);
  const pieces = useMemo(() => getBoardPieces(game), [game]);
  const pieceBySquare = useMemo(() => new Map(pieces.map((piece) => [piece.square, piece])), [pieces]);
  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 52 }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        duration: 1.15 + Math.random() * 0.8,
        delay: -Math.random() * 1.2,
        drift: (Math.random() - 0.5) * 220,
        size: 7 + Math.random() * 9,
        rotate: Math.random() * 580,
        color: ["#ef4444", "#f59e0b", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#ec4899"][index % 7],
      })),
    [],
  );

  useEffect(() => {
    return () => {
      if (confettiTimerRef.current !== null) {
        window.clearTimeout(confettiTimerRef.current);
        confettiTimerRef.current = null;
      }
    };
  }, []);

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
    startPuzzleBackgroundMusic();
  }, []);

  const clearSelection = () => {
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  const playBruhSound = () => {
    const audio = new Audio("/bruh-soundeffect.mp3");
    audio.play().catch(() => {
      // Ignore autoplay errors
    });
  };

  const playBoingSound = () => {
    const audio = new Audio("/boing.mp3");
    audio.volume = 1;

    try {
      const AudioContextCtor = (window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as
        | typeof AudioContext
        | undefined;

      if (AudioContextCtor) {
        const context = new AudioContextCtor();
        const source = context.createMediaElementSource(audio);
        const gainNode = context.createGain();
        gainNode.gain.value = 5;

        source.connect(gainNode);
        gainNode.connect(context.destination);

        audio.addEventListener(
          "ended",
          () => {
            context.close().catch(() => {
              // Ignore close errors
            });
          },
          { once: true },
        );

        context.resume().catch(() => {
          // Ignore resume errors
        });
      }
    } catch {
      // Ignore unsupported Web Audio scenarios
    }

    audio.play().catch(() => {
      // Ignore autoplay errors
    });
  };

  const playSoundAndWait = (src: string) => {
    return new Promise<void>((resolve) => {
      const audio = new Audio(src);

      const cleanup = () => {
        audio.removeEventListener("ended", onEnded);
        audio.removeEventListener("error", onError);
      };

      const onEnded = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        resolve();
      };

      audio.addEventListener("ended", onEnded, { once: true });
      audio.addEventListener("error", onError, { once: true });
      audio.play().catch(() => {
        cleanup();
        resolve();
      });
    });
  };

  const runSolvedSequence = async () => {
    if (solvedSequenceStartedRef.current) {
      return;
    }

    solvedSequenceStartedRef.current = true;
    setShowSolvedPopup(false);
    setShowSolvedConfetti(true);

    if (confettiTimerRef.current !== null) {
      window.clearTimeout(confettiTimerRef.current);
    }

    confettiTimerRef.current = window.setTimeout(() => {
      setShowSolvedConfetti(false);
      confettiTimerRef.current = null;
    }, 850);

    await stopPuzzleBackgroundMusic(900);
    await playSoundAndWait(CLAPPING_SOUND_SRC);
    await playSoundAndWait(GOOD_GIRL_SOUND_SRC);
    setShowSolvedPopup(true);
  };

  const resetToPreviousMove = () => {
    const previousFen = fenHistory[moveCount] || PUZZLE_FEN;
    setFen(previousFen);
    clearSelection();
    setLastError(false);
  };

  const resetPuzzle = () => {
    setFen(PUZZLE_FEN);
    setMoveCount(0);
    setFenHistory([PUZZLE_FEN]);
    setPuzzleSolved(false);
    setShowSolvedConfetti(false);
    setShowSolvedPopup(false);
    setPendingPromotion(null);
    clearSelection();
    setLastError(false);
    solvedSequenceStartedRef.current = false;

    if (confettiTimerRef.current !== null) {
      window.clearTimeout(confettiTimerRef.current);
      confettiTimerRef.current = null;
    }

    startPuzzleBackgroundMusic();
  };

  const onSquareClick = (square: Square) => {
    if (pendingPromotion) {
      return;
    }

    const piece = pieceBySquare.get(square);

    if (selectedSquare) {
      const canMoveHere = legalMoves.includes(square);

      if (canMoveHere) {
        if (requiresPromotion(game, selectedSquare, square)) {
          setPendingPromotion({ from: selectedSquare, to: square });
          clearSelection();
          return;
        }

        const nextGame = createGame(fen);
        const result = nextGame.move({ from: selectedSquare, to: square });
        if (result) {
          const moveNotation = `${selectedSquare}${square}`;

          if (!puzzleSolved) {
            const expectedMove = PUZZLE_SOLUTION[moveCount];

            if (moveNotation !== expectedMove) {
              playBruhSound();
              setLastError(true);
              setTimeout(() => setLastError(false), 600);
              resetToPreviousMove();
              return;
            }

            playBoingSound();
            const newMoveCount = moveCount + 1;
            const newFen = nextGame.fen();
            setFen(newFen);
            setMoveCount(newMoveCount);
            setFenHistory((prev) => [...prev, newFen]);

            if (newMoveCount >= PUZZLE_SOLUTION.length) {
              setPuzzleSolved(true);
              void runSolvedSequence();
            }
          } else {
            setFen(nextGame.fen());
          }
        }

        clearSelection();
        return;
      }
    }

    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      setLegalMoves(getLegalMovesFrom(game, square));
      return;
    }

    clearSelection();
  };

  const onPromote = (promotion: PromotionChoice) => {
    if (!pendingPromotion) {
      return;
    }

    const nextGame = createGame(fen);
    const result = nextGame.move({
      from: pendingPromotion.from,
      to: pendingPromotion.to,
      promotion,
    });

    if (result) {
      setFen(nextGame.fen());
    }

    setPendingPromotion(null);
  };

  const goToNextPuzzle = () => {
    router.push("/puzzle-2");
  };

  return (
    <main className="puzzle-page">
      {showSolvedConfetti ? (
        <div className="confetti-layer" aria-hidden="true">
          {confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className="confetti-piece"
              style={
                {
                  left: `${piece.left}%`,
                  width: `${piece.size}px`,
                  height: `${piece.size * 0.55}px`,
                  backgroundColor: piece.color,
                  ["--confetti-duration" as string]: `${piece.duration}s`,
                  ["--confetti-delay" as string]: `${piece.delay}s`,
                  ["--confetti-drift" as string]: `${piece.drift}px`,
                  ["--confetti-rotate" as string]: `${piece.rotate}deg`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      ) : null}

      <section className="puzzle-stage">
        <p className="puzzle-title puzzle-title--line-1">To know it&apos;s really you, {birthdayName},</p>
        <p className="puzzle-title puzzle-title--line-2">you gotta solve a puzzle.</p>
        <p className="puzzle-turn">Turn: {getTurnLabel(game)}</p>
        <p className="puzzle-status">
          {puzzleSolved
            ? "✓ Puzzle solved! Free play enabled."
            : `Move ${moveCount + 1} of ${PUZZLE_SOLUTION.length}`}
        </p>
        <button type="button" className="puzzle-reset-button" onClick={resetPuzzle}>
          Reset Puzzle
        </button>

        <div
          className={`puzzle-board ${lastError ? "puzzle-board--error" : ""}`}
          role="grid"
          aria-label="Chess board puzzle"
        >
          {boardSquares.map((square) => {
            const piece = pieceBySquare.get(square);
            const isSelected = selectedSquare === square;
            const isLegal = legalMoves.includes(square);

            return (
              <button
                key={square}
                type="button"
                className={`puzzle-square ${isDarkSquare(square) ? "puzzle-square--dark" : "puzzle-square--light"} ${isSelected ? "puzzle-square--selected" : ""} ${isLegal ? "puzzle-square--legal" : ""} ${piece ? toSpriteClass(piece) : "empty"}`}
                onClick={() => onSquareClick(square)}
                aria-label={`Square ${square}`}
              />
            );
          })}
        </div>

        {pendingPromotion ? (
          <div className="puzzle-overlay">
            <div className="puzzle-overlay-card">
              <p className="puzzle-overlay-title">Promotion</p>
              <p className="puzzle-overlay-text">Choose your piece</p>
              <div className="puzzle-promotion-row">
                <button type="button" className="puzzle-promotion-button" onClick={() => onPromote("q")}>
                  Queen
                </button>
                <button type="button" className="puzzle-promotion-button" onClick={() => onPromote("r")}>
                  Rook
                </button>
                <button type="button" className="puzzle-promotion-button" onClick={() => onPromote("b")}>
                  Bishop
                </button>
                <button type="button" className="puzzle-promotion-button" onClick={() => onPromote("n")}>
                  Knight
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showSolvedPopup ? (
          <div className="celebration-cake-prompt puzzle-solved-popup" role="dialog" aria-live="polite">
            <p className="puzzle-solved-popup-text">
              well i know you can play chess now. but did you think it was that easy?
            </p>
            <button type="button" className="puzzle-next-button" onClick={goToNextPuzzle}>
              go to next puzzle
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
