// School notices (circulars). Unread ones first are marked NEW.
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { parentApi } from "../../api/endpoints";
import { Badge, Card, Empty, ErrorState, Icon, Loading, Muted, Row, Screen, Segments, Strong } from "../../components/ui";
import { qk } from "../../state/queryClient";
import { colors } from "../../theme";
import { fDate } from "../../utils/format";

export default function NoticesScreen({ navigation }) {
  const q = useQuery({ queryKey: qk.notices, queryFn: parentApi.notices });
  const [f, setF] = useState("all");
  const list = (q.data || []).filter((n) => f === "all" || !n.is_read);
  const unread = (q.data || []).filter((n) => !n.is_read).length;
  return (
    <Screen onRefresh={q.refetch} refreshing={q.isRefetching}>
      <Segments items={[["all", "All"], ["unread", `Unread${unread ? ` (${unread})` : ""}`]]} value={f} onChange={setF} />
      <ErrorState error={q.error} onRetry={q.refetch} />
      {q.isLoading && <Loading />}
      {q.data && !list.length && <Empty icon="megaphone-outline" text="No notices." />}
      {list.map((n) => (
        <Card key={n.id} onPress={() => navigation.navigate("NoticeDetail", { id: n.id })} accessibilityLabel={n.title}>
          <Row>
            {n.is_pinned && <Icon name="pin" size={16} color={colors.warning} />}
            <Strong style={{ flex: 1 }} numberOfLines={2}>{n.title}</Strong>
            {!n.is_read && <Badge tone="warning" text="NEW" />}
          </Row>
          <Muted numberOfLines={2}>{n.body}</Muted>
          <Muted style={{ fontSize: 12 }}>{fDate(n.published_at)} · {n.category}{n.attachment_url ? " · attachment" : ""}</Muted>
        </Card>
      ))}
    </Screen>
  );
}
