import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/components/contexts/AppPreferencesProvider";
import { useFinance } from "@/components/contexts/FinanceProvider";
import PageScaffold from "@/components/PageScaffold";
import type { ThemeColors } from "@/components/theme";
import { AnimatedNumber, Card, CardTitle, DonutGauge, LogoMark } from "@/components/ui";
import { useVehicle } from "@/components/contexts/VehicleProvider";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { useSetupChecklist } from "@/hooks/useSetupChecklist";
import { formatCurrencyWhole } from "@/lib/money-format";

export default function Home() {
  const colors = useThemeColors();
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
    ? { title: "Plan looks stable" }
    : { title: "Budget risk detected" };
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

  // Where this month's income actually goes - the same three cost
  // fields projectedBudgetAfterEssentials is computed from
  // (finance-projections.ts), plus whatever's left over, as ring
  // segments instead of a plain number column.
  const donutLegend: { label: string; value: number; color: string }[] = [
    { label: "Fixed costs", value: monthlyFixedCosts, color: colors.textMuted },
    { label: "Fuel", value: monthlyFuelBudget, color: colors.accent },
    { label: "Spending", value: monthlyExpenses, color: colors.danger },
    { label: "Remaining", value: Math.max(projectedBudgetAfterEssentials, 0), color: colors.success },
  ];

  return (
    <PageScaffold
      title="Welcome back"
      subtitle="Your monthly plan updates from manual finance and fuel inputs as you go."
      headerRight={<LogoMark />}
      showNav
      navActive="Home"
    >
      <Card>
        <View className="flex-row items-center justify-between gap-sm">
          <CardTitle>Free Cash Flow</CardTitle>
          {shouldShowSetupChecklist ? (
            <View className="rounded-round bg-[rgba(240,145,61,0.18)] px-3 py-1.5">
              <Text className="text-xs font-bold uppercase tracking-[0.4px] text-accent">{completionCount}/{setupSteps.length} setup</Text>
            </View>
          ) : null}
        </View>

        <View className="items-center py-xs">
          <DonutGauge
            segments={donutLegend.map((item) => ({ value: item.value, color: item.color }))}
            size={176}
            strokeWidth={18}
            trackColor={colors.surfaceSoft}
          >
            <View className="items-center">
              <Text className="text-[11px] text-textMuted">This month</Text>
              <AnimatedNumber
                value={projectedBudgetAfterEssentials}
                formatValue={formatCurrencyWhole}
                className="text-[24px] font-bold text-text"
              />
            </View>
          </DonutGauge>
        </View>

        <Text className={`text-center text-sm font-bold ${isBudgetHealthy ? "text-success" : "text-danger"}`}>
          {budgetStatus.title}
          {remainingIncomeSharePercent !== null ? ` · ${remainingIncomeSharePercent}% of income free` : ""}
        </Text>

        <View className="mt-sm gap-sm">
          {donutLegend.map((item) => (
            <View key={item.label} className="flex-row items-center gap-sm">
              <View className="h-2.5 w-2.5 rounded-round" style={{ backgroundColor: item.color }} />
              <Text className="flex-1 text-[13px] text-textMuted">{item.label}</Text>
              <Text className="text-[13px] font-bold text-text">{formatCurrencyWhole(item.value)}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <CardTitle>Tank Forecast</CardTitle>
        <Text className="text-[26px] font-bold text-accent">{Math.max(projectedDaysUntilFillUp, 0).toFixed(1)} days until next fill-up</Text>
        <Text className="text-sm leading-5 text-textMuted">Estimated refill cost: {formatCurrencyWhole(projectedFillUpCost)} based on your current fuel and mileage inputs.</Text>
        <Text className="text-[13px] font-bold uppercase tracking-[0.5px] text-text">{fuelStatus}</Text>
      </Card>

      {shouldShowSetupChecklist ? (
        <Card>
          <CardTitle>Get Fully Set Up</CardTitle>
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

      <Card>
        <CardTitle>Quick Actions</CardTitle>
        <View className="gap-xs">
          <QuickActionRow
            colors={colors}
            title="Update budget"
            description="Adjust income, bills, and spending."
            icon="wallet-outline"
            onPress={() => router.push("/finance")}
          />
          <QuickActionRow
            colors={colors}
            title="Log fuel"
            description="Keep your refill forecast accurate."
            icon="car-outline"
            onPress={() => router.push("/fuel")}
          />

          {/* nutrition is not complete do not use while this is commented out */}

          {/* <QuickActionRow
            colors={colors}
            title="Log nutrition"
            description="Track a daily check-in for forecasts."
            icon="restaurant-outline"
            onPress={() => router.push("/nutrition")}
          /> */}
        </View>
      </Card>
    </PageScaffold>
  );
}

function QuickActionRow({
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
      className="flex-row items-center gap-sm rounded-md bg-surfaceSoft px-md py-3 transition-transform duration-150 ease-out active:scale-[0.98]"
    >
      <View className="items-center justify-center rounded-round bg-[rgba(240,145,61,0.16)] p-sm">
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
