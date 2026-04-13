export type BirthdayContent = {
  title: string;
  messages: string[];
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

function normalizeContent(input: unknown): BirthdayContent {
  if (!input || typeof input !== "object") {
    return DEFAULT_BIRTHDAY_CONTENT;
  }

  const candidate = input as Partial<BirthdayContent>;
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
    title,
    messages: messages.length > 0 ? messages : DEFAULT_BIRTHDAY_CONTENT.messages,
  };
}

export async function loadBirthdayContent(): Promise<BirthdayContent> {
  try {
    const response = await fetch(PRIVATE_CONTENT_PATH, { cache: "no-store" });

    if (!response.ok) {
      return DEFAULT_BIRTHDAY_CONTENT;
    }

    const data = (await response.json()) as unknown;
    return normalizeContent(data);
  } catch {
    return DEFAULT_BIRTHDAY_CONTENT;
  }
}
