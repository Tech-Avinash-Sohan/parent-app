// One conversation with a teacher. Refreshes every 10 s while open and when a chat push arrives.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { parentApi } from "../../api/endpoints";
import { ErrorState, Icon, Loading, Muted } from "../../components/ui";
import { qk } from "../../state/queryClient";
import { colors } from "../../theme";
import { fDate, fTime } from "../../utils/format";

export default function ChatThreadScreen({ route, navigation }) {
  const id = Number(route.params?.id);
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const list = useRef(null);
  useEffect(() => { if (route.params?.title) navigation.setOptions({ title: route.params.title }); }, [route.params?.title, navigation]);
  const q = useQuery({ queryKey: qk.messages(id), queryFn: () => parentApi.messages(id), refetchInterval: 10_000, enabled: !!id });
  useEffect(() => { if (q.data) qc.invalidateQueries({ queryKey: qk.chats }); }, [q.data?.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const m = useMutation({
    mutationFn: (t) => parentApi.sendMessage(id, t),
    onMutate: () => setText(""),
    onSuccess: (msg) => qc.setQueryData(qk.messages(id), (old = []) => [...old, msg]),
    onError: (_e, t) => setText(t),
  });
  const send = () => { const t = text.trim(); if (t && !m.isPending) m.mutate(t); };
  const data = q.data || [];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
      <ErrorState error={q.error || m.error} onRetry={q.refetch} />
      {q.isLoading ? <Loading /> : (
        <FlatList ref={list} data={data} keyExtractor={(x) => String(x.id)} contentContainerStyle={{ padding: 16, gap: 8 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<Muted style={{ textAlign: "center", marginTop: 24 }}>Say hello to start the conversation.</Muted>}
          renderItem={({ item: x, index }) => {
            const day = fDate(x.created_at);
            const showDay = index === 0 || fDate(data[index - 1].created_at) !== day;
            return (
              <View>
                {showDay && <Text style={{ textAlign: "center", color: colors.muted, fontSize: 12, marginVertical: 6 }}>{day}</Text>}
                <View style={{ alignSelf: x.is_mine ? "flex-end" : "flex-start", maxWidth: "82%", backgroundColor: x.is_mine ? colors.primary : "#fff",
                  borderRadius: 16, borderBottomRightRadius: x.is_mine ? 4 : 16, borderBottomLeftRadius: x.is_mine ? 16 : 4, padding: 12, borderWidth: x.is_mine ? 0 : 1, borderColor: colors.border }}>
                  {!x.is_mine && <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary, marginBottom: 2 }}>{x.sender_name}</Text>}
                  <Text style={{ color: x.is_mine ? "#fff" : colors.text, fontSize: 15 }}>{x.text}</Text>
                  <Text style={{ color: x.is_mine ? "#C7D2FE" : colors.muted, fontSize: 11, marginTop: 4, alignSelf: "flex-end" }}>
                    {fTime(x.created_at)}{x.is_mine && x.read_at ? " · Seen" : ""}
                  </Text>
                </View>
              </View>
            );
          }} />
      )}
      <View style={{ flexDirection: "row", gap: 8, padding: 10, paddingBottom: insets.bottom + 10, backgroundColor: "#fff", borderTopWidth: 1, borderColor: colors.border }}>
        <TextInput value={text} onChangeText={setText} placeholder="Write a message" placeholderTextColor={colors.muted} multiline accessibilityLabel="Message"
          style={{ flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingTop: 11, color: colors.text, fontSize: 15 }} />
        <Pressable onPress={send} disabled={!text.trim() || m.isPending} accessibilityRole="button" accessibilityLabel="Send"
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: text.trim() ? colors.primary : colors.border, alignItems: "center", justifyContent: "center", alignSelf: "flex-end" }}>
          <Icon name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
