// Day timetable of the selected child (substitute teachers shown).
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { parentApi } from "../../api/endpoints";
import ChildSwitcher from "../../components/ChildSwitcher";
import { Badge, Button, Card, DateField, Empty, ErrorState, Loading, Muted, Row, Screen, Strong } from "../../components/ui";
import { useChild } from "../../state/ChildProvider";
import { qk } from "../../state/queryClient";
import { fTime, todayISO } from "../../utils/format";

export default function TimetableScreen() {
  const { childId } = useChild();
  const [date, setDate] = useState(todayISO());
  const q = useQuery({ queryKey: qk.timetable(childId, date), queryFn: () => parentApi.timetable(childId, date), enabled: !!childId });
  const slots = q.data?.slots || [];
  return (
    <Screen onRefresh={q.refetch} refreshing={q.isRefetching}>
      <ChildSwitcher />
      <DateField label="Date" value={date} onChange={setDate} />
      {date !== todayISO() && <Button small kind="soft" title="Back to today" onPress={() => setDate(todayISO())} />}
      <ErrorState error={q.error} onRetry={q.refetch} />
      {q.isLoading && <Loading />}
      {q.data && !slots.length && <Empty icon="sunny-outline" text="No classes on this day." />}
      {slots.map((p) => (
        <Card key={`${p.slot}-${p.start_time}`}>
          <Row><Strong>{p.subject}</Strong>{p.is_substitution && <Badge tone="warning" text="Substitute" />}</Row>
          <Muted>{p.period} · {fTime(p.start_time)}–{fTime(p.end_time)}{p.teacher ? ` · ${p.teacher}` : ""}{p.room ? ` · Room ${p.room}` : ""}</Muted>
        </Card>
      ))}
    </Screen>
  );
}
