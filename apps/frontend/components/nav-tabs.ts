// Shared between BottomNav (narrow/app layout) and TopNav (wide/website
// layout, see PageScaffold) so the two navigation chrome components
// can't drift out of sync with each other.
export const navTabs = [
  { label: "Finance", path: "/finance", icon: "wallet-outline", activeIcon: "wallet" },
  { label: "Home", path: "/", icon: "home-outline", activeIcon: "home" },
  { label: "Profile", path: "/profile", icon: "person-outline", activeIcon: "person" },
  { label: "Fuel", path: "/fuel", icon: "car-outline", activeIcon: "car" },

  // nutrition is not complete do not use while this is commented out
  // { label: "Nutrition", path: "/nutrition", icon: "restaurant-outline", activeIcon: "restaurant" },

] as const;

export type NavTabLabel = (typeof navTabs)[number]["label"];
