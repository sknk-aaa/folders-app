import { Platform } from 'react-native'

const REMINDER_NOTIFICATION_ID = 'tsundoku-weekly'

// expo-notifications is a native module. It only works in EAS builds and is
// not installed in Metro dev builds, so load it safely via dynamic import.
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
      name: 'Reading reminder',
      importance: N.AndroidImportance.DEFAULT,
    })
  }

  await N.scheduleNotificationAsync({
    identifier: REMINDER_NOTIFICATION_ID,
    content: {
      title: 'Thumbmark',
      body: `You have ${unreadCount} unread bookmarks. Want to check out the pages you haven't seen yet?`,
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
