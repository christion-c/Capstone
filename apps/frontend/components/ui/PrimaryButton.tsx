import { Pressable, Text } from "react-native";

// The filled accent-color button shared by check-in start actions and
// (via AuthSubmitButton) auth forms. `className`/`textClassName` are escape
// hatches so call sites that differ slightly from the baseline (press/
// disabled feedback, text size) can keep their exact existing look.
// transition-transform + active:scale-95 gives tactile press feedback
// via NativeWind's built-in Reanimated-backed transition support -
// wrapping Pressable in Animated.createAnimatedComponent for this
// instead broke className resolution entirely (confirmed by testing:
// the button rendered with no background/shape at all), since NativeWind's
// className interop targets known primitives like Pressable directly,
// not arbitrary components created from them.
interface PrimaryButtonProps {
  onPress: () => void;
  label: string;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
}

export default function PrimaryButton({
  onPress,
  label,
  disabled = false,
  className = "",
  textClassName = "",
}: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`items-center rounded-md bg-accent py-3 transition-transform duration-150 ease-out active:scale-95 ${className}`}
    >
      <Text className={`font-bold text-accentDeep ${textClassName}`}>{label}</Text>
    </Pressable>
  );
}
