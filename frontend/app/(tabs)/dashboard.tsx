import { getSmartInsight } from "../../utils/smartInsights";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { PieChart } from 'react-native-gifted-charts';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenWrapper } from '../../components/ScreenWrapper';
import { WaltrackCard } from '../../components/WaltrackCard';
import { useTheme } from '../../contexts/ThemeContext';
import { useExpenseStore } from '../../hooks/useExpenseStore';
import {
  formatCurrency,
  getCategoryBreakdown,
  getMonthlySpending,
  getTodaySpending,
} from '../../utils/expenseAnalytics';
import { logDashboardView } from '../../utils/analytics';

export default function DashboardScreen() {
  const { theme, mode } = useTheme();
  const {
    expenses,
    monthlyBudget,
    dailyLimit,
    currency,
    setMonthlyBudget,
    setDailyLimit,
    setCurrency,
    isReady,
  } = useExpenseStore();

  useEffect(() => {
    void logDashboardView();
  }, []);

  const totalSpend = expenses.reduce((sum,item) => sum + item.amount, 0);
  const smartInsight = getSmartInsight(totalSpend, monthlyBudget);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(monthlyBudget));
  const [isDailyLimitModalVisible, setIsDailyLimitModalVisible] = useState(false);
  const [dailyLimitInput, setDailyLimitInput] = useState(String(Math.round(dailyLimit)));
  const [dailyLimitError, setDailyLimitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const monthlySpending = useMemo(() => getMonthlySpending(expenses), [expenses]);
  const todaySpending = useMemo(() => getTodaySpending(expenses), [expenses]);
  const categoryData = useMemo(() => getCategoryBreakdown(expenses), [expenses]);

  const remainingBalance = monthlyBudget - monthlySpending;
  const dailyProgress = Math.min(todaySpending / Math.max(dailyLimit, 1), 1);

  const saveBudget = async () => {
    const nextBudget = Number(budgetInput);
    if (Number.isNaN(nextBudget) || nextBudget <= 0) {
      return;
    }
    await setMonthlyBudget(nextBudget);
    setIsEditingBudget(false);
  };

  const openDailyLimitModal = () => {
    setDailyLimitInput(String(Math.round(dailyLimit)));
    setDailyLimitError('');
    setIsDailyLimitModalVisible(true);
  };

  const saveDailyLimit = async () => {
    const nextLimit = Number(dailyLimitInput);
    if (!dailyLimitInput.trim() || Number.isNaN(nextLimit) || nextLimit <= 0) {
      setDailyLimitError('Please enter a valid daily limit');
      return;
    }

    await setDailyLimit(nextLimit);
    setSuccessMessage('Daily limit updated successfully');
    setIsDailyLimitModalVisible(false);
    setDailyLimitError('');
    setTimeout(() => {
      setSuccessMessage('');
    }, 2200);
  };

  if (!isReady) {
    return (
      <ScreenWrapper scrollable={false}>
        <View style={[styles.loaderWrap, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={[styles.headerRow, { marginBottom: theme.spacing.s4 }]}>
        <View>
          <Text style={[styles.logoText, { color: theme.colors.text.primary }]}>
            Waltrack<Text style={[styles.logoDot, { color: theme.colors.primary.DEFAULT }]}>.</Text>
          </Text>
          <Text style={[styles.subText, { color: theme.colors.text.secondary, marginTop: theme.spacing.s1 }]}>Track smarter, spend wiser</Text>
        </View>
        <View style={[styles.currencyToggle, { backgroundColor: theme.colors.secondary.lightGray }]}>
          {(['INR', 'USD'] as const).map((code) => (
            <Pressable
              key={code}
              testID={`currency-${code}`}
              accessibilityLabel={`Switch currency to ${code}`}
              onPress={() => setCurrency(code)}
              style={[
                styles.currencyChip,
                currency === code && [styles.currencyChipActive, { backgroundColor: theme.colors.background }]
              ]}
            >
              <Text style={[
                styles.currencyChipText,
                { color: theme.colors.text.secondary },
                currency === code && { color: theme.colors.primary.dark }
              ]}>
                {code}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <WaltrackCard style={[styles.balanceCard, { backgroundColor: theme.colors.primary.DEFAULT, borderColor: theme.colors.primary.dark }]}>
        <Text style={[styles.balanceLabel, { color: theme.colors.text.inverse, opacity: 0.9 }]}>Remaining balance</Text>
        <Text style={[styles.balanceAmount, { color: theme.colors.text.inverse, marginTop: theme.spacing.s2 }]}>{formatCurrency(remainingBalance, currency)}</Text>
        <View style={[styles.budgetRow, { marginTop: theme.spacing.s3, gap: theme.spacing.s2 }]}>
          <Text style={[styles.budgetLabel, { color: theme.colors.text.inverse }]}>Monthly budget</Text>
          {!isEditingBudget ? (
            <Pressable
              testID="edit-budget-button"
              accessibilityLabel="Edit monthly budget"
              onPress={() => {
                setBudgetInput(String(monthlyBudget));
                setIsEditingBudget(true);
              }}
              style={[styles.editBudgetButton, { backgroundColor: theme.colors.background }]}
            >
              <MaterialCommunityIcons name="pencil-outline" size={16} color={theme.colors.primary.dark} />
              <Text style={[styles.editBudgetText, { color: theme.colors.primary.dark }]}>{formatCurrency(monthlyBudget, currency)}</Text>
            </Pressable>
          ) : (
            <View style={[styles.budgetEditWrap, { gap: theme.spacing.s2 }]}>
              <TextInput
                testID="budget-input"
                accessibilityLabel="Monthly budget input"
                value={budgetInput}
                onChangeText={setBudgetInput}
                keyboardType="numeric"
                style={[styles.budgetInput, { backgroundColor: theme.colors.background, color: theme.colors.text.primary, borderColor: theme.colors.secondary.border }]}
              />
              <Pressable
                testID="save-budget-button"
                accessibilityLabel="Save monthly budget"
                onPress={saveBudget}
                style={[styles.saveBudgetButton, { backgroundColor: theme.colors.primary.dark }]}
              >
                <Text style={[styles.saveBudgetText, { color: theme.colors.text.inverse }]}>Save</Text>
              </Pressable>
            </View>
          )}
        </View>
      </WaltrackCard>

      <WaltrackCard style={[styles.statCard, { marginBottom: theme.spacing.s4 }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.cardHeading, { color: theme.colors.text.primary }]}>Today’s spending</Text>
          <Text style={[styles.cardValue, { color: theme.colors.primary.dark }]}>{formatCurrency(todaySpending, currency)}</Text>
        </View>
        <View style={[styles.progressTrack, { marginTop: theme.spacing.s3, backgroundColor: theme.colors.secondary.lightGray }]}>
          <View style={[styles.progressFill, { width: `${dailyProgress * 100}%`, backgroundColor: theme.colors.primary.DEFAULT }]} />
        </View>
        <View style={[styles.dailyLimitRow, { marginTop: theme.spacing.s2, gap: theme.spacing.s2 }]}>
          <Text style={[styles.progressCaption, { color: theme.colors.text.secondary }]}>
            {formatCurrency(todaySpending, currency)} / {formatCurrency(dailyLimit, currency)} daily limit
          </Text>
          <Pressable
            testID="edit-daily-limit-button"
            accessibilityLabel="Edit daily limit"
            onPress={openDailyLimitModal}
            style={styles.dailyLimitEditButton}
          >
            <MaterialCommunityIcons name="pencil-outline" size={14} color={theme.colors.text.secondary} />
          </Pressable>
        </View>
        {!!successMessage && (
          <View style={[styles.successToast, { marginTop: theme.spacing.s2, backgroundColor: theme.colors.primary.bg }]}>
            <Text style={[styles.successToastText, { color: theme.colors.primary.dark }]}>{successMessage}</Text>
          </View>
        )}
      </WaltrackCard>

      <WaltrackCard style={[styles.chartCard, { gap: theme.spacing.s4 }]}>
        <Text style={[styles.cardHeading, { color: theme.colors.text.primary }]}>Category spending (this month)</Text>
        {categoryData.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons
              name="wallet-outline"
              size={80}
              color={theme.colors.secondary.gray}
              style={styles.emptyIcon}
            />
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>No expenses this month yet</Text>
          </View>
        ) : (
          <>
            <PieChart
              donut
              data={categoryData}
              radius={86}
              innerRadius={56}
              innerCircleColor={theme.colors.background}
              centerLabelComponent={() => (
                <Text style={[styles.centerPieText, { color: theme.colors.text.primary }]}>{formatCurrency(monthlySpending, currency)}</Text>
              )}
            />
            <View style={[styles.legendWrap, { gap: theme.spacing.s2 }]}>
              {categoryData.map((item) => (
                <View key={item.label} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendLabel, { color: theme.colors.text.secondary }]}>{item.label}</Text>
                  <Text style={[styles.legendValue, { color: theme.colors.text.primary }]}>{formatCurrency(item.value, currency)}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </WaltrackCard>
      
      <View style={[styles.smartInsightCard, { backgroundColor: mode === 'dark' ? theme.colors.primary.bg : '#E6F4Ef', padding: theme.spacing.s4, borderRadius: theme.radius.lg, marginTop: theme.spacing.s4 }]}>
        <Text style={[{ fontWeight: "600", marginBottom: 4, color: theme.colors.text.primary }]}>
          Smart Insight
        </Text>
        <Text style={[styles.smartInsightText, { color: theme.colors.text.primary }]}>
          {smartInsight}
        </Text>
      </View>

      <Modal
        visible={isDailyLimitModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDailyLimitModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(17,24,39,0.35)' }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.secondary.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>Edit Daily Limit</Text>
            <Text style={[styles.modalLabel, { color: theme.colors.text.secondary }]}>Enter new daily limit</Text>
            <TextInput
              testID="daily-limit-input"
              accessibilityLabel="Enter new daily limit"
              value={dailyLimitInput}
              onChangeText={(value) => {
                setDailyLimitError('');
                setDailyLimitInput(value.replace(/[^0-9.]/g, ''));
              }}
              keyboardType="numeric"
              style={[styles.modalInput, { color: theme.colors.text.primary, borderColor: theme.colors.secondary.border }]}
              placeholder={Platform.OS === 'ios' ? '0' : undefined}
              placeholderTextColor={theme.colors.text.tertiary}
            />
            {!!dailyLimitError && <Text style={[styles.modalError, { color: theme.colors.danger }]}>{dailyLimitError}</Text>}
            <View style={[styles.modalActions, { gap: theme.spacing.s3 }]}>
              <Pressable
                testID="cancel-daily-limit-button"
                accessibilityLabel="Cancel daily limit edit"
                onPress={() => setIsDailyLimitModalVisible(false)}
                style={[styles.modalButton, styles.modalCancelButton, { borderColor: theme.colors.secondary.border, backgroundColor: theme.colors.background }]}
              >
                <Text style={[styles.modalCancelText, { color: theme.colors.text.secondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                testID="save-daily-limit-button"
                accessibilityLabel="Save daily limit"
                onPress={saveDailyLimit}
                style={[styles.modalButton, styles.modalSaveButton, { backgroundColor: theme.colors.primary.DEFAULT }]}
              >
                <Text style={[styles.modalSaveText, { color: theme.colors.text.inverse }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  logoDot: {
    fontWeight: '700',
  },
  subText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  currencyToggle: {
    flexDirection: 'row',
    borderRadius: 9999,
    padding: 4,
  },
  currencyChip: {
    minHeight: 44,
    minWidth: 56,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  currencyChipActive: {
  },
  currencyChipText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  currencyChipTextActive: {
  },
  balanceCard: {
    borderWidth: 1,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 46,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  editBudgetButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  editBudgetText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginLeft: 8,
  },
  budgetEditWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetInput: {
    minHeight: 44,
    minWidth: 96,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  saveBudgetButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  saveBudgetText: {
    fontWeight: '700',
  },
  statCard: {
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardHeading: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  progressTrack: {
    height: 14,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 9999,
  },
  progressCaption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  dailyLimitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dailyLimitEditButton: {
    width: 24,
    height: 24,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  successToast: {
    alignSelf: 'flex-start',
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  successToastText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  modalInput: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  modalError: {
    fontSize: 12,
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    borderWidth: 1,
  },
  modalSaveButton: {
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  chartCard: {
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    opacity: 0.3,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    marginTop: 8,
  },
  centerPieText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    width: 70,
  },
  legendWrap: {
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 9999,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    flex: 1,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  smartInsightCard: {
  },
  smartInsightText: {
    fontSize: 16,
  },
});
