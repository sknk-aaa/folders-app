import * as FileSystem from 'expo-file-system/legacy'
import * as ImageManipulator from 'expo-image-manipulator'

const THUMB_ASPECT = 1 / 0.72

/**
 * OGP画像URLをダウンロードして1.4:1にセンタークロップし、thumbnailsディレクトリに保存する。
 * 成功時は保存先のローカルURIを返す。失敗時はnull。
 */
export async function downloadAndCropOgp(imageUrl: string): Promise<string | null> {
  try {
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}thumbnails/`, {
      intermediates: true,
    })
    const ts = Date.now()
    const tmpPath = `${FileSystem.documentDirectory}thumbnails/${ts}-raw.jpg`
    const dest = `${FileSystem.documentDirectory}thumbnails/${ts}.jpg`
    await FileSystem.downloadAsync(imageUrl, tmpPath)
    const info = await ImageManipulator.manipulateAsync(tmpPath, [], { base64: false })
    let cropW: number
    let cropH: number
    let originX: number
    let originY: number
    if (info.width / info.height > THUMB_ASPECT) {
      cropH = info.height
      cropW = cropH * THUMB_ASPECT
      originY = 0
      originX = (info.width - cropW) / 2
    } else {
      cropW = info.width
      cropH = cropW / THUMB_ASPECT
      originX = 0
      originY = (info.height - cropH) / 2
    }
    const result = await ImageManipulator.manipulateAsync(
      tmpPath,
      [{ crop: { originX, originY, width: cropW, height: cropH } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
    )
    await FileSystem.moveAsync({ from: result.uri, to: dest })
    await FileSystem.deleteAsync(tmpPath, { idempotent: true })
    return dest
  } catch {
    return null
  }
}
