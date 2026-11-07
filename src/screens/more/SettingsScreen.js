// Settings: push notification status (turn on / open phone settings), app info, support.
import { useFocusEffect } from "@react-navigation/native";
import * as Application from "expo-application";
import { useCallback, useState } from "react";
import { Linking, Platform, Text } from "react-native";
import { Badge, Button, Card, ErrorBox, ListItem, Muted, OkBox, Row, Screen, Strong, Title } from "../../components/ui";
import { ENV } from "../../config/env";
import { permissionStatus } from "../../services/push";
import { useAuth } from "../../state/AuthProvider";
import { useNotifications } from "../../state/NotificationsProvider";
import { type } from "../../theme";

const LABEL = { granted: ["On", "success"], denied: ["Off", "danger"], undetermined: ["Not asked yet", "warning"], unsupported: ["Not available", "neutral"] };

export default function SettingsScreen({ navigation }) {
  const { user } = useAuth();
  const { push, enablePush } = useNotifications();
  const [perm, setPerm] = useState(null);
  const [busy, setBusy] = useState(false);
  useFocusEffect(useCallback(() => { permissionStatus().then(setPerm); }, []));
  const turnOn = async () => {
    setBusy(true);
    const r = await enablePush(true);
    setPerm(await permissionStatus());
    setBusy(false);
    if (!r.ok && /turned off/i.test(r.reason || "")) Linking.openSettings().catch(() => {});
  };
  const [label, tone] = LABEL[perm] || ["…", "neutral"];
  return (
    <Screen>
      <Title>Notifications</Title>
      <Card>
        <Row><Strong>Push notifications</Strong><Badge tone={tone} text={label} /></Row>
        <Muted>Absent alerts, homework, results, fee receipts, notices and teacher messages.</Muted>
        {push?.ok && <OkBox text="This phone is registered and will get notifications." />}
        {push && !push.ok && perm !== "unsupported" && <ErrorBox text={push.reason} />}
        {perm === "unsupported" && <Muted>{Platform.OS === "web" ? "Push notifications work in the Android and iPhone app." : "Use a real phone to get push notifications."}</Muted>}
        {perm !== "unsupported" && !push?.ok && <Button title={perm === "denied" ? "Open phone settings" : "Turn on notifications"} icon="notifications-outline" busy={busy} onPress={perm === "denied" ? () => Linking.openSettings() : turnOn} />}
        {push?.ok && <Button small kind="ghost" title="Notification history" onPress={() => navigation.navigate("Notifications")} />}
      </Card>
      <Title>Account</Title>
      <ListItem icon="person-outline" title="My profile" subtitle={user?.mobile} onPress={() => navigation.navigate("Profile")} />
      <ListItem icon="key-outline" title="Change password" onPress={() => navigation.navigate("ChangePassword")} />
      <Title>About</Title>
      <Card>
        <Row><Muted>Version</Muted><Text style={type.body}>{Application.nativeApplicationVersion || ENV.APP_VERSION} ({Application.nativeBuildVersion || "web"})</Text></Row>
        <Row><Muted>Environment</Muted><Text style={type.body}>{ENV.APP_ENV}</Text></Row>
        <Row><Muted>Server</Muted><Text style={[type.small, { flexShrink: 1 }]} numberOfLines={1}>{ENV.API_URL.replace(/^https?:\/\//, "")}</Text></Row>
      </Card>
      <Muted style={{ textAlign: "center" }}>For help with your login or fees, contact your school office.</Muted>
    </Screen>
  );
}
