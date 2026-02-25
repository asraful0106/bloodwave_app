export const lightColors = {
  bodyBackground: "white",
  secondBackgroundColor: "#FAFAFA",
  thirdBackgroundColor: "#f3f5f7ff",

  textColor: "black",
  secondaryTextColor: "black",
  thirdTextColor: "#ADADAD",
  primaryColor: "#E53935",
  secondaryColor: "#2eb97b",

  bottomNavigationColor: "#E53935", // active (primary red)
  bottomNavigationInActiveColor: "#9E9E9E", // neutral gray
};
export const darkColors = {
  bodyBackground: "#222831",
  secondBackgroundColor: "#2A303A",
  thirdBackgroundColor: "#343642ff",

  textColor: "#FFFFFF",
  secondaryTextColor: "#ADADAD",
  thirdTextColor: "#ADADAD",
  primaryColor: "#E53935",
  secondaryColor: "#2eb97b",

  bottomNavigationColor: "#E53935", // active
  bottomNavigationInActiveColor: "#6C757D", // soft gray
};
// all themes in one object
export const themes = {
  light: lightColors,
  dark: darkColors,
} as const;

export type ThemeName = keyof typeof themes;
export type ThemeColors = (typeof themes)[ThemeName];
