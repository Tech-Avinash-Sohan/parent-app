// More tab: profile, children, all other features, settings, log out.
import { useQuery } from "@tanstack/react-query";
import { Alert, Platform, View } from "react-native";
import { parentApi } from "../../api/endpoints";
import { Avatar, Button, Card, ErrorState, ListItem, Muted, Row, Screen, Strong, Title } from "../../components/ui";
import { ENV } from "../../config/env";
import { useAuth } from "../../state/AuthProvider";
import { useChild } from "../../state/ChildProvider";
import { qk } from "../../state/queryClient";
import { colors } from "../../theme";
import { fDate, initials } from "../../utils/format";

export default function MoreScreen({ navigation }) {
  const { signOut } = useAuth();
  const { children } = useChild();
  const p = useQuery({ queryKey: qk.profile, queryFn: parentApi.profile });
  const go = (s, params) => () => navigation.navigate(s, params);
  const logout = () => {
    if (Platform.OS === "web") return signOut();
    Alert.alert("Log out?", "You will stop getting notifications on this phone.", [
      { text: "Cancel", style: "cancel" }, { text: "Log out", style: "destructive", onPress: signOut },
    ]);
  };
  return (
    <Screen onRefresh={p.refetch} refreshing={p.isRefetching}>
      <ErrorState error={p.error} onRetry={p.refetch} />
      {p.data && (
        <Card onPress={go("Profile")} accessibilityLabel="My profile">
          <Row style={{ justifyContent: "flex-start", gap: 12 }}>
            <Avatar text={initials(p.data.name)} size={52} />
            <View style={{ flex: 1 }}>
              <Strong>{p.data.name}</Strong>
              <Muted>{p.data.mobile}{p.data.email ? ` · ${p.data.email}` : ""}</Muted>
              <Muted style={{ color: p.data.is_app_active ? colors.success : colors.danger }}>
                {p.data.is_app_active ? `Parent app active till ${fDate(p.data.app_valid_till)}` : "Parent app not active"}
              </Muted>
            </View>
          </Row>
        </Card>
      )}
      <Title>My children</Title>
      {(children || []).map((c) => (
        <ListItem key={c.id} icon="person-outline" title={c.full_name} subtitle={`${c.school_name} · Class ${c.class_name}${c.section_name ? `-${c.section_name}` : ""}`}
          onPress={go("ChildProfile", { id: c.id })} />
      ))}
      <Title>School</Title>
      <ListItem icon="megaphone-outline" iconBg={colors.warningSoft} iconColor={colors.warning} title="Notices" onPress={go("Notices")} />
      <ListItem icon="document-text-outline" iconBg={colors.successSoft} iconColor={colors.success} title="Certificates" subtitle="Bonafide, LC, character, fee…" onPress={go("Certificates")} />
      <ListItem icon="people-outline" title="Parent-teacher meetings" subtitle="Book a slot" onPress={go("Meetings")} />
      <ListItem icon="checkbox-outline" iconBg={colors.infoSoft} iconColor={colors.info} title="Permission slips" subtitle="Trips and events" onPress={go("Consent")} />
      <ListItem icon="flag-outline" iconBg={colors.pinkSoft} iconColor={colors.pink} title="Complaints & feedback" onPress={go("Complaints")} />
      <ListItem icon="calendar-outline" iconBg={colors.warningSoft} iconColor={colors.warning} title="School calendar" onPress={go("Calendar")} />
      <Title>Account</Title>
      <ListItem icon="notifications-outline" title="Notifications" subtitle="History and settings" onPress={go("Notifications")} />
      <ListItem icon="settings-outline" title="Settings" onPress={go("Settings")} />
      <ListItem icon="key-outline" title="Change password" onPress={go("ChangePassword")} />
      <Button title="Log out" kind="ghost" icon="log-out-outline" onPress={logout} />
      <Muted style={{ textAlign: "center" }}>School ERP Parent · v{ENV.APP_VERSION}</Muted>
    </Screen>
  );
}
