// Red strip on top while the phone has no internet.
import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme";
import { Icon } from "./ui";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const insets = useSafeAreaInsets();
  useEffect(() => NetInfo.addEventListener((s) => setOffline(s.isConnected === false || s.isInternetReachable === false)), []);
  if (!offline) return null;
  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 100, paddingTop: insets.top + 4, paddingBottom: 6, backgroundColor: colors.danger, flexDirection: "row", justifyContent: "center", gap: 6 }}>
      <Icon name="cloud-offline-outline" size={16} color="#fff" />
      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>No internet – showing saved data</Text>
    </View>
  );
}
