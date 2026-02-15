export type LanguageCode =
  | "en"
  | "bn";

export const LanguageCodes = {
  en: "en",
  bn: "bn",
} as const;

// Optional: helpful derived type
export type LanguageCodeKey = keyof typeof LanguageCodes;
