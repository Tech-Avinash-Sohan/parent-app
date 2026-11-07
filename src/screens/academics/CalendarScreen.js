// School calendar: holidays, exams and events (upcoming first).
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { parentApi } from "../../api/endpoints";
import ChildSwitcher from "../../components/ChildSwitcher";
import { Badge, Card, Empty, ErrorState, Loading, Muted, Row, Screen, Segments, Strong } from "../../components/ui";
import { useChild } from "../../state/ChildProvider";
import { qk } from "../../state/queryClient";
import { fDate, todayISO } from "../../utils/format";

const TONE = { HOLIDAY: "danger", EXAM: "info", EVENT: "success", PTM: "warning", VACATION: "danger" };

export default function CalendarScreen() {
  const { childId } = useChild();
  const [when, setWhen] = useState("upcoming");
  const q = useQuery({ queryKey: qk.calendar(childId), queryFn: () => parentApi.calendar(childId), enabled: !!childId });
  const today = todayISO();
  const list = (q.data || []).filter((e) => (when === "upcoming" ? (e.end_date || e.start_date) >= today : (e.end_date || e.start_date) < today))
    .sort((a, b) => (when === "upcoming" ? a.start_date.localeCompare(b.start_date) : b.start_date.localeCompare(a.start_date)));
  return (
    <Screen onRefresh={q.refetch} refreshing={q.isRefetching}>
      <ChildSwitcher compact />
      <Segments items={[["upcoming", "Upcoming"], ["past", "Past"]]} value={when} onChange={setWhen} />
      <ErrorState error={q.error} onRetry={q.refetch} />
      {q.isLoading && <Loading />}
      {q.data && !list.length && <Empty icon="calendar-outline" text="No events." />}
      {list.map((e) => (
        <Card key={e.id}>
          <Row><Strong style={{ flex: 1 }}>{e.title}</Strong><Badge tone={TONE[e.event_type] || "neutral"} text={e.event_type_display} /></Row>
          <Muted>{fDate(e.start_date)}{e.end_date && e.end_date !== e.start_date ? ` – ${fDate(e.end_date)}` : ""}</Muted>
          {!!e.description && <Muted>{e.description}</Muted>}
        </Card>
      ))}
    </Screen>
  );
}
