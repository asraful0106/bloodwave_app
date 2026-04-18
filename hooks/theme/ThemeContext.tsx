import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { loadTheme, saveTheme } from "@/storage/theemStrage";
import { ThemeColors, ThemeName, themes } from "@/constants/themeCollorConstant";

type ThemeMode = "light" | "dark";
type ThemeContextValue = {
  themeName: ThemeName;
  colors: ThemeColors;
  config: {
    style: ThemeMode;
    bg: ThemeColors;
  };
  setCTheme: (name: ThemeMode) => void;
  setThemeName: (name: ThemeName) => void;
  changeTheme: (name: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>("light"); //dark
  const [cTheme, setCTheme] = useState<ThemeMode>("dark"); //light
  const [isHydrated, setIsHydrated] = useState(false);

  // Load theme on app startup
  useEffect(() => {
    (async () => {
      const stored = await loadTheme();
      if (stored?.themeName) {
        setThemeName(stored.themeName);
      }
      if (stored?.cTheme) {
        setCTheme(stored.cTheme);
      }
      setIsHydrated(true);
    })();
  }, []);

  // Save whenever theme changes (after first load)
  useEffect(() => {
    if (!isHydrated) return; // avoid saving initial defaults before load
    saveTheme(themeName, cTheme);
  }, [themeName, cTheme, isHydrated]);

  const changeTheme = (name: ThemeName) => {
    setThemeName(name);
    setCTheme(String(name).toLowerCase().includes("dark") ? "light" : "dark");
  };

  const value: ThemeContextValue = {
    themeName,
    colors: themes[themeName],
    config: {
      style: cTheme,
      bg: themes[themeName],
    },
    setCTheme,
    setThemeName,
    changeTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return ctx;
}
