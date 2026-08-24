import type { ReactNode } from "react";
import { Text } from "react-native";

// The bold section-heading style used at the top of nearly every Card
// across the app (e.g. "Forecast", "Vehicle", "Budget Snapshot").
interface CardTitleProps {
  children: ReactNode;
  // Escape hatch for the rare case a title needs extra spacing/margin.
  className?: string;
}

export default function CardTitle({ children, className = "" }: CardTitleProps) {
  // Sized up from the original text-xl now that most sections are
  // borderless - the title itself has to carry the "this is a new
  // section" signal a box used to carry.
  return <Text className={`text-2xl font-bold tracking-[0.2px] text-text ${className}`}>{children}</Text>;
}
