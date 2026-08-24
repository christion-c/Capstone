import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppPreferences, useThemeColors } from "@/components/contexts/AppPreferencesProvider";
import BottomNav from "./BottomNav";
import type { NavTabLabel } from "./nav-tabs";
import PageScaffoldBody from "./PageScaffoldBody";
import { useOverscrollGuard } from "@/hooks/useOverscrollGuard";
import { withAlpha } from "@/lib/color";

// The app shell: bottom tab bar, phone-width column, compact
// touch-first chrome - used on every platform, including web, so the
// product looks and behaves like one app everywhere.
export default function PageScaffold({
  title,
  subtitle,
  headerLeft,
  headerRight,
  children,
  showNav = false,
  navActive,
  scrollable = true,
}: {
  title: string;
  subtitle?: string;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
  // Top-level tab screens (Home, Finance, Fuel, Profile) opt into
  // navigation chrome; nested screens (settings, auth, debug) reach
  // this via a back button (headerLeft) instead and stay off by default.
  showNav?: boolean;
  // Which tab this screen belongs to, if any.
  navActive?: NavTabLabel;
  scrollable?: boolean;
}) {
  const { compactCards } = useAppPreferences();
  const { scrollRef, handleScroll } = useOverscrollGuard();
  const colors = useThemeColors();

  const body = (
    <PageScaffoldBody
      title={title}
      subtitle={subtitle}
      headerLeft={headerLeft}
      headerRight={headerRight}
      compactCards={compactCards}
    >
      {children}
    </PageScaffoldBody>
  );

  return (
    <SafeAreaView className="flex-1 overflow-hidden bg-background">
      <View className="w-full max-w-[480px] flex-1 self-center">
        {/* A warm ambient wash behind the header, not a loud full-bleed
            gradient - low alpha throughout so body text underneath still
            reads at full contrast. */}
        <LinearGradient
          pointerEvents="none"
          colors={[withAlpha(colors.accent, 0.16), withAlpha(colors.danger, 0.05), "transparent"]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ position: "absolute", left: 0, right: 0, top: 0, height: 260 }}
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
        {showNav ? <BottomNav active={navActive} /> : null}
      </View>
    </SafeAreaView>
  );
}
