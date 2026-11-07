// Wires push notifications into the running app (only after the parent is in the app):
// registers the phone, keeps the unread badge in sync, refreshes data when a push arrives,
// and opens the right screen when a notification is tapped (also from a closed app).
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { notificationsApi } from "../api/endpoints";
import { navigate, whenNavReady } from "../navigation/navigationRef";
import { Notifications, registerForPush, routeForData, setBadge, supportsPush } from "../services/push";
import { useChild } from "./ChildProvider";
import { qk } from "./queryClient";

const Ctx = createContext({ unread: 0, push: null, enablePush: async () => {} });
export const useNotifications = () => useContext(Ctx);

// which cached lists a push makes stale
const STALE = {
  STUDENT_ABSENT: ["home", "attendance"], LEAVE_DECIDED: ["leaves", "attendance"], HOMEWORK_ASSIGNED: ["homework", "home"],
  RESULT_PUBLISHED: ["exams"], FEE_RECEIPT: ["fees", "home"], FEE_REMINDER: ["fees", "home"], CERTIFICATE_READY: ["certificates"],
  MEETING_BOOKED: ["meetings"], COMPLAINT_UPDATE: ["complaints", "notes"], NOTICE_PUBLISHED: ["notices", "home"],
  CHAT_MESSAGE: ["chats", "messages"],
};

export function NotificationsProvider({ children }) {
  const qc = useQueryClient();
  const { setChildId } = useChild();
  const [push, setPush] = useState(null); // result of registerForPush
  const handled = useRef(new Set());

  const unreadQ = useQuery({ queryKey: qk.unread, queryFn: notificationsApi.unreadCount, refetchInterval: 60_000 });
  const unread = unreadQ.data?.unread || 0;
  useEffect(() => { setBadge(unread); }, [unread]);

  const enablePush = useCallback(async (ask = true) => {
    const r = await registerForPush({ ask });
    setPush(r);
    return r;
  }, []);

  const open = useCallback((response) => {
    const id = response?.notification?.request?.identifier;
    if (!id || handled.current.has(id)) return;
    handled.current.add(id);
    const data = response.notification.request.content.data || {};
    if (data.child) setChildId(Number(data.child));
    if (data.notification_id) notificationsApi.read(data.notification_id).then(() => qc.invalidateQueries({ queryKey: qk.unread })).catch(() => {});
    const r = routeForData(data);
    whenNavReady(() => navigate(r.name, r.params));
  }, [qc, setChildId]);

  useEffect(() => {
    enablePush(true);
    const onState = AppState.addEventListener("change", (s) => {
      if (s === "active") { qc.invalidateQueries({ queryKey: qk.unread }); enablePush(false); }
    });
    if (!supportsPush) return () => onState.remove();
    const received = Notifications.addNotificationReceivedListener((n) => {
      const data = n.request.content.data || {};
      qc.invalidateQueries({ queryKey: qk.unread });
      qc.invalidateQueries({ queryKey: qk.inbox });
      for (const key of STALE[data.event] || []) qc.invalidateQueries({ queryKey: [key] });
    });
    const tapped = Notifications.addNotificationResponseReceivedListener(open);
    // app was closed and opened by tapping a notification
    const last = Notifications.getLastNotificationResponse();
    if (last) open(last);
    return () => { onState.remove(); received.remove(); tapped.remove(); };
  }, [enablePush, open, qc]);

  return <Ctx.Provider value={{ unread, push, enablePush, refreshUnread: unreadQ.refetch }}>{children}</Ctx.Provider>;
}
