export type BirthdayContent = {
  title: string;
  messages: string[];
};

export type PuzzleQuestion = {
  question: string;
  answer: string;
};

export type PuzzleClue = {
  number: number;
  clue: string;
  answer: string;
};

export type PuzzleTwoContent = {
  petName: string;
  roughQuestions: PuzzleQuestion[];
  crosswordClues: {
    across: PuzzleClue[];
    down: PuzzleClue[];
  };
};

export type PrivateBirthdayContent = BirthdayContent & {
  name: string;
  puzzleTwo: PuzzleTwoContent;
  isPublic: boolean;
};

export const DEFAULT_NAME = "Birthday Star";
export const REQUIRED_ACROSS_NUMBERS = [1, 2, 5, 6, 8, 9] as const;
export const REQUIRED_DOWN_NUMBERS = [3, 4, 7, 10, 11, 12, 13] as const;
export const PLACEHOLDER_CLUE_TEXT = "Placeholder question";
export const PLACEHOLDER_ANSWER_TEXT = "PLACEHOLDER";

export const DEFAULT_PUZZLE_TWO_CONTENT: PuzzleTwoContent = {
  petName: "friend",
  roughQuestions: [],
  crosswordClues: {
    across: REQUIRED_ACROSS_NUMBERS.map((number) => ({
      number,
      clue: PLACEHOLDER_CLUE_TEXT,
      answer: PLACEHOLDER_ANSWER_TEXT,
    })),
    down: REQUIRED_DOWN_NUMBERS.map((number) => ({
      number,
      clue: PLACEHOLDER_CLUE_TEXT,
      answer: PLACEHOLDER_ANSWER_TEXT,
    })),
  },
};

export const DEFAULT_BIRTHDAY_CONTENT: BirthdayContent = {
  title: "Happy Birthday!",
  messages: [
    "Put your sweet messages here.",
    "Add your private birthday line here.",
    "Keep your personal messages in the private JSON file.",
  ],
};

const PRIVATE_CONTENT_PATH = "/private-birthday-content.json";

function normalizeQuestionArray(input: unknown): PuzzleQuestion[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((item): item is Partial<PuzzleQuestion> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      question: typeof item.question === "string" ? item.question.trim() : "",
      answer: typeof item.answer === "string" ? item.answer.trim().toUpperCase() : "",
    }))
    .filter((item) => item.question.length > 0 && item.answer.length > 0);
}

function normalizeClues(input: unknown, requiredNumbers: readonly number[]): PuzzleClue[] {
  const incoming = Array.isArray(input) ? input : [];

  return requiredNumbers.map((requiredNumber) => {
    const matched = incoming.find((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const candidate = item as Partial<PuzzleClue>;
      return candidate.number === requiredNumber;
    }) as Partial<PuzzleClue> | undefined;

    const clue =
      typeof matched?.clue === "string" && matched.clue.trim().length > 0
        ? matched.clue.trim()
        : PLACEHOLDER_CLUE_TEXT;
    const answer =
      typeof matched?.answer === "string" && matched.answer.trim().length > 0
        ? matched.answer.trim().toUpperCase()
        : PLACEHOLDER_ANSWER_TEXT;

    return {
      number: requiredNumber,
      clue,
      answer,
    };
  });
}

function normalizePuzzleTwo(input: unknown): PuzzleTwoContent {
  if (!input || typeof input !== "object") {
    return DEFAULT_PUZZLE_TWO_CONTENT;
  }

  const candidate = input as Record<string, unknown>;
  const cluesCandidate =
    candidate.crosswordClues && typeof candidate.crosswordClues === "object"
      ? (candidate.crosswordClues as Record<string, unknown>)
      : {};
  const petName =
    typeof candidate.petName === "string" && candidate.petName.trim().length > 0
      ? candidate.petName.trim()
      : DEFAULT_PUZZLE_TWO_CONTENT.petName;

  return {
    petName,
    roughQuestions: normalizeQuestionArray(candidate.roughQuestions),
    crosswordClues: {
      across: normalizeClues(cluesCandidate.across, REQUIRED_ACROSS_NUMBERS),
      down: normalizeClues(cluesCandidate.down, REQUIRED_DOWN_NUMBERS),
    },
  };
}

function normalizePrivateContent(input: unknown): PrivateBirthdayContent {
  if (!input || typeof input !== "object") {
    return {
      ...DEFAULT_BIRTHDAY_CONTENT,
      name: DEFAULT_NAME,
      puzzleTwo: DEFAULT_PUZZLE_TWO_CONTENT,
      isPublic: false,
    };
  }

  const candidate = input as Record<string, unknown>;
  const isPublic = typeof candidate.isPublic === "boolean" ? candidate.isPublic : false;

  // If in public mode, return all defaults
  if (isPublic) {
    return {
      ...DEFAULT_BIRTHDAY_CONTENT,
      name: DEFAULT_NAME,
      puzzleTwo: DEFAULT_PUZZLE_TWO_CONTENT,
      isPublic: true,
    };
  }

  const name =
    typeof candidate.name === "string" && candidate.name.trim().length > 0
      ? candidate.name.trim()
      : DEFAULT_NAME;

  const title =
    typeof candidate.title === "string" && candidate.title.trim().length > 0
      ? candidate.title.trim()
      : DEFAULT_BIRTHDAY_CONTENT.title;

  const messages = Array.isArray(candidate.messages)
    ? candidate.messages
        .filter((message): message is string => typeof message === "string")
        .map((message) => message.trim())
        .filter((message) => message.length > 0)
    : [];

  return {
    name,
    title,
    messages: messages.length > 0 ? messages : DEFAULT_BIRTHDAY_CONTENT.messages,
    puzzleTwo: normalizePuzzleTwo(candidate.puzzleTwo),
    isPublic: false,
  };
}

export async function loadPrivateBirthdayContent(): Promise<PrivateBirthdayContent> {
  try {
    const response = await fetch(PRIVATE_CONTENT_PATH, { cache: "no-store" });

    if (!response.ok) {
      return {
        ...DEFAULT_BIRTHDAY_CONTENT,
        name: DEFAULT_NAME,
        puzzleTwo: DEFAULT_PUZZLE_TWO_CONTENT,
      };
    }

    const data = (await response.json()) as unknown;
    return normalizePrivateContent(data);
  } catch {
    return {
      ...DEFAULT_BIRTHDAY_CONTENT,
      name: DEFAULT_NAME,
      puzzleTwo: DEFAULT_PUZZLE_TWO_CONTENT,
    };
  }
}

export async function loadBirthdayContent(): Promise<BirthdayContent> {
  const content = await loadPrivateBirthdayContent();

  return {
    title: content.title,
    messages: content.messages,
  };
}

export async function loadBirthdayName(): Promise<string> {
  const content = await loadPrivateBirthdayContent();
  return content.name;
}

export async function loadPuzzleTwoContent(): Promise<PuzzleTwoContent> {
  const content = await loadPrivateBirthdayContent();
  return content.puzzleTwo;
}
