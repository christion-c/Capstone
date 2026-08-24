import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";

interface MetricRowProps {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  iconColor: string;
}

// A compact "icon + label + value" row - the denser, more visual
// alternative to a plain CardText line, used anywhere a forecast/summary
// card lists several small figures next to a RadialGauge.
export default function MetricRow({ icon, label, value, iconColor }: MetricRowProps) {
  return (
    <View className="flex-row items-center gap-xs">
      <Ionicons name={icon} size={14} color={iconColor} />
      <Text className="flex-1 text-[13px] text-textMuted">{label}</Text>
      <Text className="text-[13px] font-bold text-text">{value}</Text>
    </View>
  );
}
