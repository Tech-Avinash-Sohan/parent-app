// One notice: full text, attachment, "I have read" is recorded automatically when opened.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Linking, Text } from "react-native";
import { parentApi } from "../../api/endpoints";
import { Badge, Button, Card, Empty, ErrorState, Loading, Muted, OkBox, Row, Screen } from "../../components/ui";
import { qk } from "../../state/queryClient";
import { type } from "../../theme";
import { fDateTime } from "../../utils/format";

export default function NoticeDetailScreen({ route }) {
  const id = Number(route.params?.id);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: qk.notices, queryFn: parentApi.notices });
  const n = (q.data || []).find((x) => x.id === id);
  useEffect(() => {
    if (n && !n.is_read) {
      parentApi.readNotice(n.id).then(() => {
        qc.setQueryData(qk.notices, (old = []) => old.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
        qc.invalidateQueries({ queryKey: qk.home });
      }).catch(() => {});
    }
  }, [n?.id, n?.is_read]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Screen onRefresh={q.refetch} refreshing={q.isRefetching}>
      <ErrorState error={q.error} onRetry={q.refetch} />
      {q.isLoading && <Loading />}
      {q.data && !n && <Empty icon="megaphone-outline" text="This notice is no longer available." />}
      {n && (<>
        <Card>
          <Row><Badge tone="info" text={n.category} />{n.is_pinned && <Badge tone="warning" text="Pinned" />}</Row>
          <Text style={type.h2}>{n.title}</Text>
          <Muted>{fDateTime(n.published_at)}{n.expires_on ? ` · till ${n.expires_on}` : ""}</Muted>
          <Text style={[type.body, { lineHeight: 22 }]}>{n.body}</Text>
        </Card>
        {!!n.attachment_url && <Button title="Open attachment" icon="attach" kind="soft" onPress={() => Linking.openURL(n.attachment_url)} />}
        <OkBox text="Marked as read – the school can see you have read this." />
      </>)}
    </Screen>
  );
}
