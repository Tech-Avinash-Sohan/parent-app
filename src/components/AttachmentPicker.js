// "Attach photo / PDF" control: camera, gallery or file -> uploaded -> onChange(url).
import { useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View } from "react-native";
import { pickPdf, pickPhoto, takePhoto, upload } from "../services/files";
import { colors } from "../theme";
import { ErrorBox, Icon, Muted } from "./ui";

export default function AttachmentPicker({ label = "Attachment (optional)", value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const run = (fn) => async () => {
    setErr("");
    try {
      const f = await fn();
      if (!f) return;
      setBusy(true);
      const url = await upload(f);
      setName(f.name);
      onChange(url);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const opt = (icon, text, fn) => (
    <Pressable onPress={run(fn)} disabled={busy} accessibilityRole="button" accessibilityLabel={text}
      style={({ pressed }) => [{ flex: 1, alignItems: "center", gap: 6, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" }, pressed && { opacity: 0.7 }]}>
      <Icon name={icon} color={colors.primary} />
      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>{text}</Text>
    </Pressable>
  );
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text2 }}>{label}</Text>
      {value ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, backgroundColor: colors.successSoft }}>
          <Icon name="document-attach-outline" color={colors.success} />
          <Text style={{ flex: 1, color: colors.success, fontWeight: "600" }} numberOfLines={1}>{name || "File attached"}</Text>
          <Pressable onPress={() => { onChange(""); setName(""); }} hitSlop={10} accessibilityLabel="Remove attachment"><Icon name="close-circle" color={colors.success} /></Pressable>
        </View>
      ) : busy ? (
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center", padding: 12 }}><ActivityIndicator color={colors.primary} /><Muted>Uploading…</Muted></View>
      ) : (
        <View style={{ flexDirection: "row", gap: 8 }}>
          {Platform.OS !== "web" && opt("camera-outline", "Camera", takePhoto)}
          {opt("images-outline", "Gallery", pickPhoto)}
          {opt("document-outline", "PDF / file", pickPdf)}
        </View>
      )}
      <ErrorBox text={err} />
    </View>
  );
}
