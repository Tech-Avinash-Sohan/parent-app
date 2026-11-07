// Pick a photo (camera / gallery) or a PDF, then upload it to the backend (/uploads/) -> url.
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";
import { uploadsApi } from "../api/endpoints";

const MAX_MB = 5;

function fromAsset(a, fallbackName) {
  const name = a.fileName || a.name || fallbackName;
  return { uri: a.uri, name, mimeType: a.mimeType || (name.endsWith(".pdf") ? "application/pdf" : "image/jpeg"), size: a.fileSize || a.size, file: a.file };
}

export async function takePhoto() {
  if (Platform.OS !== "web") {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted) throw new Error("Camera permission is off. Turn it on in phone settings.");
  }
  const r = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7 });
  return r.canceled ? null : fromAsset(r.assets[0], `photo_${Date.now()}.jpg`);
}

export async function pickPhoto() {
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
  return r.canceled ? null : fromAsset(r.assets[0], `image_${Date.now()}.jpg`);
}

export async function pickPdf() {
  const r = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"], copyToCacheDirectory: true });
  return r.canceled ? null : fromAsset(r.assets[0], `file_${Date.now()}.pdf`);
}

export async function upload(file) {
  if (file.size && file.size > MAX_MB * 1024 * 1024) throw new Error(`File is too big (max ${MAX_MB} MB).`);
  const r = await uploadsApi.upload(file);
  return r.url;
}
