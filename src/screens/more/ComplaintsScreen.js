// Complaints & feedback to the school, with status and the school's response.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { parentApi } from "../../api/endpoints";
import AttachmentPicker from "../../components/AttachmentPicker";
import { useToast } from "../../components/Toast";
import { Badge, Button, Card, ErrorBox, ErrorState, Input, Muted, Row, Screen, Select, Strong, Title } from "../../components/ui";
import { useChild } from "../../state/ChildProvider";
import { qk } from "../../state/queryClient";
import { fDate } from "../../utils/format";

const CATS = [["ACADEMIC", "Academic"], ["TRANSPORT", "Transport"], ["FEES", "Fees"], ["FACILITY", "Facility / infrastructure"], ["STAFF", "Staff behaviour"], ["OTHER", "Other / feedback"]]
  .map(([value, label]) => ({ value, label }));
const CAT_LABEL = Object.fromEntries(CATS.map((c) => [c.value, c.label]));
const TONE = { OPEN: "warning", IN_PROGRESS: "info", RESOLVED: "success", CLOSED: "neutral" };
const EMPTY = { category: "OTHER", subject: "", description: "", attachment_url: "" };

export default function ComplaintsScreen() {
  const { childId } = useChild();
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: qk.complaints, queryFn: parentApi.complaints });
  const [f, setF] = useState(EMPTY);
  const m = useMutation({
    mutationFn: () => parentApi.complain({ ...f, subject: f.subject.trim(), description: f.description.trim(), child: childId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.complaints }); setF(EMPTY); toast.show("Sent to the school office"); },
  });
  return (
    <Screen onRefresh={q.refetch} refreshing={q.isRefetching}>
      <Card>
        <Select label="Category" value={f.category} options={CATS} onChange={(v) => setF({ ...f, category: v })} />
        <Input label="Subject" value={f.subject} onChangeText={(v) => setF({ ...f, subject: v })} maxLength={150} />
        <Input label="Details" value={f.description} onChangeText={(v) => setF({ ...f, description: v })} multiline />
        <AttachmentPicker label="Photo (optional)" value={f.attachment_url} onChange={(v) => setF({ ...f, attachment_url: v })} />
        <ErrorBox text={m.error?.message} />
        <Button title="Send" icon="send" onPress={() => m.mutate()} busy={m.isPending} disabled={!f.subject.trim() || !f.description.trim()} />
      </Card>
      <Title>My complaints</Title>
      <ErrorState error={q.error} onRetry={q.refetch} />
      {q.data && !q.data.length && <Muted>Nothing sent yet.</Muted>}
      {(q.data || []).map((c) => (
        <Card key={c.id}>
          <Row><Strong style={{ flex: 1 }}>{c.subject}</Strong><Badge tone={TONE[c.status] || "neutral"} text={c.status.replace("_", " ")} /></Row>
          <Muted>{fDate(c.created_at)} · {CAT_LABEL[c.category] || c.category}{c.student_name ? ` · ${c.student_name}` : ""}</Muted>
          <Muted>{c.description}</Muted>
          {!!c.response && <Card style={{ backgroundColor: "#F8FAFC" }}><Muted>School's response</Muted><Strong style={{ fontSize: 14 }}>{c.response}</Strong></Card>}
        </Card>
      ))}
    </Screen>
  );
}
