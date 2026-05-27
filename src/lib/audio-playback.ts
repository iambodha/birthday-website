const RETRY_EVENT_OPTIONS = { once: true, passive: true } as const;

export function playAudioWithRetry(audio: HTMLAudioElement): void {
  const tryPlay = () => {
    void audio.play().catch(() => {
      if (typeof window === "undefined") {
        return;
      }

      const retry = () => {
        void audio.play().catch(() => {
          // Ignore repeat failures; the browser may still require another user gesture.
        });
      };

      window.addEventListener("pointerdown", retry, RETRY_EVENT_OPTIONS);
      window.addEventListener("keydown", retry, { once: true });
      window.addEventListener("touchstart", retry, RETRY_EVENT_OPTIONS);
    });
  };

  tryPlay();
}