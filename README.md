# School ERP – Parent App (React Native + Expo SDK 54)

Android and iOS app for parents. It uses the existing Django backend (`/api/v1/...`) for everything:
login, yearly app payment, children, attendance, leave, homework (with photo upload), timetable, exams and report card (PDF),
fees with online payment and receipts (PDF), notices, chat with teachers, PTM booking, certificates (request + PDF),
complaints, permission slips, calendar, profile, change requests, and **push notifications** with history and unread badge.

## 1. Run it on your computer

```bash
npm install
cp .env.example .env                 # then edit EXPO_PUBLIC_API_URL
npx expo start                       # w = web (quick check), a = Android emulator, i = iOS simulator
```

- **Phone on the same Wi-Fi:** set `EXPO_PUBLIC_API_URL=http://<your-Mac-IP>:8000/api/v1` and run Django with `python manage.py runserver 0.0.0.0:8000`.
- **Live backend:** `EXPO_PUBLIC_API_URL=https://backend-drf-ygow.onrender.com/api/v1`.
- After changing `.env`, restart with `npx expo start -c`.

**Expo Go vs development build.** Expo Go is fine for most screens. Push notifications (Android) and the native Razorpay/UPI flow
need a **development build**, because Expo Go can't receive remote push on Android:

```bash
npm i -g eas-cli
eas login
eas init                             # creates the EAS project; copy the id into .env as EAS_PROJECT_ID
eas build --profile development --platform android     # install the APK on your phone
npx expo start --dev-client
```

## 2. Push notifications – one-time setup

The app gets an Expo push token, sends it to the backend (`POST /notifications/devices/`), and the backend sends through
Expo's push service (Android → FCM, iOS → APNs).

1. `eas init` → put the project id in `.env` / EAS env as `EAS_PROJECT_ID`.
2. **Android (FCM):**
   - In the Firebase console, add an Android app with package `com.schoolerp.parent` and download `google-services.json` into this folder.
   - Set `GOOGLE_SERVICES_JSON=./google-services.json` in `.env` (for EAS builds: `eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json`).
   - In Firebase, go to Project settings → Service accounts → **Generate new private key**.
   - Run `eas credentials` → Android → Google Service Account → **FCM V1** and upload that key.
3. **iOS (APNs):** `eas build -p ios` asks to create the push key automatically. Answer yes. An Apple Developer account is needed.
4. **Backend (Render):** set `PUSH_BACKEND=expo`. This is the default when `DEBUG=False`. Set `EXPO_ACCESS_TOKEN` only if you turn on
   "Enhanced push security" in Expo.
5. **Test:**
   - Log in on a real phone and allow notifications.
   - Mark the child absent from the Teacher app or the web panel. The parent gets "Aarav absent today", and tapping it opens Attendance.
   - Or send a test push from https://expo.dev/notifications using the token in the `device_token` table.

What sends a push (all saved in the in-app **Notifications** history):

| Event | Opens |
|---|---|
| Absent alert, leave approved/rejected | Attendance |
| Homework given | Homework |
| Result published | Exams & results |
| Fee receipt, fee reminder | Fees tab |
| Certificate ready | Certificates |
| Meeting booked/cancelled | Meetings |
| Notice published | That notice |
| Teacher chat message | That chat |

**How notifications behave:**
- **Foreground:** a banner shows while the app is open, and the lists on screen refresh.
- **Background / closed app:** tapping the notification opens the right screen and marks it read.
- **Badge:** the app icon badge and the bell / More tab show the unread count.

Deep links work too, for example `schoolerp-parent://notices/12`, `schoolerp-parent://chats/5` or `schoolerp-parent://fees`.

## 3. Build for the stores

```bash
eas build --profile preview --platform android       # APK to share for testing
eas build --profile production --platform android    # AAB for Google Play
eas build --profile production --platform ios        # for App Store / TestFlight
eas submit --platform android                        # or ios
```

Set production values in EAS (not in git):

```bash
eas env:create --environment production --name EXPO_PUBLIC_API_URL --value https://backend-drf-ygow.onrender.com/api/v1
eas env:create --environment production --name EAS_PROJECT_ID --value <id>
```

Change `ios.bundleIdentifier` / `android.package` in `app.config.js` (or `IOS_BUNDLE_ID` / `ANDROID_PACKAGE` env) to your own.
Version numbers are increased automatically (`autoIncrement` in `eas.json`).

## 4. Security
- Tokens are stored in the iOS Keychain or Android Keystore (`expo-secure-store`) and never in plain storage.
- An expired access token is refreshed once, automatically. If the refresh fails, the app logs out.
- If the backend answers 402 (yearly fee not paid), the app goes back to the payment screen.
- Teacher, school and admin logins are refused, because this app is for parents only.
- Logging out or changing the password removes this phone's push token from the server.

## 5. Project structure

```
App.js                         providers: safe area, React Query, auth, toasts, navigation (+ deep links)
app.config.js / eas.json       app config per environment, build profiles
src/config/env.js              API url, timeout, EAS project id
src/api/client.js              fetch wrapper: token, refresh, 401/402, timeout, offline, upload, errors
src/api/endpoints.js           every backend endpoint used
src/api/tokenStorage.js        secure token storage
src/state/                     AuthProvider, ChildProvider, NotificationsProvider, queryClient (cache + query keys)
src/services/                  push.js (Expo Notifications), pdf.js (receipts / report card / certificates), files.js (camera, gallery, PDF upload)
src/components/                ui kit, RazorpayPay, AttachmentPicker, ChildSwitcher, HeaderBell, Toast, OfflineBanner, ErrorBoundary
src/navigation/                RootNavigator (tabs: Home · Academics · Fees · Chat · More), linking, navigationRef
src/screens/                   auth, onboarding, home, academics, attendance, fees, chat, notices, notifications, more
```

## 6. Checks
```bash
npx expo lint
npx expo-doctor
```

## Not in this version
- **Bus tracking.** The backend has no transport or GPS module yet.
- **Marathi / Hindi screens.** The app is in English only.
- **OTP login.** Login is mobile number + password. OTP is used for "Forgot password".
