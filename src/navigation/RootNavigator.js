// Signed out -> Login. Signed in -> instructions -> payment -> the app (bottom tabs + detail screens).
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HeaderBell from "../components/HeaderBell";
import { Button, Icon, Loading, Muted } from "../components/ui";
import { useAuth } from "../state/AuthProvider";
import { ChildProvider } from "../state/ChildProvider";
import { NotificationsProvider, useNotifications } from "../state/NotificationsProvider";
import { colors } from "../theme";

import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import InstructionsScreen from "../screens/onboarding/InstructionsScreen";
import PaymentScreen from "../screens/onboarding/PaymentScreen";
import HomeScreen from "../screens/home/HomeScreen";
import AcademicsScreen from "../screens/academics/AcademicsScreen";
import CalendarScreen from "../screens/academics/CalendarScreen";
import DiaryScreen from "../screens/academics/DiaryScreen";
import ExamsScreen from "../screens/academics/ExamsScreen";
import HomeworkScreen from "../screens/academics/HomeworkScreen";
import ReportCardScreen from "../screens/academics/ReportCardScreen";
import TimetableScreen from "../screens/academics/TimetableScreen";
import AttendanceScreen from "../screens/attendance/AttendanceScreen";
import LeaveApplyScreen from "../screens/attendance/LeaveApplyScreen";
import FeesScreen from "../screens/fees/FeesScreen";
import ReceiptScreen from "../screens/fees/ReceiptScreen";
import ChatsScreen from "../screens/chat/ChatsScreen";
import ChatThreadScreen from "../screens/chat/ChatThreadScreen";
import NewChatScreen from "../screens/chat/NewChatScreen";
import NotificationsScreen from "../screens/notifications/NotificationsScreen";
import NoticeDetailScreen from "../screens/notices/NoticeDetailScreen";
import NoticesScreen from "../screens/notices/NoticesScreen";
import CertificatesScreen from "../screens/more/CertificatesScreen";
import ChangePasswordScreen from "../screens/more/ChangePasswordScreen";
import ChildProfileScreen from "../screens/more/ChildProfileScreen";
import ComplaintsScreen from "../screens/more/ComplaintsScreen";
import ConsentScreen from "../screens/more/ConsentScreen";
import MeetingsScreen from "../screens/more/MeetingsScreen";
import MoreScreen from "../screens/more/MoreScreen";
import ProfileScreen from "../screens/more/ProfileScreen";
import SettingsScreen from "../screens/more/SettingsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const stackOpts = {
  headerTintColor: colors.text, headerTitleStyle: { fontWeight: "700" }, headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.bg }, contentStyle: { backgroundColor: colors.bg }, headerBackTitle: "Back",
};

function Tabs() {
  const insets = useSafeAreaInsets();
  const { unread } = useNotifications();
  const icon = (name) => {
    const TabIcon = ({ color, focused }) => <Icon name={focused ? name : `${name}-outline`} size={22} color={color} />;
    return TabIcon;
  };
  return (
    <Tab.Navigator screenOptions={{
      ...stackOpts, headerRight: () => <HeaderBell />,
      tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted,
      tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      tabBarStyle: { height: 62 + insets.bottom, paddingTop: 4, borderTopColor: colors.border },
      tabBarItemStyle: { paddingBottom: insets.bottom ? 0 : 6 },
    }}>
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: "Home", headerShown: false, tabBarIcon: icon("home") }} />
      <Tab.Screen name="AcademicsTab" component={AcademicsScreen} options={{ title: "Academics", tabBarIcon: icon("school") }} />
      <Tab.Screen name="FeesTab" component={FeesScreen} options={{ title: "Fees", tabBarIcon: icon("wallet") }} />
      <Tab.Screen name="ChatTab" component={ChatsScreen} options={{ title: "Chat", tabBarIcon: icon("chatbubbles") }} />
      <Tab.Screen name="MoreTab" component={MoreScreen} options={{ title: "More", tabBarIcon: icon("grid"), tabBarBadge: unread > 0 ? (unread > 99 ? "99+" : unread) : undefined }} />
    </Tab.Navigator>
  );
}

function ParentApp() {
  return (
    <ChildProvider>
      <NotificationsProvider>
        <Stack.Navigator screenOptions={stackOpts}>
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Attendance" component={AttendanceScreen} />
          <Stack.Screen name="LeaveApply" component={LeaveApplyScreen} options={{ title: "Apply leave" }} />
          <Stack.Screen name="Homework" component={HomeworkScreen} />
          <Stack.Screen name="Timetable" component={TimetableScreen} />
          <Stack.Screen name="Exams" component={ExamsScreen} options={{ title: "Exams & results" }} />
          <Stack.Screen name="ReportCard" component={ReportCardScreen} options={({ route }) => ({ title: route.params?.name || "Report card" })} />
          <Stack.Screen name="Diary" component={DiaryScreen} options={{ title: "Diary & material" }} />
          <Stack.Screen name="Calendar" component={CalendarScreen} options={{ title: "School calendar" }} />
          <Stack.Screen name="Receipt" component={ReceiptScreen} options={{ title: "Receipt" }} />
          <Stack.Screen name="Notices" component={NoticesScreen} />
          <Stack.Screen name="NoticeDetail" component={NoticeDetailScreen} options={{ title: "Notice" }} />
          <Stack.Screen name="NewChat" component={NewChatScreen} options={{ title: "New message" }} />
          <Stack.Screen name="ChatThread" component={ChatThreadScreen} options={({ route }) => ({ title: route.params?.title || "Chat" })} />
          <Stack.Screen name="Certificates" component={CertificatesScreen} />
          <Stack.Screen name="Meetings" component={MeetingsScreen} options={{ title: "Parent-teacher meetings" }} />
          <Stack.Screen name="Complaints" component={ComplaintsScreen} options={{ title: "Complaints & feedback" }} />
          <Stack.Screen name="Consent" component={ConsentScreen} options={{ title: "Permission slips" }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "My profile" }} />
          <Stack.Screen name="ChildProfile" component={ChildProfileScreen} options={{ title: "Child details" }} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: "Change password" }} />
        </Stack.Navigator>
      </NotificationsProvider>
    </ChildProvider>
  );
}

function StartupOffline() {
  const { refreshMe, signOut } = useAuth();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 14, backgroundColor: colors.bg }}>
      <Icon name="cloud-offline-outline" size={48} color={colors.muted} />
      <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>Can't reach the school server</Text>
      <Muted style={{ textAlign: "center" }}>Check your internet connection and try again.</Muted>
      <Button title="Try again" icon="refresh" onPress={() => refreshMe().catch(() => {})} style={{ alignSelf: "stretch" }} />
      <Button title="Log out" kind="ghost" onPress={signOut} style={{ alignSelf: "stretch" }} />
    </View>
  );
}

export default function RootNavigator() {
  const { ready, user, nextStep } = useAuth();
  if (!ready) return <View style={{ flex: 1, justifyContent: "center", backgroundColor: colors.bg }}><Loading /></View>;
  if (!user) {
    return (
      <Stack.Navigator screenOptions={stackOpts}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Forgot" component={ForgotPasswordScreen} options={{ title: "Forgot password" }} />
      </Stack.Navigator>
    );
  }
  if (user.offline) return <StartupOffline />;
  if (nextStep === "instructions") {
    return <Stack.Navigator screenOptions={{ ...stackOpts, headerShown: false }}><Stack.Screen name="Instructions" component={InstructionsScreen} /></Stack.Navigator>;
  }
  if (nextStep === "payment") {
    return <Stack.Navigator screenOptions={{ ...stackOpts, headerShown: false }}><Stack.Screen name="Payment" component={PaymentScreen} /></Stack.Navigator>;
  }
  if (nextStep === "parent_home") return <ParentApp />;
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12, backgroundColor: colors.bg }}>
      <Muted style={{ textAlign: "center" }}>This login can't use the Parent app{Platform.OS === "web" ? "" : " on this phone"}.</Muted>
      <LogoutButton />
    </View>
  );
}

function LogoutButton() {
  const { signOut } = useAuth();
  return <Button title="Log out" kind="ghost" onPress={signOut} />;
}
