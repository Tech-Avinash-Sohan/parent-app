// Start a conversation with any teacher of the selected child.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { parentApi } from "../../api/endpoints";
import ChildSwitcher from "../../components/ChildSwitcher";
import { Avatar, Button, Card, Empty, ErrorBox, ErrorState, Icon, Input, Loading, Muted, Row, Screen, Strong, Title } from "../../components/ui";
import { useChild } from "../../state/ChildProvider";
import { qk } from "../../state/queryClient";
import { colors } from "../../theme";
import { initials } from "../../utils/format";

export default function NewChatScreen({ navigation }) {
  const { childId } = useChild();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: qk.teachers(childId), queryFn: () => parentApi.teachers(childId), enabled: !!childId });
  const [teacher, setTeacher] = useState(null);
  const [text, setText] = useState("");
  const m = useMutation({
    mutationFn: () => parentApi.startChat({ child: childId, teacher: teacher.id, text: text.trim() }),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: qk.chats });
      navigation.replace("ChatThread", { id: t.id, title: t.teacher_name });
    },
  });
  return (
    <Screen>
      <ChildSwitcher />
      <Title>Choose a teacher</Title>
      <ErrorState error={q.error} onRetry={q.refetch} />
      {q.isLoading && <Loading />}
      {q.data && !q.data.length && <Empty icon="person-outline" text="No teachers are assigned to this class yet." />}
      {(q.data || []).map((t) => {
        const on = teacher?.id === t.id;
        return (
          <Card key={t.id} onPress={() => setTeacher(t)} accessibilityLabel={`${t.name}, ${t.role}`} style={on ? { borderColor: colors.primary, backgroundColor: colors.primarySoft } : null}>
            <Row>
              <Avatar text={initials(t.name)} />
              <Strong style={{ flex: 1 }}>{t.name}</Strong>
              {on && <Icon name="checkmark-circle" color={colors.primary} />}
            </Row>
            <Muted>{t.role}{t.subjects.length ? ` · ${t.subjects.join(", ")}` : ""}</Muted>
          </Card>
        );
      })}
      {teacher && (<>
        <Input label={`Message to ${teacher.name}`} value={text} onChangeText={setText} multiline placeholder="Write your message" />
        <ErrorBox text={m.error?.message} />
        <Button title="Send" icon="send" onPress={() => m.mutate()} busy={m.isPending} disabled={!text.trim()} />
      </>)}
    </Screen>
  );
}
