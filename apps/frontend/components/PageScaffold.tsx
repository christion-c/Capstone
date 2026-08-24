import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppPreferences } from "@/components/contexts/AppPreferencesProvider";
import BottomNav from "./BottomNav";
import type { NavTabLabel } from "./nav-tabs";
import PageScaffoldBody from "./PageScaffoldBody";
import { useOverscrollGuard } from "@/hooks/useOverscrollGuard";

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
        <View
          pointerEvents="none"
          className="absolute -right-5 -top-10 h-[180px] w-[180px] rounded-[90px] bg-[rgba(240,145,61,0.12)]"
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
