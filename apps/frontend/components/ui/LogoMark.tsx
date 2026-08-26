import { Text, View } from "react-native";

import { useThemeColors } from "@/components/contexts/AppPreferencesProvider";
import { withAlpha } from "@/lib/color";

interface LogoMarkProps {
  size?: number;
}

// A themed monogram badge, standing in for the app's raster logo image
// on screens where a small mark is wanted (currently just the home
// header). The actual logo PNG has fixed blue coloring baked into its
// pixels, which clashed hard against the app's warm palette and can't
// adapt to it - this is a plain View/Text, so it always matches
// whatever accent color the current theme/mode/contrast setting uses.
export default function LogoMark({ size = 40 }: LogoMarkProps) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        height: size,
        width: size,
        borderRadius: size / 2,
        backgroundColor: withAlpha(colors.accent, 0.16),
      }}
      className="items-center justify-center border border-accent"
    >
      <Text style={{ fontSize: size * 0.4 }} className="font-bold text-accent">
        TT
      </Text>
    </View>
  );
}
