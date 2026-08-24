import type { ReactNode } from "react";
import { Text, View } from "react-native";
import Animated, { Easing, FadeInDown } from "react-native-reanimated";

// A quick, gentle rise-and-fade rather than a linear one, so screen
// content arrives with a slight settle instead of snapping to a stop.
const entranceEasing = Easing.out(Easing.cubic);

// The page title/subtitle/header block plus entrance animation, used
// by every screen through PageScaffold.tsx.
export default function PageScaffoldBody({
  title,
  subtitle,
  headerLeft,
  headerRight,
  compactCards,
  children,
}: {
  title: string;
  subtitle?: string;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  compactCards: boolean;
  children: ReactNode;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(380).easing(entranceEasing)}
      className={compactCards ? "gap-md px-md pt-md" : "gap-lg px-lg pt-lg"}
    >
      <View className={compactCards ? "gap-1.5" : "gap-2"}>
        <View className="flex-row items-center justify-between gap-sm">
          <View className="flex-1 flex-row items-center gap-sm">
            {headerLeft ? <View className="items-start justify-center">{headerLeft}</View> : null}
            <Text
              className={`shrink font-bold tracking-[0.2px] text-text ${compactCards ? "text-[28px]" : "text-[32px]"}`}
            >
              {title}
            </Text>
          </View>
          {headerRight ? <View className="items-end justify-center">{headerRight}</View> : null}
        </View>
        {subtitle ? (
          <Text className={`text-textMuted ${compactCards ? "text-[15px] leading-[22px]" : "text-base leading-6"}`}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children}
    </Animated.View>
  );
}
