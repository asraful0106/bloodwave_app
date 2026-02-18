export const lightColors = {
  bodyBackground: "white",
  secondBackgroundColor: "#FAFAFA",
  thirdBackgroundColor: "#f3f5f7ff",

  textColor: "black",
  secondaryTextColor: "black",
  primaryColor: "#E53935",
};
export const darkColors = {
  bodyBackground: "#222831",
  secondBackgroundColor: "#2A303A",
  thirdBackgroundColor: "#343642ff",

  textColor: "#FFFFFF",
  secondaryTextColor: "#ADADAD",
  primaryColor: "#E53935",
};
// all themes in one object
export const themes = {
  light: lightColors,
  dark: darkColors,
} as const;

export type ThemeName = keyof typeof themes;
export type ThemeColors = (typeof themes)[ThemeName];
