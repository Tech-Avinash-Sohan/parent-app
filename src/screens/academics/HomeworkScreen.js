// Homework list; when the teacher wants it submitted, the parent marks it done with a note + photo / PDF.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Linking, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { parentApi } from "../../api/endpoints";
import AttachmentPicker from "../../components/AttachmentPicker";
import ChildSwitcher from "../../components/ChildSwitcher";
import { useToast } from "../../components/Toast";
import { Badge, Button, Card, Empty, ErrorBox, ErrorState, Icon, Input, Loading, Muted, Row, Screen, Segments, Strong, styles } from "../../components/ui";
import { useChild } from "../../state/ChildProvider";
import { qk } from "../../state/queryClient";
import { colors, type } from "../../theme";
import { fDate, todayISO } from "../../utils/format";

const TONE = { PENDING: "warning", SUBMITTED: "info", LATE: "danger", CHECKED: "success", INCOMPLETE: "danger" };
const LABEL = { PENDING: "To do", SUBMITTED: "Submitted", LATE: "Submitted late", CHECKED: "Checked", INCOMPLETE: "Incomplete" };

export default function HomeworkScreen() {
  const { childId } = useChild();
  const qc = useQueryClient();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("pending");
  const [open, setOpen] = useState(null);
  const [note, setNote] = useState("");
  const [file, setFile] = useState("");
  const q = useQuery({ queryKey: qk.homework(childId), queryFn: () => parentApi.homework(childId), enabled: !!childId });
  const m = useMutation({
    mutationFn: () => parentApi.submitHomework(open.submission_id, { note: note.trim(), ...(file ? { file_url: file } : {}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.homework(childId) });
      qc.invalidateQueries({ queryKey: qk.home });
      toast.show("Homework marked as done");
      setOpen(null); setNote(""); setFile("");
    },
  });
  const today = todayISO();
  const list = (q.data || []).filter((h) => (filter === "all" ? true : filter === "pending"
    ? (!h.status || h.status === "PENDING") && h.due_date >= today : h.status && h.status !== "PENDING"));

  return (
    <Screen onRefresh={q.refetch} refreshing={q.isRefetching}>
      <ChildSwitcher />
      <Segments items={[["pending", "To do"], ["done", "Done"], ["all", "All"]]} value={filter} onChange={setFilter} />
      <ErrorState error={q.error} onRetry={q.refetch} />
      {q.isLoading && <Loading />}
      {q.data && !list.length && <Empty icon="checkmark-done-outline" text={filter === "pending" ? "No pending homework." : "Nothing here."} />}
      {list.map((h) => (
        <Card key={h.id}>
          <Row><Strong style={{ flex: 1 }}>{h.subject} · {h.title}</Strong>{h.status && <Badge tone={TONE[h.status] || "neutral"} text={LABEL[h.status] || h.status} />}</Row>
          {!!h.description && <Text style={type.body}>{h.description}</Text>}
          <Muted>Given {fDate(h.assigned_on)} · Due {fDate(h.due_date)}</Muted>
          {!!h.attachment_url && (
            <Pressable onPress={() => Linking.openURL(h.attachment_url)} accessibilityRole="link" style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
              <Icon name="attach" size={16} color={colors.primary} /><Text style={{ color: colors.primary, fontWeight: "600" }}>Open attachment</Text>
            </Pressable>
          )}
          {!!h.teacher_remark && <Muted>Teacher: {h.teacher_remark}</Muted>}
          {h.needs_submission && h.submission_id && h.status === "PENDING" && (
            <Button small title="Mark as done" icon="checkmark" onPress={() => { setOpen(h); m.reset(); }} />
          )}
        </Card>
      ))}
      <Modal visible={!!open} transparent animationType="slide" onRequestClose={() => setOpen(null)}>
        <Pressable style={styles.sheetBack} onPress={() => setOpen(null)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={type.h3}>{open?.subject} · {open?.title}</Text>
          <Input label="Note for the teacher (optional)" value={note} onChangeText={setNote} maxLength={255} />
          <AttachmentPicker label="Photo of the work (optional)" value={file} onChange={setFile} />
          <ErrorBox text={m.error?.message} />
          <Button title="Submit" onPress={() => m.mutate()} busy={m.isPending} />
          <Button title="Cancel" kind="ghost" onPress={() => setOpen(null)} />
        </View>
      </Modal>
    </Screen>
  );
}
