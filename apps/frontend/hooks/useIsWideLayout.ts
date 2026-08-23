import { useWindowDimensions } from "react-native";

// Below this width the app should feel like an app (bottom tab bar,
// single narrow column, compact touch-sized chrome) - at or above it,
// like a website (persistent top nav, wider multi-column-capable
// content, hover-friendly targets). Using actual window width rather
// than Platform.OS === "web" so a phone browser still gets the app-like
// layout and a wide native window (e.g. an iPad) still gets the
// website-like one - useWindowDimensions is reactive and identical
// across web/native, unlike NativeWind's CSS-only responsive classes.
const WIDE_LAYOUT_BREAKPOINT = 768;

export function useIsWideLayout(): boolean {
  const { width } = useWindowDimensions();
  return width >= WIDE_LAYOUT_BREAKPOINT;
}
