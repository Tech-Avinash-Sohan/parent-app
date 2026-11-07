// Ask the school for a certificate (Bonafide, LC, …), follow the request, download issued ones as PDF.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { parentApi } from "../../api/endpoints";
import ChildSwitcher from "../../components/ChildSwitcher";
import { useToast } from "../../components/Toast";
import { Badge, Button, Card, ErrorBox, ErrorState, Input, Loading, Muted, Row, Screen, Select, Strong, Title } from "../../components/ui";
import { sharePdf } from "../../services/pdf";
import { useChild } from "../../state/ChildProvider";
import { qk } from "../../state/queryClient";
import { fDate } from "../../utils/format";

const TYPES = [["BONAFIDE", "Bonafide certificate"], ["LEAVING", "School leaving certificate (LC / TC)"], ["CHARACTER", "Character certificate"],
  ["STUDY", "Study certificate"], ["FEE", "Fee paid certificate"], ["BIRTH_EXTRACT", "Birth date extract (Nirgam Utara)"], ["OTHER", "Other"]]
  .map(([value, label]) => ({ value, label }));
const TONE = { PENDING: "warning", APPROVED: "success", ISSUED: "success", REJECTED: "danger" };

export default function CertificatesScreen() {
  const { childId } = useChild();
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: qk.certificates(childId), queryFn: () => parentApi.certificates(childId), enabled: !!childId });
  const [type, setType] = useState("BONAFIDE");
  const [purpose, setPurpose] = useState("");
  const [downloading, setDownloading] = useState(null);
  const m = useMutation({
    mutationFn: () => parentApi.requestCertificate(childId, type, purpose.trim()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.certificates(childId) }); setPurpose(""); toast.show("Request sent to the school office"); },
  });
  const download = async (c) => {
    setDownloading(c.id);
    try { await sharePdf(await parentApi.certificateHtml(childId, c.id), `${c.title} ${c.serial_no}`); }
    catch (e) { toast.show(e.message, "error"); } finally { setDownloading(null); }
  };
  return (
    <Screen onRefresh={q.refetch} refreshing={q.isRefetching}>
      <ChildSwitcher />
      <Card>
        <Select label="Certificate" value={type} options={TYPES} onChange={setType} />
        <Input label="Purpose" placeholder="Bank account, passport, new admission…" value={purpose} onChangeText={setPurpose} maxLength={200} />
        {type === "LEAVING" && <Muted>An LC means your child is leaving the school. The office will contact you to clear any dues first.</Muted>}
        <ErrorBox text={m.error?.message} />
        <Button title="Request certificate" icon="send" onPress={() => m.mutate()} busy={m.isPending} disabled={!childId} />
      </Card>
      <ErrorState error={q.error} onRetry={q.refetch} />
      {q.isLoading && <Loading />}
      {!!q.data?.issued?.length && <Title>Issued</Title>}
      {(q.data?.issued || []).map((c) => (
        <Card key={c.id}>
          <Row><Strong style={{ flex: 1 }}>{c.title}</Strong><Badge tone="success" text={c.serial_no} /></Row>
          <Muted>Issued {fDate(c.issue_date)} · the signed copy is with the school office</Muted>
          <Button small kind="soft" icon="download-outline" title="Download PDF" busy={downloading === c.id} onPress={() => download(c)} />
        </Card>
      ))}
      <Title>Requests</Title>
      {q.data && !q.data.requests.length && <Muted>No requests yet.</Muted>}
      {(q.data?.requests || []).map((r) => (
        <Card key={r.id}>
          <Row><Strong style={{ flex: 1 }}>{r.type_display}</Strong><Badge tone={TONE[r.status] || "neutral"} text={r.status_display} /></Row>
          <Muted>{fDate(r.created_at)}{r.purpose ? ` · ${r.purpose}` : ""}</Muted>
          {!!r.decision_note && <Muted>Office: {r.decision_note}</Muted>}
        </Card>
      ))}
    </Screen>
  );
}
