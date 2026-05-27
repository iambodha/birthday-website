"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_BIRTHDAY_CONTENT, loadPrivateBirthdayContent } from "@/lib/birthday-content";
import {
  CAT_HAPPY_BIRTHDAY_SRC,
  DROP_DELAY_MS,
  DROP_DURATION_MS,
  SINGING_SRC,
  PUBLIC_BIRTHDAY_SONG_SRC,
} from "@/lib/experience-state";

export default function HappyBirthdayPage() {
  const router = useRouter();
  const [shouldDrop, setShouldDrop] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCakePrompt, setShowCakePrompt] = useState(false);
  const [isCakeChallengeActive, setIsCakeChallengeActive] = useState(false);
  const [cakeClicks, setCakeClicks] = useState(0);
  const [cakePopTick, setCakePopTick] = useState(0);
  const [birthdayContent, setBirthdayContent] = useState(DEFAULT_BIRTHDAY_CONTENT);
  const [isPublic, setIsPublic] = useState(false);
  const [typedMessage, setTypedMessage] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const catAudioRef = useRef<HTMLAudioElement | null>(null);
  const singingAudioRef = useRef<HTMLAudioElement | null>(null);
  const confettiTimerRef = useRef<number | null>(null);
  const cakePromptTimerRef = useRef<number | null>(null);
  const didTriggerConfettiRef = useRef(false);
  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 90 }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        duration: 4.8 + Math.random() * 4.2,
        delay: -Math.random() * 8,
        drift: (Math.random() - 0.5) * 240,
        size: 8 + Math.random() * 10,
        rotate: Math.random() * 540,
        color: ["#ef4444", "#f59e0b", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#ec4899"][
          index % 7
        ],
      })),
    [],
  );
  const carouselMessages = birthdayContent.messages;

  useEffect(() => {
    let isMounted = true;

    void loadPrivateBirthdayContent().then((loadedContent) => {
      if (isMounted) {
        setBirthdayContent(loadedContent);
        setIsPublic(loadedContent.isPublic);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Drop the curtain after a delay
    const dropTimer = window.setTimeout(() => {
      setShouldDrop(true);
    }, DROP_DELAY_MS);

    return () => {
      window.clearTimeout(dropTimer);
    };
  }, []);

  useEffect(() => {
    if (!showConfetti) {
      setTypedMessage("");
      setMessageIndex(0);
      setIsDeletingMessage(false);
      return;
    }

    const currentMessage = carouselMessages[messageIndex % carouselMessages.length];

    const timer = window.setTimeout(
      () => {
        if (!isDeletingMessage) {
          if (typedMessage.length < currentMessage.length) {
            setTypedMessage(currentMessage.slice(0, typedMessage.length + 1));
          } else {
            setIsDeletingMessage(true);
          }
          return;
        }

        if (typedMessage.length > 0) {
          setTypedMessage(currentMessage.slice(0, typedMessage.length - 1));
        } else {
          setIsDeletingMessage(false);
          setMessageIndex((prev) => (prev + 1) % carouselMessages.length);
        }
      },
      !isDeletingMessage
        ? typedMessage.length === currentMessage.length
          ? 1500
          : 42
        : typedMessage.length === 0
          ? 320
          : 26,
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [carouselMessages, isDeletingMessage, messageIndex, showConfetti, typedMessage]);

  useEffect(() => {
    void router.prefetch("/puzzle");
  }, [router]);

  useEffect(() => {
    if (cakeClicks >= 3 && !isCakeChallengeActive) {
      router.push("/puzzle");
    }
  }, [cakeClicks, isCakeChallengeActive, router]);

  useEffect(() => {
    const globalWindow = window as Window & {
      __introAudio?: HTMLAudioElement;
      __catBirthdayAudio?: HTMLAudioElement;
      __singingAudio?: HTMLAudioElement;
      __publicBirthdayAudio?: HTMLAudioElement;
    };
    const introAudio = globalWindow.__introAudio;
    let isDisposed = false;

    const startBirthdayTrack = () => {
      if (isDisposed || catAudioRef.current) {
        return;
      }

      const birthdayAudioSrc = isPublic ? PUBLIC_BIRTHDAY_SONG_SRC : CAT_HAPPY_BIRTHDAY_SRC;
      const birthdayAudio = new Audio(birthdayAudioSrc);
      birthdayAudio.preload = "auto";
      birthdayAudio.volume = 1;
      let hasStartedSinging = false;

      const onTimeUpdate = () => {
        if (!Number.isFinite(birthdayAudio.duration) || birthdayAudio.duration <= 0) {
          return;
        }

        // For private mode, start singing near the end of cat audio
        if (!isPublic) {
          const singingStart = Math.max(0, birthdayAudio.duration - 1.5);
          if (!hasStartedSinging && birthdayAudio.currentTime >= singingStart) {
            hasStartedSinging = true;
            const singingAudio = new Audio(SINGING_SRC);
            singingAudio.preload = "auto";
            singingAudioRef.current = singingAudio;
            globalWindow.__singingAudio = singingAudio;

            const maybeStartConfetti = () => {
              if (!didTriggerConfettiRef.current) {
                didTriggerConfettiRef.current = true;
                setShowConfetti(true);
              }
            };

            const onSingingTimeUpdate = () => {
              if (singingAudio.currentTime >= 5) {
                maybeStartConfetti();
                singingAudio.removeEventListener("timeupdate", onSingingTimeUpdate);
              }
            };

            singingAudio.addEventListener("timeupdate", onSingingTimeUpdate);

            confettiTimerRef.current = window.setTimeout(() => {
              if (!isDisposed) {
                maybeStartConfetti();
              }
            }, 5000);

            void singingAudio.play().catch(() => {
              // Ignore autoplay interruptions and keep the experience flow safe.
            });

            singingAudio.addEventListener(
              "ended",
              () => {
                singingAudio.removeEventListener("timeupdate", onSingingTimeUpdate);

                if (cakePromptTimerRef.current !== null) {
                  window.clearTimeout(cakePromptTimerRef.current);
                }

                cakePromptTimerRef.current = window.setTimeout(() => {
                  if (!isDisposed) {
                    setCakeClicks(0);
                    setShowCakePrompt(true);
                    setIsCakeChallengeActive(true);
                  }
                }, 3000);
              },
              { once: true },
            );
          }
        }

        // Apply fade-out for both public and private modes
        const fadeStart = Math.max(0, birthdayAudio.duration - 3);

        if (birthdayAudio.currentTime >= fadeStart) {
          const remaining = Math.max(0, birthdayAudio.duration - birthdayAudio.currentTime);
          birthdayAudio.volume = Math.max(0, Math.min(1, remaining / 3));
        }

        // For public mode, trigger confetti partway through
        if (isPublic && birthdayAudio.currentTime >= 5 && !didTriggerConfettiRef.current) {
          didTriggerConfettiRef.current = true;
          setShowConfetti(true);
        }
      };

      birthdayAudio.addEventListener("timeupdate", onTimeUpdate);

      catAudioRef.current = birthdayAudio;
      if (isPublic) {
        globalWindow.__publicBirthdayAudio = birthdayAudio;
      } else {
        globalWindow.__catBirthdayAudio = birthdayAudio;
      }

      void birthdayAudio.play().catch(() => {
        // Ignore autoplay interruptions and keep the experience flow safe.
      });

      birthdayAudio.addEventListener(
        "ended",
        () => {
          birthdayAudio.removeEventListener("timeupdate", onTimeUpdate);
          if (catAudioRef.current === birthdayAudio) {
            catAudioRef.current = null;
          }
          if (isPublic && globalWindow.__publicBirthdayAudio === birthdayAudio) {
            delete globalWindow.__publicBirthdayAudio;
          } else if (!isPublic && globalWindow.__catBirthdayAudio === birthdayAudio) {
            delete globalWindow.__catBirthdayAudio;
          }

          // For public mode, show cake prompt after song ends
          if (isPublic && !isDisposed) {
            if (cakePromptTimerRef.current !== null) {
              window.clearTimeout(cakePromptTimerRef.current);
            }

            cakePromptTimerRef.current = window.setTimeout(() => {
              if (!isDisposed) {
                setCakeClicks(0);
                setShowCakePrompt(true);
                setIsCakeChallengeActive(true);
              }
            }, 3000);
          }
        },
        { once: true },
      );
    };

    if (!introAudio || introAudio.ended) {
      startBirthdayTrack();
    } else {
      introAudio.addEventListener("ended", startBirthdayTrack, { once: true });
    }

    return () => {
      isDisposed = true;

      if (introAudio && !introAudio.ended) {
        introAudio.removeEventListener("ended", startBirthdayTrack);
      }

      if (catAudioRef.current) {
        catAudioRef.current.pause();
        catAudioRef.current.currentTime = 0;

        if (globalWindow.__catBirthdayAudio === catAudioRef.current) {
          delete globalWindow.__catBirthdayAudio;
        }
        if (globalWindow.__publicBirthdayAudio === catAudioRef.current) {
          delete globalWindow.__publicBirthdayAudio;
        }

        catAudioRef.current = null;
      }

      if (singingAudioRef.current) {
        singingAudioRef.current.pause();
        singingAudioRef.current.currentTime = 0;

        if (globalWindow.__singingAudio === singingAudioRef.current) {
          delete globalWindow.__singingAudio;
        }

        singingAudioRef.current = null;
      }

      if (confettiTimerRef.current !== null) {
        window.clearTimeout(confettiTimerRef.current);
        confettiTimerRef.current = null;
      }

      if (cakePromptTimerRef.current !== null) {
        window.clearTimeout(cakePromptTimerRef.current);
        cakePromptTimerRef.current = null;
      }
    };
  }, [isPublic]);

  const playClickSound = () => {
    const clickAudio = new Audio("/Click.mp3");
    void clickAudio.play().catch(() => {
      // Ignore playback failures when browser blocks immediate audio.
    });
  };

  const handleCakeClick = () => {
    playClickSound();

    if (isPublic) {
      router.push("/puzzle");
      return;
    }

    if (!isCakeChallengeActive) {
      return;
    }

    setCakePopTick((prev) => prev + 1);
    const nextClicks = cakeClicks + 1;
    setCakeClicks(nextClicks);

    if (nextClicks >= 3) {
      setIsCakeChallengeActive(false);
      setShowCakePrompt(false);
    }
  };

  return (
    <main className="celebration-page">
      {showConfetti ? (
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

      {showConfetti ? (
        <section className="celebration-hero" aria-live="polite">
          <p className="celebration-message-carousel">
            {typedMessage}
            <span className="celebration-message-cursor" aria-hidden="true" />
          </p>
          <button
            type="button"
            className="celebration-cake-button"
            onClick={handleCakeClick}
            aria-label="Birthday cake"
          >
            <img
              src="/cake.gif"
              alt="Pink birthday cake"
              className={`celebration-cake ${isCakeChallengeActive ? `celebration-cake--pop-${cakePopTick % 2 === 0 ? "a" : "b"}` : ""}`}
              loading="eager"
              decoding="async"
            />
          </button>

          {showCakePrompt ? (
            <div className="celebration-cake-prompt" role="status" aria-live="polite">
              {isPublic
                ? "Click on your birthday cake to continue."
                : "Click on your birthday cake three times."}
            </div>
          ) : null}
          <h1 className="celebration-title">{birthdayContent.title}</h1>
        </section>
      ) : null}

      <div
        className={`celebration-curtain ${shouldDrop ? "celebration-curtain--gone" : ""}`}
        style={{ transitionDuration: `${DROP_DURATION_MS}ms` }}
        aria-hidden="true"
      />

      <div className="sr-only" aria-live="polite">
        {shouldDrop ? "Curtain dropped" : "Curtain dropping"}
      </div>
    </main>
  );
}
