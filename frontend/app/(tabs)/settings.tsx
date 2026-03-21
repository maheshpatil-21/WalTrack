import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Notifications from 'expo-notifications';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScaleButton } from '../../components/ScaleButton';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { WaltrackCard } from '../../components/WaltrackCard';
import { theme } from '../../constants/theme';
import { ReminderSettings, useExpenseStore } from '../../hooks/useExpenseStore';

function formatReminderTime(hour: number, minute: number, period: 'AM' | 'PM') {
  return `${hour}:${String(minute).padStart(2, '0')} ${period}`;
}

function convertTo24Hour(hour: number, period: 'AM' | 'PM') {
  if (period === 'AM') {
    return hour === 12 ? 0 : hour;
  }
  return hour === 12 ? 12 : hour + 12;
}

export default function SettingsScreen() {
  const { userProfile, reminderSettings, setReminderSettings } = useExpenseStore();
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [hourInput, setHourInput] = useState(String(reminderSettings.hour));
  const [minuteInput, setMinuteInput] = useState(String(reminderSettings.minute).padStart(2, '0'));
  const [period, setPeriod] = useState<'AM' | 'PM'>(reminderSettings.period);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const reminderTimeText = useMemo(
    () => formatReminderTime(reminderSettings.hour, reminderSettings.minute, reminderSettings.period),
    [reminderSettings.hour, reminderSettings.minute, reminderSettings.period]
  );

  const scheduleReminder = async (settings: ReminderSettings) => {
    if (Platform.OS === 'web') {
      return null;
    }

    const currentPermission = await Notifications.getPermissionsAsync();
    let finalStatus = currentPermission.status;
    if (finalStatus !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }
    if (finalStatus !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Waltrack Reminder',
        body: "Reminder: Don't forget to add today's expenses in Waltrack.",
        data: { route: '/add-expense' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: convertTo24Hour(settings.hour, settings.period),
        minute: settings.minute,
      },
    });

    return notificationId;
  };

  const updateReminder = async (nextSettings: ReminderSettings, successCopy: string) => {
    try {
      if (Platform.OS !== 'web' && reminderSettings.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(reminderSettings.notificationId);
      }

      let nextNotificationId: string | null = null;
      if (nextSettings.enabled && Platform.OS !== 'web') {
        nextNotificationId = await scheduleReminder(nextSettings);
      }

      await setReminderSettings({
        ...nextSettings,
        notificationId: Platform.OS === 'web' ? null : nextNotificationId,
      });
      setStatusMessage(successCopy);
      setTimeout(() => setStatusMessage(''), 2500);
      setError('');
    } catch {
      setError('Could not update reminder. Please check permissions.');
    }
  };

  const handleToggle = async (value: boolean) => {
    await updateReminder(
      {
        ...reminderSettings,
        enabled: value,
      },
      value ? 'Daily reminder enabled' : 'Daily reminder disabled'
    );
  };

  const openTimeEditor = () => {
    setHourInput(String(reminderSettings.hour));
    setMinuteInput(String(reminderSettings.minute).padStart(2, '0'));
    setPeriod(reminderSettings.period);
    setError('');
    setIsTimeModalOpen(true);
  };

  const saveTime = async () => {
    const hour = Number(hourInput);
    const minute = Number(minuteInput);
    const validHour = Number.isFinite(hour) && hour >= 1 && hour <= 12;
    const validMinute = Number.isFinite(minute) && minute >= 0 && minute <= 59;

    if (!validHour || !validMinute) {
      setError('Enter a valid reminder time');
      return;
    }

    const nextSettings: ReminderSettings = {
      ...reminderSettings,
      hour,
      minute,
      period,
    };

    await updateReminder(
      nextSettings,
      reminderSettings.enabled ? 'Reminder time updated' : 'Reminder time saved'
    );
    setIsTimeModalOpen(false);
  };

  return (
    <ScreenWrapper>
      <View style={styles.headerWrap}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage profile and reminders</Text>
      </View>

      <WaltrackCard style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>User Profile</Text>
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Name</Text>
          <Text style={styles.profileValue}>{userProfile?.name ?? '-'}</Text>
        </View>
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Email</Text>
          <Text style={styles.profileValue}>{userProfile?.email ?? '-'}</Text>
        </View>
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Mobile</Text>
          <Text style={styles.profileValue}>{userProfile?.phone ?? '-'}</Text>
        </View>
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Age</Text>
          <Text style={styles.profileValue}>{userProfile?.age ?? '-'}</Text>
        </View>
      </WaltrackCard>

      <WaltrackCard style={styles.sectionCard}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.sectionTitle}>Daily Expense Reminder</Text>
            <Text style={styles.mutedText}>Reminder Enabled: {reminderSettings.enabled ? 'ON' : 'OFF'}</Text>
          </View>
          <Switch
            testID="reminder-toggle"
            accessibilityLabel="Toggle daily reminder"
            value={reminderSettings.enabled}
            onValueChange={handleToggle}
            thumbColor={Platform.OS === 'android' ? theme.colors.background : undefined}
            trackColor={{ false: '#D1D5DB', true: '#6EE7B7' }}
          />
        </View>

        <Pressable
          testID="edit-reminder-time"
          accessibilityLabel="Edit reminder time"
          style={styles.timeRow}
          onPress={openTimeEditor}
        >
          <View>
            <Text style={styles.timeLabel}>Reminder Time</Text>
            <Text style={styles.timeValue}>{reminderTimeText}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.text.secondary} />
        </Pressable>

        {Platform.OS === 'web' && (
          <Text style={styles.webFallback}>
            Web fallback: reminder settings are saved here; push reminders run on mobile app.
          </Text>
        )}
      </WaltrackCard>

      {!!statusMessage && (
        <View style={styles.statusToast}>
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      )}

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isTimeModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTimeModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set Reminder Time</Text>
            <View style={styles.timeInputRow}>
              <View style={styles.timeInputWrap}>
                <Text style={styles.modalLabel}>Hour</Text>
                <TextInput
                  testID="reminder-hour-input"
                  accessibilityLabel="Reminder hour"
                  keyboardType="numeric"
                  value={hourInput}
                  onChangeText={(value) => {
                    setError('');
                    setHourInput(value.replace(/[^0-9]/g, ''));
                  }}
                  style={styles.modalInput}
                />
              </View>
              <View style={styles.timeInputWrap}>
                <Text style={styles.modalLabel}>Minute</Text>
                <TextInput
                  testID="reminder-minute-input"
                  accessibilityLabel="Reminder minute"
                  keyboardType="numeric"
                  value={minuteInput}
                  onChangeText={(value) => {
                    setError('');
                    setMinuteInput(value.replace(/[^0-9]/g, ''));
                  }}
                  style={styles.modalInput}
                />
              </View>
            </View>

            <View style={styles.periodRow}>
              {(['AM', 'PM'] as const).map((item) => (
                <Pressable
                  key={item}
                  testID={`reminder-period-${item}`}
                  accessibilityLabel={`Set reminder period ${item}`}
                  style={[styles.periodChip, period === item && styles.periodChipActive]}
                  onPress={() => setPeriod(item)}
                >
                  <Text style={[styles.periodChipText, period === item && styles.periodChipTextActive]}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <ScaleButton
                label="Cancel"
                onPress={() => setIsTimeModalOpen(false)}
                style={styles.modalButton}
                testID="cancel-reminder-time"
                accessibilityLabel="Cancel reminder time"
              />
              <ScaleButton
                label="Save"
                onPress={saveTime}
                style={styles.modalButton}
                testID="save-reminder-time"
                accessibilityLabel="Save reminder time"
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    marginBottom: theme.spacing.s4,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
  },
  subtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.s1,
  },
  sectionCard: {
    marginBottom: theme.spacing.s4,
    gap: theme.spacing.s3,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  profileRow: {
    minHeight: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.s3,
  },
  profileLabel: {
    ...theme.typography.bodySm,
    color: theme.colors.text.secondary,
  },
  profileValue: {
    ...theme.typography.bodySm,
    color: theme.colors.text.primary,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.s3,
  },
  mutedText: {
    ...theme.typography.bodySm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.s1,
  },
  timeRow: {
    minHeight: 52,
    borderTopWidth: 1,
    borderTopColor: theme.colors.secondary.border,
    paddingTop: theme.spacing.s3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeLabel: {
    ...theme.typography.bodySm,
    color: theme.colors.text.secondary,
  },
  timeValue: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '700',
    marginTop: theme.spacing.s1,
  },
  webFallback: {
    ...theme.typography.bodyXs,
    color: theme.colors.text.secondary,
  },
  statusToast: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.s3,
    paddingVertical: theme.spacing.s1,
  },
  statusText: {
    ...theme.typography.bodyXs,
    color: theme.colors.primary.dark,
    fontWeight: '600',
  },
  errorText: {
    ...theme.typography.bodySm,
    color: theme.colors.danger,
    marginTop: theme.spacing.s2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.s6,
    backgroundColor: 'rgba(17,24,39,0.35)',
  },
  modalCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.secondary.border,
    padding: theme.spacing.s4,
    gap: theme.spacing.s3,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: theme.spacing.s3,
  },
  timeInputWrap: {
    flex: 1,
    gap: theme.spacing.s1,
  },
  modalLabel: {
    ...theme.typography.bodyXs,
    color: theme.colors.text.secondary,
  },
  modalInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: theme.colors.secondary.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.s3,
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },
  periodRow: {
    flexDirection: 'row',
    gap: theme.spacing.s2,
  },
  periodChip: {
    minHeight: 42,
    flex: 1,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.secondary.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodChipActive: {
    backgroundColor: theme.colors.primary.bg,
    borderColor: theme.colors.primary.DEFAULT,
  },
  periodChipText: {
    ...theme.typography.bodySm,
    color: theme.colors.text.secondary,
    fontWeight: '700',
  },
  periodChipTextActive: {
    color: theme.colors.primary.dark,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.s3,
  },
  modalButton: {
    flex: 1,
  },
});
