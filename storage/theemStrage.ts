import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "@app_theme";

export async function saveTheme(themeName: string, cTheme: string) {
  try {
    const data = JSON.stringify({ themeName, cTheme });
    await AsyncStorage.setItem(THEME_KEY, data);
    // console.log("Theme: ", data);
  } catch (e) {
    console.warn("Failed to save theme:", e);
  }
}

export async function loadTheme() {
  try {
    const data = await AsyncStorage.getItem(THEME_KEY);
    if (!data) return null; // nothing saved yet
    return JSON.parse(data); // { themeName, cTheme }
  } catch (e) {
    console.warn("Failed to load theme:", e);
    return null;
  }
}
