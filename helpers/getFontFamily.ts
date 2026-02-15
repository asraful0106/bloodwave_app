import { LanguageCode } from "@/constants/languages";

export const getFontFamily = (lang: LanguageCode) => {
  // console.log(lang);
  switch (lang) {
    case "bn":
      return "NotoSerifBengali";
    case "en":
      return "SansFlex";
    default:
      return "Noto";
  }
};
