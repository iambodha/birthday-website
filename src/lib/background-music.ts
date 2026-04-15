const PUZZLE_TRACKS = [
  "/Zelda-Main-1.mp3",
  "/Zelda-Main-2.mp3",
  "/Zelda-Main-3.mp3",
  "/Zelda-Main-4.mp3",
] as const;

const LETTER_TRACK = "/Zelda-Chill.mp3";
const PUZZLE_VOLUME = 0.18;
const LETTER_VOLUME = 0.16;

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

type MusicMode = "puzzle" | "letter";

type StartTrackOptions = {
  mode: MusicMode;
  loop: boolean;
  fadeMs?: number;
  targetVolume: number;
  onEnded?: () => void;
};

class BackgroundMusicManager {
  private mode: MusicMode | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentSource: string | null = null;
  private remainingPuzzleTracks: string[] = [];
  private lastPuzzleTrack: string | null = null;
  private interactionRetryBound = false;
  private transitionToken = 0;

  public startPuzzlePlaylist(): void {
    const nextTrack = this.pickNextPuzzleTrack();
    void this.startTrack(nextTrack, {
      mode: "puzzle",
      loop: false,
      fadeMs: 600,
      targetVolume: PUZZLE_VOLUME,
      onEnded: () => {
        this.startPuzzlePlaylist();
      },
    });
  }

  public async stopPuzzlePlaylist(fadeMs = 800): Promise<void> {
    if (this.mode !== "puzzle") {
      return;
    }

    this.mode = null;
    this.transitionToken += 1;
    const previousAudio = this.currentAudio;
    this.currentAudio = null;
    this.currentSource = null;

    if (!previousAudio) {
      return;
    }

    await this.fadeOutAndStop(previousAudio, fadeMs);
  }

  public startLetterLoop(): void {
    void this.startTrack(LETTER_TRACK, {
      mode: "letter",
      loop: true,
      fadeMs: 650,
      targetVolume: LETTER_VOLUME,
    });
  }

  public async stopAll(fadeMs = 500): Promise<void> {
    this.mode = null;
    this.transitionToken += 1;
    const previousAudio = this.currentAudio;
    this.currentAudio = null;
    this.currentSource = null;

    if (!previousAudio) {
      return;
    }

    await this.fadeOutAndStop(previousAudio, fadeMs);
  }

  private pickNextPuzzleTrack(): string {
    if (this.remainingPuzzleTracks.length === 0) {
      const refill = PUZZLE_TRACKS.filter((track) => track !== this.lastPuzzleTrack);
      this.remainingPuzzleTracks = (refill.length > 0 ? refill : [...PUZZLE_TRACKS]) as string[];
    }

    const randomIndex = Math.floor(Math.random() * this.remainingPuzzleTracks.length);
    const [nextTrack] = this.remainingPuzzleTracks.splice(randomIndex, 1);
    this.lastPuzzleTrack = nextTrack;
    return nextTrack;
  }

  private async startTrack(src: string, options: StartTrackOptions): Promise<void> {
    const { mode, loop, fadeMs = 600, targetVolume, onEnded } = options;

    if (this.mode === mode && this.currentAudio && this.currentSource === src) {
      return;
    }

    this.mode = mode;
    const token = ++this.transitionToken;

    const previousAudio = this.currentAudio;
    this.currentAudio = null;
    this.currentSource = null;

    if (previousAudio) {
      await this.fadeOutAndStop(previousAudio, fadeMs);
      if (token !== this.transitionToken) {
        return;
      }
    }

    const nextAudio = new Audio(src);
    nextAudio.preload = "auto";
    nextAudio.loop = loop;
    nextAudio.volume = 0;

    if (onEnded) {
      nextAudio.addEventListener(
        "ended",
        () => {
          if (this.transitionToken !== token || this.mode !== mode) {
            return;
          }
          onEnded();
        },
        { once: false },
      );
    }

    this.currentAudio = nextAudio;
    this.currentSource = src;
    this.bindInteractionRetry();

    void nextAudio.play().catch(() => {
      // Ignore autoplay restrictions and retry on interaction.
    });

    this.fadeToVolume(nextAudio, targetVolume, fadeMs);
  }

  private bindInteractionRetry(): void {
    if (this.interactionRetryBound) {
      return;
    }

    this.interactionRetryBound = true;

    const retry = () => {
      if (!this.currentAudio) {
        return;
      }

      void this.currentAudio.play().catch(() => {
        // Ignore retries that still fail due to browser policies.
      });
    };

    window.addEventListener("pointerdown", retry, { passive: true });
    window.addEventListener("keydown", retry);
  }

  private fadeToVolume(audio: HTMLAudioElement, targetVolume: number, durationMs: number): void {
    const startVolume = clampVolume(audio.volume);
    const safeTargetVolume = clampVolume(targetVolume);
    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const progress = durationMs <= 0 ? 1 : Math.min(1, Math.max(0, elapsed / durationMs));
      audio.volume = clampVolume(startVolume + (safeTargetVolume - startVolume) * progress);

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }

  private async fadeOutAndStop(audio: HTMLAudioElement, durationMs: number): Promise<void> {
    const startVolume = clampVolume(audio.volume);
    const startedAt = performance.now();

    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        const elapsed = now - startedAt;
        const progress = durationMs <= 0 ? 1 : Math.min(1, Math.max(0, elapsed / durationMs));
        audio.volume = clampVolume(startVolume * (1 - progress));

        if (progress < 1) {
          requestAnimationFrame(tick);
          return;
        }

        resolve();
      };

      requestAnimationFrame(tick);
    });

    audio.pause();
    audio.currentTime = 0;
  }
}

declare global {
  interface Window {
    __birthdayBackgroundMusicManager?: BackgroundMusicManager;
  }
}

function getManager(): BackgroundMusicManager | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!window.__birthdayBackgroundMusicManager) {
    window.__birthdayBackgroundMusicManager = new BackgroundMusicManager();
  }

  return window.__birthdayBackgroundMusicManager;
}

export function startPuzzleBackgroundMusic(): void {
  const manager = getManager();
  if (!manager) {
    return;
  }

  manager.startPuzzlePlaylist();
}

export function stopPuzzleBackgroundMusic(fadeMs = 800): Promise<void> {
  const manager = getManager();
  if (!manager) {
    return Promise.resolve();
  }

  return manager.stopPuzzlePlaylist(fadeMs);
}

export function startLetterBackgroundMusic(): void {
  const manager = getManager();
  if (!manager) {
    return;
  }

  manager.startLetterLoop();
}

export function stopBackgroundMusic(fadeMs = 500): Promise<void> {
  const manager = getManager();
  if (!manager) {
    return Promise.resolve();
  }

  return manager.stopAll(fadeMs);
}
