import { useEffect, useRef, useState } from "react";
import { Text, type TextProps } from "react-native";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface AnimatedNumberProps extends TextProps {
  value: number;
  formatValue: (value: number) => string;
  duration?: number;
}

// Eases the displayed number from its previous value to a new one
// whenever `value` changes, instead of snapping instantly - a small
// touch that makes budget figures feel alive rather than static text
// that happens to be a number. Plain requestAnimationFrame + React
// state rather than Reanimated, since this only needs to re-render a
// few dozen times over ~600ms (not drive a gesture), and formatting a
// number through Intl.NumberFormat isn't something a Reanimated
// worklet can do on the UI thread anyway.
export default function AnimatedNumber({ value, formatValue, duration = 700, ...textProps }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;

    if (from === to) {
      return;
    }

    const start = Date.now();

    function tick() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      setDisplayValue(from + (to - from) * eased);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration]);

  return <Text {...textProps}>{formatValue(displayValue)}</Text>;
}
