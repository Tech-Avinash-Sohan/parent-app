// Razorpay Checkout for an order created by our API (yearly Parent app fee or school fees).
// - Test mode (server has no Razorpay keys, key_id "rzp_dev_mode"): "test payment" button, signature "dev".
// - Android / iOS: checkout inside a WebView; UPI app links (upi://, intent://) open the UPI app.
// - Web: loads checkout.js.
import { useState } from "react";
import { Linking, Modal, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme";
import { Button, Icon, Muted } from "./ui";

const checkoutOptions = (o) => ({
  key: o.key_id, order_id: o.order_id, amount: o.amount_paise || o.amount, currency: o.currency || "INR",
  name: o.name || "School ERP", description: o.description || "Payment", prefill: o.prefill || {}, theme: { color: colors.primary },
});

const html = (o) => `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<script src="https://checkout.razorpay.com/v1/checkout.js"></script></head>
<body style="font-family:-apple-system,Roboto,sans-serif;padding:24px;color:#475569">Opening secure payment…<script>
var post = function (m) { window.ReactNativeWebView.postMessage(JSON.stringify(m)); };
var opts = ${JSON.stringify(checkoutOptions(o))};
opts.handler = function (r) { post(r); };
opts.modal = { ondismiss: function () { post({ cancel: true }); } };
var rzp = new Razorpay(opts);
rzp.on("payment.failed", function (r) { post({ error: (r.error && r.error.description) || "Payment failed" }); });
rzp.open();
</script></body></html>`;

function loadScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Could not load Razorpay. Check your internet."));
    document.body.appendChild(s);
  });
}

export default function RazorpayPay({ order, title, onSuccess, onError, onCancel, busy }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const dev = order.dev_mode || order.key_id === "rzp_dev_mode";
  const finish = (r) => onSuccess({
    razorpay_order_id: r.razorpay_order_id || order.order_id, razorpay_payment_id: r.razorpay_payment_id, razorpay_signature: r.razorpay_signature,
  });

  if (dev) {
    return (
      <View style={{ gap: 8 }}>
        <Button title={title} icon="card-outline" busy={busy} onPress={() => finish({ razorpay_payment_id: `pay_test_${Date.now()}`, razorpay_signature: "dev" })} />
        <Muted style={{ textAlign: "center" }}>Test mode – the server has no Razorpay keys yet, so no money is taken.</Muted>
      </View>
    );
  }

  if (Platform.OS === "web") {
    const openWeb = async () => {
      try {
        await loadScript();
        const rzp = new window.Razorpay({ ...checkoutOptions(order), handler: finish, modal: { ondismiss: () => onCancel?.() } });
        rzp.on("payment.failed", (r) => onError?.(r.error?.description || "Payment failed"));
        rzp.open();
      } catch (e) { onError?.(e.message); }
    };
    return <Button title={title} icon="card-outline" busy={busy} onPress={openWeb} />;
  }

  const { WebView } = require("react-native-webview");
  return (
    <>
      <Button title={title} icon="card-outline" busy={busy} onPress={() => setOpen(true)} />
      <Modal visible={open} animationType="slide" onRequestClose={() => { setOpen(false); onCancel?.(); }}>
        <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: "#fff" }}>
          <View style={{ flexDirection: "row", alignItems: "center", padding: 12, gap: 10, borderBottomWidth: 1, borderColor: colors.border }}>
            <Pressable onPress={() => { setOpen(false); onCancel?.(); }} hitSlop={10} accessibilityLabel="Close payment"><Icon name="close" size={24} /></Pressable>
            <Text style={{ fontWeight: "700", fontSize: 16 }}>Secure payment · Razorpay</Text>
          </View>
          <WebView originWhitelist={["*"]} source={{ html: html(order), baseUrl: "https://checkout.razorpay.com" }} javaScriptEnabled
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={(req) => {
              if (/^(upi|intent|phonepe|paytmmp|tez|gpay|credpay):/i.test(req.url)) { Linking.openURL(req.url).catch(() => onError?.("No UPI app found on this phone.")); return false; }
              return true;
            }}
            onMessage={(e) => {
              let r = {};
              try { r = JSON.parse(e.nativeEvent.data); } catch { return; }
              setOpen(false);
              if (r.razorpay_payment_id) finish(r);
              else if (r.error) onError?.(r.error);
              else onCancel?.();
            }} />
        </View>
      </Modal>
    </>
  );
}
