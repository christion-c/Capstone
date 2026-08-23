import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";

import { useThemeColors } from "../components/AppPreferences";
import { useFinance } from "../components/FinanceContext";
import PageScaffold from "../components/PageScaffold";
import { shadows, type ThemeColors } from "../components/theme";
import AnimatedNumber from "../components/ui/AnimatedNumber";
import Card from "../components/ui/Card";
import LogoMark from "../components/ui/LogoMark";
import StatTile from "../components/ui/StatTile";
import { useVehicle } from "../components/VehicleContext";
import { useIsWideLayout } from "../hooks/useIsWideLayout";
import { useRefetchOnFocus } from "../hooks/useRefetchOnFocus";
import { useSetupChecklist } from "../hooks/useSetupChecklist";
import { formatCurrencyWhole } from "../lib/money-format";

export default function Home() {
  const colors = useThemeColors();
  // TopNav (website layout) already shows the logo/wordmark, so this
  // screen's own header-right logo would be a redundant second one -
  // only the narrow/app layout, which uses BottomNav instead, needs it
  // as its one brand touch.
  const isWideLayout = useIsWideLayout();
  const {
    monthlyIncome,
    monthlyExpenses,
    monthlyFixedCosts,
    monthlyFuelBudget,
    projectedFillUpCost,
    projectedDaysUntilFillUp,
    projectedBudgetAfterEssentials,
    refresh: refreshFinance,
  } = useFinance();
  const { vehicles, refreshVehicles } = useVehicle();

  useRefetchOnFocus(
    useCallback(async () => {
      await Promise.all([refreshFinance(), refreshVehicles()]);
    }, [refreshFinance, refreshVehicles]),
  );

  const isBudgetHealthy = projectedBudgetAfterEssentials >= 0;
  const budgetStatus = isBudgetHealthy
    ? {
        title: "Plan looks stable",
        description: "You still have room after your core monthly costs and fuel reserve.",
      }
    : {
        title: "Budget risk detected",
        description: "Your current monthly plan runs negative after fuel and fixed costs.",
      };
  // How much of take-home income is still free after essentials - a
  // second, differently-framed number alongside the dollar figure
  // shown higher up, rather than just repeating it.
  const remainingIncomeSharePercent =
    monthlyIncome > 0 ? Math.round((projectedBudgetAfterEssentials / monthlyIncome) * 100) : null;

  const setupSteps: { label: string; description: string; complete: boolean; path: "/finance" | "/fuel" }[] = [
    {
      label: "Budget baseline",
      description: "Log your income, bills, and monthly spending.",
      complete: monthlyIncome > 0 || monthlyExpenses > 0 || monthlyFixedCosts > 0,
      path: "/finance",
    },
    {
      label: "Fuel forecast",
      description: "Enter a fuel price and mileage to project refill costs.",
      complete: projectedFillUpCost > 0 || projectedDaysUntilFillUp > 0,
      path: "/fuel",
    },
    {
      label: "Vehicle profile",
      description: "Add a vehicle so fill-ups track against it accurately.",
      complete: vehicles.length > 0,
      path: "/fuel",
    },
  ];

  const { shouldShowSetupChecklist, completionCount } = useSetupChecklist(setupSteps);

  const fuelStatus =
    projectedDaysUntilFillUp <= 3
      ? "Refill soon"
      : projectedDaysUntilFillUp <= 7
        ? "Monitor this week"
        : "On track";

  return (
    <PageScaffold
      title="Welcome back"
      subtitle="Your monthly plan updates from manual finance and fuel inputs as you go."
      headerRight={isWideLayout ? undefined : <LogoMark />}
      showNav
      navActive="Home"
    >
      <View style={shadows.soft} className="gap-sm rounded-xl border border-border bg-surface p-lg">
        {shouldShowSetupChecklist ? (
          <View className="self-start rounded-round bg-[rgba(240,168,104,0.18)] px-3 py-1.5">
            <Text className="text-xs font-bold uppercase tracking-[0.4px] text-accent">{completionCount}/{setupSteps.length} setup steps complete</Text>
          </View>
        ) : null}
        <Text className="text-[15px] text-textMuted">Projected Free Cash This Month</Text>
        <AnimatedNumber
          value={projectedBudgetAfterEssentials}
          formatValue={formatCurrencyWhole}
          className="mt-xs text-[38px] font-bold text-text"
        />
        <Text className={`text-sm font-bold ${isBudgetHealthy ? "text-success" : "text-danger"}`}>{budgetStatus.title}</Text>

        <View className="mt-sm flex-row flex-wrap gap-sm">
          <StatTile
            label="Income"
            value={formatCurrencyWhole(monthlyIncome)}
            className="min-w-[30%] grow rounded-md border border-border bg-surfaceSoft p-md"
            labelClassName="mb-1 text-textMuted"
            valueClassName="text-lg font-semibold text-success"
          />

          <StatTile
            label="Spending"
            value={formatCurrencyWhole(monthlyExpenses + monthlyFixedCosts)}
            className="min-w-[30%] grow rounded-md border border-border bg-surfaceSoft p-md"
            labelClassName="mb-1 text-textMuted"
            valueClassName="text-base font-semibold text-danger"
          />

          <StatTile
            label="Fuel Budget"
            value={formatCurrencyWhole(monthlyFuelBudget)}
            className="min-w-[30%] grow rounded-md border border-border bg-surfaceSoft p-md"
            labelClassName="mb-1 text-textMuted"
            valueClassName="text-base font-semibold text-text"
          />
        </View>
      </View>

      <Card padding="md" className={isBudgetHealthy ? "border-success" : "border-danger"}>
        <View className="flex-row items-center justify-between gap-sm">
          <View className="flex-1 gap-xs">
            <Text className="text-[17px] font-bold text-text">{budgetStatus.title}</Text>
            <Text className="text-sm leading-[21px] text-textMuted">{budgetStatus.description}</Text>
          </View>
          {remainingIncomeSharePercent !== null ? (
            <View className="items-center gap-0.5 rounded-md bg-surfaceSoft px-md py-2">
              <Text className={`text-xl font-bold ${isBudgetHealthy ? "text-success" : "text-danger"}`}>
                {remainingIncomeSharePercent}%
              </Text>
              <Text className="text-[11px] uppercase tracking-[0.4px] text-textMuted">of income free</Text>
            </View>
          ) : null}
        </View>
      </Card>

      <Card padding="md" style={shadows.soft}>
        <Text className="text-base font-bold text-text">Tank Forecast</Text>
        <Text className="text-[22px] font-bold text-accent">{Math.max(projectedDaysUntilFillUp, 0).toFixed(1)} days until next fill-up</Text>
        <Text className="text-sm leading-5 text-textMuted">Estimated refill cost: {formatCurrencyWhole(projectedFillUpCost)} based on your current fuel and mileage inputs.</Text>
        <Text className="text-[13px] font-bold uppercase tracking-[0.5px] text-text">{fuelStatus}</Text>
      </Card>

      {shouldShowSetupChecklist ? (
        <Card padding="md">
          <Text className="text-lg font-bold text-text">Get Fully Set Up</Text>
          <View className="gap-xs">
            {setupSteps.map((step) => (
              <Pressable key={step.label} onPress={() => router.push(step.path)} className="flex-row items-center gap-sm rounded-md bg-surfaceSoft px-md py-3 transition-transform duration-150 ease-out active:scale-[0.98]">
                <Ionicons
                  name={step.complete ? "checkmark-circle" : "ellipse-outline"}
                  size={20}
                  color={step.complete ? colors.success : colors.textMuted}
                />
                <View className="flex-1 gap-0.5">
                  <Text className="text-[15px] font-semibold text-text">{step.label}</Text>
                  <Text className="text-[13px] leading-[18px] text-textMuted">{step.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </Card>
      ) : null}

      <View className={isWideLayout ? "flex-row gap-sm" : "gap-sm"}>
        <QuickActionCard
          colors={colors}
          title="Update budget"
          description="Adjust income, bills, and spending."
          icon="wallet-outline"
          onPress={() => router.push("/finance")}
        />
        <QuickActionCard
          colors={colors}
          title="Log fuel"
          description="Keep your refill forecast accurate."
          icon="car-outline"
          onPress={() => router.push("/fuel")}
        />

        {/* nutrition is not complete do not use while this is commented out */}

        {/* <QuickActionCard
          colors={colors}
          title="Log nutrition"
          description="Track a daily check-in for forecasts."
          icon="restaurant-outline"
          onPress={() => router.push("/nutrition")}
        /> */}
      </View>
    </PageScaffold>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  colors,
  onPress,
}: {
  colors: ThemeColors;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 flex-row items-center gap-sm rounded-lg border border-border bg-surface p-md transition-transform duration-150 ease-out active:scale-[0.97] active:opacity-85"
    >
      <View className="items-center justify-center rounded-round bg-[rgba(240,168,104,0.16)] p-sm">
        <Ionicons name={icon} size={22} color={colors.accent} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-base font-bold text-text">{title}</Text>
        <Text className="text-[13px] leading-[19px] text-textMuted">{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}
