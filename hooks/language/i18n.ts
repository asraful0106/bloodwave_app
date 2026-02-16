// i18n.ts
import i18n, { use as i18nUse } from "i18next";
import { initReactI18next } from "react-i18next";

export const resources = {
  en: {
    translation: {
      login: {
        welcome_back: "Welcome back",
        email: "Email",
        password: "Password",
        remember_me: "Remember me",
        forget_password: "Forget Password?",
        login: "Login",
      },
    },
  },
  bn: {
    translation: {
      login: {
        welcome_back: "ফিরে আসায় স্বাগতম",
        email: "ইমেইল",
        password: "পাসওয়ার্ড",
        remember_me: "আমাকে মনে রেখো",
        forget_password: "পাসওয়ার্ড ভুলে গেছেন?",
        login: "লগইন",
      },
    },
  },
} as const;

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
