import { Ionicons } from "@expo/vector-icons";
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from "react-native";
import type { KeyboardAvoidingViewProps } from "react-native";

import type { StepFlowStepConfig } from "@/hooks/useStepFlow";
import { withAlpha } from "@/lib/color";
import type { ThemeColors } from "./theme";

interface StepFlowModalProps<K extends string> {
  step: StepFlowStepConfig<K> | null;
  isLastStep: boolean;
  stepIndex: number;
  totalSteps: number;
  draft: string;
  onChangeDraft: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  webKeyboardInset: number;
  colors: ThemeColors;
  // Defaults match fuel.tsx's tuning; finance.tsx passes its own (see
  // git history for why they differ per-page).
  keyboardBehavior?: KeyboardAvoidingViewProps["behavior"];
  keyboardVerticalOffset?: number;
}

// Renders the current step of a useStepFlow wizard as a bottom-anchored
// modal - a progress bar plus an icon badge per step, rather than a bare
// "title, hint, text field" form, so a 4-step wizard reads as one guided
// flow with a sense of where you are in it instead of a plain form.
export default function StepFlowModal<K extends string>({
  step,
  isLastStep,
  stepIndex,
  totalSteps,
  draft,
  onChangeDraft,
  onCancel,
  onConfirm,
  webKeyboardInset,
  colors,
  keyboardBehavior = Platform.OS === "ios" ? "position" : "height",
  keyboardVerticalOffset = Platform.OS === "ios" ? 24 : 0,
}: StepFlowModalProps<K>) {
  return (
    <Modal transparent visible={Boolean(step)} animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={keyboardBehavior}
        keyboardVerticalOffset={keyboardVerticalOffset}
        className="flex-1 justify-end bg-[rgba(4,8,12,0.68)]"
      >
        {/* marginBottom is a runtime pixel value from useWebKeyboardInset, so it
            stays an inline style - Tailwind classes can't express an
            unbounded runtime number. */}
        <View style={{ marginBottom: webKeyboardInset }} className="px-md pb-lg">
          <View className="gap-sm rounded-lg border border-border bg-surface p-lg">
            {totalSteps > 1 ? (
              <View className="flex-row gap-xs">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <View
                    key={index}
                    className={`h-1.5 flex-1 rounded-round ${index <= stepIndex ? "bg-accent" : ""}`}
                    style={index <= stepIndex ? undefined : { backgroundColor: withAlpha(colors.text, 0.14) }}
                  />
                ))}
              </View>
            ) : null}

            <View className="flex-row items-center gap-sm">
              {step?.icon ? (
                <View
                  className="h-9 w-9 items-center justify-center rounded-round"
                  style={{ backgroundColor: withAlpha(colors.accent, 0.16) }}
                >
                  <Ionicons name={step.icon} size={18} color={colors.accent} />
                </View>
              ) : null}
              <Text className="flex-1 text-xl font-bold text-text">{step?.title}</Text>
            </View>

            <Text className="text-sm leading-5 text-textMuted">{step?.hint}</Text>
            <TextInput
              value={draft}
              onChangeText={onChangeDraft}
              keyboardType={step?.keyboardType ?? "default"}
              autoCapitalize={step?.autoCapitalize ?? "sentences"}
              autoCorrect={step?.autoCorrect ?? true}
              className="rounded-md border border-border bg-surfaceSoft px-md py-3 text-base text-text"
              placeholder={step?.placeholder}
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View className="mt-xs flex-row justify-end gap-sm">
              <Pressable onPress={onCancel} className="rounded-md border border-border px-md py-2.5">
                <Text className="text-sm font-semibold text-text">Cancel</Text>
              </Pressable>
              <Pressable onPress={onConfirm} className="rounded-md bg-accent px-md py-2.5">
                <Text className="text-sm font-bold text-accentDeep">{isLastStep ? "Done" : "Next"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
