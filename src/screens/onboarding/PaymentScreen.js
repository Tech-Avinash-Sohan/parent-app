// Step 2 of 3: pay the yearly Parent app fee (Razorpay). Step 3: success -> app opens.
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Text, View } from "react-native";
import { parentApi } from "../../api/endpoints";
import RazorpayPay from "../../components/RazorpayPay";
import { Button, Card, ErrorBox, ErrorState, Icon, Loading, Muted, OkBox, Row, Screen } from "../../components/ui";
import { useAuth } from "../../state/AuthProvider";
import { qk } from "../../state/queryClient";
import { colors } from "../../theme";
import { fDate, inr } from "../../utils/format";
import { Steps } from "./InstructionsScreen";

export default function PaymentScreen() {
  const { user, setNextStep, signOut } = useAuth();
  const q = useQuery({ queryKey: qk.payment, queryFn: parentApi.paymentStatus });
  const [err, setErr] = useState("");
  const order = useMutation({ mutationFn: parentApi.createOrder, onError: (e) => setErr(e.message) });
  const verify = useMutation({ mutationFn: parentApi.verifyPayment, onError: (e) => setErr(e.message) });
  const st = q.data;
  const done = verify.data;

  if (done) {
    return (
      <Screen>
        <Steps n={3} />
        <View style={{ alignItems: "center", gap: 12, paddingVertical: 24 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" }}>
            <Icon name="checkmark" size={48} color={colors.success} />
          </View>
          <Text style={{ fontSize: 26, fontWeight: "800", color: colors.text }}>Payment successful</Text>
          <Muted>Your Parent app is active till <Text style={{ fontWeight: "700", color: colors.text }}>{fDate(done.valid_till)}</Text></Muted>
        </View>
        <Card>
          <Row><Muted>Amount</Muted><Text style={{ fontWeight: "700" }}>{inr(done.payment?.amount)}</Text></Row>
          <Row><Muted>Payment id</Muted><Text style={{ fontWeight: "700", flexShrink: 1 }} numberOfLines={1}>{done.payment?.razorpay_payment_id || done.payment?.order_id}</Text></Row>
        </Card>
        <OkBox text="Receipt sent on WhatsApp and e-mail" />
        <Button title="Go to my children" onPress={() => setNextStep(done.next_step)} />
      </Screen>
    );
  }

  return (
    <Screen onRefresh={q.refetch}>
      <Steps n={2} />
      <Text style={{ fontSize: 26, fontWeight: "800", color: colors.text }}>Activate the Parent app</Text>
      <ErrorState error={q.error} onRetry={q.refetch} />
      {q.isLoading ? <Loading /> : st && (
        <View style={{ backgroundColor: colors.dark, borderRadius: 20, padding: 22, gap: 12 }}>
          <Row>
            <Text style={{ color: "#CBD5E1", flex: 1 }}>{st.school}</Text>
            <View style={{ backgroundColor: "#FBBF24", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ fontSize: 11, fontWeight: "800", color: "#422006" }}>1 YEAR</Text></View>
          </Row>
          <Text style={{ color: "#fff", fontSize: 40, fontWeight: "800" }}>{inr(st.amount)}</Text>
          <Row><Text style={{ color: "#CBD5E1" }}>Parent</Text><Text style={{ color: "#fff" }}>{user?.name} · {user?.mobile}</Text></Row>
        </View>
      )}
      <Card>
        {["Daily attendance and homework", "School notices and calendar", "Fees, receipts and results", "Chat with teachers"].map((t) => (
          <Row key={t} style={{ justifyContent: "flex-start" }}><Icon name="checkmark-circle" size={18} color={colors.success} /><Text style={{ color: colors.text }}>{t}</Text></Row>
        ))}
      </Card>
      <ErrorBox text={err} />
      {!order.data
        ? <Button title={`Pay ${inr(st?.amount)} securely`} icon="lock-closed-outline" onPress={() => { setErr(""); order.mutate(); }} busy={order.isPending} disabled={!st} />
        : <RazorpayPay order={order.data} title={`Pay ${inr((order.data.amount_paise || order.data.amount) / 100)} now`} busy={verify.isPending}
            onSuccess={(b) => verify.mutate(b)} onError={setErr} onCancel={() => setErr("Payment was cancelled. You can try again.")} />}
      <Muted style={{ textAlign: "center" }}>Payments by Razorpay · UPI, card, net banking</Muted>
      <Button title="Log out" kind="ghost" onPress={signOut} />
    </Screen>
  );
}
