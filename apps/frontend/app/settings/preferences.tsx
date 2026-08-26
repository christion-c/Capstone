import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "@/components/contexts/AppPreferencesProvider";
import PageScaffold from "@/components/PageScaffold";
import SettingsBackButton from "@/components/settings/SettingsBackButton";
import SettingToggleRow from "@/components/settings/SettingToggleRow";
import { Card, CardText, CardTitle, StatusMessage } from "@/components/ui";
import { withAlpha } from "@/lib/color";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

export default function ProfileSettings() {
  const colors = useThemeColors();
  const {
    colorMode,
    setColorMode,
    compactCards,
    setCompactCards,
    highContrast,
    setHighContrast,
    remindersEnabled,
    setRemindersEnabled,
  } = useAppPreferences();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const handleLogout = async () => {
    setLogoutError("");

    if (!isFirebaseConfigured || !auth) {
      setLogoutError("Firebase is not configured yet. Logout is unavailable in preview mode.");
      return;
    }

    try {
      setIsSigningOut(true);
      await signOut(auth);
      router.replace("/auth/login");
    } catch {
      setLogoutError("Unable to sign out right now. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <PageScaffold
      title="Profile Settings"
      subtitle="Adjust a few frontend app options for your experience."
      headerLeft={<SettingsBackButton onPress={() => router.replace("/profile")} />}
    >
      <Card surface>
        <CardTitle>Appearance</CardTitle>
        <CardText>Choose the app color mode.</CardText>

        <View className="flex-row gap-sm">
          <Pressable
            onPress={() => setColorMode("dark")}
            style={colorMode === "dark" ? { backgroundColor: withAlpha(colors.accent, 0.2) } : undefined}
            className={`flex-1 items-center rounded-md border py-3 ${
              colorMode === "dark" ? "border-accent" : "border-border bg-surfaceSoft"
            }`}
          >
            <Text className={`text-[15px] ${colorMode === "dark" ? "font-bold text-accent" : "font-semibold text-textMuted"}`}>
              Dark
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setColorMode("light")}
            style={colorMode === "light" ? { backgroundColor: withAlpha(colors.accent, 0.2) } : undefined}
            className={`flex-1 items-center rounded-md border py-3 ${
              colorMode === "light" ? "border-accent" : "border-border bg-surfaceSoft"
            }`}
          >
            <Text className={`text-[15px] ${colorMode === "light" ? "font-bold text-accent" : "font-semibold text-textMuted"}`}>
              Light
            </Text>
          </Pressable>
        </View>
      </Card>

      <Card surface>
        <CardTitle>Basic Options</CardTitle>

        <SettingToggleRow
          title="Compact Cards"
          caption="Use tighter spacing in cards."
          value={compactCards}
          onValueChange={setCompactCards}
        />

        <SettingToggleRow
          title="High Contrast"
          caption="Increase visual separation and stronger text colors."
          value={highContrast}
          onValueChange={setHighContrast}
        />

        <SettingToggleRow
          title="Check-In Reminders"
          caption="Keep light follow-up prompts visible so your routine stays on track."
          value={remindersEnabled}
          onValueChange={setRemindersEnabled}
        />
      </Card>

      <Card surface>
        <CardTitle>Account</CardTitle>
        <CardText>View account details or request data deletion.</CardText>
        <Pressable
          onPress={() => router.push("/settings/account")}
          className="mt-xs rounded-md border border-border bg-surfaceSoft px-md py-3.5"
        >
          <Text className="text-[15px] font-bold text-text">Account details</Text>
        </Pressable>
      </Card>

      <Card surface>
        <CardTitle>Session</CardTitle>
        <CardText>Sign out of your current account on this device.</CardText>

        <StatusMessage message={logoutError} tone="error" />

        <Pressable
          onPress={handleLogout}
          disabled={isSigningOut}
          className="mt-xs items-center rounded-md border border-danger bg-transparent py-3 active:opacity-85 disabled:opacity-85"
        >
          <Text className="text-base font-bold text-danger">{isSigningOut ? "Signing out..." : "Log Out"}</Text>
        </Pressable>
      </Card>
    </PageScaffold>
  );
}
