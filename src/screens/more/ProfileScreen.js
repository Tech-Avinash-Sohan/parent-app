// Edit my profile: name, e-mail, occupation, alternate mobile, address. Login mobile can't change here.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fieldErrors } from "../../api/client";
import { authApi, parentApi } from "../../api/endpoints";
import { useToast } from "../../components/Toast";
import { Button, Card, ErrorBox, ErrorState, Input, Loading, Muted, Screen } from "../../components/ui";
import { useAuth } from "../../state/AuthProvider";
import { qk } from "../../state/queryClient";
import { isMobile } from "../../utils/format";

export default function ProfileScreen({ navigation }) {
  const qc = useQueryClient();
  const toast = useToast();
  const { refreshMe } = useAuth();
  const q = useQuery({ queryKey: qk.profile, queryFn: parentApi.profile });
  const [f, setF] = useState(null);
  const [fe, setFe] = useState({});
  useEffect(() => {
    if (q.data && !f) {
      const d = q.data;
      setF({ first_name: d.first_name || "", last_name: d.last_name || "", email: d.email || "", occupation: d.occupation || "",
        alternate_mobile: d.alternate_mobile || "", address: d.address || "" });
    }
  }, [q.data, f]);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const m = useMutation({
    mutationFn: async () => {
      const { email, ...rest } = f;
      if (rest.alternate_mobile && !isMobile(rest.alternate_mobile)) throw Object.assign(new Error("Check the form."), { data: { alternate_mobile: ["Enter a valid 10-digit mobile number."] } });
      await parentApi.saveProfile(rest);
      if (email !== (q.data.email || "")) await authApi.updateMe({ email: email || null });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.profile });
      await refreshMe().catch(() => {});
      toast.show("Profile saved");
      navigation.goBack();
    },
    onError: (e) => setFe(fieldErrors(e)),
  });
  if (q.isLoading || (!f && !q.error)) return <Loading />;
  return (
    <Screen>
      <ErrorState error={q.error} onRetry={q.refetch} />
      {f && (
        <Card>
          <Input label="First name" value={f.first_name} onChangeText={set("first_name")} error={fe.first_name} />
          <Input label="Last name" value={f.last_name} onChangeText={set("last_name")} error={fe.last_name} />
          <Input label="Login mobile" value={q.data.mobile} editable={false} hint="To change the login mobile, contact the school office." />
          <Input label="E-mail" value={f.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" error={fe.email} hint="Receipts and results are also sent here" />
          <Input label="Alternate mobile" value={f.alternate_mobile} onChangeText={(t) => set("alternate_mobile")(t.replace(/\D/g, "").slice(0, 10))} keyboardType="number-pad" error={fe.alternate_mobile} />
          <Input label="Occupation" value={f.occupation} onChangeText={set("occupation")} error={fe.occupation} />
          <Input label="Address" value={f.address} onChangeText={set("address")} multiline error={fe.address} />
          <ErrorBox text={!Object.keys(fe).length ? m.error?.message : ""} />
          <Button title="Save" onPress={() => { setFe({}); m.mutate(); }} busy={m.isPending} disabled={!f.first_name.trim()} />
          <Muted>Your child's details (name, birth date, address in school records) are changed by the office – ask from the child's page.</Muted>
        </Card>
      )}
    </Screen>
  );
}
