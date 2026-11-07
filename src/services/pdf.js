// Download / share documents as PDF: fee receipts, report cards, certificates.
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { escapeHtml as e, fDate, inr } from "../utils/format";

const page = (title, body) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${e(title)}</title><style>
body{font-family:-apple-system,Roboto,Helvetica,Arial,sans-serif;color:#0F172A;padding:28px;max-width:720px;margin:auto}
h1{font-size:22px;margin:0}h2{font-size:16px;margin:4px 0 18px;color:#3446D6}.m{color:#475569;font-size:13px}
table{width:100%;border-collapse:collapse;margin-top:14px}th,td{border:1px solid #E2E8F0;padding:8px 10px;text-align:left;font-size:13px}
th{background:#3446D6;color:#fff}.r{text-align:right}.tot td{font-weight:700;background:#F1F4FB}.box{border:1px solid #E2E8F0;border-radius:10px;padding:12px;margin-top:14px}
.foot{margin-top:28px;font-size:11px;color:#94A3B8;text-align:center}</style></head><body>${body}
<div class="foot">Generated from the School ERP Parent app on ${fDate(new Date().toISOString())}</div></body></html>`;

export function receiptHtml(r, schoolName = "") {
  const lines = (r.lines || []).map((l) => `<tr><td>${e(l.head)}${l.installment ? ` · ${l.installment}` : ""}</td><td>${fDate(l.due_date)}</td><td class="r">${inr(l.amount)}</td></tr>`).join("");
  return page(`Receipt ${r.receipt_no}`, `
<h1>${e(schoolName)}</h1><h2>Fee receipt ${e(r.receipt_no)}</h2>
<div class="m">Date: ${fDate(r.paid_on)} · Mode: ${e(r.mode_display)}${r.reference ? ` · Ref: ${e(r.reference)}` : ""}</div>
<div class="box"><b>${e(r.student_name)}</b><br><span class="m">Adm. no ${e(r.admission_no)} · Class ${e(r.class_name)}</span></div>
<table><tr><th>Fee</th><th>Due date</th><th class="r">Amount</th></tr>${lines}
${Number(r.late_fee) > 0 ? `<tr><td colspan="2">Late fee</td><td class="r">${inr(r.late_fee)}</td></tr>` : ""}
<tr class="tot"><td colspan="2">Total paid</td><td class="r">${inr(r.amount)}</td></tr></table>`);
}

export function reportCardHtml(rc, schoolName = "") {
  const rows = (rc.subjects || []).map((s) => `<tr><td>${e(s.subject)}</td><td class="r">${s.is_absent ? "AB" : e(s.marks ?? "—")}</td><td class="r">${e(s.max_marks)}</td><td>${e(s.grade || "")}</td><td>${s.passed ? "Pass" : "Fail"}</td></tr>`).join("");
  return page(`Report card ${rc.exam}`, `
<h1>${e(schoolName)}</h1><h2>Report card · ${e(rc.exam)} · ${e(rc.academic_year)}</h2>
<div class="box"><b>${e(rc.student.name)}</b><br><span class="m">Class ${e(rc.student.class)}${rc.student.section ? `-${e(rc.student.section)}` : ""} · Roll ${e(rc.student.roll_no || "—")} · Adm. no ${e(rc.student.admission_no)}</span></div>
<table><tr><th>Subject</th><th class="r">Marks</th><th class="r">Out of</th><th>Grade</th><th>Result</th></tr>${rows}
<tr class="tot"><td>Total</td><td class="r">${e(rc.total)}</td><td class="r">${e(rc.max_total)}</td><td>${e(rc.grade || "")}</td><td>${e(rc.result || "")}</td></tr></table>
<div class="box">Percentage: <b>${rc.percentage != null ? `${e(rc.percentage)}%` : "—"}</b>${rc.remark ? `<br>Teacher's remark: ${e(rc.remark)}` : ""}</div>`);
}

/** Make a PDF from HTML and open the share sheet (save to Files, WhatsApp, print …). */
export async function sharePdf(html, fileTitle) {
  if (Platform.OS === "web") {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: fileTitle });
  } else {
    await Print.printAsync({ uri });
  }
}
