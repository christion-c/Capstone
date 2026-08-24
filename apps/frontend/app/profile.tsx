import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "@/components/contexts/AppPreferencesProvider";
import { useAuth } from "@/components/contexts/AuthProvider";
import { useFinance } from "@/components/contexts/FinanceProvider";
import PageScaffold from "@/components/PageScaffold";
import { shadows } from "@/components/theme";
import { useVehicle } from "@/components/contexts/VehicleProvider";
import { Card, CardTitle, MetricRow } from "@/components/ui";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { formatCurrencyWhole } from "@/lib/money-format";

function initialsFor(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "?";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export default function Profile() {
  const colors = useThemeColors();
  const { colorMode, highContrast, remindersEnabled } = useAppPreferences();
  const { user } = useAuth();
  const { monthlyFuelBudget, refresh: refreshFinance } = useFinance();
  const { backendUser, selectedVehicle, loading, refreshVehicles } = useVehicle();

  useRefetchOnFocus(
    useCallback(async () => {
      await Promise.all([refreshFinance(), refreshVehicles()]);
    }, [refreshFinance, refreshVehicles]),
  );

  const accountLabel = user?.displayName || user?.email || "Account owner";
  const cloudStatus = backendUser ? "Connected" : loading ? "Syncing..." : "Not synced yet";
  const cloudStatusIcon = backendUser ? "cloud-done-outline" : loading ? "sync-outline" : "cloud-offline-outline";
  const cloudStatusColor = backendUser ? colors.success : loading ? colors.accent : colors.textMuted;

  return (
    <PageScaffold
      title="Profile"
      subtitle="Manage account settings and verify your planner baseline."
      headerRight={
        <Pressable onPress={() => router.push("/settings/preferences")} className="rounded-[10px] px-1.5 py-1">
          <Ionicons name="settings-outline" size={20} color={colors.text} />
        </Pressable>
      }
      showNav
      navActive="Profile"
    >
      <Card style={shadows.soft}>
        <View className="flex-row items-center gap-md">
          <View className="h-14 w-14 items-center justify-center rounded-round bg-[rgba(240,145,61,0.16)]">
            <Text className="text-xl font-bold text-accent">{initialsFor(accountLabel)}</Text>
          </View>
          <View className="flex-1 gap-xs">
            <Text className="text-lg font-bold text-text">{accountLabel}</Text>
            <View className="flex-row items-center gap-xs">
              <Ionicons name={cloudStatusIcon} size={14} color={cloudStatusColor} />
              <Text className="text-[13px]" style={{ color: cloudStatusColor }}>{cloudStatus}</Text>
            </View>
          </View>
        </View>
      </Card>

      <Card>
        <CardTitle>Account Details</CardTitle>
        <MetricRow icon="car-outline" label="Active vehicle" value={selectedVehicle?.nickname ?? "None selected"} iconColor={colors.textMuted} />
        <MetricRow icon="water-outline" label="Monthly fuel cost" value={formatCurrencyWhole(monthlyFuelBudget)} iconColor={colors.textMuted} />
        <MetricRow icon="moon-outline" label="Appearance" value={colorMode === "dark" ? "Dark" : "Light"} iconColor={colors.textMuted} />
        <MetricRow icon="contrast-outline" label="High contrast" value={highContrast ? "On" : "Off"} iconColor={colors.textMuted} />
        <MetricRow icon="notifications-outline" label="Reminders" value={remindersEnabled ? "On" : "Off"} iconColor={colors.textMuted} />
      </Card>
    </PageScaffold>
  );
}
