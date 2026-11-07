// Child chips (shown only when the parent has more than one child) + selected child line.
import { ScrollView, Text, View } from "react-native";
import { useChild } from "../state/ChildProvider";
import { colors } from "../theme";
import { Chip, ErrorState, Loading } from "./ui";

export const childLabel = (c) => (c ? `${c.full_name} · Class ${c.class_name}${c.section_name ? `-${c.section_name}` : ""}` : "");

export default function ChildSwitcher({ compact }) {
  const { children, child, setChildId, error, reload, loading } = useChild();
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading || !children) return <Loading />;
  if (!children.length) return <ErrorState error={{ message: "No child is linked to this login yet. Please contact the school office." }} />;
  return (
    <View style={{ gap: 6 }}>
      {children.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {children.map((c) => <Chip key={c.id} text={c.first_name} active={c.id === child?.id} onPress={() => setChildId(c.id)} />)}
        </ScrollView>
      )}
      {!compact && child && <Text style={{ color: colors.text2, fontSize: 13 }}>{childLabel(child)}</Text>}
    </View>
  );
}
