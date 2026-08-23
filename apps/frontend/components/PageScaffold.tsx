import type { ReactNode } from "react";
import { useRef } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { Easing, FadeInDown } from "react-native-reanimated";

import { useAppPreferences } from "./AppPreferences";

// A quick, gentle rise-and-fade rather than a linear one, so screen
// content arrives with a slight settle instead of snapping to a stop.
const entranceEasing = Easing.out(Easing.cubic);

export default function PageScaffold({
  title,
  subtitle,
  headerLeft,
  headerRight,
  children,
  footer,
  scrollable = true,
}: {
  title: string;
  subtitle?: string;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  scrollable?: boolean;
}) {
  const { compactCards } = useAppPreferences();
  const scrollRef = useRef<ScrollView>(null);

  // Belt-and-suspenders against rubber-band overscroll: the ScrollView below
  // already sets bounces/alwaysBounceVertical/overScrollMode false and CSS
  // overscroll-none, but that quartet still isn't airtight on every
  // platform (Safari in particular can rubber-band past the content edge
  // regardless). This manually snaps back to the last valid offset as a
  // final catch, rather than trusting any single native/CSS flag alone.
  const handleScroll = ({ nativeEvent }: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
    const maxOffset = Math.max(nativeEvent.contentSize.height - nativeEvent.layoutMeasurement.height, 0);
    if (nativeEvent.contentOffset.y > maxOffset) {
      scrollRef.current?.scrollTo({
        y: maxOffset,
        animated: false,
      });
    }
  };

  const body = (
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

  return (
    <SafeAreaView className="flex-1 overflow-hidden bg-background">
      {/* Caps content to a phone-width column on wide (web/desktop)
          viewports instead of letting every card/row stretch full-bleed
          across the browser window - on an actual phone screen this is
          a no-op since the viewport is already narrower than the cap. */}
      <View className="w-full max-w-[480px] flex-1 self-center">
        <View
          pointerEvents="none"
          className="absolute -right-5 -top-10 h-[180px] w-[180px] rounded-[90px] bg-[rgba(240,168,104,0.12)]"
        />
        {scrollable ? (
          <ScrollView
            ref={scrollRef}
            className="flex-1 overscroll-none"
            contentContainerClassName={`overscroll-none ${compactCards ? "pb-lg" : "pb-xl"}`}
            showsVerticalScrollIndicator={false}
            bounces={false}
            alwaysBounceVertical={false}
            overScrollMode="never"
            scrollEventThrottle={16}
            onScroll={handleScroll}
          >
            {body}
          </ScrollView>
        ) : (
          body
        )}
        {footer}
      </View>
    </SafeAreaView>
  );
}
