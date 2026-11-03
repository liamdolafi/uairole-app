import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { supabase } from "./supabase";

export type PickedPhoto = { uri: string; width: number };

/** Pergunta se é câmera ou galeria e devolve a foto (ou null se cancelou) */
export function askPhotoSource(opts: { square?: boolean } = {}): Promise<PickedPhoto | null> {
  return new Promise((resolve) => {
    Alert.alert("Escolher foto", undefined, [
      { text: "Tirar foto", onPress: () => pickPhoto("camera", opts).then(resolve) },
      { text: "Da galeria", onPress: () => pickPhoto("galeria", opts).then(resolve) },
      { text: "Cancelar", style: "cancel", onPress: () => resolve(null) },
    ], { cancelable: true, onDismiss: () => resolve(null) });
  });
}

export async function pickPhoto(source: "camera" | "galeria", { square }: { square?: boolean } = {}): Promise<PickedPhoto | null> {
  const perm = source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(
      "Sem permissão",
      source === "camera"
        ? "Libera a câmera pro Uai Rolê nas configurações do celular."
        : "Libera as fotos pro Uai Rolê nas configurações do celular.",
    );
    return null;
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], allowsEditing: true, aspect: square ? [1, 1] : undefined, quality: 1 };
  const result = source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets?.[0]) return null;
  return { uri: result.assets[0].uri, width: result.assets[0].width };
}

/**
 * Diminui a foto (máx. 1600 px, JPEG) e envia pro Storage.
 * Os buckets do site aceitam até 5 MB e só JPG/PNG/WebP.
 * O caminho começa com o id do usuário (regra do banco).
 */
export async function uploadPhoto(bucket: "avatars" | "posts", userId: string, photo: PickedPhoto, maxSize = 1600) {
  const ctx = ImageManipulator.manipulate(photo.uri);
  if (photo.width > maxSize) ctx.resize({ width: maxSize });
  const ref = await ctx.renderAsync();
  const out = await ref.saveAsync({ compress: 0.75, format: SaveFormat.JPEG });
  const body = await (await fetch(out.uri)).arrayBuffer();
  if (body.byteLength > 5 * 1024 * 1024) throw new Error("A foto ficou maior que 5 MB. Tenta outra.");
  const path = `${userId}/${bucket === "avatars" ? "avatar-" : ""}${Date.now()}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType: "image/jpeg", upsert: bucket === "avatars" });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
