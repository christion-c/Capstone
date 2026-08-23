import "../global.css";

import type { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect, Stack, useSegments } from "expo-router";

import { AppPreferencesProvider, useThemeColors } from "../components/AppPreferences";
import { AuthProvider, useAuth } from "../components/AuthProvider";
import { BudgetProvider } from "../components/BudgetContext";
import { FinanceProvider } from "../components/FinanceContext";
import ThemeVarsRoot from "../components/ThemeVarsRoot";
import { VehicleProvider } from "../components/VehicleContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppPreferencesProvider>
        <ThemeVarsRoot>
          {/* VehicleProvider must stay above FinanceProvider: FinanceContext
              calls useVehicle() internally to auto-fill combinedMpg/
              tankCapacityGallons from the selected vehicle, which throws
              ("useVehicle must be used inside VehicleProvider") if the
              nesting is reversed. */}
          <VehicleProvider>
            <FinanceProvider>
              <BudgetProvider>
                <AuthGate>
                  <AppStack />
                </AuthGate>
              </BudgetProvider>
            </FinanceProvider>
          </VehicleProvider>
        </ThemeVarsRoot>
      </AppPreferencesProvider>
    </AuthProvider>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth();
  const colors = useThemeColors();
  const segments = useSegments();

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  // Declarative <Redirect> rather than an imperative router.replace() in a
  // useEffect: Redirect defers via useFocusEffect and catches its own
  // navigation errors, so it doesn't race the navigator's own mount the
  // way a raw effect call did - that race crashed with "Attempted to
  // navigate before mounting the Root Layout component" whenever a
  // redirect fired on the very first render (e.g. loading /auth/login
  // directly while already signed in).
  const inAuthFlow = segments[0] === "auth";

  if (!user && !inAuthFlow) {
    return <Redirect href="/auth/login" />;
  }

  if (user && inAuthFlow) {
    return <Redirect href="/" />;
  }

  return <>{children}</>;
}

function AppStack() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Home" }} />

      <Stack.Screen name="fuel" options={{ title: "Fuel" }} />
      <Stack.Screen name="finance" options={{ title: "Finance" }} />
      <Stack.Screen name="nutrition" options={{ title: "Nutrition" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />

      <Stack.Screen name="profile/profile" options={{ title: "Profile" }} />

      <Stack.Screen name="auth/login" options={{ title: "Login" }} />
      <Stack.Screen name="auth/register" options={{ title: "Register" }} />
      <Stack.Screen name="auth/forgotPassword" options={{ title: "Forgot Password" }} />

      <Stack.Screen name="settings/preferences" options={{ title: "Profile Settings" }} />
      <Stack.Screen name="debug/ml-account" options={{ title: "Internal ML Debug" }} />
    </Stack>
  );
}
