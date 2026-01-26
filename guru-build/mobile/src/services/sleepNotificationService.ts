import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { usePreferencesStore } from '../store/usePreferencesStore';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Notification identifiers for managing scheduled notifications
const BEDTIME_REMINDER_ID = 'bedtime-reminder';
const WAKEUP_ALARM_ID_PREFIX = 'wakeup-alarm-';

// Weekday indices (Sunday = 0, Monday = 1, ..., Saturday = 6)
const WEEKDAYS = [1, 2, 3, 4, 5]; // Monday through Friday

interface TimeComponents {
  hours: number;
  minutes: number;
}

/**
 * Parse time string like "10:00 PM" or "7:30 AM" to hours and minutes
 */
function parseTimeString(timeStr: string): TimeComponents | null {
  if (!timeStr) return null;

  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  // Convert to 24-hour format
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Cancel all sleep-related notifications
 */
export async function cancelAllSleepNotifications(): Promise<void> {
  // Cancel bedtime reminder
  await Notifications.cancelScheduledNotificationAsync(BEDTIME_REMINDER_ID).catch(() => {});

  // Cancel all weekday wake-up alarms
  for (const day of WEEKDAYS) {
    await Notifications.cancelScheduledNotificationAsync(`${WAKEUP_ALARM_ID_PREFIX}${day}`).catch(() => {});
  }
}

/**
 * Schedule a bedtime reminder notification 30 minutes before the specified bed time
 * This notification repeats daily
 */
export async function scheduleBedtimeReminder(bedTimeStr: string): Promise<boolean> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.warn('Notification permissions not granted');
    return false;
  }

  const bedTime = parseTimeString(bedTimeStr);
  if (!bedTime) {
    console.error('Invalid bed time format:', bedTimeStr);
    return false;
  }

  // Calculate 30 minutes before bedtime
  let reminderHours = bedTime.hours;
  let reminderMinutes = bedTime.minutes - 30;

  if (reminderMinutes < 0) {
    reminderMinutes += 60;
    reminderHours -= 1;
    if (reminderHours < 0) {
      reminderHours = 23;
    }
  }

  // Cancel existing bedtime reminder
  await Notifications.cancelScheduledNotificationAsync(BEDTIME_REMINDER_ID).catch(() => {});

  // Schedule daily bedtime reminder
  await Notifications.scheduleNotificationAsync({
    identifier: BEDTIME_REMINDER_ID,
    content: {
      title: 'Bedtime Reminder',
      body: `Time to start winding down! Your bedtime is in 30 minutes at ${bedTimeStr}.`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: reminderHours,
      minute: reminderMinutes,
    },
  });

  console.log(`Bedtime reminder scheduled for ${reminderHours}:${reminderMinutes.toString().padStart(2, '0')} daily`);
  return true;
}

/**
 * Schedule wake-up alarm notifications for weekdays (Monday-Friday)
 * Each weekday gets its own recurring weekly notification
 */
export async function scheduleWeekdayWakeUpAlarms(wakeTimeStr: string): Promise<boolean> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.warn('Notification permissions not granted');
    return false;
  }

  const wakeTime = parseTimeString(wakeTimeStr);
  if (!wakeTime) {
    console.error('Invalid wake time format:', wakeTimeStr);
    return false;
  }

  // Cancel existing wake-up alarms
  for (const day of WEEKDAYS) {
    await Notifications.cancelScheduledNotificationAsync(`${WAKEUP_ALARM_ID_PREFIX}${day}`).catch(() => {});
  }

  // Schedule wake-up alarm for each weekday
  for (const weekday of WEEKDAYS) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${WAKEUP_ALARM_ID_PREFIX}${weekday}`,
      content: {
        title: 'Wake Up!',
        body: `Good morning! Time to start your day. It's ${wakeTimeStr}.`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: weekday,
        hour: wakeTime.hours,
        minute: wakeTime.minutes,
      },
    });
  }

  console.log(`Wake-up alarms scheduled for weekdays at ${wakeTimeStr}`);
  return true;
}

/**
 * Schedule both bedtime reminder and wake-up alarms based on user preferences
 */
export async function scheduleSleepNotifications(
  bedTimeStr: string,
  wakeTimeStr: string
): Promise<{ bedtimeScheduled: boolean; wakeupScheduled: boolean }> {
  const bedtimeScheduled = await scheduleBedtimeReminder(bedTimeStr);
  const wakeupScheduled = await scheduleWeekdayWakeUpAlarms(wakeTimeStr);

  return { bedtimeScheduled, wakeupScheduled };
}

/**
 * Initialize sleep notifications from stored preferences
 * Call this on app startup to reschedule notifications
 */
export async function initializeSleepNotificationsFromPreferences(): Promise<void> {
  const preferences = usePreferencesStore.getState().preferences;

  const bedTime = preferences.bedTime[0];
  const wakeTime = preferences.wakeTime[0];

  if (bedTime) {
    await scheduleBedtimeReminder(bedTime);
  }

  if (wakeTime) {
    await scheduleWeekdayWakeUpAlarms(wakeTime);
  }
}

/**
 * Get all currently scheduled sleep notifications (for debugging/UI display)
 */
export async function getScheduledSleepNotifications(): Promise<Notifications.NotificationRequest[]> {
  const allNotifications = await Notifications.getAllScheduledNotificationsAsync();

  return allNotifications.filter(
    (notification) =>
      notification.identifier === BEDTIME_REMINDER_ID ||
      notification.identifier.startsWith(WAKEUP_ALARM_ID_PREFIX)
  );
}

/**
 * Add a listener for when notifications are received while app is foregrounded
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add a listener for when user interacts with a notification
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Send an immediate test notification (fires in 5 seconds)
 * Use this to verify notifications are working
 */
export async function sendTestNotificationNow(): Promise<boolean> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.warn('Notification permissions not granted');
    return false;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: 'test-notification',
    content: {
      title: 'Bedtime Reminder (Test)',
      body: 'Time to start winding down! This is a test notification.',
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
    },
  });

  console.log('Test notification scheduled to fire in 5 seconds');
  return true;
}
