// Design tokens used by every screen.
import { Platform } from "react-native";

export const colors = {
  primary: "#3446D6", primaryDark: "#2433A8", primarySoft: "#EEF0FD",
  bg: "#F5F6FA", card: "#FFFFFF", text: "#0F172A", text2: "#475569", muted: "#94A3B8", border: "#E2E8F0",
  success: "#047857", successSoft: "#D1FAE5", danger: "#B91C1C", dangerSoft: "#FEE2E2",
  warning: "#B45309", warningSoft: "#FEF3C7", info: "#1D4ED8", infoSoft: "#DBEAFE",
  purple: "#6D28D9", purpleSoft: "#EDE9FE", pink: "#9D174D", pinkSoft: "#FCE7F3", dark: "#0F172A",
};

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const shadow = Platform.select({
  ios: { shadowColor: "#0F172A", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  android: { elevation: 1 },
  default: { boxShadow: "0 2px 8px rgba(15,23,42,0.06)" },
});

export const type = {
  h1: { fontSize: 26, fontWeight: "800", color: colors.text },
  h2: { fontSize: 20, fontWeight: "800", color: colors.text },
  h3: { fontSize: 17, fontWeight: "700", color: colors.text },
  body: { fontSize: 15, color: colors.text },
  small: { fontSize: 13, color: colors.text2 },
  tiny: { fontSize: 11, color: colors.muted },
};
