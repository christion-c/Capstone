import type { ReactNode } from "react";
import { Text, View } from "react-native";

// A titled paragraph block for policy-style pages (privacy policy,
// account deletion). Shared so pages like that stay visually
// consistent without each one redefining the same heading/body style.
export default function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-xs">
      <Text className="text-base font-bold text-text">{title}</Text>
      <Text className="text-sm leading-[21px] text-textMuted">{children}</Text>
    </View>
  );
}
