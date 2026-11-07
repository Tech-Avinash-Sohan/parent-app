// One fee receipt with PDF download / share.
import { useState } from "react";
import { Text, View } from "react-native";
import { useToast } from "../../components/Toast";
import { Button, Card, Divider, Muted, Row, Screen, Strong } from "../../components/ui";
import { receiptHtml, sharePdf } from "../../services/pdf";
import { useChild } from "../../state/ChildProvider";
import { colors } from "../../theme";
import { fDate, inr } from "../../utils/format";

export default function ReceiptScreen({ route }) {
  const r = route.params?.receipt;
  const { child } = useChild();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (!r) return <Screen><Muted>Receipt not found.</Muted></Screen>;
  const download = async () => {
    setBusy(true);
    try { await sharePdf(receiptHtml(r, child?.school_name), `Receipt ${r.receipt_no}`); } catch (e) { toast.show(e.message, "error"); } finally { setBusy(false); }
  };
  return (
    <Screen>
      <View style={{ alignItems: "center", gap: 4, paddingVertical: 12 }}>
        <Muted>Receipt {r.receipt_no}</Muted>
        <Text style={{ fontSize: 34, fontWeight: "800", color: colors.success }}>{inr(r.amount)}</Text>
        <Muted>{fDate(r.paid_on)} · {r.mode_display}</Muted>
      </View>
      <Card>
        <Strong>{r.student_name}</Strong>
        <Muted>Adm. no {r.admission_no} · Class {r.class_name}</Muted>
        <Divider />
        {(r.lines || []).map((l) => (
          <Row key={l.student_fee}><Muted style={{ flex: 1 }}>{l.head}{l.installment ? ` · Inst. ${l.installment}` : ""}</Muted><Text>{inr(l.amount)}</Text></Row>
        ))}
        {Number(r.late_fee) > 0 && <Row><Muted>Late fee</Muted><Text>{inr(r.late_fee)}</Text></Row>}
        <Divider />
        <Row><Strong>Total paid</Strong><Strong>{inr(r.amount)}</Strong></Row>
        {!!r.reference && <Muted>Reference {r.reference}</Muted>}
      </Card>
      <Button title="Download PDF" icon="download-outline" onPress={download} busy={busy} />
    </Screen>
  );
}
