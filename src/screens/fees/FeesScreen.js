// Fees of the selected child: balance, dues (choose what to pay), Razorpay payment, receipts (PDF).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { parentApi } from "../../api/endpoints";
import ChildSwitcher from "../../components/ChildSwitcher";
import RazorpayPay from "../../components/RazorpayPay";
import { useToast } from "../../components/Toast";
import { Badge, Button, Card, Empty, ErrorBox, ErrorState, Icon, ListItem, Loading, Muted, Row, Screen, Strong, Title } from "../../components/ui";
import { useChild } from "../../state/ChildProvider";
import { qk } from "../../state/queryClient";
import { colors } from "../../theme";
import { fDate, inr, todayISO } from "../../utils/format";

const TONE = { PAID: "success", PARTIAL: "warning", DUE: "danger", UNPAID: "danger", WAIVED: "neutral" };
const open = (f) => Number(f.balance) > 0 && !["PAID", "WAIVED", "CANCELLED"].includes(f.status);

export default function FeesScreen({ navigation }) {
  const { childId } = useChild();
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: qk.fees(childId), queryFn: () => parentApi.fees(childId), enabled: !!childId });
  const dues = useMemo(() => (q.data?.dues || []).filter(open), [q.data]);
  const [picked, setPicked] = useState([]);
  const [err, setErr] = useState("");
  useEffect(() => { setPicked(dues.map((f) => f.id)); }, [dues]);

  const order = useMutation({ mutationFn: () => parentApi.payFees(childId, picked.length === dues.length ? null : picked), onError: (e) => setErr(e.message) });
  const verify = useMutation({
    mutationFn: parentApi.verifyFees,
    onSuccess: (r) => {
      order.reset();
      qc.invalidateQueries({ queryKey: qk.fees(childId) });
      qc.invalidateQueries({ queryKey: qk.home });
      toast.show(`Paid ${inr(r.receipt?.amount)} · receipt ${r.receipt?.receipt_no}`);
      if (r.receipt) navigation.navigate("Receipt", { receipt: r.receipt });
    },
    onError: (e) => setErr(e.message),
  });

  const sm = q.data?.summary || {};
  const today = todayISO();
  const pickedTotal = dues.filter((f) => picked.includes(f.id)).reduce((a, f) => a + Number(f.balance), 0);
  const toggle = (id) => { order.reset(); setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])); };

  return (
    <Screen onRefresh={q.refetch} refreshing={q.isRefetching}>
      <ChildSwitcher />
      <ErrorState error={q.error} onRetry={q.refetch} />
      {q.isLoading ? <Loading /> : q.data && (<>
        <View style={{ backgroundColor: colors.dark, borderRadius: 20, padding: 20, gap: 8 }}>
          <Text style={{ color: "#CBD5E1" }}>Balance to pay</Text>
          <Text style={{ color: "#fff", fontSize: 34, fontWeight: "800" }}>{inr(sm.balance)}</Text>
          {Number(sm.overdue) > 0 && <Text style={{ color: "#FCA5A5", fontWeight: "700" }}>{inr(sm.overdue)} overdue{Number(sm.late_fee) > 0 ? ` · late fee ${inr(sm.late_fee)}` : ""}</Text>}
          <Row><Text style={{ color: "#CBD5E1" }}>Total {inr(sm.total)}</Text><Text style={{ color: "#CBD5E1" }}>Paid {inr(sm.paid)}</Text></Row>
        </View>

        <Title>Dues</Title>
        {!dues.length && <Empty icon="checkmark-circle-outline" text="No fees due. All paid." />}
        {dues.map((f) => {
          const on = picked.includes(f.id);
          return (
            <Pressable key={f.id} onPress={() => toggle(f.id)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`${f.head_name} ${inr(f.balance)}`}>
              <Card style={on ? { borderColor: colors.primary } : null}>
                <Row>
                  <Icon name={on ? "checkbox" : "square-outline"} color={on ? colors.primary : colors.muted} />
                  <Strong style={{ flex: 1 }}>{f.head_name}{f.installment ? ` · Inst. ${f.installment}` : ""}</Strong>
                  <Strong>{inr(f.balance)}</Strong>
                </Row>
                <Row>
                  <Muted style={f.due_date < today ? { color: colors.danger } : null}>Due {fDate(f.due_date)}{f.due_date < today ? " · overdue" : ""}</Muted>
                  <Badge tone={TONE[f.status] || "neutral"} text={f.status} />
                </Row>
              </Card>
            </Pressable>
          );
        })}
        {dues.length > 0 && (<>
          <ErrorBox text={err} />
          {!order.data
            ? <Button title={picked.length ? `Pay ${inr(pickedTotal)} online` : "Choose fees to pay"} icon="card-outline" disabled={!picked.length}
                busy={order.isPending} onPress={() => { setErr(""); order.mutate(); }} />
            : <RazorpayPay order={{ ...order.data, name: "School fees", description: order.data.student }} title={`Pay ${inr(order.data.amount)} now`}
                busy={verify.isPending} onSuccess={(b) => verify.mutate(b)} onError={setErr} onCancel={() => { order.reset(); setErr("Payment was cancelled."); }} />}
          <Muted style={{ textAlign: "center" }}>Late fee (if any) is added automatically · UPI, card, net banking</Muted>
        </>)}

        <Title>Receipts</Title>
        {!q.data.receipts.length && <Muted>No receipts yet.</Muted>}
        {q.data.receipts.map((r) => (
          <ListItem key={r.id} icon="receipt-outline" iconBg={colors.successSoft} iconColor={colors.success}
            title={`${r.receipt_no} · ${inr(r.amount)}`} subtitle={`${fDate(r.paid_on)} · ${r.mode_display}`}
            onPress={() => navigation.navigate("Receipt", { receipt: r })} />
        ))}
      </>)}
    </Screen>
  );
}
