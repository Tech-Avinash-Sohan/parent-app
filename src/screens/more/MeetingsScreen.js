// Parent-teacher meetings: book an open slot of my child's teachers; see my meetings.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Linking } from "react-native";
import { parentApi } from "../../api/endpoints";
import ChildSwitcher from "../../components/ChildSwitcher";
import { useToast } from "../../components/Toast";
import { Badge, Button, Card, ErrorState, Input, Loading, Muted, Row, Screen, Strong, Title } from "../../components/ui";
import { useChild } from "../../state/ChildProvider";
import { qk } from "../../state/queryClient";
import { fDate, fTime } from "../../utils/format";

const when = (s) => `${fDate(s.date)} · ${fTime(s.start_time)}–${fTime(s.end_time)} · ${s.mode === "ONLINE" ? "Online" : "In school"}`;
const TONE = { BOOKED: "info", DONE: "success", CANCELLED: "danger" };

export default function MeetingsScreen() {
  const { childId } = useChild();
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: qk.meetings(childId), queryFn: () => parentApi.meetings(childId), enabled: !!childId });
  const [agenda, setAgenda] = useState("");
  const m = useMutation({
    mutationFn: (s) => parentApi.bookMeeting(s.id, childId, agenda.trim()),
    onSuccess: (s) => { qc.invalidateQueries({ queryKey: qk.meetings(childId) }); setAgenda(""); toast.show(`Booked with ${s.teacher_name} on ${fDate(s.date)}`); },
    onError: (e) => { toast.show(e.message, "error"); qc.invalidateQueries({ queryKey: qk.meetings(childId) }); },
  });
  const d = q.data;
  return (
    <Screen onRefresh={q.refetch} refreshing={q.isRefetching}>
      <ChildSwitcher />
      <ErrorState error={q.error} onRetry={q.refetch} />
      {q.isLoading && <Loading />}
      {d && (<>
        <Title>My meetings</Title>
        {!d.my_meetings.length && <Muted>No meetings booked.</Muted>}
        {d.my_meetings.map((s) => (
          <Card key={s.id}>
            <Row><Strong style={{ flex: 1 }}>{s.teacher_name}</Strong><Badge tone={TONE[s.status] || "neutral"} text={s.status} /></Row>
            <Muted>{when(s)}{s.student_name ? ` · ${s.student_name}` : ""}</Muted>
            {!!s.agenda && <Muted>Agenda: {s.agenda}</Muted>}
            {!!s.notes && <Muted>Teacher's notes: {s.notes}</Muted>}
            {!!s.meeting_link && s.status === "BOOKED" && <Button small kind="soft" icon="videocam-outline" title="Join online" onPress={() => Linking.openURL(s.meeting_link)} />}
          </Card>
        ))}
        <Title>Open slots</Title>
        {d.open.length > 0 && <Input label="What do you want to discuss? (optional)" value={agenda} onChangeText={setAgenda} maxLength={255} />}
        {!d.open.length && <Muted>No open slots right now. Teachers open slots before a PTM.</Muted>}
        {d.open.map((s) => (
          <Card key={s.id}>
            <Row><Strong style={{ flex: 1 }}>{s.teacher_name}</Strong><Button small title="Book" busy={m.isPending && m.variables?.id === s.id} onPress={() => m.mutate(s)} /></Row>
            <Muted>{when(s)}</Muted>
          </Card>
        ))}
      </>)}
    </Screen>
  );
}
