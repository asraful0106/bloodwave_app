// "@/context/LanguageContext.tsx"

import { LanguageCode, LanguageCodes } from "@/constants/languages";
import { loadLanguage, saveLanguage } from "@/storage/languageStorage";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import i18n from "./i18n";

type Direction = "ltr" | "rtl";

type LanguageConfig = {
  code: LanguageCode;
  label: string;
  dir: Direction;
  // Optionally: you can attach a font per language here
  // fontFamily?: string;
};

const languages: Record<LanguageCode, LanguageConfig> = {
  en: { code: "en", label: "English", dir: "ltr" },
  bn: { code: "bn", label: "বাংলা", dir: "ltr" },
};

type LanguageContextValue = {
  lang: LanguageCode;
  config: LanguageConfig;
  changeLanguage: (lang: LanguageCode) => void;
  isHydrated: boolean; // so you can react on app start
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LanguageCode>("en");
  const [isHydrated, setIsHydrated] = useState(false);

  // Load language on app startup
  useEffect(() => {
    (async () => {
      const stored = await loadLanguage();

      if (stored) {
        setLang(stored);
        i18n.changeLanguage(stored);
      } else if (typeof window !== "undefined") {
        setLang(LanguageCodes.en);
        i18n.changeLanguage(LanguageCodes.en);
      }
      setIsHydrated(true);
    })();
  }, []);

  // Save whenever language changes (after first load)
  useEffect(() => {
    if (!isHydrated) return;
    saveLanguage(lang);
  }, [lang, isHydrated]);

  const changeLanguage = (newLang: LanguageCode) => {
    if (lang === newLang) return;
    setLang(newLang);
    i18n.changeLanguage(newLang);
  };

  const value: LanguageContextValue = {
    lang,
    config: languages[lang],
    changeLanguage,
    isHydrated,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return ctx;
}
