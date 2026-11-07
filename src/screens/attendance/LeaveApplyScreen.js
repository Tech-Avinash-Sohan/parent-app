// Apply leave for the selected child (dates, reason, optional doctor's note photo / PDF).
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { parentApi } from "../../api/endpoints";
import AttachmentPicker from "../../components/AttachmentPicker";
import ChildSwitcher from "../../components/ChildSwitcher";
import { useToast } from "../../components/Toast";
import { Button, Card, Chip, DateField, ErrorBox, Input, Row, Screen } from "../../components/ui";
import { useChild } from "../../state/ChildProvider";
import { qk } from "../../state/queryClient";
import { todayISO } from "../../utils/format";

const QUICK = ["Fever / not well", "Family function", "Out of town", "Doctor's appointment"];

export default function LeaveApplyScreen({ navigation }) {
  const { childId } = useChild();
  const qc = useQueryClient();
  const toast = useToast();
  const [f, setF] = useState({ from_date: todayISO(), to_date: todayISO(), reason: "", attachment_url: "" });
  const m = useMutation({
    mutationFn: () => parentApi.applyLeave(childId, { ...f, reason: f.reason.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.leaves(childId) });
      toast.show("Leave sent to the class teacher");
      navigation.goBack();
    },
  });
  return (
    <Screen>
      <ChildSwitcher />
      <Card>
        <DateField label="From" value={f.from_date} onChange={(v) => setF({ ...f, from_date: v, to_date: v > f.to_date ? v : f.to_date })} />
        <DateField label="To" value={f.to_date} min={f.from_date} onChange={(v) => setF({ ...f, to_date: v })} />
        <Row style={{ flexWrap: "wrap", justifyContent: "flex-start" }}>{QUICK.map((t) => <Chip key={t} text={t} active={f.reason === t} onPress={() => setF({ ...f, reason: t })} />)}</Row>
        <Input label="Reason" placeholder="Write the reason" value={f.reason} onChangeText={(v) => setF({ ...f, reason: v })} multiline maxLength={255} />
        <AttachmentPicker label="Doctor's note (optional)" value={f.attachment_url} onChange={(v) => setF({ ...f, attachment_url: v })} />
        <ErrorBox text={m.error?.message} />
        <Button title="Send leave request" icon="send" onPress={() => m.mutate()} busy={m.isPending} disabled={!f.reason.trim() || !childId} />
      </Card>
    </Screen>
  );
}
