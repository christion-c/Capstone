import { router } from "expo-router";

import { useAuth } from "@/components/contexts/AuthProvider";
import PageScaffold from "@/components/PageScaffold";
import SettingsBackButton from "@/components/settings/SettingsBackButton";
import { useVehicle } from "@/components/contexts/VehicleProvider";
import { Card, CardText, CardTitle, ListRow } from "@/components/ui";

export default function Account() {
  const { user } = useAuth();
  const { backendUser, vehicles, selectedVehicle } = useVehicle();

  return (
    <PageScaffold
      title="Account"
      subtitle="Manage your personal details and account preferences."
      headerLeft={<SettingsBackButton onPress={() => router.replace("/settings/preferences")} />}
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
        <ListRow title="Open profile overview" onPress={() => router.push("/profile")} />
        <ListRow title="Adjust app preferences" onPress={() => router.push("/settings/preferences")} />
        <ListRow title="Manage fill-up & check-in history" onPress={() => router.push("/history")} />
        <ListRow title="Delete my account" danger onPress={() => router.push("/delete-account")} />
      </Card>
    </PageScaffold>
  );
}
