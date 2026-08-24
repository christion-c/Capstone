import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface RadialGaugeProps {
  // 0-100. Values outside that range are clamped, not rejected - callers
  // computing this from real-world data (tank %, budget used %) shouldn't
  // need to clamp it themselves first.
  percent: number;
  size?: number;
  strokeWidth?: number;
  trackColor: string;
  fillColor: string;
  label: string;
  valueLabel: string;
  labelColor: string;
  valueColor: string;
}

// A circular progress ring with a label/value pair centered inside it -
// the "how full is the tank" / "how much of the budget is spent" visual
// this app was missing everywhere it only ever showed those as a plain
// number in a text row. Pure react-native-svg (already a dependency),
// no new native module.
export default function RadialGauge({
  percent,
  size = 96,
  strokeWidth = 10,
  trackColor,
  fillColor,
  label,
  valueLabel,
  labelColor,
  valueColor,
}: RadialGaugeProps) {
  const clampedPercent = Math.min(Math.max(percent, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clampedPercent / 100);

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={fillColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </Svg>
      <Text className="text-lg font-bold" style={{ color: valueColor }}>
        {valueLabel}
      </Text>
      <Text className="text-[11px] font-semibold uppercase tracking-[0.4px]" style={{ color: labelColor }}>
        {label}
      </Text>
    </View>
  );
}
