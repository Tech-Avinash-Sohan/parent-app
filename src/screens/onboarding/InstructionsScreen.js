// Step 1 of 3 after the first login: read the instructions, then pay (or open directly if the school is free).
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Switch, Text, View } from "react-native";
import { parentApi } from "../../api/endpoints";
import { Button, Card, ErrorBox, ErrorState, Loading, Muted, Row, Screen, Strong } from "../../components/ui";
import { useAuth } from "../../state/AuthProvider";
import { qk } from "../../state/queryClient";
import { colors } from "../../theme";
import { inr } from "../../utils/format";

export const Steps = ({ n }) => (
  <View style={{ gap: 6 }}>
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3].map((i) => <View key={i} style={{ flex: 1, height: 5, borderRadius: 99, backgroundColor: i <= n ? (n === 3 ? colors.success : colors.primary) : colors.border }} />)}
    </View>
    <Text style={{ fontSize: 13, fontWeight: "700", color: n === 3 ? colors.success : colors.primary }}>STEP {n} OF 3</Text>
  </View>
);

export default function InstructionsScreen() {
  const { user, setNextStep, signOut } = useAuth();
  const q = useQuery({ queryKey: qk.onboarding, queryFn: parentApi.onboarding });
  const [agree, setAgree] = useState(false);
  const m = useMutation({ mutationFn: parentApi.accept, onSuccess: (r) => setNextStep(r.next_step) });
  const d = q.data;
  return (
    <Screen onRefresh={q.refetch}>
      <Steps n={1} />
      <Text style={{ fontSize: 26, fontWeight: "800", color: colors.text }}>Welcome, {user?.first_name}</Text>
      <ErrorState error={q.error} onRetry={q.refetch} />
      {q.isLoading ? <Loading /> : d && (<>
        <Muted>{d.school} · please read before you start</Muted>
        {(d.instructions || []).map((x, i) => (
          <Card key={i} style={/subscription|fee/i.test(x.title) ? { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" } : null}>
            <Strong>{x.title}</Strong>
            <Muted>{x.text}</Muted>
          </Card>
        ))}
        <Card><Row><Strong>Parent app fee</Strong><Strong>{d.fee ? `${inr(d.fee)} / year` : "Free"}</Strong></Row></Card>
        <Row style={{ justifyContent: "flex-start" }}>
          <Switch value={agree} onValueChange={setAgree} trackColor={{ true: colors.primary }} accessibilityLabel="I have read the instructions" />
          <Text style={{ color: colors.text, fontSize: 15, flex: 1 }} onPress={() => setAgree((a) => !a)}>I have read the instructions</Text>
        </Row>
        <ErrorBox text={m.error?.message} />
        <Button title={d.fee ? "Continue to payment" : "Open the app"} onPress={() => m.mutate()} busy={m.isPending} disabled={!agree} />
      </>)}
      <Button title="Log out" kind="ghost" onPress={signOut} />
    </Screen>
  );
}
