// i18n.ts
import i18n, { use as i18nUse } from "i18next";
import { initReactI18next } from "react-i18next";

export const resources = {
  en: {},
  bn: {},
};

i18nUse(initReactI18next).init({
  resources,
  lng: "en", // initial language (from device)
  fallbackLng: "en", // if device language is not in resources
  compatibilityJSON: "v4", // important for React Native
  interpolation: {
    escapeValue: false, // not needed for React Native
  },
});

export default i18n;