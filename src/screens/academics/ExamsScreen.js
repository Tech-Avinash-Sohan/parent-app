// Exams of the child's class: date sheet, and the report card once the school publishes results.
import { useQuery } from "@tanstack/react-query";
import { View } from "react-native";
import { parentApi } from "../../api/endpoints";
import ChildSwitcher from "../../components/ChildSwitcher";
import { Badge, Button, Card, Divider, Empty, ErrorState, Loading, Muted, Row, Screen, Strong } from "../../components/ui";
import { useChild } from "../../state/ChildProvider";
import { qk } from "../../state/queryClient";
import { fDate, fTime } from "../../utils/format";

export default function ExamsScreen({ navigation }) {
  const { childId } = useChild();
  const q = useQuery({ queryKey: qk.exams(childId), queryFn: () => parentApi.exams(childId), enabled: !!childId });
  return (
    <Screen onRefresh={q.refetch} refreshing={q.isRefetching}>
      <ChildSwitcher />
      <ErrorState error={q.error} onRetry={q.refetch} />
      {q.isLoading && <Loading />}
      {q.data && !q.data.length && <Empty icon="ribbon-outline" text="No exams scheduled yet." />}
      {(q.data || []).map((ex) => (
        <Card key={ex.id}>
          <Row><Strong style={{ flex: 1 }}>{ex.name}</Strong><Badge tone={ex.result_published ? "success" : "info"} text={ex.result_published ? "Result out" : ex.status.replace("_", " ")} /></Row>
          <Muted>{ex.start_date ? `${fDate(ex.start_date)}${ex.end_date && ex.end_date !== ex.start_date ? ` – ${fDate(ex.end_date)}` : ""}` : "Dates will be announced"}</Muted>
          {ex.date_sheet.length > 0 && <Divider />}
          {ex.date_sheet.map((p) => (
            <View key={`${p.subject}-${p.date}`}>
              <Row><Strong style={{ fontSize: 14 }}>{p.subject}</Strong><Muted>{p.date ? fDate(p.date) : "Date TBA"}</Muted></Row>
              <Muted>{p.time ? `${fTime(p.time)} · ` : ""}{p.duration_minutes ? `${p.duration_minutes} min · ` : ""}{p.max_marks} marks</Muted>
            </View>
          ))}
          {ex.result_published && <Button small icon="document-text-outline" title="View report card" onPress={() => navigation.navigate("ReportCard", { exam: ex.id, name: ex.name })} />}
        </Card>
      ))}
    </Screen>
  );
}
