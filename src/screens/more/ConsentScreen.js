// Permission slips (trips, events): answer YES / NO for each child before the last date.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { View } from "react-native";
import { parentApi } from "../../api/endpoints";
import { useToast } from "../../components/Toast";
import { Badge, Button, Card, Empty, ErrorState, Loading, Muted, Row, Screen, Strong } from "../../components/ui";
import { qk } from "../../state/queryClient";
import { fDate, inr, todayISO } from "../../utils/format";

export default function ConsentScreen() {
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: qk.consent, queryFn: parentApi.consentForms });
  const m = useMutation({
    mutationFn: ({ f, answer }) => parentApi.answerConsent({ form: f.form, child: f.child, answer }),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: qk.consent }); toast.show(r.answer === "YES" ? "Permission given" : "Answer saved: No"); },
    onError: (e) => toast.show(e.message, "error"),
  });
  const today = todayISO();
  return (
    <Screen onRefresh={q.refetch} refreshing={q.isRefetching}>
      <ErrorState error={q.error} onRetry={q.refetch} />
      {q.isLoading && <Loading />}
      {q.data && !q.data.length && <Empty icon="checkbox-outline" text="No permission slips." />}
      {(q.data || []).map((f) => {
        const closed = f.respond_by && f.respond_by < today;
        const busy = m.isPending && m.variables?.f.form === f.form && m.variables?.f.child === f.child;
        return (
          <Card key={`${f.form}-${f.child}`}>
            <Row><Strong style={{ flex: 1 }}>{f.title}</Strong>{f.answer && <Badge tone={f.answer === "YES" ? "success" : "danger"} text={f.answer === "YES" ? "Allowed" : "Not allowed"} />}</Row>
            <Muted>{f.child_name}{f.event_date ? ` · ${fDate(f.event_date)}` : ""}{Number(f.amount) > 0 ? ` · ${inr(f.amount)}` : ""}</Muted>
            {!!f.description && <Muted>{f.description}</Muted>}
            {f.respond_by && <Muted>{closed ? "Closed on" : "Answer by"} {fDate(f.respond_by)}</Muted>}
            {!closed && (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Button small title="Yes, allow" style={{ flex: 1 }} busy={busy && m.variables?.answer === "YES"} kind={f.answer === "YES" ? "success" : "ghost"} onPress={() => m.mutate({ f, answer: "YES" })} />
                <Button small title="No" style={{ flex: 1 }} busy={busy && m.variables?.answer === "NO"} kind={f.answer === "NO" ? "danger" : "ghost"} onPress={() => m.mutate({ f, answer: "NO" })} />
              </View>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}
