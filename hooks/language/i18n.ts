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
        error_title: "Login Error",
        error_generic: "Something went wrong. Unable to login.",
      },
      home: {
        home: "Home",
      },
      donated: {
        donated: "Donated",
      },
      profile: {
        profile: "Profile",
      },
      setting: {
        generalSetting: "General Setting",
        theme: "Theme",
        language: "Language",
      },
      universal: {
        loading: "Loading",
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
        error_title: "লগইন ত্রুটি",
        error_generic: "কিছু একটা ভুল হয়েছে। লগইন করা সম্ভব হয়নি।",
      },
      home: {
        home: "হোম",
      },
      donated: {
        donated: "দান করেছেন",
      },
      profile: {
        profile: "প্রোফাইল",
      },
      setting: {
        generalSetting: "সাধারণ সেটিংস",
        theme: "থিম",
        language: "ভাষা",
      },
      universal: {
        loading: "লোড হচ্ছে",
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
