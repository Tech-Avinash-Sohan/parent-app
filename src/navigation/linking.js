// Deep links: schoolerp-parent://notices/12, schoolerp-parent://chats/5, https links can be added in prefixes.
import * as Linking from "expo-linking";

export const linking = {
  prefixes: [Linking.createURL("/"), "schoolerp-parent://"],
  config: {
    screens: {
      Tabs: {
        screens: { HomeTab: "home", AcademicsTab: "academics", FeesTab: "fees", ChatTab: "chats", MoreTab: "more" },
      },
      Notifications: "notifications",
      Attendance: "attendance",
      Homework: "homework",
      Timetable: "timetable",
      Exams: "exams",
      ReportCard: "report-card/:exam",
      Notices: "notices",
      NoticeDetail: "notices/:id",
      ChatThread: "chats/:id",
      Certificates: "certificates",
      Meetings: "meetings",
      Complaints: "complaints",
      Consent: "consent",
      Calendar: "calendar",
      Settings: "settings",
      Login: "login",
    },
  },
};
