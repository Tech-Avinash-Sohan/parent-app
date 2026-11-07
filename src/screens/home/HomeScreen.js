// Home: child switcher, today's status, money due, next exam, latest notice, shortcuts to everything.
import { useQuery } from "@tanstack/react-query";
import { Pressable, ScrollView, Text, View } from "react-native";
import { parentApi } from "../../api/endpoints";
import HeaderBell from "../../components/HeaderBell";
import { Avatar, Badge, Card, ErrorState, Hero, Icon, Loading, Muted, Row, Screen, Strong, Tile, TileGrid, Title } from "../../components/ui";
import { useAuth } from "../../state/AuthProvider";
import { useChild } from "../../state/ChildProvider";
import { useNotifications } from "../../state/NotificationsProvider";
import { qk } from "../../state/queryClient";
import { colors } from "../../theme";
import { fDate, firstName, greeting, initials, inr } from "../../utils/format";

const tone = (s) => (!s ? "neutral" : /present/i.test(s) ? "success" : /absent/i.test(s) ? "danger" : "warning");

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { childId, setChildId } = useChild();
  const { push } = useNotifications();
  const q = useQuery({ queryKey: qk.home, queryFn: parentApi.home });
  const kids = q.data?.children || [];
  const k = kids.find((x) => x.id === childId) || kids[0];
  const go = (name, params) => navigation.navigate(name, params);
  const pushOff = push && !push.ok && /turned off/i.test(push.reason || "");

  return (
    <Screen padded={false} onRefresh={q.refetch} refreshing={q.isRefetching}
      header={(
        <Hero overline={greeting()} title={q.data?.parent || user?.name || "Parent"} right={<HeaderBell light />}>
          {kids.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {kids.map((c) => {
                const on = c.id === k?.id;
                return (
                  <Pressable key={c.id} onPress={() => setChildId(c.id)} accessibilityRole="button" accessibilityLabel={`Select ${c.name}`} accessibilityState={{ selected: on }}
                    style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, backgroundColor: on ? "#fff" : "rgba(255,255,255,0.15)" }}>
                    <Avatar text={initials(c.name)} size={32} bg={on ? colors.primarySoft : "rgba(255,255,255,0.25)"} fg={on ? colors.primary : "#fff"} />
                    <View>
                      <Text style={{ fontWeight: "700", color: on ? colors.text : "#fff" }}>{firstName(c.name)}</Text>
                      <Text style={{ fontSize: 11, color: on ? colors.text2 : "#E0E7FF" }}>Class {c.class}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </Hero>
      )}>
      <View style={{ padding: 16, gap: 12 }}>
        <ErrorState error={q.error} onRetry={q.refetch} />
        {q.isLoading && <Loading />}
        {user?.must_change_password && (
          <Card onPress={() => go("ChangePassword")} style={{ backgroundColor: colors.warningSoft, borderColor: "#FDE68A" }} accessibilityLabel="Set your own password">
            <Row><Strong style={{ flex: 1 }}>Set your own password</Strong><Icon name="chevron-forward" color={colors.warning} /></Row>
            <Muted>You are using the password the school sent you. Change it to keep your account safe.</Muted>
          </Card>
        )}
        {pushOff && (
          <Card onPress={() => go("Settings")} style={{ backgroundColor: colors.infoSoft, borderColor: colors.infoSoft }} accessibilityLabel="Turn on notifications">
            <Row><Strong style={{ flex: 1 }}>Turn on notifications</Strong><Icon name="notifications-outline" color={colors.info} /></Row>
            <Muted>Get absent alerts, homework, results and receipts instantly.</Muted>
          </Card>
        )}
        {q.data && !k && <Muted>No child is linked to this login yet. Please contact the school office.</Muted>}
        {k && (<>
          <Card onPress={() => go("Attendance")} accessibilityLabel="Today's attendance">
            <Row><Strong>Today</Strong><Badge tone={tone(k.attendance_today)} text={k.attendance_today || "Not marked yet"} /></Row>
            <Muted>{k.school}{k.class_teacher ? ` · Class teacher ${k.class_teacher}` : ""}</Muted>
          </Card>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Card style={{ flex: 1 }} onPress={() => go("Homework")} accessibilityLabel="Homework due">
              <Muted>Homework due</Muted>
              <Text style={{ fontSize: 26, fontWeight: "800", color: colors.text }}>{k.homework_due}</Text>
            </Card>
            <Card style={{ flex: 1 }} onPress={() => go("FeesTab")} accessibilityLabel="Fee due">
              <Muted>Fee due</Muted>
              <Text style={{ fontSize: 26, fontWeight: "800", color: Number(k.fee_overdue) > 0 ? colors.danger : colors.text }}>{inr(k.fee_due)}</Text>
              {Number(k.fee_overdue) > 0 && <Text style={{ color: colors.danger, fontSize: 12 }}>{inr(k.fee_overdue)} overdue</Text>}
            </Card>
          </View>
          {k.next_exam && (
            <Card onPress={() => go("Exams")} style={{ backgroundColor: colors.infoSoft, borderColor: colors.infoSoft }}>
              <Row style={{ justifyContent: "flex-start" }}><Icon name="calendar-outline" color={colors.info} /><Strong style={{ flex: 1 }}>Next exam · {k.next_exam.subject}</Strong></Row>
              <Muted>{k.next_exam.exam} · {fDate(k.next_exam.date)}</Muted>
            </Card>
          )}
          {k.latest_notice && (
            <Card onPress={() => go("NoticeDetail", { id: k.latest_notice.id })}>
              <Muted>Latest notice</Muted>
              <Strong>{k.latest_notice.title}</Strong>
            </Card>
          )}
          <Title>Everything for {firstName(k.name)}</Title>
          <TileGrid>
            <Tile label="Attendance" icon="checkmark-done-outline" color={colors.successSoft} ink={colors.success} note="Month view, leave" onPress={() => go("Attendance")} />
            <Tile label="Homework" icon="create-outline" note={`${k.homework_due} pending`} onPress={() => go("Homework")} />
            <Tile label="Timetable" icon="grid-outline" color={colors.infoSoft} ink={colors.info} note="Day by day" onPress={() => go("Timetable")} />
            <Tile label="Results" icon="ribbon-outline" color={colors.purpleSoft} ink={colors.purple} note="Exams, report card" onPress={() => go("Exams")} />
            <Tile label="Notices" icon="megaphone-outline" color={colors.warningSoft} ink={colors.warning} note="Circulars" onPress={() => go("Notices")} />
            <Tile label="Apply leave" icon="airplane-outline" color={colors.pinkSoft} ink={colors.pink} note="Sick, family" onPress={() => go("LeaveApply")} />
            <Tile label="Certificates" icon="document-text-outline" color={colors.successSoft} ink={colors.success} note="Bonafide, LC" onPress={() => go("Certificates")} />
            <Tile label="PTM" icon="people-outline" note="Book a meeting" onPress={() => go("Meetings")} />
          </TileGrid>
          {q.data.app_valid_till && <Muted style={{ textAlign: "center" }}>Parent app active till {fDate(q.data.app_valid_till)}</Muted>}
        </>)}
      </View>
    </Screen>
  );
}
