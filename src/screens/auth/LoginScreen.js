// Login with the mobile number given to the school + password (sent on WhatsApp at admission).
import { useState } from "react";
import { Image, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, ErrorBox, Input, PasswordInput, Screen } from "../../components/ui";
import { ENV, IS_DEV } from "../../config/env";
import { useAuth } from "../../state/AuthProvider";
import { colors } from "../../theme";
import { isMobile } from "../../utils/format";

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [touched, setTouched] = useState(false);
  const mobileErr = touched && !isMobile(mobile) ? "Enter your 10-digit mobile number." : "";

  const submit = async () => {
    setTouched(true);
    if (!isMobile(mobile) || !password) return;
    setBusy(true); setErr("");
    try { await signIn(mobile.trim(), password); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <Screen padded={false}>
      <View style={{ backgroundColor: colors.primary, paddingTop: insets.top + 48, paddingBottom: 40, paddingHorizontal: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, gap: 10 }}>
        <Image source={require("../../../assets/icon.png")} style={{ width: 64, height: 64, borderRadius: 18 }} accessibilityIgnoresInvertColors />
        <Text style={{ color: "#fff", fontSize: 30, fontWeight: "800" }}>Parent App</Text>
        <Text style={{ color: "#E0E7FF", fontSize: 15 }}>Attendance, homework, fees and results of your child – in one place.</Text>
      </View>
      <View style={{ padding: 20, gap: 14 }}>
        <Input testID="mobile" label="Mobile number" value={mobile} onChangeText={(t) => setMobile(t.replace(/\D/g, "").slice(0, 10))}
          keyboardType="number-pad" textContentType="telephoneNumber" autoComplete="tel" placeholder="10-digit mobile" error={mobileErr} returnKeyType="next" />
        <PasswordInput testID="password" label="Password" value={password} onChangeText={setPassword} placeholder="Password from WhatsApp / SMS"
          textContentType="password" autoComplete="password" onSubmitEditing={submit} returnKeyType="go" />
        <ErrorBox text={err} />
        <Button testID="login" title="Log in" onPress={submit} busy={busy} disabled={!mobile || !password} />
        <Button title="Forgot password?" kind="ghost" onPress={() => navigation.navigate("Forgot", { mobile })} />
        <Text style={{ textAlign: "center", color: colors.muted, fontSize: 12, marginTop: 8 }}>
          Your login was sent on WhatsApp when your child was admitted.{IS_DEV ? `\n${ENV.API_URL}` : ""}
        </Text>
      </View>
    </Screen>
  );
}
