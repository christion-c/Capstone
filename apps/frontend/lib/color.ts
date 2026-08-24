// Tailwind's color-opacity shorthand (e.g. "bg-text/15") needs a color
// defined in a special rgb(var(...) / <alpha-value>) form to work with
// CSS variables - this app's theme vars are plain hex, so that syntax
// silently doesn't apply alpha. This does it manually instead, off
// whichever already-mode-resolved color the caller passes in.
export function withAlpha(hexColor: string, alpha: number): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
