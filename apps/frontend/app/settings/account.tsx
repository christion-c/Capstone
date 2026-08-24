import { router } from "expo-router";
import { Pressable, Text } from "react-native";

import { useThemeColors } from "@/components/contexts/AppPreferencesProvider";
import { useAuth } from "@/components/contexts/AuthProvider";
import PageScaffold from "@/components/PageScaffold";
import SettingsBackButton from "@/components/settings/SettingsBackButton";
import { useVehicle } from "@/components/contexts/VehicleProvider";
import { Card, CardText, CardTitle } from "@/components/ui";

export default function Account() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { backendUser, vehicles, selectedVehicle } = useVehicle();

  return (
    <PageScaffold
      title="Account"
      subtitle="Manage your personal details and account preferences."
      headerLeft={<SettingsBackButton onPress={() => router.replace("/settings/preferences")} colors={colors} />}
    >
      <Card surface>
        <CardTitle>Identity</CardTitle>
        <CardText>Email: {user?.email ?? "Not available"}</CardText>
        <CardText>Display name: {user?.displayName ?? "Not set"}</CardText>
        <CardText>Email verified: {user?.emailVerified ? "Yes" : "No"}</CardText>
      </Card>

      <Card surface>
        <CardTitle>Backend Sync</CardTitle>
        <CardText>Profile status: {backendUser ? "Connected" : "Not connected"}</CardText>
        <CardText>Vehicles stored: {vehicles.length}</CardText>
        <CardText>Selected vehicle: {selectedVehicle?.nickname ?? "None"}</CardText>
      </Card>

      <Card surface>
        <CardTitle>Next Steps</CardTitle>
        <Pressable onPress={() => router.push("/profile")} className="rounded-md border border-border bg-surfaceSoft px-md py-3.5">
          <Text className="text-[15px] font-bold text-text">Open profile overview</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/settings/preferences")} className="rounded-md border border-border bg-surfaceSoft px-md py-3.5">
          <Text className="text-[15px] font-bold text-text">Adjust app preferences</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/delete-account")} className="rounded-md border border-border bg-surfaceSoft px-md py-3.5">
          <Text className="text-[15px] font-bold text-danger">Delete my account</Text>
        </Pressable>
      </Card>
    </PageScaffold>
  );
}
