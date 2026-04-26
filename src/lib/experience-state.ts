export const PERSISTENCE_ENABLED = false;
export const PROGRESS_KEY = "birthday-website-progress";
export const DROP_DELAY_MS = 5000;
export const DROP_DURATION_MS = 12000;
export const STARTER_HAPPY_BIRTHDAY_SRC = "/Intro_Music.mp3";
export const CAT_HAPPY_BIRTHDAY_SRC = "/Cats_Happy_Birthday.mp3";
export const SINGING_SRC = "/Singing.mp3";
export const PUBLIC_BIRTHDAY_SONG_SRC = "/Public_Birthday_Song.mp3";

export type ProgressState = {
  accepted: boolean;
  introComplete: boolean;
};

export function readProgress(): ProgressState {
  if (typeof window === "undefined") {
    return { accepted: false, introComplete: false };
  }

  const raw = window.localStorage.getItem(PROGRESS_KEY);

  if (!raw) {
    return { accepted: false, introComplete: false };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      accepted: Boolean(parsed.accepted),
      introComplete: Boolean(parsed.introComplete),
    };
  } catch {
    return { accepted: false, introComplete: false };
  }
}

export function saveProgress(progress: ProgressState) {
  if (typeof window === "undefined" || !PERSISTENCE_ENABLED) {
    return;
  }

  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}