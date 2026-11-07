// Forgot password: mobile -> OTP on WhatsApp / SMS -> OTP + new password.
import { useState } from "react";
import { Button, Card, ErrorBox, Input, Muted, OkBox, PasswordInput, Screen, Strong } from "../../components/ui";
import { authApi } from "../../api/endpoints";
import { fieldErrors } from "../../api/client";
import { ENV } from "../../config/env";
import { useToast } from "../../components/Toast";
import { isMobile } from "../../utils/format";

export default function ForgotPasswordScreen({ navigation, route }) {
  const toast = useToast();
  const [mobile, setMobile] = useState(route.params?.mobile || "");
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [fe, setFe] = useState({});

  const send = async () => {
    if (!isMobile(mobile)) return setErr("Enter your 10-digit mobile number.");
    setBusy(true); setErr("");
    try { await authApi.forgot(mobile); setSent(true); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const reset = async () => {
    if (pw !== pw2) return setFe({ new_password2: "Both passwords must match." });
    setBusy(true); setErr(""); setFe({});
    try {
      await authApi.reset(mobile, otp, pw);
      toast.show("Password changed. Please log in.");
      navigation.goBack();
    } catch (e) { setFe(fieldErrors(e)); setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <Screen>
      {!sent ? (
        <Card>
          <Strong>Reset your password</Strong>
          <Muted>We'll send a {ENV.OTP_LENGTH}-digit OTP on WhatsApp and SMS to your registered mobile.</Muted>
          <Input label="Mobile number" value={mobile} onChangeText={(t) => setMobile(t.replace(/\D/g, "").slice(0, 10))} keyboardType="number-pad" placeholder="10-digit mobile" />
          <ErrorBox text={err} />
          <Button title="Send OTP" onPress={send} busy={busy} />
        </Card>
      ) : (
        <Card>
          <OkBox text={`OTP sent to ${mobile}`} />
          <Input label="OTP" value={otp} onChangeText={(t) => setOtp(t.replace(/\D/g, "").slice(0, 6))} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="sms-otp" placeholder="OTP" error={fe.otp} />
          <PasswordInput label="New password" value={pw} onChangeText={setPw} error={fe.new_password} hint="At least 8 characters, not only numbers" />
          <PasswordInput label="Confirm new password" value={pw2} onChangeText={setPw2} error={fe.new_password2} />
          <ErrorBox text={!Object.keys(fe).length ? err : ""} />
          <Button title="Set new password" onPress={reset} busy={busy} disabled={!otp || !pw || !pw2} />
          <Button title="Send OTP again" kind="ghost" onPress={send} />
        </Card>
      )}
    </Screen>
  );
}
