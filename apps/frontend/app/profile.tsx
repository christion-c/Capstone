import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback } from "react";
import { Pressable, Text } from "react-native";

import { useAppPreferences, useThemeColors } from "@/components/contexts/AppPreferencesProvider";
import { useAuth } from "@/components/contexts/AuthProvider";
import { useFinance } from "@/components/contexts/FinanceProvider";
import PageScaffold from "@/components/PageScaffold";
import { useVehicle } from "@/components/contexts/VehicleProvider";
import { Card, CardText, CardTitle } from "@/components/ui";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { formatCurrencyWhole } from "@/lib/money-format";

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
      <Card>
        <CardTitle>Account Snapshot</CardTitle>
        <CardText>Signed in as {accountLabel}.</CardText>
        <CardText>Cloud Status: {backendUser ? "Connected" : loading ? "Loading" : "Not synced yet"}</CardText>
        <CardText>Current monthly fuel cost: {formatCurrencyWhole(monthlyFuelBudget)}</CardText>
        <Text className="mt-0.5 text-sm font-semibold text-accent">Appearance: {colorMode === "dark" ? "Dark" : "Light"}</Text>
      </Card>

      <Card>
        <CardTitle>Account Details</CardTitle>
        <CardText>Active vehicle: {selectedVehicle?.nickname ?? "None selected"}</CardText>
        <CardText>High contrast: {highContrast ? "On" : "Off"}</CardText>
        <CardText>Reminders: {remindersEnabled ? "On" : "Off"}</CardText>
      </Card>
    </PageScaffold>
  );
}
