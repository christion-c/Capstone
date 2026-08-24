import type { ReactNode } from "react";
import { View } from "react-native";
import type { ViewProps } from "react-native";

// A section wrapper. Borderless/transparent by default - screens read
// as one continuous flow, sections told apart by spacing and
// typography (PageScaffoldBody's gap-2xl between top-level children),
// not by boxing everything in its own bordered panel. Pass `surface`
// for the genuine exceptions where a bounded panel is the right call -
// an actual input form (auth screens), or a sub-block that needs to
// visually separate itself from a sibling within the same section.
interface CardProps extends Pick<ViewProps, "style"> {
  children: ReactNode;
  // Space between this card's own children. "sm" is the more common case;
  // "xs" is used by the smaller status/alert-style cards.
  gap?: "xs" | "sm" | "md";
  // Inner padding. "lg" is the more common case; "md" is used by denser panels.
  padding?: "md" | "lg";
  // Opt into the bordered/filled panel look - default is borderless.
  surface?: boolean;
  // Escape hatch for one-off additions (a status border color, active:
  // press feedback, etc.) without needing a new prop for every case.
  className?: string;
}

export default function Card({
  children,
  gap = "sm",
  padding = "lg",
  surface = false,
  className = "",
  style,
}: CardProps) {
  const gapClass = gap === "md" ? "gap-md" : gap === "xs" ? "gap-xs" : "gap-sm";
  const paddingClass = padding === "md" ? "p-md" : "p-lg";
  const surfaceClass = surface ? "rounded-lg border border-border bg-surface" : "";

  return (
    <View style={style} className={`${surfaceClass} ${gapClass} ${paddingClass} ${className}`}>
      {children}
    </View>
  );
}
