// Month attendance calendar + summary + leave applications of the selected child.
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Text, View } from "react-native";
import { parentApi } from "../../api/endpoints";
import ChildSwitcher from "../../components/ChildSwitcher";
import { Badge, Button, Card, ErrorState, Icon, Loading, Muted, Row, Screen, Strong, Title } from "../../components/ui";
import { useChild } from "../../state/ChildProvider";
import { qk } from "../../state/queryClient";
import { colors } from "../../theme";
import { fDate, monthKey } from "../../utils/format";

const COLOR = { P: colors.success, A: colors.danger, L: colors.warning, LT: colors.warning, HD: colors.info };
const LEGEND = [["P", "Present"], ["A", "Absent"], ["L", "Leave"], ["LT", "Late"], ["HD", "Half day"]];
const LEAVE_TONE = { PENDING: "warning", APPROVED: "success", REJECTED: "danger", CANCELLED: "neutral" };

export default function AttendanceScreen({ navigation }) {
  const { childId } = useChild();
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const mk = monthKey(month);
  const q = useQuery({ queryKey: qk.attendance(childId, mk), queryFn: () => parentApi.attendance(childId, mk), enabled: !!childId });
  const leaves = useQuery({ queryKey: qk.leaves(childId), queryFn: () => parentApi.leaves(childId), enabled: !!childId });
  const now = new Date();
  const isCurrent = month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();
  const shift = (n) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const sm = q.data?.summary || {};
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const byDay = Object.fromEntries((q.data?.days || []).map((d) => [Number(String(d.date).slice(8, 10)), d]));
  const cells = [...Array(month.getDay()).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];

  return (
    <Screen onRefresh={() => { q.refetch(); leaves.refetch(); }} refreshing={q.isRefetching}>
      <ChildSwitcher />
      <Row>
        <Button small kind="ghost" icon="chevron-back" title="Prev" onPress={() => shift(-1)} />
        <Strong>{month.toLocaleString("en-IN", { month: "long", year: "numeric" })}</Strong>
        <Button small kind="ghost" title="Next" onPress={() => shift(1)} disabled={isCurrent} />
      </Row>
      <ErrorState error={q.error} onRetry={q.refetch} />
      {q.isLoading ? <Loading /> : (<>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[["Present", sm.present ?? 0, colors.success], ["Absent", sm.absent ?? 0, colors.danger], ["Attendance", sm.percentage != null ? `${sm.percentage}%` : "—", colors.primary]].map(([l, v, c]) => (
            <Card key={l} style={{ flex: 1, alignItems: "center" }}><Text style={{ fontSize: 22, fontWeight: "800", color: c }}>{v}</Text><Muted>{l}</Muted></Card>
          ))}
        </View>
        <Card>
          <View style={{ flexDirection: "row" }}>
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <Text key={i} style={{ flex: 1, textAlign: "center", color: colors.muted, fontWeight: "700" }}>{d}</Text>)}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {cells.map((n, i) => {
              const d = n && byDay[n];
              const c = d ? COLOR[d.status] || colors.muted : null;
              return (
                <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 3 }}>
                  {n && (
                    <View accessibilityLabel={d ? `${n}: ${d.status_display}` : `${n}`} style={{ flex: 1, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: c ? `${c}22` : "transparent" }}>
                      <Text style={{ fontWeight: "700", color: c || colors.text2 }}>{n}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
            {LEGEND.map(([k, l]) => <View key={k} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLOR[k] }} /><Muted>{l}</Muted></View>)}
          </View>
        </Card>
        {(q.data?.days || []).filter((d) => d.status !== "P").map((d) => (
          <Card key={d.date}><Row><Strong>{d.status_display}</Strong><Muted>{fDate(d.date)}</Muted></Row>{!!d.remark && <Muted>{d.remark}</Muted>}</Card>
        ))}
      </>)}
      <Title right={<Button small icon="add" title="Apply leave" onPress={() => navigation.navigate("LeaveApply")} />}>Leave applications</Title>
      <ErrorState error={leaves.error} onRetry={leaves.refetch} />
      {leaves.data && !leaves.data.length && <Muted>No leave applied yet.</Muted>}
      {(leaves.data || []).map((l) => (
        <Card key={l.id}>
          <Row><Strong>{fDate(l.from_date)} → {fDate(l.to_date)}</Strong><Badge tone={LEAVE_TONE[l.status] || "neutral"} text={l.status_display || l.status} /></Row>
          <Muted>{l.days} day(s) · {l.reason}</Muted>
          {!!l.attachment_url && <Row style={{ justifyContent: "flex-start" }}><Icon name="attach" size={16} color={colors.text2} /><Muted>Attachment sent</Muted></Row>}
          {!!l.decision_note && <Muted>Teacher: {l.decision_note}</Muted>}
        </Card>
      ))}
    </Screen>
  );
}
