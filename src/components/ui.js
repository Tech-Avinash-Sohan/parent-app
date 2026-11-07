// Reusable UI building blocks (same look on Android and iOS).
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadow, type } from "../theme";
import { addDays, fDate } from "../utils/format";

export const Icon = ({ name, size = 20, color = colors.text }) => <Ionicons name={name} size={size} color={color} />;

/** Scrolling page with pull-to-refresh and keyboard handling. */
export function Screen({ children, onRefresh, refreshing = false, padded = true, header, footer, scroll = true }) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[padded && styles.pad, { paddingBottom: 40 }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} /> : undefined}>
      {children}
    </ScrollView>
  ) : <View style={[{ flex: 1 }, padded && styles.pad]}>{children}</View>;
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {header}
      {body}
      {footer}
    </KeyboardAvoidingView>
  );
}

/** Blue rounded page header used on Home. */
export function Hero({ overline, title, right, children }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.hero, { paddingTop: insets.top + 14 }]}>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          {!!overline && <Text style={styles.heroOver}>{overline}</Text>}
          <Text style={styles.heroTitle} numberOfLines={1}>{title}</Text>
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

export const Card = ({ children, style, onPress, accessibilityLabel }) =>
  onPress ? (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress}
      style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.85 }]}>{children}</Pressable>
  ) : <View style={[styles.card, style]}>{children}</View>;

export function Button({ title, onPress, kind = "primary", disabled, busy, small, icon, style, testID }) {
  const bg = { primary: colors.primary, danger: colors.danger, success: colors.success, ghost: "#fff", soft: colors.primarySoft }[kind];
  const fg = kind === "ghost" ? colors.text : kind === "soft" ? colors.primary : "#fff";
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={title} disabled={disabled || busy} onPress={onPress}
      style={({ pressed }) => [styles.btn, small && styles.btnSmall, { backgroundColor: bg },
        kind === "ghost" && { borderWidth: 1, borderColor: colors.border }, (disabled || busy) && { opacity: 0.5 }, pressed && { opacity: 0.8 }, style]}>
      {busy ? <ActivityIndicator color={fg} /> : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {icon && <Icon name={icon} size={small ? 16 : 18} color={fg} />}
          <Text style={{ color: fg, fontWeight: "700", fontSize: small ? 13 : 15 }}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Input({ label, error, hint, style, box, multiline, right, ...rest }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={[{ gap: 6 }, box]}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.input, multiline && { minHeight: 96, alignItems: "flex-start" }, focus && { borderColor: colors.primary }, error && { borderColor: colors.danger }]}>
        <TextInput placeholderTextColor={colors.muted} multiline={multiline} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={[{ flex: 1, fontSize: 15, color: colors.text, paddingVertical: multiline ? 12 : 0 }, multiline && { textAlignVertical: "top" }, style]}
          accessibilityLabel={label} {...rest} />
        {right}
      </View>
      {error ? <Text style={styles.err}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function PasswordInput(props) {
  const [show, setShow] = useState(false);
  return (
    <Input {...props} secureTextEntry={!show} autoCapitalize="none" autoCorrect={false}
      right={<Pressable onPress={() => setShow((x) => !x)} hitSlop={10} accessibilityLabel={show ? "Hide password" : "Show password"}>
        <Icon name={show ? "eye-off-outline" : "eye-outline"} color={colors.muted} /></Pressable>} />
  );
}

/** Pick one value from a bottom sheet. options: [{value, label}] */
export function Select({ label, value, options = [], onChange, placeholder = "Choose…", error }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const cur = options.find((o) => String(o.value) === String(value));
  return (
    <View style={{ gap: 6 }}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={label || placeholder}
        style={[styles.input, error && { borderColor: colors.danger }]}>
        <Text style={{ flex: 1, color: cur ? colors.text : colors.muted, fontSize: 15 }} numberOfLines={1}>{cur ? cur.label : placeholder}</Text>
        <Icon name="chevron-down" size={18} color={colors.muted} />
      </Pressable>
      {!!error && <Text style={styles.err}>{error}</Text>}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.sheetBack} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={type.h3}>{label || placeholder}</Text>
          <FlatList data={options} keyExtractor={(o) => String(o.value)} style={{ maxHeight: 420 }}
            ListEmptyComponent={<Text style={styles.hint}>Nothing to choose.</Text>}
            renderItem={({ item }) => (
              <Pressable onPress={() => { onChange(item.value); setOpen(false); }}
                style={[styles.option, String(item.value) === String(value) && { backgroundColor: colors.primarySoft }]}>
                <Text style={{ fontSize: 15, color: colors.text, flex: 1 }}>{item.label}</Text>
                {String(item.value) === String(value) && <Icon name="checkmark" color={colors.primary} />}
              </Pressable>
            )} />
          <Button title="Close" kind="ghost" onPress={() => setOpen(false)} />
        </View>
      </Modal>
    </View>
  );
}

/** YYYY-MM-DD with ‹ › buttons (works the same everywhere, no native date picker needed). */
export function DateField({ label, value, onChange, min, max }) {
  const prevOff = min && value <= min;
  const nextOff = max && value >= max;
  return (
    <View style={{ gap: 6 }}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.input, styles.rowBetween]}>
        <Pressable disabled={prevOff} onPress={() => onChange(addDays(value, -1))} hitSlop={12} accessibilityLabel={`${label || "Date"} previous day`}>
          <Icon name="chevron-back" color={prevOff ? colors.border : colors.primary} />
        </Pressable>
        <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{fDate(value)}</Text>
        <Pressable disabled={nextOff} onPress={() => onChange(addDays(value, 1))} hitSlop={12} accessibilityLabel={`${label || "Date"} next day`}>
          <Icon name="chevron-forward" color={nextOff ? colors.border : colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const TONES = {
  success: [colors.successSoft, colors.success], danger: [colors.dangerSoft, colors.danger], warning: [colors.warningSoft, colors.warning],
  info: [colors.infoSoft, colors.info], purple: [colors.purpleSoft, colors.purple], neutral: ["#EEF2F7", colors.text2],
};
export const Badge = ({ text, tone = "neutral" }) => (
  <View style={[styles.badge, { backgroundColor: TONES[tone][0] }]}><Text style={{ color: TONES[tone][1], fontSize: 12, fontWeight: "700" }}>{text}</Text></View>
);

export const Chip = ({ text, active, onPress }) => (
  <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!active }}
    style={[styles.chip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
    <Text style={{ color: active ? "#fff" : colors.text, fontWeight: "600", fontSize: 13 }}>{text}</Text>
  </Pressable>
);

export const Segments = ({ items, value, onChange }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
    {items.map(([k, l]) => <Chip key={k} text={l} active={value === k} onPress={() => onChange(k)} />)}
  </ScrollView>
);

export const Title = ({ children, right }) => (
  <View style={[styles.rowBetween, { marginTop: 6 }]}><Text style={type.h3}>{children}</Text>{right}</View>
);
export const Muted = ({ children, style, numberOfLines }) => <Text numberOfLines={numberOfLines} style={[type.small, style]}>{children}</Text>;
export const Strong = ({ children, style, numberOfLines }) => <Text numberOfLines={numberOfLines} style={[{ color: colors.text, fontSize: 15, fontWeight: "700" }, style]}>{children}</Text>;
export const Row = ({ children, style }) => <View style={[styles.rowBetween, style]}>{children}</View>;

export const Loading = ({ text }) => (
  <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" />{!!text && <Muted>{text}</Muted>}</View>
);

export const Empty = ({ icon = "file-tray-outline", text = "Nothing here yet.", action }) => (
  <View style={styles.center}>
    <View style={styles.emptyIcon}><Icon name={icon} size={28} color={colors.muted} /></View>
    <Muted style={{ textAlign: "center" }}>{text}</Muted>
    {action}
  </View>
);

/** Error with a Retry button (for failed loads). */
export function ErrorState({ error, onRetry }) {
  if (!error) return null;
  return (
    <View style={styles.errBox}>
      <Icon name={error.network ? "cloud-offline-outline" : "alert-circle-outline"} color={colors.danger} />
      <Text style={{ color: colors.danger, flex: 1 }}>{error.message || String(error)}</Text>
      {onRetry && <Pressable onPress={onRetry} hitSlop={8}><Text style={{ color: colors.danger, fontWeight: "700" }}>Retry</Text></Pressable>}
    </View>
  );
}
export const ErrorBox = ({ text }) => (text ? (
  <View style={styles.errBox}><Icon name="alert-circle-outline" color={colors.danger} /><Text style={{ color: colors.danger, flex: 1 }}>{text}</Text></View>
) : null);
export const OkBox = ({ text }) => (text ? (
  <View style={[styles.errBox, { backgroundColor: colors.successSoft }]}><Icon name="checkmark-circle" color={colors.success} /><Text style={{ color: colors.success, fontWeight: "600", flex: 1 }}>{text}</Text></View>
) : null);

/** Square shortcut tile on Home / Academics. */
export function Tile({ label, note, icon, color = colors.primarySoft, ink = colors.primary, onPress, badge }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.8 }]}>
      <View style={[styles.tileIcon, { backgroundColor: color }]}><Icon name={icon} size={20} color={ink} /></View>
      <Text style={{ fontWeight: "700", fontSize: 14, color: colors.text }} numberOfLines={1}>{label}</Text>
      {!!note && <Text style={{ fontSize: 12, color: colors.text2 }} numberOfLines={1}>{note}</Text>}
      {!!badge && <View style={styles.tileBadge}><Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>{badge}</Text></View>}
    </Pressable>
  );
}
export const TileGrid = ({ children }) => <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>{children}</View>;

export function ListItem({ title, subtitle, right, onPress, icon, iconColor = colors.primary, iconBg = colors.primarySoft, chevron = !!onPress }) {
  return (
    <Card onPress={onPress} accessibilityLabel={title} style={{ paddingVertical: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {icon && <View style={[styles.liIcon, { backgroundColor: iconBg }]}><Icon name={icon} size={18} color={iconColor} /></View>}
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", fontSize: 15, color: colors.text }} numberOfLines={2}>{title}</Text>
          {!!subtitle && <Text style={{ color: colors.text2, fontSize: 13, marginTop: 2 }} numberOfLines={2}>{subtitle}</Text>}
        </View>
        {right}
        {chevron && <Icon name="chevron-forward" size={18} color={colors.muted} />}
      </View>
    </Card>
  );
}

export const Avatar = ({ text, size = 40, bg = colors.primarySoft, fg = colors.primary }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
    <Text style={{ color: fg, fontWeight: "800", fontSize: size * 0.36 }}>{text}</Text>
  </View>
);

export const Divider = () => <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />;

export const styles = StyleSheet.create({
  pad: { padding: 16, gap: 12 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 32, gap: 10 },
  hero: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, gap: 10 },
  heroOver: { color: "#C7D2FE", fontSize: 13 },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "800" },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: 16, gap: 8, borderWidth: 1, borderColor: "#EEF1F6", ...shadow },
  btn: { minHeight: 50, borderRadius: radius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  btnSmall: { minHeight: 38, paddingHorizontal: 12, borderRadius: 10 },
  label: { fontSize: 13, fontWeight: "600", color: colors.text2 },
  input: { minHeight: 50, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: "#fff", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8 },
  err: { color: colors.danger, fontSize: 12 },
  hint: { color: colors.muted, fontSize: 12 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  errBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.dangerSoft, padding: 12, borderRadius: 12 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#EEF2F7", alignItems: "center", justifyContent: "center" },
  tile: { width: "47.8%", backgroundColor: "#fff", borderRadius: radius.md, padding: 14, gap: 6, borderWidth: 1, borderColor: "#EEF1F6", ...shadow },
  tileIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  tileBadge: { position: "absolute", top: 10, right: 10, backgroundColor: colors.danger, borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  liIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sheetBack: { flex: 1, backgroundColor: "rgba(15,23,42,0.4)" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 },
  option: { paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, flexDirection: "row", alignItems: "center" },
});
