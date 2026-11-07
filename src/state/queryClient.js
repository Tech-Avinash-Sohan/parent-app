// React Query: server data cache, retries, refetch when the app comes back or the internet returns.
import NetInfo from "@react-native-community/netinfo";
import { focusManager, onlineManager, QueryClient } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((s) => setOnline(s.isConnected !== false && s.isInternetReachable !== false)));

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (s) => focusManager.setFocused(s === "active"));
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      retry: (count, err) => (err?.network || err?.status >= 500) && count < 2,
      retryDelay: (n) => Math.min(1000 * 2 ** n, 8000),
      refetchOnWindowFocus: true,
    },
    mutations: { retry: false },
  },
});

/** Query keys in one place so screens and push notifications refresh the same data. */
export const qk = {
  me: ["me"],
  profile: ["profile"],
  onboarding: ["onboarding"],
  payment: ["payment"],
  home: ["home"],
  children: ["children"],
  child: (id) => ["child", id],
  attendance: (id, month) => ["attendance", id, month],
  leaves: (id) => ["leaves", id],
  timetable: (id, date) => ["timetable", id, date],
  homework: (id) => ["homework", id],
  diary: (id) => ["diary", id],
  materials: (id) => ["materials", id],
  notes: (id) => ["notes", id],
  exams: (id) => ["exams", id],
  reportCard: (id, exam) => ["reportCard", id, exam],
  fees: (id) => ["fees", id],
  teachers: (id) => ["teachers", id],
  certificates: (id) => ["certificates", id],
  changeRequests: (id) => ["changeRequests", id],
  calendar: (id) => ["calendar", id],
  notices: ["notices"],
  chats: ["chats"],
  messages: (t) => ["messages", t],
  meetings: (id) => ["meetings", id],
  complaints: ["complaints"],
  consent: ["consent"],
  inbox: ["inbox"],
  unread: ["unread"],
};
