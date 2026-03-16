import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { PieChart } from 'react-native-gifted-charts';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenWrapper } from '../../components/ScreenWrapper';
import { WaltrackCard } from '../../components/WaltrackCard';
import { theme } from '../../constants/theme';
import { useExpenseStore } from '../../hooks/useExpenseStore';
import {
  formatCurrency,
  getCategoryBreakdown,
  getMonthlySpending,
  getTodaySpending,
} from '../../utils/expenseAnalytics';

export default function DashboardScreen() {
  const { expenses, monthlyBudget, currency, setMonthlyBudget, setCurrency, isReady } = useExpenseStore();
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(monthlyBudget));

  const monthlySpending = useMemo(() => getMonthlySpending(expenses), [expenses]);
  const todaySpending = useMemo(() => getTodaySpending(expenses), [expenses]);
  const categoryData = useMemo(() => getCategoryBreakdown(expenses), [expenses]);

  const remainingBalance = Math.max(monthlyBudget - monthlySpending, 0);
  const now = new Date();
  const dailyLimit = monthlyBudget / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyProgress = Math.min(todaySpending / Math.max(dailyLimit, 1), 1);

  const saveBudget = async () => {
    const nextBudget = Number(budgetInput);
    if (Number.isNaN(nextBudget) || nextBudget <= 0) {
      return;
    }
    await setMonthlyBudget(nextBudget);
    setIsEditingBudget(false);
  };

  if (!isReady) {
    return (
      <ScreenWrapper scrollable={false}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.logoText}>
            Waltrack<Text style={styles.logoDot}>.</Text>
          </Text>
          <Text style={styles.subText}>Track smarter, spend wiser</Text>
        </View>
        <View style={styles.currencyToggle}>
          {(['INR', 'USD'] as const).map((code) => (
            <Pressable
              key={code}
              testID={`currency-${code}`}
              accessibilityLabel={`Switch currency to ${code}`}
              onPress={() => setCurrency(code)}
              style={[styles.currencyChip, currency === code && styles.currencyChipActive]}
            >
              <Text style={[styles.currencyChipText, currency === code && styles.currencyChipTextActive]}>
                {code}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <WaltrackCard style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Remaining balance</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(remainingBalance, currency)}</Text>
        <View style={styles.budgetRow}>
          <Text style={styles.budgetLabel}>Monthly budget</Text>
          {!isEditingBudget ? (
            <Pressable
              testID="edit-budget-button"
              accessibilityLabel="Edit monthly budget"
              onPress={() => {
                setBudgetInput(String(monthlyBudget));
                setIsEditingBudget(true);
              }}
              style={styles.editBudgetButton}
            >
              <MaterialCommunityIcons name="pencil-outline" size={16} color={theme.colors.primary.dark} />
              <Text style={styles.editBudgetText}>{formatCurrency(monthlyBudget, currency)}</Text>
            </Pressable>
          ) : (
            <View style={styles.budgetEditWrap}>
              <TextInput
                testID="budget-input"
                accessibilityLabel="Monthly budget input"
                value={budgetInput}
                onChangeText={setBudgetInput}
                keyboardType="numeric"
                style={styles.budgetInput}
              />
              <Pressable
                testID="save-budget-button"
                accessibilityLabel="Save monthly budget"
                onPress={saveBudget}
                style={styles.saveBudgetButton}
              >
                <Text style={styles.saveBudgetText}>Save</Text>
              </Pressable>
            </View>
          )}
        </View>
      </WaltrackCard>

      <WaltrackCard style={styles.statCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardHeading}>Today’s spending</Text>
          <Text style={styles.cardValue}>{formatCurrency(todaySpending, currency)}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${dailyProgress * 100}%` }]} />
        </View>
        <Text style={styles.progressCaption}>
          {formatCurrency(todaySpending, currency)} / {formatCurrency(dailyLimit, currency)} daily limit
        </Text>
      </WaltrackCard>

      <WaltrackCard style={styles.chartCard}>
        <Text style={styles.cardHeading}>Category spending (this month)</Text>
        {categoryData.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons
              name="wallet-outline"
              size={80}
              color={theme.colors.secondary.gray}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>No expenses this month yet</Text>
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
                <Text style={styles.centerPieText}>{formatCurrency(monthlySpending, currency)}</Text>
              )}
            />
            <View style={styles.legendWrap}>
              {categoryData.map((item) => (
                <View key={item.label} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendLabel}>{item.label}</Text>
                  <Text style={styles.legendValue}>{formatCurrency(item.value, currency)}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </WaltrackCard>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.s4,
  },
  logoText: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
  },
  logoDot: {
    color: theme.colors.primary.DEFAULT,
  },
  subText: {
    ...theme.typography.bodySm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.s1,
  },
  currencyToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.secondary.lightGray,
    borderRadius: theme.radius.full,
    padding: theme.spacing.s1,
  },
  currencyChip: {
    minHeight: 44,
    minWidth: 56,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s3,
  },
  currencyChipActive: {
    backgroundColor: theme.colors.background,
  },
  currencyChipText: {
    ...theme.typography.bodyXs,
    color: theme.colors.text.secondary,
    fontWeight: '700',
  },
  currencyChipTextActive: {
    color: theme.colors.primary.dark,
  },
  balanceCard: {
    backgroundColor: theme.colors.primary.DEFAULT,
    borderColor: theme.colors.primary.dark,
    marginBottom: theme.spacing.s4,
  },
  balanceLabel: {
    ...theme.typography.bodySm,
    color: theme.colors.text.inverse,
    opacity: 0.9,
  },
  balanceAmount: {
    ...theme.typography.amount,
    color: theme.colors.text.inverse,
    marginTop: theme.spacing.s2,
  },
  budgetRow: {
    marginTop: theme.spacing.s3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.s2,
  },
  budgetLabel: {
    ...theme.typography.bodySm,
    color: theme.colors.text.inverse,
  },
  editBudgetButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s2,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.s3,
    borderRadius: theme.radius.full,
  },
  editBudgetText: {
    ...theme.typography.bodySm,
    color: theme.colors.primary.dark,
    fontWeight: '700',
  },
  budgetEditWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s2,
  },
  budgetInput: {
    minHeight: 44,
    minWidth: 96,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.s3,
    color: theme.colors.text.primary,
  },
  saveBudgetButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.s3,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary.dark,
  },
  saveBudgetText: {
    color: theme.colors.text.inverse,
    fontWeight: '700',
  },
  statCard: {
    marginBottom: theme.spacing.s4,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.s2,
  },
  cardHeading: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  cardValue: {
    ...theme.typography.body,
    color: theme.colors.primary.dark,
    fontWeight: '700',
  },
  progressTrack: {
    height: 14,
    marginTop: theme.spacing.s3,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.secondary.lightGray,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary.DEFAULT,
    borderRadius: theme.radius.full,
  },
  progressCaption: {
    ...theme.typography.bodySm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.s2,
  },
  chartCard: {
    gap: theme.spacing.s4,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.s8,
  },
  emptyIcon: {
    opacity: 0.3,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.s2,
  },
  centerPieText: {
    ...theme.typography.bodySm,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    width: 70,
  },
  legendWrap: {
    gap: theme.spacing.s2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
    gap: theme.spacing.s2,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: theme.radius.full,
  },
  legendLabel: {
    ...theme.typography.bodySm,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  legendValue: {
    ...theme.typography.bodySm,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
});
