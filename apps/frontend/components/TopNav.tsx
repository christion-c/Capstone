import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/components/contexts/AppPreferencesProvider";
import { navTabs, type NavTabLabel } from "./nav-tabs";
import LogoMark from "./ui/LogoMark";

// The website-equivalent of BottomNav: a persistent horizontal bar
// instead of a bottom tab strip, with hover states (a website
// affordance touch devices don't have and NativeWind's hover: variant
// simply never triggers on, so it's safe to include unconditionally).
// Rendered by PageScaffold.web.tsx in place of BottomNav - Metro
// resolves that file only for web builds, so this only ever renders
// there, never on iOS/Android.
export default function TopNav({ active }: { active?: NavTabLabel }) {
  const colors = useThemeColors();

  return (
    <View className="w-full border-b border-border bg-surface">
      <View className="mx-auto w-full max-w-[1100px] flex-row items-center justify-between px-lg py-sm">
        <Pressable
          onPress={() => router.push("/")}
          className="flex-row items-center gap-sm transition-opacity duration-150 hover:opacity-80"
        >
          <LogoMark size={32} />
          <Text className="text-lg font-bold tracking-[0.2px] text-text">ThinkTwice</Text>
        </Pressable>

        <View className="flex-row items-center gap-xs">
          {navTabs.map((tab) => {
            const isActive = tab.label === active;
            return (
              <Pressable
                key={tab.label}
                onPress={() => {
                  if (!isActive) {
                    router.push(tab.path);
                  }
                }}
                className={`flex-row items-center gap-1.5 rounded-md px-sm py-1.5 transition-colors duration-150 hover:bg-surfaceSoft ${
                  isActive ? "bg-[rgba(240,168,104,0.16)]" : "bg-transparent"
                }`}
              >
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={16}
                  color={isActive ? colors.accent : colors.textMuted}
                />
                <Text className={`text-[13px] ${isActive ? "font-bold text-accent" : "font-semibold text-textMuted"}`}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
