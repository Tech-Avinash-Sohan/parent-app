// Class diary (what was taught), study material links and teacher notes for the selected child.
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Linking, Text } from "react-native";
import { parentApi } from "../../api/endpoints";
import ChildSwitcher from "../../components/ChildSwitcher";
import { Badge, Card, Empty, ErrorState, Icon, Loading, Muted, Row, Screen, Segments, Strong } from "../../components/ui";
import { useChild } from "../../state/ChildProvider";
import { qk } from "../../state/queryClient";
import { colors, type } from "../../theme";
import { fDate } from "../../utils/format";

const TABS = [["diary", "Diary"], ["materials", "Study material"], ["notes", "Teacher notes"]];

export default function DiaryScreen({ route }) {
  const { childId } = useChild();
  const [tab, setTab] = useState(route.params?.tab || "diary");
  const q = useQuery({ queryKey: qk[tab](childId), queryFn: () => parentApi[tab](childId), enabled: !!childId });
  return (
    <Screen onRefresh={q.refetch} refreshing={q.isRefetching}>
      <ChildSwitcher />
      <Segments items={TABS} value={tab} onChange={setTab} />
      <ErrorState error={q.error} onRetry={q.refetch} />
      {q.isLoading && <Loading />}
      {q.data && !q.data.length && <Empty icon="book-outline" text={tab === "notes" ? "No notes from teachers." : "Nothing here yet."} />}
      {(q.data || []).map((x) => tab === "diary" ? (
        <Card key={x.id}>
          <Row><Strong>{x.subject_name || "Class diary"}</Strong><Muted>{fDate(x.date)}</Muted></Row>
          <Text style={type.body}>{x.note}</Text>
          {!!x.written_by_name && <Muted>— {x.written_by_name}</Muted>}
        </Card>
      ) : tab === "materials" ? (
        <Card key={x.id} onPress={x.url ? () => Linking.openURL(x.url) : undefined} accessibilityLabel={x.title}>
          <Row><Strong style={{ flex: 1 }}>{x.title}</Strong><Badge tone="info" text={x.material_type} /></Row>
          <Muted>{[x.subject_name, x.chapter].filter(Boolean).join(" · ")}</Muted>
          {!!x.description && <Muted>{x.description}</Muted>}
          {!!x.url && <Row style={{ justifyContent: "flex-start" }}><Icon name="open-outline" size={16} color={colors.primary} /><Text style={{ color: colors.primary, fontWeight: "600" }}>Open</Text></Row>}
        </Card>
      ) : (
        <Card key={x.id}>
          <Row><Badge tone={/appreciat|achiev/i.test(x.category) ? "success" : "warning"} text={x.category} /><Muted>{fDate(x.created_at)}</Muted></Row>
          <Text style={type.body}>{x.note}</Text>
          {!!x.written_by_name && <Muted>— {x.written_by_name}</Muted>}
        </Card>
      ))}
    </Screen>
  );
}
