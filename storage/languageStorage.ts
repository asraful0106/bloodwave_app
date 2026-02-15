// storage/languageStorage.ts
import { LanguageCode, LanguageCodes } from "@/constants/languages";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "app_language";

export async function loadLanguage(): Promise<LanguageCode> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    if (value && value in LanguageCodes) {
      return value as LanguageCode;
    }
  } catch (error) {
    console.warn("Failed to load language", error);
  }
  return LanguageCodes.en; // fallback
}

export async function saveLanguage(lang: LanguageCode): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch (error) {
    console.warn("Failed to save language", error);
  }
}
