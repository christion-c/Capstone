import type { ReactNode } from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

export interface DonutGaugeSegment {
  value: number;
  color: string;
}

interface DonutGaugeProps {
  segments: DonutGaugeSegment[];
  size?: number;
  strokeWidth?: number;
  trackColor: string;
  children?: ReactNode;
}

// A multi-segment ring (each segment a share of one whole, e.g. where
// income goes across fixed costs/fuel/spending/what's left) with
// arbitrary centered content, rather than RadialGauge's single
// value-vs-track progress ring. Segments render in order starting at
// 12 o'clock and going clockwise, each sized proportionally to its
// share of the segment total; a zero-length segment just doesn't draw.
export default function DonutGauge({
  segments,
  size = 168,
  strokeWidth = 18,
  trackColor,
  children,
}: DonutGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, segment) => sum + Math.max(segment.value, 0), 0);

  let offsetSoFar = 0;
  const arcs = total > 0
    ? segments
        .filter((segment) => segment.value > 0)
        .map((segment, index) => {
          const arcLength = (segment.value / total) * circumference;
          const dashOffset = -offsetSoFar;
          offsetSoFar += arcLength;

          return (
            <Circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={segment.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${arcLength} ${circumference - arcLength}`}
              strokeDashoffset={dashOffset}
            />
          );
        })
    : null;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        {arcs}
      </Svg>
      {children}
    </View>
  );
}
