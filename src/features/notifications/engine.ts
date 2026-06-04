import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

const REMINDER_CHANNEL_ID = 'tsundoku-reminder'
const REMINDER_NOTIFICATION_ID = 'tsundoku-weekly'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function requestNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync()
  if ((existing as { granted?: boolean }).granted) return true

  const result = await Notifications.requestPermissionsAsync()
  return (result as { granted?: boolean }).granted ?? false
}

export async function scheduleWeeklyReminder(unreadCount: number): Promise<void> {
  // 既存の通知をキャンセルしてから再スケジュール
  await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID).catch(() => {})

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: '積ん読リマインダー',
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_NOTIFICATION_ID,
    content: {
      title: 'サムネブクマ',
      body: `${unreadCount}件の積ん読があります。まだ見ていないページをチェックしませんか？`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 7 * 24 * 60 * 60, // 1週間
      repeats: true,
    },
  })
}

export async function cancelWeeklyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID).catch(() => {})
}
