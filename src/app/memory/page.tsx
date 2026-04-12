"use client";

import { useEffect, useState } from "react";
import {
  DROP_DELAY_MS,
  DROP_DURATION_MS,
  PERSISTENCE_ENABLED,
  readProgress,
  saveProgress,
} from "@/lib/experience-state";

export default function MemoryPage() {
  const [shouldDrop, setShouldDrop] = useState(false);
  const [isReadyToStart, setIsReadyToStart] = useState(false);

  useEffect(() => {
    if (PERSISTENCE_ENABLED) {
      const progress = readProgress();

      if (progress.memoryComplete) {
        setShouldDrop(true);
        setIsReadyToStart(true);
        return;
      }
    }

    const introAudioWindow = window as Window & {
      __introAudio?: HTMLAudioElement;
    };

    const audio = introAudioWindow.__introAudio;

    if (!audio) {
      return;
    }

    const dropTimer = window.setTimeout(() => {
      setShouldDrop(true);
    }, DROP_DELAY_MS);

    const handleEnded = () => {
      setIsReadyToStart(true);

      if (PERSISTENCE_ENABLED) {
        saveProgress({ accepted: true, memoryComplete: true });
      }

      setShouldDrop(true);
    };

    audio.addEventListener("ended", handleEnded);

    return () => {
      window.clearTimeout(dropTimer);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3e8d8]">
      <div className="absolute inset-0 bg-[#f3e8d8]" />

      <div
        className={`absolute inset-0 z-10 bg-black transition-transform ease-[cubic-bezier(0.2,0.9,0.25,1)] ${
          shouldDrop ? "translate-y-full" : "translate-y-0"
        }`}
        style={{ transitionDuration: `${DROP_DURATION_MS}ms` }}
      />

      <div className="sr-only" aria-live="polite">
        {isReadyToStart ? "Checkpoint ready" : "Waiting for intro to finish"}
      </div>
    </main>
  );
}
