// Notification history (inbox): every push the parent got, unread highlighted, tap to open, mark all read.
import { useFocusEffect } from "@react-navigation/native";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useLayoutEffect } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { notificationsApi } from "../../api/endpoints";
import { Empty, ErrorState, Icon, Loading } from "../../components/ui";
import { navigate } from "../../navigation/navigationRef";
import { routeForData } from "../../services/push";
import { useChild } from "../../state/ChildProvider";
import { useNotifications } from "../../state/NotificationsProvider";
import { qk } from "../../state/queryClient";
import { colors } from "../../theme";
import { timeAgo } from "../../utils/format";

const ICON = {
  STUDENT_ABSENT: ["alert-circle-outline", colors.danger, colors.dangerSoft], LEAVE_DECIDED: ["airplane-outline", colors.pink, colors.pinkSoft],
  HOMEWORK_ASSIGNED: ["create-outline", colors.primary, colors.primarySoft], RESULT_PUBLISHED: ["ribbon-outline", colors.purple, colors.purpleSoft],
  FEE_RECEIPT: ["receipt-outline", colors.success, colors.successSoft], FEE_REMINDER: ["wallet-outline", colors.warning, colors.warningSoft],
  CERTIFICATE_READY: ["document-text-outline", colors.success, colors.successSoft], MEETING_BOOKED: ["people-outline", colors.info, colors.infoSoft],
  NOTICE_PUBLISHED: ["megaphone-outline", colors.warning, colors.warningSoft], CHAT_MESSAGE: ["chatbubble-outline", colors.primary, colors.primarySoft],
  COMPLAINT_UPDATE: ["flag-outline", colors.info, colors.infoSoft],
};

export default function NotificationsScreen({ navigation }) {
  const qc = useQueryClient();
  const { setChildId } = useChild();
  const { unread, refreshUnread } = useNotifications();
  const q = useInfiniteQuery({
    queryKey: qk.inbox,
    queryFn: ({ pageParam }) => notificationsApi.inbox(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (last?.next ? all.length + 1 : undefined),
  });
  const { refetch } = q;
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));
  const items = (q.data?.pages || []).flatMap((p) => p.results || []);

  const markAll = useMutation({
    mutationFn: notificationsApi.readAll,
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.inbox }); refreshUnread(); },
  });
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (unread > 0 ? (
        <Pressable onPress={() => markAll.mutate()} hitSlop={8} accessibilityRole="button" style={{ marginRight: 12 }}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>Mark all read</Text>
        </Pressable>
      ) : null),
    });
  }, [navigation, unread, markAll]);

  const open = (n) => {
    if (!n.is_read) {
      notificationsApi.read(n.id).then(() => { qc.invalidateQueries({ queryKey: qk.inbox }); refreshUnread(); }).catch(() => {});
    }
    if (n.data?.child) setChildId(Number(n.data.child));
    const r = routeForData(n.data);
    if (r.name !== "Notifications") navigate(r.name, r.params);
  };

  if (q.isLoading) return <Loading />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ErrorState error={q.error} onRetry={q.refetch} />
      <FlatList data={items} keyExtractor={(n) => String(n.id)} contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={q.isRefetching && !q.isFetchingNextPage} onRefresh={q.refetch} tintColor={colors.primary} />}
        onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()} onEndReachedThreshold={0.4}
        ListEmptyComponent={<Empty icon="notifications-outline" text="No notifications yet. Absent alerts, homework, results and receipts will appear here." />}
        ListFooterComponent={q.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : null}
        renderItem={({ item: n }) => {
          const [icon, ink, bg] = ICON[n.event] || ["notifications-outline", colors.primary, colors.primarySoft];
          return (
            <Pressable onPress={() => open(n)} accessibilityRole="button" accessibilityLabel={`${n.is_read ? "" : "Unread. "}${n.title}`}
              style={({ pressed }) => [{ flexDirection: "row", gap: 12, padding: 14, borderRadius: 14, backgroundColor: n.is_read ? "#fff" : colors.primarySoft,
                borderWidth: 1, borderColor: n.is_read ? "#EEF1F6" : "#D6DBFA" }, pressed && { opacity: 0.85 }]}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}><Icon name={icon} color={ink} /></View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontWeight: n.is_read ? "600" : "800", color: colors.text, fontSize: 15 }} numberOfLines={2}>{n.title}</Text>
                <Text style={{ color: colors.text2, fontSize: 13 }} numberOfLines={3}>{n.body}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{timeAgo(n.created_at)}</Text>
              </View>
              {!n.is_read && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 6 }} />}
            </Pressable>
          );
        }} />
    </View>
  );
}
