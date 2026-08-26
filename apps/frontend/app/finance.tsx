import { useCallback } from "react";
import { Platform, Text, View } from "react-native";

import { useThemeColors } from "@/components/contexts/AppPreferencesProvider";
import StepFlowModal from "@/components/StepFlowModal";
import { useFinance } from "@/components/contexts/FinanceProvider";
import PageScaffold from "@/components/PageScaffold";
import { Card, CardTitle, MetricRow, PrimaryButton, RadialGauge, StatTile } from "@/components/ui";
import { useWebKeyboardInset } from "@/hooks/useWebKeyboardInset";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { useStepFlow, type StepFlowStepConfig } from "@/hooks/useStepFlow";
import { formatCurrency } from "@/lib/money-format";

type FinanceCheckinStepKey = "income" | "expense" | "bills";

const FINANCE_CHECKIN_STEPS: StepFlowStepConfig<FinanceCheckinStepKey>[] = [
  { key: "income", title: "Monthly income", hint: "Enter your normal monthly income.", placeholder: "0.00", keyboardType: "decimal-pad", icon: "cash-outline" },
  { key: "expense", title: "Monthly spending", hint: "Enter your typical monthly spending.", placeholder: "0.00", keyboardType: "decimal-pad", icon: "cart-outline" },
  { key: "bills", title: "Static bills", hint: "Enter your recurring monthly bills like rent, insurance, or loan payments.", placeholder: "0.00", keyboardType: "decimal-pad", icon: "receipt-outline" },
];

export default function Finance() {
  const colors = useThemeColors();
  const webKeyboardInset = useWebKeyboardInset();
  const {
    incomeInput,
    setIncomeInput,
    expenseInput,
    setExpenseInput,
    monthlyFixedCostsInput,
    setMonthlyFixedCostsInput,
    monthlyIncome,
    monthlyExpenses,
    monthlyFixedCosts,
    monthlyFuelBudget,
    projectedBudgetAfterEssentials,
    weeklySpendTarget,
    refresh: refreshFinance,
  } = useFinance();

  useRefetchOnFocus(useCallback(() => refreshFinance(), [refreshFinance]));

  const financeFlow = useStepFlow<FinanceCheckinStepKey>({
    steps: FINANCE_CHECKIN_STEPS,
    onStepConfirmed: (key, value) => {
      if (key === "income") {
        setIncomeInput(value);
      } else if (key === "expense") {
        setExpenseInput(value);
      } else {
        setMonthlyFixedCostsInput(value);
      }
    },
    onComplete: () => {
      // Each step's value was already mirrored into FinanceContext as it
      // was confirmed; nothing left to do once the last step lands.
    },
  });

  const startFinanceFlow = () =>
    financeFlow.start({
      income: incomeInput,
      expense: expenseInput,
      bills: monthlyFixedCostsInput,
    });

  const isHealthy = projectedBudgetAfterEssentials >= 0;
  const spendingHabitRatio =
    monthlyIncome > 0 ? (monthlyExpenses + monthlyFixedCosts + monthlyFuelBudget) / monthlyIncome : 0;

  return (
    <PageScaffold
      title="Finances"
      subtitle="Build your monthly budget and reserve room for fuel before surprises hit."
      showNav
      navActive="Finance"
    >
      <Card>
        <CardTitle>Budget Snapshot</CardTitle>
        <View className="flex-row items-center gap-md">
          <RadialGauge
            percent={spendingHabitRatio * 100}
            trackColor={colors.surfaceSoft}
            fillColor={isHealthy ? colors.success : colors.danger}
            label="Spent"
            valueLabel={`${Math.round(spendingHabitRatio * 100)}%`}
            labelColor={colors.textMuted}
            valueColor={colors.text}
          />
          <View className="flex-1 gap-xs">
            <MetricRow icon="cash-outline" label="Income" value={formatCurrency(monthlyIncome)} iconColor={colors.textMuted} />
            <MetricRow icon="cart-outline" label="Spending" value={formatCurrency(monthlyExpenses)} iconColor={colors.textMuted} />
            <MetricRow icon="receipt-outline" label="Fixed costs" value={formatCurrency(monthlyFixedCosts)} iconColor={colors.textMuted} />
            <MetricRow icon="water-outline" label="Fuel cost" value={formatCurrency(monthlyFuelBudget)} iconColor={colors.textMuted} />
          </View>
        </View>
        <Text className={`text-sm font-bold ${isHealthy ? "text-success" : "text-danger"}`}>
          {isHealthy ? "Healthy" : "Needs attention"} · Available: {formatCurrency(projectedBudgetAfterEssentials)}
        </Text>

        <View className="mt-xs flex-row flex-wrap gap-sm">
          <StatTile
            label="Weekly Budget"
            value={formatCurrency(weeklySpendTarget)}
            className="min-w-[30%] flex-1 gap-xs rounded-md bg-surfaceSoft p-md"
            labelClassName="text-caption uppercase tracking-[0.5px] text-textMuted"
            valueClassName="text-[22px] font-bold text-text"
          />
          <StatTile
            label="Fuel share"
            value={monthlyIncome > 0 ? `${Math.round((monthlyFuelBudget / monthlyIncome) * 100)}%` : "0%"}
            className="min-w-[30%] flex-1 gap-xs rounded-md bg-surfaceSoft p-md"
            labelClassName="text-caption uppercase tracking-[0.5px] text-textMuted"
            valueClassName="text-[22px] font-bold text-text"
          />
        </View>
      </Card>

      <Card>
        <CardTitle>Budget Check-In</CardTitle>

        <View className="gap-sm">
          <PrimaryButton onPress={startFinanceFlow} label="Start monthly check-in" textClassName="text-[15px]" />
          <Text className="text-sm text-textMuted">Enter your monthly income, spending, and recurring bills one step at a time.</Text>
        </View>
      </Card>

      <StepFlowModal
        step={financeFlow.activeStep}
        isLastStep={financeFlow.isLastStep}
        stepIndex={financeFlow.stepIndex}
        totalSteps={financeFlow.totalSteps}
        draft={financeFlow.draft}
        onChangeDraft={financeFlow.setDraft}
        onCancel={financeFlow.close}
        onConfirm={() => void financeFlow.confirmStep()}
        webKeyboardInset={webKeyboardInset}
        keyboardBehavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      />
    </PageScaffold>
  );
}
