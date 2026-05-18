import * as FileSystem from 'expo-file-system/legacy'
import * as ImageManipulator from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'

const FOLDER_THUMB_DIR = `${FileSystem.documentDirectory}folder-thumbnails/`

export async function pickAndSaveFolderThumbnail(folderId: string): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!perm.granted) return null

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [5, 3],
    quality: 1,
  })
  if (result.canceled || !result.assets[0]) return null

  await FileSystem.makeDirectoryAsync(FOLDER_THUMB_DIR, { intermediates: true })
  const ts = Date.now()
  const dest = `${FOLDER_THUMB_DIR}${folderId}-${ts}.jpg`

  const manipulated = await ImageManipulator.manipulateAsync(
    result.assets[0].uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
  )
  await FileSystem.moveAsync({ from: manipulated.uri, to: dest })
  return dest
}

export async function deleteFolderThumbnail(path: string): Promise<void> {
  await FileSystem.deleteAsync(path, { idempotent: true })
}
