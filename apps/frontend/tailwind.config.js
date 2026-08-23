/**
 * Tailwind tokens mirror apps/frontend/components/theme.ts exactly, so
 * migrating a screen from StyleSheet to className produces the same
 * pixel values as before. Colors are CSS custom properties (see
 * components/ThemeVarsRoot.tsx) rather than fixed hex values, because
 * this app's theme isn't just light/dark - colorMode and highContrast
 * combine into four palettes chosen at runtime (see theme.ts's
 * getColors()), which a static Tailwind theme can't express on its own.
 */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        surfaceSoft: "var(--color-surface-soft)",
        border: "var(--color-border)",
        text: "var(--color-text)",
        textMuted: "var(--color-text-muted)",
        accent: "var(--color-accent)",
        accentDeep: "var(--color-accent-deep)",
        success: "var(--color-success)",
        danger: "var(--color-danger)",
      },
      // Tightened from the original 6/10/16/24/32 scale - the previous
      // values compounded (24px card padding + 24px gap between cards,
      // repeated down every screen) into a visibly sparse, empty-feeling
      // layout across the whole app.
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },
      borderRadius: {
        sm: "12px",
        md: "16px",
        lg: "20px",
        xl: "28px",
        round: "999px",
      },
    },
  },
  plugins: [],
};
