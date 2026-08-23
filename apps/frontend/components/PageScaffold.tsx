import type { ReactNode } from "react";
import { useRef } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { Easing, FadeInDown } from "react-native-reanimated";

import { useAppPreferences } from "./AppPreferences";
import BottomNav from "./BottomNav";
import type { NavTabLabel } from "./nav-tabs";
import TopNav from "./TopNav";
import { useIsWideLayout } from "../hooks/useIsWideLayout";

// A quick, gentle rise-and-fade rather than a linear one, so screen
// content arrives with a slight settle instead of snapping to a stop.
const entranceEasing = Easing.out(Easing.cubic);

export default function PageScaffold({
  title,
  subtitle,
  headerLeft,
  headerRight,
  children,
  showNav = false,
  navActive,
  narrow = false,
  scrollable = true,
}: {
  title: string;
  subtitle?: string;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
  // Top-level tab screens (Home, Finance, Fuel, Profile) opt into
  // navigation chrome; nested screens (settings, auth, debug) reach
  // this via a back button (headerLeft) instead and stay off by
  // default, matching how `footer` used to be omitted entirely for them.
  showNav?: boolean;
  // Which tab this screen belongs to, if any - PageScaffold owns
  // picking and rendering the right navigation chrome for it (BottomNav
  // on a narrow/app layout, TopNav on a wide/website one) rather than
  // every screen constructing its own <BottomNav active="..." />, so
  // that decision lives in exactly one place.
  navActive?: NavTabLabel;
  // Form-only screens (auth) read better as a narrow card even on a
  // wide/website layout - unlike dashboard screens, more width doesn't
  // give them anything useful to do with it, it just stretches a form.
  narrow?: boolean;
  scrollable?: boolean;
}) {
  const { compactCards } = useAppPreferences();
  const isWideLayout = useIsWideLayout();
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
      {/* Website mode: a persistent top bar instead of a bottom tab
          strip, rendered full-width above the content column below. */}
      {showNav && isWideLayout ? <TopNav active={navActive} /> : null}
      {/* App mode caps content to a phone-width column; website mode
          allows a much wider column so screens can use the extra room
          instead of stretching a phone-shaped layout across the page. */}
      <View className={`w-full flex-1 self-center ${isWideLayout && !narrow ? "max-w-[1100px]" : "max-w-[480px]"}`}>
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
        {showNav && !isWideLayout ? <BottomNav active={navActive} /> : null}
      </View>
    </SafeAreaView>
  );
}
