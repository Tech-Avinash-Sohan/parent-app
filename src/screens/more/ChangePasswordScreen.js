// Change password. The server logs out every device afterwards, so the parent logs in again.
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { fieldErrors } from "../../api/client";
import { authApi } from "../../api/endpoints";
import { tokenStorage } from "../../api/tokenStorage";
import { useToast } from "../../components/Toast";
import { Button, Card, ErrorBox, Muted, PasswordInput, Screen } from "../../components/ui";
import { unregisterPush } from "../../services/push";
import { useAuth } from "../../state/AuthProvider";

export default function ChangePasswordScreen() {
  const { signOut } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ old: "", pw: "", pw2: "" });
  const [fe, setFe] = useState({});
  const m = useMutation({
    mutationFn: async () => {
      if (f.pw !== f.pw2) throw Object.assign(new Error("Both new passwords must match."), { data: { new_password2: ["Both new passwords must match."] } });
      await unregisterPush();
      await authApi.changePassword(f.old, f.pw);
    },
    onSuccess: async () => {
      toast.show("Password changed. Please log in with the new password.");
      await tokenStorage.clear();
      signOut();
    },
    onError: (e) => setFe(fieldErrors(e)),
  });
  return (
    <Screen>
      <Card>
        <PasswordInput label="Current password" value={f.old} onChangeText={(v) => setF({ ...f, old: v })} error={fe.old_password} />
        <PasswordInput label="New password" value={f.pw} onChangeText={(v) => setF({ ...f, pw: v })} error={fe.new_password} hint="At least 8 characters, not only numbers" />
        <PasswordInput label="Confirm new password" value={f.pw2} onChangeText={(v) => setF({ ...f, pw2: v })} error={fe.new_password2} />
        <ErrorBox text={!Object.keys(fe).length ? m.error?.message : ""} />
        <Button title="Change password" onPress={() => { setFe({}); m.mutate(); }} busy={m.isPending} disabled={!f.old || !f.pw || !f.pw2} />
        <Muted>You will be logged out on all phones and need to log in again.</Muted>
      </Card>
    </Screen>
  );
}
