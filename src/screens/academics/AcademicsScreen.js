// Academics tab: today's classes, pending homework and links to results, timetable, diary, calendar.
import { useQuery } from "@tanstack/react-query";
import { View } from "react-native";
import { parentApi } from "../../api/endpoints";
import ChildSwitcher from "../../components/ChildSwitcher";
import { Badge, Card, ErrorState, Muted, Row, Screen, Strong, Tile, TileGrid, Title } from "../../components/ui";
import { useChild } from "../../state/ChildProvider";
import { qk } from "../../state/queryClient";
import { colors } from "../../theme";
import { fDate, fTime, todayISO } from "../../utils/format";

export default function AcademicsScreen({ navigation }) {
  const { childId } = useChild();
  const today = todayISO();
  const tt = useQuery({ queryKey: qk.timetable(childId, today), queryFn: () => parentApi.timetable(childId, today), enabled: !!childId });
  const hw = useQuery({ queryKey: qk.homework(childId), queryFn: () => parentApi.homework(childId), enabled: !!childId });
  const pending = (hw.data || []).filter((h) => h.due_date >= today && (!h.status || h.status === "PENDING"));
  const go = (s) => navigation.navigate(s);
  return (
    <Screen onRefresh={() => { tt.refetch(); hw.refetch(); }} refreshing={tt.isRefetching || hw.isRefetching}>
      <ChildSwitcher />
      <TileGrid>
        <Tile label="Homework" icon="create-outline" note={`${pending.length} pending`} badge={pending.length || null} onPress={() => go("Homework")} />
        <Tile label="Timetable" icon="grid-outline" color={colors.infoSoft} ink={colors.info} note="Day by day" onPress={() => go("Timetable")} />
        <Tile label="Exams & results" icon="ribbon-outline" color={colors.purpleSoft} ink={colors.purple} note="Date sheet, report card" onPress={() => go("Exams")} />
        <Tile label="Diary & material" icon="book-outline" color={colors.successSoft} ink={colors.success} note="What was taught" onPress={() => go("Diary")} />
        <Tile label="Calendar" icon="calendar-outline" color={colors.warningSoft} ink={colors.warning} note="Holidays, events" onPress={() => go("Calendar")} />
        <Tile label="Teacher notes" icon="chatbox-ellipses-outline" color={colors.pinkSoft} ink={colors.pink} note="Remarks" onPress={() => navigation.navigate("Diary", { tab: "notes" })} />
      </TileGrid>
      <Title>Today's classes</Title>
      <ErrorState error={tt.error} onRetry={tt.refetch} />
      {tt.data && !(tt.data.slots || []).length && <Muted>No classes today.</Muted>}
      {(tt.data?.slots || []).slice(0, 8).map((p) => (
        <Card key={`${p.slot}-${p.start_time}`} style={{ paddingVertical: 12 }}>
          <Row><Strong>{p.subject}</Strong><Muted>{fTime(p.start_time)}–{fTime(p.end_time)}</Muted></Row>
          <Muted>{p.period}{p.teacher ? ` · ${p.teacher}` : ""}{p.is_substitution ? " · substitute" : ""}</Muted>
        </Card>
      ))}
      <Title>Pending homework</Title>
      <ErrorState error={hw.error} onRetry={hw.refetch} />
      {hw.data && !pending.length && <Muted>All homework is done.</Muted>}
      {pending.slice(0, 5).map((h) => (
        <Card key={h.id} onPress={() => navigation.navigate("Homework")}>
          <Row><Strong style={{ flex: 1 }} numberOfLines={1}>{h.subject} · {h.title}</Strong><Badge tone="warning" text={`Due ${fDate(h.due_date)}`} /></Row>
        </Card>
      ))}
      <View style={{ height: 8 }} />
    </Screen>
  );
}
