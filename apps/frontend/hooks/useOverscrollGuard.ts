import { useRef } from "react";
import type { ScrollView } from "react-native";

// Belt-and-suspenders against rubber-band overscroll: the ScrollView using
// this already sets bounces/alwaysBounceVertical/overScrollMode false and
// CSS overscroll-none, but that quartet still isn't airtight on every
// platform (Safari in particular can rubber-band past the content edge
// regardless). This manually snaps back to the last valid offset as a
// final catch, rather than trusting any single native/CSS flag alone.
// Shared by both PageScaffold.tsx (app shell) and PageScaffold.web.tsx
// (website shell) - the scroll guard itself isn't platform-specific,
// only the surrounding nav chrome is.
export function useOverscrollGuard() {
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = ({
    nativeEvent,
  }: {
    nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } };
  }) => {
    const maxOffset = Math.max(nativeEvent.contentSize.height - nativeEvent.layoutMeasurement.height, 0);
    if (nativeEvent.contentOffset.y > maxOffset) {
      scrollRef.current?.scrollTo({
        y: maxOffset,
        animated: false,
      });
    }
  };

  return { scrollRef, handleScroll };
}
