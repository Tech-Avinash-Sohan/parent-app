// Report card of one published exam, with PDF download / share.
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Text, View } from "react-native";
import { parentApi } from "../../api/endpoints";
import { useToast } from "../../components/Toast";
import { Badge, Button, Card, ErrorState, Loading, Muted, Row, Screen, Strong } from "../../components/ui";
import { useChild } from "../../state/ChildProvider";
import { qk } from "../../state/queryClient";
import { reportCardHtml, sharePdf } from "../../services/pdf";
import { colors } from "../../theme";

export default function ReportCardScreen({ route }) {
  const { childId, child } = useChild();
  const toast = useToast();
  const exam = Number(route.params?.exam);
  const q = useQuery({ queryKey: qk.reportCard(childId, exam), queryFn: () => parentApi.reportCard(childId, exam), enabled: !!childId && !!exam });
  const [busy, setBusy] = useState(false);
  const r = q.data;
  const download = async () => {
    setBusy(true);
    try { await sharePdf(reportCardHtml(r, child?.school_name), `Report card ${r.exam}`); } catch (e) { toast.show(e.message, "error"); } finally { setBusy(false); }
  };
  return (
    <Screen onRefresh={q.refetch} refreshing={q.isRefetching}>
      <ErrorState error={q.error} onRetry={q.refetch} />
      {q.isLoading && <Loading />}
      {r && (<>
        <View style={{ backgroundColor: colors.primary, borderRadius: 20, padding: 20, gap: 6 }}>
          <Text style={{ color: "#E0E7FF" }}>{r.exam} · {r.academic_year}</Text>
          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>{r.student.name}</Text>
          <Text style={{ color: "#E0E7FF" }}>Class {r.student.class}{r.student.section ? `-${r.student.section}` : ""} · Roll {r.student.roll_no || "—"}</Text>
          <Row style={{ marginTop: 8 }}>
            <Text style={{ color: "#fff", fontSize: 34, fontWeight: "800" }}>{r.percentage != null ? `${r.percentage}%` : "—"}</Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>Grade {r.grade || "—"}</Text>
              <Text style={{ color: r.result === "FAIL" ? "#FCA5A5" : "#A7F3D0", fontWeight: "700" }}>{r.result || ""}</Text>
            </View>
          </Row>
        </View>
        <Card>
          {r.subjects.map((s) => (
            <Row key={s.subject} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flex: 1 }}><Strong>{s.subject}</Strong>{!!s.remark && <Muted>{s.remark}</Muted>}</View>
              <Text style={{ width: 80, textAlign: "right", color: colors.text }}>{s.is_absent ? "Absent" : `${s.marks ?? "—"} / ${s.max_marks}`}</Text>
              <View style={{ width: 54, alignItems: "flex-end" }}><Badge tone={s.passed ? "success" : "danger"} text={s.grade || (s.passed ? "P" : "F")} /></View>
            </Row>
          ))}
          <Row style={{ paddingTop: 8 }}><Strong>Total</Strong><Strong>{r.total} / {r.max_total}</Strong></Row>
        </Card>
        {!!r.remark && <Card><Muted>Teacher's remark</Muted><Strong>{r.remark}</Strong></Card>}
        <Button title="Download PDF" icon="download-outline" onPress={download} busy={busy} />
      </>)}
    </Screen>
  );
}
