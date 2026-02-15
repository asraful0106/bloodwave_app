export const lightColors = {
  bodyBackground: "white",
  textColor: "black",
};
export const darkColors = {
  bodyBackground: "#222831",
  textColor: "#FFFFFF",
};
// all themes in one object
export const themes = {
  light: lightColors,
  dark: darkColors,
} as const;

export type ThemeName = keyof typeof themes;
export type ThemeColors = (typeof themes)[ThemeName];
