import { Platform } from 'react-native'

const REMINDER_NOTIFICATION_ID = 'tsundoku-weekly'

// expo-notificationsはネイティブモジュール。EASビルドでのみ動作し、
// Metroのdev buildでは未インストールのため動的インポートで安全にロード。
async function getNotifications() {
  try {
    return await import('expo-notifications')
  } catch {
    return null
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const N = await getNotifications()
  if (!N) return false
  const existing = await N.getPermissionsAsync()
  if ((existing as { granted?: boolean }).granted) return true
  const result = await N.requestPermissionsAsync()
  return (result as { granted?: boolean }).granted ?? false
}

export async function scheduleWeeklyReminder(unreadCount: number): Promise<void> {
  const N = await getNotifications()
  if (!N) return

  await N.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID).catch(() => {})

  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('tsundoku-reminder', {
      name: '積ん読リマインダー',
      importance: N.AndroidImportance.DEFAULT,
    })
  }

  await N.scheduleNotificationAsync({
    identifier: REMINDER_NOTIFICATION_ID,
    content: {
      title: 'サムネブクマ',
      body: `${unreadCount}件の積ん読があります。まだ見ていないページをチェックしませんか？`,
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 7 * 24 * 60 * 60,
      repeats: true,
    },
  })
}

export async function cancelWeeklyReminder(): Promise<void> {
  const N = await getNotifications()
  if (!N) return
  await N.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID).catch(() => {})
}
