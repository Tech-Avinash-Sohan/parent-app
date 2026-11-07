// A child's school record + ask the office to correct a detail (the office approves).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { parentApi } from "../../api/endpoints";
import { useToast } from "../../components/Toast";
import { Avatar, Badge, Button, Card, Divider, ErrorBox, ErrorState, Input, Loading, Muted, Row, Screen, Select, Strong, Title } from "../../components/ui";
import { qk } from "../../state/queryClient";
import { fDate, initials } from "../../utils/format";

const FIELDS = [["first_name", "First name"], ["middle_name", "Middle name"], ["last_name", "Last name"], ["date_of_birth", "Date of birth (YYYY-MM-DD)"],
  ["gender", "Gender"], ["blood_group", "Blood group"], ["father_name", "Father's name"], ["mother_name", "Mother's name"], ["address", "Address"],
  ["place_of_birth", "Place of birth"], ["mother_tongue", "Mother tongue"]];
const LABEL = Object.fromEntries(FIELDS);
const TONE = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" };

export default function ChildProfileScreen({ route }) {
  const id = Number(route.params?.id);
  const qc = useQueryClient();
  const toast = useToast();
  const c = useQuery({ queryKey: qk.child(id), queryFn: () => parentApi.child(id) });
  const reqs = useQuery({ queryKey: qk.changeRequests(id), queryFn: () => parentApi.changeRequests(id) });
  const [f, setF] = useState({ field: "", new_value: "", reason: "" });
  const m = useMutation({
    mutationFn: () => parentApi.requestChange(id, f),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.changeRequests(id) }); setF({ field: "", new_value: "", reason: "" }); toast.show("Sent to the school office"); },
  });
  const d = c.data;
  const row = (l, v) => <Row key={l}><Muted>{l}</Muted><Strong style={{ fontSize: 14, flexShrink: 1, textAlign: "right" }}>{v || "—"}</Strong></Row>;
  return (
    <Screen onRefresh={() => { c.refetch(); reqs.refetch(); }} refreshing={c.isRefetching}>
      <ErrorState error={c.error} onRetry={c.refetch} />
      {c.isLoading && <Loading />}
      {d && (
        <Card>
          <Row style={{ justifyContent: "flex-start", gap: 12 }}>
            <Avatar text={initials(d.full_name)} size={52} />
            <Strong style={{ flex: 1, fontSize: 18 }}>{d.full_name}</Strong>
          </Row>
          <Divider />
          {row("School", d.school_name)}
          {row("Class", `${d.class_name}${d.section_name ? `-${d.section_name}` : ""}`)}
          {row("Roll no", d.roll_no)}
          {row("Admission no", d.admission_no)}
          {row("Admission date", fDate(d.admission_date))}
          {row("Class teacher", d.class_teacher)}
          {row("Academic year", d.academic_year)}
          {row("Date of birth", fDate(d.date_of_birth))}
          {row("Gender", d.gender)}
          {row("Blood group", d.blood_group)}
        </Card>
      )}
      <Title>Ask for a correction</Title>
      <Card>
        <Select label="What is wrong?" value={f.field} options={FIELDS.map(([value, label]) => ({ value, label }))} onChange={(v) => setF({ ...f, field: v })} placeholder="Choose a detail" />
        <Input label="Correct value" value={f.new_value} onChangeText={(v) => setF({ ...f, new_value: v })} />
        <Input label="Reason (optional)" value={f.reason} onChangeText={(v) => setF({ ...f, reason: v })} placeholder="e.g. spelling as per birth certificate" />
        <ErrorBox text={m.error?.message} />
        <Button title="Send to office" onPress={() => m.mutate()} busy={m.isPending} disabled={!f.field || !f.new_value.trim()} />
      </Card>
      {(reqs.data || []).map((r) => (
        <Card key={r.id}>
          <Row><Strong style={{ flex: 1 }}>{LABEL[r.field] || r.field}</Strong><Badge tone={TONE[r.status] || "neutral"} text={r.status} /></Row>
          <Muted>{r.old_value || "—"} → {r.new_value}</Muted>
          {!!r.decision_note && <Muted>Office: {r.decision_note}</Muted>}
          <Muted style={{ fontSize: 12 }}>{fDate(r.created_at)}</Muted>
        </Card>
      ))}
    </Screen>
  );
}
