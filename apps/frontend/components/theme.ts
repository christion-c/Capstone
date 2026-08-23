import { StyleSheet } from "react-native";

export type ColorMode = "dark" | "light";

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSoft: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentDeep: string;
  success: string;
  danger: string;
}

// A warm plum-charcoal + amber palette, deliberately not the
// navy-and-teal look most apps in this space default to. Amber ties
// thematically to "fuel"/"energy"/value, and warm neutrals read as more
// contemplative than a cold blue - fitting for an app about pausing to
// think before spending. Every pairing below was checked against WCAG
// contrast ratios (see the design conversation this was picked in) and
// meets or beats what the previous navy/teal palette actually achieved.
export const palettes: Record<ColorMode, ThemeColors> = {
  dark: {
    background: "#14121B",
    surface: "#1E1A2B",
    surfaceSoft: "#282136",
    border: "rgba(245, 241, 234, 0.08)",
    text: "#F5F1EA",
    textMuted: "#A79A94",
    accent: "#F0A868",
    accentDeep: "#241608",
    success: "#9CC086",
    danger: "#E8735A",
  },
  light: {
    background: "#FAF5EC",
    surface: "#FFFFFF",
    surfaceSoft: "#F3EBDD",
    border: "rgba(36, 28, 20, 0.12)",
    text: "#241C14",
    textMuted: "#6B5D4F",
    accent: "#B7630E",
    accentDeep: "#241C14",
    success: "#4F8F52",
    danger: "#C0442E",
  },
};

// High contrast keeps each mode's accent/status colors (so the app
// still looks like itself) but pushes background/text/border to their
// most legible extremes, and thickens borders so card edges stay visible.
const highContrastOverrides: Record<ColorMode, Partial<ThemeColors>> = {
  dark: {
    background: "#000000",
    surface: "#000000",
    surfaceSoft: "#141010",
    border: "rgba(245, 241, 234, 0.4)",
    text: "#FFFFFF",
    textMuted: "#E8DFD3",
  },
  light: {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceSoft: "#F5F0E8",
    border: "rgba(36, 28, 20, 0.5)",
    text: "#000000",
    textMuted: "#241C14",
  },
};

export const getColors = (
  mode: ColorMode,
  highContrast = false,
): ThemeColors =>
  highContrast
    ? { ...palettes[mode], ...highContrastOverrides[mode] }
    : palettes[mode];

// Kept in sync with tailwind.config.js's spacing scale (see its comment
// for why these were tightened from the original 6/10/16/24/32 values).
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  round: 999,
};

export const shadows = StyleSheet.create({
  elevated: {
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  soft: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
});
