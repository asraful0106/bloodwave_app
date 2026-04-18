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
  cardBorderColor: "#E5E7EB", // soft cool gray
  descriptionTextColor: "#333333",

  // Button
  activeButton: {
    primary: {
      bg: "#4F46E5",
      text: "#FFFFFF",
      border: "#4F46E5",
      shadow: "rgba(79, 70, 229, 0.35)",
    },
    secondary: {
      bg: "#10B981",
      text: "#FFFFFF",
      border: "#10B981",
      shadow: "rgba(16, 185, 129, 0.35)",
    },
    tertiary: {
      bg: "#EEF2FF",
      text: "#4F46E5",
      border: "#C7D2FE",
      shadow: "rgba(79, 70, 229, 0.15)",
    },
  },

  inactiveButton: {
    primary: {
      bg: "#EEF2FF",
      text: "#6B7280",
      border: "#DDE1F5",
      shadow: "rgba(0, 0, 0, 0.05)",
    },
    secondary: {
      bg: "#D1FAE5",
      text: "#6B7280",
      border: "#A7F3D0",
      shadow: "rgba(0, 0, 0, 0.05)",
    },
    tertiary: {
      bg: "transparent",
      text: "#6B7280",
      border: "#E8EAF6",
      shadow: "transparent",
    },
  },

  disabledButton: {
    bg: "#E8EAF6",
    text: "#9CA3AF",
    border: "#E8EAF6",
    shadow: "transparent",
  },

  // Toggole button
  toggleTrack: "#4F46E5",
  toggoleThumb: "#FFFFFF",

  divider: "#E8EAF6",
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
  cardBorderColor: "#3E4451",
  descriptionTextColor: "#C5C9D3",

  // Button
  activeButton: {
    primary: {
      bg: "#6366F1",
      text: "#FFFFFF",
      border: "#6366F1",
      shadow: "rgba(99, 102, 241, 0.4)",
    },
    secondary: {
      bg: "#34D399",
      text: "#052E16",
      border: "#34D399",
      shadow: "rgba(52, 211, 153, 0.35)",
    },
    tertiary: {
      bg: "#1E1B4B",
      text: "#818CF8",
      border: "#2A2660",
      shadow: "rgba(0, 0, 0, 0.4)",
    },
  },

  inactiveButton: {
    primary: {
      bg: "#1E1B4B",
      text: "#8B93C9",
      border: "#2A2660",
      shadow: "rgba(0, 0, 0, 0.25)",
    },
    secondary: {
      bg: "#064E3B",
      text: "#6B7280",
      border: "#065F46",
      shadow: "rgba(0, 0, 0, 0.25)",
    },
    tertiary: {
      bg: "transparent",
      text: "#8B93C9",
      border: "#1F1D3D",
      shadow: "transparent",
    },
  },

  disabledButton: {
    bg: "#1F1D3D",
    text: "#4B5469",
    border: "#1F1D3D",
  },

  // Toggole button
  toggleTrack: "#6366F1",
  toggoleThumb: "#FFFFFF",

  divider: "#1F1D3D",
};
// all themes in one object
export const themes = {
  light: lightColors,
  dark: darkColors,
} as const;

export type ThemeName = keyof typeof themes;
export type ThemeColors = (typeof themes)[ThemeName];
