"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  INTRO_AUDIO_SRC,
  PERSISTENCE_ENABLED,
  readProgress,
  saveProgress,
} from "@/lib/experience-state";

const MESSAGE =
  "To experience the website to the fullest, please go on your computer and turn up the volume and brightness. Enter fullscreen, press enter, and enjoy!";

export default function Home() {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [isTypingDone, setIsTypingDone] = useState(false);
  const [showReadyModal, setShowReadyModal] = useState(false);
  const [choice, setChoice] = useState<"yes" | "no" | null>(null);
  const [isDropping, setIsDropping] = useState(false);

  useEffect(() => {
    if (!PERSISTENCE_ENABLED) {
      return;
    }

    const progress = readProgress();

    if (progress.memoryComplete || progress.accepted) {
      router.replace("/memory");
    }
  }, [router]);

  useEffect(() => {
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTyped(MESSAGE.slice(0, index));

      if (index >= MESSAGE.length) {
        window.clearInterval(timer);
        setIsTypingDone(true);

        if (PERSISTENCE_ENABLED) {
          const progress = readProgress();
          saveProgress({
            accepted: progress.accepted,
            memoryComplete: progress.memoryComplete,
          });
        }
      }
    }, 10);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && isTypingDone && !showReadyModal && !isDropping) {
        setShowReadyModal(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isTypingDone, showReadyModal, isDropping]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3e8d8]">
      <div
        className={`absolute inset-0 z-10 flex items-center justify-center bg-black px-6 transition-transform duration-[1200ms] ease-[cubic-bezier(0.2,0.9,0.25,1)] ${isDropping ? "translate-y-full" : "translate-y-0"}`}
      >
        <div className="w-full max-w-4xl text-center">
          <p className="text-xl leading-relaxed text-white sm:text-3xl">
            {typed}
            <span className="ml-1 inline-block h-[1.1em] w-[0.08em] animate-pulse bg-white align-[-0.15em]" />
          </p>

          {isTypingDone && !showReadyModal ? (
            <p className="mt-8 text-sm uppercase tracking-[0.2em] text-zinc-300 sm:text-base">
              Press Enter To Continue
            </p>
          ) : null}

          {choice === "no" ? (
            <p className="mt-8 text-sm uppercase tracking-[0.15em] text-red-400 sm:text-base">
              Waiting For Your Approval Queen.
            </p>
          ) : null}
        </div>

        {showReadyModal ? (
          <div className="absolute inset-0 z-10 grid place-items-center bg-black/75 px-6">
            <div className="w-full max-w-xl border-4 border-zinc-200 bg-zinc-900 p-6 text-center shadow-[0_0_0_4px_#0f0f0f,0_20px_60px_rgba(0,0,0,0.7)] sm:p-8">
              <p className="mb-6 text-3xl uppercase tracking-[0.08em] text-white sm:text-4xl">
                Are You Ready?
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setChoice("yes");
                    setShowReadyModal(false);

                    if (PERSISTENCE_ENABLED) {
                      saveProgress({ accepted: true, memoryComplete: false });
                    }

                    const audio = new Audio(INTRO_AUDIO_SRC);
                    const introAudioWindow = window as Window & {
                      __introAudio?: HTMLAudioElement;
                    };

                    introAudioWindow.__introAudio = audio;
                    void audio.play();
                    router.push("/memory");
                  }}
                  className="border-2 border-green-300 bg-green-600 px-7 py-3 text-lg font-bold uppercase tracking-[0.12em] text-white shadow-[0_4px_0_0_#166534] transition hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_0_#166534]"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChoice("no");
                    setShowReadyModal(false);

                    if (PERSISTENCE_ENABLED) {
                      saveProgress({ accepted: false, memoryComplete: false });
                    }
                  }}
                  className="border-2 border-red-300 bg-red-600 px-7 py-3 text-lg font-bold uppercase tracking-[0.12em] text-white shadow-[0_4px_0_0_#991b1b] transition hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_0_#991b1b]"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
