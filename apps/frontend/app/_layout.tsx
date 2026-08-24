import "@/global.css";

import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Redirect, Stack, useSegments, type ErrorBoundaryProps } from "expo-router";

import { AppPreferencesProvider, useThemeColors } from "@/components/contexts/AppPreferencesProvider";
import { AuthProvider, useAuth } from "@/components/contexts/AuthProvider";
import { BudgetProvider } from "@/components/contexts/BudgetProvider";
import { FinanceProvider } from "@/components/contexts/FinanceProvider";
import ThemeVarsRoot from "@/components/ThemeVarsRoot";
import { VehicleProvider } from "@/components/contexts/VehicleProvider";

// Expo Router wraps the whole app in a Try/catch boundary using this
// export (the file-based convention any route or layout module can use)
// whenever it's present - without it, an uncaught render error anywhere
// in the tree unmounts the entire app to a blank screen with no
// recovery, since nothing else in this app catches React errors.
//
// Hardcoded colors rather than the usual className theme tokens: this
// can render for an error thrown before/outside ThemeVarsRoot mounts
// (confirmed by testing - className-based colors here fell back to an
// unstyled white page since the CSS custom properties they reference
// weren't defined), so it needs to look reasonable without depending on
// anything else in the tree having mounted successfully.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, backgroundColor: "#14121B", paddingHorizontal: 24 }}>
      <Text style={{ textAlign: "center", fontSize: 18, fontWeight: "bold", color: "#F5F1EA" }}>Something went wrong</Text>
      <Text style={{ textAlign: "center", fontSize: 14, color: "#A79A94" }}>{error.message}</Text>
      <Pressable
        onPress={() => void retry()}
        style={{ alignItems: "center", borderRadius: 8, backgroundColor: "#F0A868", paddingHorizontal: 24, paddingVertical: 12 }}
      >
        <Text style={{ fontSize: 15, fontWeight: "bold", color: "#241608" }}>Try again</Text>
      </Pressable>
    </View>
  );
}

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
  // The privacy policy has to be reachable by anyone without signing
  // in - Play/App Store reviewers, and prospective users deciding
  // whether to make an account - so it's exempt from the sign-in
  // redirect the same way the auth flow itself is.
  const isPublicLegalPage = segments[0] === "privacy-policy";

  if (!user && !inAuthFlow && !isPublicLegalPage) {
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

      <Stack.Screen name="profile" options={{ title: "Profile" }} />

      <Stack.Screen name="auth/login" options={{ title: "Login" }} />
      <Stack.Screen name="auth/register" options={{ title: "Register" }} />
      <Stack.Screen name="auth/forgot-password" options={{ title: "Forgot Password" }} />

      <Stack.Screen name="settings/preferences" options={{ title: "Profile Settings" }} />
      <Stack.Screen name="debug/ml-account" options={{ title: "Internal ML Debug" }} />

      <Stack.Screen name="privacy-policy" options={{ title: "Privacy Policy" }} />
    </Stack>
  );
}
