// Chat tab: conversations with teachers (unread count), start a new chat.
import { useFocusEffect } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { rows } from "../../api/client";
import { parentApi } from "../../api/endpoints";
import { Badge, Button, Empty, ErrorState, ListItem, Loading, Screen } from "../../components/ui";
import { qk } from "../../state/queryClient";
import { timeAgo } from "../../utils/format";

export default function ChatsScreen({ navigation }) {
  const q = useQuery({ queryKey: qk.chats, queryFn: parentApi.chats, refetchInterval: 30_000 });
  const { refetch } = q;
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));
  const list = rows(q.data);
  return (
    <Screen onRefresh={q.refetch} refreshing={q.isRefetching}>
      <Button title="New message to a teacher" icon="create-outline" onPress={() => navigation.navigate("NewChat")} />
      <ErrorState error={q.error} onRetry={q.refetch} />
      {q.isLoading && <Loading />}
      {q.data && !list.length && <Empty icon="chatbubbles-outline" text="No chats yet. Message your child's teacher." />}
      {list.map((t) => (
        <ListItem key={t.id} title={t.teacher_name} subtitle={`${t.student_name} · ${t.last_message || "No messages yet"}`}
          right={t.unread ? <Badge tone="info" text={`${t.unread} new`} /> : t.last_message_at ? <Badge text={timeAgo(t.last_message_at)} /> : null}
          onPress={() => navigation.navigate("ChatThread", { id: t.id, title: t.teacher_name })}
          chevron={false}
        />
      ))}
    </Screen>
  );
}

