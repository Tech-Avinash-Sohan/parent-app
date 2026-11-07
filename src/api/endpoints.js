// Every backend endpoint the Parent app uses (Django: apps/authentication, apps/parent_app, apps/notifications, uploads).
import { api } from "./client";
import { tokenStorage } from "./tokenStorage";

export const authApi = {
  async login(mobile, password) {
    const d = await api.post("/auth/login/", { mobile, password }, { auth: false });
    await tokenStorage.save(d);
    return d;
  },
  me: () => api.get("/auth/me/"),
  updateMe: (body) => api.patch("/auth/me/", body),
  forgot: (mobile) => api.post("/auth/password/forgot/", { mobile }, { auth: false }),
  reset: (mobile, otp, new_password) => api.post("/auth/password/reset/", { mobile, otp, new_password }, { auth: false }),
  changePassword: (old_password, new_password) => api.post("/auth/password/change/", { old_password, new_password }),
  async logout() {
    try { await api.post("/auth/logout/", {}); } catch { /* token may already be dead */ }
    await tokenStorage.clear();
  },
};

export const parentApi = {
  // onboarding + yearly payment (allowed before payment)
  onboarding: () => api.get("/parent/onboarding/"),
  accept: () => api.post("/parent/onboarding/accept/"),
  paymentStatus: () => api.get("/parent/payment/"),
  createOrder: () => api.post("/parent/payment/create-order/"),
  verifyPayment: (body) => api.post("/parent/payment/verify/", body),
  profile: () => api.get("/parent/profile/"),
  saveProfile: (body) => api.patch("/parent/profile/", body),
  // after payment
  home: () => api.get("/parent/home/"),
  children: () => api.get("/parent/children/"),
  child: (id) => api.get(`/parent/children/${id}/`),
  attendance: (id, month) => api.get(`/parent/children/${id}/attendance/`, { month }),
  leaves: (id) => api.get(`/parent/children/${id}/leaves/`),
  applyLeave: (id, body) => api.post(`/parent/children/${id}/leaves/`, body),
  timetable: (id, date) => api.get(`/parent/children/${id}/timetable/`, { date }),
  homework: (id) => api.get(`/parent/children/${id}/homework/`),
  submitHomework: (submissionId, body) => api.post(`/parent/homework/${submissionId}/submit/`, body),
  diary: (id) => api.get(`/parent/children/${id}/diary/`),
  materials: (id) => api.get(`/parent/children/${id}/materials/`),
  notes: (id) => api.get(`/parent/children/${id}/notes/`),
  exams: (id) => api.get(`/parent/children/${id}/exams/`),
  reportCard: (id, examId) => api.get(`/parent/children/${id}/report-card/${examId}/`),
  fees: (id) => api.get(`/parent/children/${id}/fees/`),
  payFees: (id, student_fee_ids) => api.post(`/parent/children/${id}/fees/pay/`, student_fee_ids?.length ? { student_fee_ids } : {}),
  verifyFees: (body) => api.post("/parent/fees/verify/", body),
  teachers: (id) => api.get(`/parent/children/${id}/teachers/`),
  certificates: (id) => api.get(`/parent/children/${id}/certificates/`),
  requestCertificate: (id, certificate_type, purpose) => api.post(`/parent/children/${id}/certificates/`, { certificate_type, purpose }),
  certificateHtml: (id, certId) => api.html(`/parent/children/${id}/certificates/${certId}/print/`),
  changeRequests: (id) => api.get(`/parent/children/${id}/change-requests/`),
  requestChange: (id, body) => api.post(`/parent/children/${id}/change-requests/`, body),
  calendar: (child) => api.get("/parent/calendar/", { child }),
  notices: () => api.get("/parent/notices/"),
  readNotice: (id) => api.post(`/parent/notices/${id}/read/`),
  chats: () => api.get("/parent/chats/"),
  startChat: (body) => api.post("/parent/chats/", body),
  messages: (threadId) => api.get(`/parent/chats/${threadId}/messages/`),
  sendMessage: (threadId, text) => api.post(`/parent/chats/${threadId}/messages/`, { text }),
  meetings: (child) => api.get("/parent/meetings/", { child }),
  bookMeeting: (slotId, child, agenda) => api.post(`/parent/meetings/${slotId}/book/`, { child, agenda }),
  complaints: () => api.get("/parent/complaints/"),
  complain: (body) => api.post("/parent/complaints/", body),
  consentForms: () => api.get("/parent/consent-forms/"),
  answerConsent: (body) => api.post("/parent/consent-forms/", body),
};

export const notificationsApi = {
  registerDevice: (token, platform) => api.post("/notifications/devices/", { token, platform, app: "parent" }),
  unregisterDevice: (token) => api.post("/notifications/devices/unregister/", { token }),
  inbox: (page = 1) => api.get("/notifications/inbox/", { page }),
  unreadCount: () => api.get("/notifications/inbox/unread-count/"),
  read: (id) => api.post(`/notifications/inbox/${id}/read/`),
  readAll: () => api.post("/notifications/inbox/read-all/"),
};

export const uploadsApi = { upload: (file) => api.upload(file) };
