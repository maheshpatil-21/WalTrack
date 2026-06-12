import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { AboutCard } from '../../components/AboutCard';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ReminderSettings, useExpenseStore } from '../../hooks/useExpenseStore';

function formatReminderTime(hour: number, minute: number, period: 'AM' | 'PM') {
  return `${hour}:${String(minute).padStart(2, '0')} ${period}`;
}

function convertTo24Hour(hour: number, period: 'AM' | 'PM') {
  if (period === 'AM') return hour === 12 ? 0 : hour;
  return hour === 12 ? 12 : hour + 12;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { mode, theme, setTheme } = useTheme();
  const { signOut, deleteAccount } = useAuth();
  const { userProfile, reminderSettings, setReminderSettings } = useExpenseStore();

  // ── Reminder state ───────────────────────────────────────────────────────
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [hourInput, setHourInput] = useState(String(reminderSettings.hour));
  const [minuteInput, setMinuteInput] = useState(String(reminderSettings.minute).padStart(2, '0'));
  const [period, setPeriod] = useState<'AM' | 'PM'>(reminderSettings.period);
  const [reminderError, setReminderError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // ── Sign out state ───────────────────────────────────────────────────────
  const [isSigningOut, setIsSigningOut] = useState(false);

  // ── Delete account state ─────────────────────────────────────────────────
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const reminderTimeText = useMemo(
    () => formatReminderTime(reminderSettings.hour, reminderSettings.minute, reminderSettings.period),
    [reminderSettings.hour, reminderSettings.minute, reminderSettings.period]
  );

  // ── Reminder helpers ─────────────────────────────────────────────────────
  const scheduleReminder = async (settings: ReminderSettings) => {
    if (Platform.OS === 'web') return null;
    const currentPermission = await Notifications.getPermissionsAsync();
    let finalStatus = currentPermission.status;
    if (finalStatus !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }
    if (finalStatus !== 'granted') throw new Error('Notification permission not granted');
    return Notifications.scheduleNotificationAsync({
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
  };

  const updateReminder = async (nextSettings: ReminderSettings, successCopy: string) => {
    try {
      if (Platform.OS !== 'web' && reminderSettings.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(reminderSettings.notificationId);
      }
      let nextNotificationId: string | null = null;
      if (nextSettings.enabled && Platform.OS !== 'web') {
        nextNotificationId = await scheduleReminder(nextSettings) ?? null;
      }
      await setReminderSettings({ ...nextSettings, notificationId: Platform.OS === 'web' ? null : nextNotificationId });
      setStatusMessage(successCopy);
      setTimeout(() => setStatusMessage(''), 2500);
      setReminderError('');
    } catch {
      setReminderError('Could not update reminder. Please check permissions.');
    }
  };

  const handleToggle = async (value: boolean) => {
    await updateReminder({ ...reminderSettings, enabled: value }, value ? 'Daily reminder enabled' : 'Daily reminder disabled');
  };

  const openTimeEditor = () => {
    setHourInput(String(reminderSettings.hour));
    setMinuteInput(String(reminderSettings.minute).padStart(2, '0'));
    setPeriod(reminderSettings.period);
    setReminderError('');
    setIsTimeModalOpen(true);
  };

  const saveTime = async () => {
    const hour = Number(hourInput);
    const minute = Number(minuteInput);
    if (!Number.isFinite(hour) || hour < 1 || hour > 12 || !Number.isFinite(minute) || minute < 0 || minute > 59) {
      setReminderError('Enter a valid reminder time');
      return;
    }
    await updateReminder({ ...reminderSettings, hour, minute, period }, reminderSettings.enabled ? 'Reminder time updated' : 'Reminder time saved');
    setIsTimeModalOpen(false);
  };

  // ── Sign out ─────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace('/login');
    } catch {
      setIsSigningOut(false);
    }
  };

  // ── Delete account ───────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount();
      router.replace('/login');
    } catch (e: any) {
      if (e?.code === 'auth/requires-recent-login') {
        setDeleteError('For security, please sign out and sign in again before deleting your account.');
      } else {
        setDeleteError('Something went wrong. Please try again.');
      }
      setIsDeleting(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.headerWrap}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>Manage profile and reminders</Text>
      </View>

      {/* ── Profile card ─────────────────────────────────────────────── */}
      <WaltrackCard style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>User Profile</Text>
        {[
          { label: 'Name', value: userProfile?.name },
          { label: 'Email', value: userProfile?.email },
          { label: 'Mobile', value: userProfile?.phone },
          { label: 'Age', value: userProfile?.age?.toString() },
          { label: 'College / City', value: userProfile?.college },
        ].map(({ label, value }) => (
          <View key={label} style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: theme.colors.text.secondary }]}>{label}</Text>
            <Text style={[styles.profileValue, { color: theme.colors.text.primary }]}>{value ?? '-'}</Text>
          </View>
        ))}
      </WaltrackCard>

      {/* ── Appearance card ───────────────────────────────────────────── */}
      <WaltrackCard style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Appearance</Text>
        <View style={styles.rowBetween}>
          <View>
            <Text style={[styles.profileLabel, { color: theme.colors.text.secondary }]}>Theme</Text>
            <Text style={[styles.profileValue, { color: theme.colors.text.primary, marginTop: 4 }]}>
              {mode === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </Text>
          </View>
          <Pressable
            testID="theme-toggle"
            accessibilityLabel={`Switch to ${mode === 'dark' ? 'light' : 'dark'} theme`}
            style={[styles.themeToggleButton, { borderColor: theme.colors.secondary.border }]}
            onPress={() => setTheme(mode === 'dark' ? 'light' : 'dark')}
          >
            <Text style={[styles.themeToggleText, { color: theme.colors.primary.DEFAULT }]}>
              {mode === 'dark' ? 'Light' : 'Dark'}
            </Text>
          </Pressable>
        </View>
      </WaltrackCard>

      {/* ── Reminders card ───────────────────────────────────────────── */}
      <WaltrackCard style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Daily Expense Reminder</Text>
        <View style={styles.rowBetween}>
          <Text style={[styles.mutedText, { color: theme.colors.text.secondary }]}>
            Reminder Enabled: {reminderSettings.enabled ? 'ON' : 'OFF'}
          </Text>
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
          style={[styles.timeRow, { borderTopColor: theme.colors.secondary.border }]}
          onPress={openTimeEditor}
        >
          <View>
            <Text style={[styles.timeLabel, { color: theme.colors.text.secondary }]}>Reminder Time</Text>
            <Text style={[styles.timeValue, { color: theme.colors.text.primary }]}>{reminderTimeText}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.text.secondary} />
        </Pressable>
        {Platform.OS === 'web' && (
          <Text style={[styles.webFallback, { color: theme.colors.text.secondary }]}>
            Web fallback: reminder settings are saved here; push reminders run on mobile.
          </Text>
        )}
      </WaltrackCard>

      {!!statusMessage && (
        <View style={[styles.statusToast, { backgroundColor: '#ECFDF5' }]}>
          <Text style={[styles.statusText, { color: theme.colors.primary.dark }]}>{statusMessage}</Text>
        </View>
      )}

      {!!reminderError && (
        <Text style={[styles.errorText, { color: theme.colors.danger }]}>{reminderError}</Text>
      )}

      <AboutCard />

      {/* ── Account actions card ──────────────────────────────────────── */}
      <WaltrackCard style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Account</Text>

        <Pressable
          style={[styles.accountBtn, { borderColor: theme.colors.secondary.border }]}
          onPress={handleSignOut}
          disabled={isSigningOut}
          accessibilityLabel="Sign out"
        >
          {isSigningOut
            ? <ActivityIndicator size="small" color={theme.colors.primary.DEFAULT} />
            : (
              <View style={styles.accountBtnInner}>
                <MaterialCommunityIcons name="logout" size={20} color={theme.colors.primary.DEFAULT} />
                <Text style={[styles.accountBtnText, { color: theme.colors.primary.DEFAULT }]}>Sign Out</Text>
              </View>
            )}
        </Pressable>

        <Pressable
          style={[styles.accountBtn, { borderColor: theme.colors.danger }]}
          onPress={() => { setDeleteError(''); setIsDeleteModalOpen(true); }}
          accessibilityLabel="Delete account"
        >
          <View style={styles.accountBtnInner}>
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.colors.danger} />
            <Text style={[styles.accountBtnText, { color: theme.colors.danger }]}>Delete Account</Text>
          </View>
        </Pressable>
      </WaltrackCard>

      {/* ── Reminder time modal ───────────────────────────────────────── */}
      <Modal visible={isTimeModalOpen} transparent animationType="fade" onRequestClose={() => setIsTimeModalOpen(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(17,24,39,0.35)' }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.secondary.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>Set Reminder Time</Text>
            <View style={styles.timeInputRow}>
              {(['Hour', 'Minute'] as const).map((field) => (
                <View key={field} style={styles.timeInputWrap}>
                  <Text style={[styles.modalLabel, { color: theme.colors.text.secondary }]}>{field}</Text>
                  <TextInput
                    testID={`reminder-${field.toLowerCase()}-input`}
                    accessibilityLabel={`Reminder ${field.toLowerCase()}`}
                    keyboardType="numeric"
                    value={field === 'Hour' ? hourInput : minuteInput}
                    onChangeText={(v) => {
                      setReminderError('');
                      const clean = v.replace(/[^0-9]/g, '');
                      field === 'Hour' ? setHourInput(clean) : setMinuteInput(clean);
                    }}
                    style={[styles.modalInput, { borderColor: theme.colors.secondary.border, color: theme.colors.text.primary }]}
                  />
                </View>
              ))}
            </View>
            <View style={styles.periodRow}>
              {(['AM', 'PM'] as const).map((item) => (
                <Pressable
                  key={item}
                  testID={`reminder-period-${item}`}
                  accessibilityLabel={`Set reminder period ${item}`}
                  style={[styles.periodChip, { borderColor: theme.colors.secondary.border }, period === item && { backgroundColor: theme.colors.primary.bg, borderColor: theme.colors.primary.DEFAULT }]}
                  onPress={() => setPeriod(item)}
                >
                  <Text style={[styles.periodChipText, { color: period === item ? theme.colors.primary.dark : theme.colors.text.secondary }]}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            {!!reminderError && <Text style={[styles.errorText, { color: theme.colors.danger }]}>{reminderError}</Text>}
            <View style={styles.modalActions}>
              <ScaleButton label="Cancel" onPress={() => setIsTimeModalOpen(false)} style={styles.modalButton} testID="cancel-reminder-time" accessibilityLabel="Cancel reminder time" />
              <ScaleButton label="Save" onPress={saveTime} style={styles.modalButton} testID="save-reminder-time" accessibilityLabel="Save reminder time" />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Delete account confirmation modal ─────────────────────────── */}
      <Modal visible={isDeleteModalOpen} transparent animationType="fade" onRequestClose={() => setIsDeleteModalOpen(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(17,24,39,0.55)' }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.secondary.border }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={40} color={theme.colors.danger} style={{ alignSelf: 'center' }} />
            <Text style={[styles.modalTitle, { color: theme.colors.text.primary, textAlign: 'center' }]}>
              Delete Account
            </Text>
            <Text style={[styles.deleteWarning, { color: theme.colors.text.secondary }]}>
              This will permanently delete your account and all expense data. This action cannot be undone.
            </Text>
            {!!deleteError && (
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>{deleteError}</Text>
            )}
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.deleteModalBtn, { borderColor: theme.colors.secondary.border }]}
                onPress={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                <Text style={[styles.deleteModalBtnText, { color: theme.colors.text.primary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.deleteModalBtn, styles.deleteModalBtnDanger]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={[styles.deleteModalBtnText, { color: '#fff' }]}>Delete</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerWrap: { marginBottom: 16 },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  subtitle: { fontSize: 13, lineHeight: 20, marginTop: 4 },
  sectionCard: { marginBottom: 16, gap: 12 },
  sectionTitle: { fontSize: 18, lineHeight: 28, fontWeight: '600' },
  profileRow: { minHeight: 30, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  profileLabel: { fontSize: 13, lineHeight: 20 },
  profileValue: { fontSize: 13, lineHeight: 20, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  mutedText: { fontSize: 13, lineHeight: 20, marginTop: 4 },
  timeRow: { minHeight: 52, borderTopWidth: 1, paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeLabel: { fontSize: 13, lineHeight: 20 },
  timeValue: { fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 4 },
  webFallback: { fontSize: 12, lineHeight: 18 },
  statusToast: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  statusText: { fontSize: 12, lineHeight: 18, fontWeight: '600' },
  errorText: { fontSize: 13, lineHeight: 20, marginTop: 4 },
  accountBtn: { minHeight: 48, borderWidth: 1, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  accountBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accountBtnText: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 12 },
  modalTitle: { fontSize: 18, lineHeight: 28, fontWeight: '600' },
  deleteWarning: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  timeInputRow: { flexDirection: 'row', gap: 12 },
  timeInputWrap: { flex: 1, gap: 4 },
  modalLabel: { fontSize: 12, lineHeight: 18 },
  modalInput: { minHeight: 46, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 15, lineHeight: 22 },
  periodRow: { flexDirection: 'row', gap: 8 },
  periodChip: { minHeight: 42, flex: 1, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  periodChipText: { fontSize: 13, lineHeight: 20, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1 },
  deleteModalBtn: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  deleteModalBtnDanger: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  deleteModalBtnText: { fontSize: 15, lineHeight: 22, fontWeight: '700' },
  themeToggleButton: { minHeight: 40, minWidth: 80, borderWidth: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  themeToggleText: { fontSize: 13, fontWeight: '600', lineHeight: 20 },
});
