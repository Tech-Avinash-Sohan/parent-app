// Bell with unread count, top-right on every tab.
import { useNavigation } from "@react-navigation/native";
import { Pressable, Text, View } from "react-native";
import { useNotifications } from "../state/NotificationsProvider";
import { colors } from "../theme";
import { Icon } from "./ui";

export default function HeaderBell({ light }) {
  const nav = useNavigation();
  const { unread } = useNotifications();
  return (
    <Pressable onPress={() => nav.navigate("Notifications")} hitSlop={8} accessibilityRole="button"
      accessibilityLabel={unread ? `Notifications, ${unread} unread` : "Notifications"}
      style={{ width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: light ? "rgba(255,255,255,0.16)" : colors.primarySoft, marginRight: light ? 0 : 12 }}>
      <Icon name="notifications-outline" size={22} color={light ? "#fff" : colors.primary} />
      {unread > 0 && (
        <View style={{ position: "absolute", top: 4, right: 4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center", paddingHorizontal: 4, borderWidth: 2, borderColor: light ? colors.primary : "#fff" }}>
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>{unread > 99 ? "99+" : unread}</Text>
        </View>
      )}
    </Pressable>
  );
}
