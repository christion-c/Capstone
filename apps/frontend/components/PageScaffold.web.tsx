import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppPreferences } from "./AppPreferences";
import type { NavTabLabel } from "./nav-tabs";
import PageScaffoldBody from "./PageScaffoldBody";
import TopNav from "./TopNav";
import { useOverscrollGuard } from "../hooks/useOverscrollGuard";

// The website-shell variant of PageScaffold: a persistent top nav bar,
// wide multi-column-capable content, no bottom tab strip. Metro
// resolves this file for web builds; see PageScaffold.tsx for the
// app-shell variant iOS/Android get instead. Same props on both, a
// genuinely different layout per file - no runtime platform branching,
// the file itself is the fork.
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
  // this via a back button (headerLeft) instead and stay off by default.
  showNav?: boolean;
  // Which tab this screen belongs to, if any.
  navActive?: NavTabLabel;
  // Form-only screens (auth) read better as a narrow card even on this
  // wide layout - more width doesn't give a form anything useful to do
  // with it, just stretches it.
  narrow?: boolean;
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
      {showNav ? <TopNav active={navActive} /> : null}
      <View className={`w-full flex-1 self-center ${narrow ? "max-w-[480px]" : "max-w-[1100px]"}`}>
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
      </View>
    </SafeAreaView>
  );
}
