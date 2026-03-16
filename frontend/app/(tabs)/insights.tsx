import { BarChart, LineChart } from 'react-native-gifted-charts';
import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ScreenWrapper } from '../../components/ScreenWrapper';
import { WaltrackCard } from '../../components/WaltrackCard';
import { theme } from '../../constants/theme';
import { useExpenseStore } from '../../hooks/useExpenseStore';
import {
  formatCurrency,
  getBudgetSuggestion,
  getCategoryBreakdown,
  getHighestSpendDay,
  getLast7DaysSeries,
  getMonthlySpending,
} from '../../utils/expenseAnalytics';

export default function InsightsScreen() {
  const { expenses, monthlyBudget, currency } = useExpenseStore();
  const { width } = useWindowDimensions();

  const weeklySeries = useMemo(() => getLast7DaysSeries(expenses), [expenses]);
  const highestSpendDay = useMemo(() => getHighestSpendDay(expenses), [expenses]);
  const monthlySpending = useMemo(() => getMonthlySpending(expenses), [expenses]);
  const categoryBreakdown = useMemo(() => getCategoryBreakdown(expenses), [expenses]);
  const suggestion = useMemo(
    () => getBudgetSuggestion(monthlyBudget, monthlySpending),
    [monthlyBudget, monthlySpending]
  );

  const chartWidth = Math.max(width - 96, 240);

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Weekly trends and smart analysis</Text>
      </View>

      <WaltrackCard style={styles.cardGap}>
        <Text style={styles.cardTitle}>Weekly spending</Text>
        <BarChart
          data={weeklySeries}
          width={chartWidth}
          height={180}
          spacing={18}
          barWidth={20}
          roundedTop
          noOfSections={4}
          frontColor={theme.colors.primary.DEFAULT}
          yAxisThickness={0}
          xAxisThickness={0}
          hideRules
          xAxisLabelTextStyle={styles.axisLabel}
        />
      </WaltrackCard>

      <WaltrackCard style={styles.cardGap}>
        <Text style={styles.cardTitle}>Spending trend line</Text>
        <LineChart
          data={weeklySeries}
          width={chartWidth}
          height={180}
          color={theme.colors.primary.dark}
          dataPointsColor={theme.colors.primary.DEFAULT}
          dataPointsRadius={4}
          thickness={3}
          curved
          isAnimated
          yAxisThickness={0}
          xAxisThickness={0}
          hideRules
          xAxisLabelTextStyle={styles.axisLabel}
        />
      </WaltrackCard>

      <WaltrackCard style={styles.cardGap}>
        <Text style={styles.cardTitle}>Category analysis (this month)</Text>
        {categoryBreakdown.length === 0 ? (
          <Text style={styles.emptyText}>No category data yet. Add expenses to unlock insights.</Text>
        ) : (
          <View style={styles.categoryWrap}>
            {categoryBreakdown.map((item) => (
              <View key={item.label} style={styles.categoryRow}>
                <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                <Text style={styles.categoryLabel}>{item.label}</Text>
                <Text style={styles.categoryValue}>{formatCurrency(item.value, currency)}</Text>
              </View>
            ))}
          </View>
        )}
      </WaltrackCard>

      <WaltrackCard style={styles.statCard}>
        <Text style={styles.cardTitle}>Highest spend day</Text>
        <Text style={styles.statHeadline}>{highestSpendDay.fullDay}</Text>
        <Text style={styles.statValue}>{formatCurrency(highestSpendDay.value, currency)}</Text>
      </WaltrackCard>

      <WaltrackCard
        style={[
          styles.tipCard,
          suggestion.tone === 'danger'
            ? styles.tipDanger
            : suggestion.tone === 'warning'
              ? styles.tipWarning
              : styles.tipGood,
        ]}
      >
        <Text style={styles.tipTitle}>{suggestion.title}</Text>
        <Text style={styles.tipText}>{suggestion.message}</Text>
      </WaltrackCard>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
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
  cardGap: {
    marginBottom: theme.spacing.s4,
    gap: theme.spacing.s3,
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  axisLabel: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    marginTop: theme.spacing.s1,
  },
  categoryWrap: {
    gap: theme.spacing.s2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
    gap: theme.spacing.s2,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: theme.radius.full,
  },
  categoryLabel: {
    ...theme.typography.bodySm,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  categoryValue: {
    ...theme.typography.bodySm,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  emptyText: {
    ...theme.typography.bodySm,
    color: theme.colors.text.secondary,
  },
  statCard: {
    marginBottom: theme.spacing.s4,
  },
  statHeadline: {
    ...theme.typography.body,
    marginTop: theme.spacing.s2,
    color: theme.colors.text.secondary,
  },
  statValue: {
    ...theme.typography.h2,
    marginTop: theme.spacing.s1,
    color: theme.colors.primary.dark,
  },
  tipCard: {
    marginBottom: theme.spacing.s8,
    borderWidth: 0,
  },
  tipGood: {
    backgroundColor: '#ECFDF5',
  },
  tipWarning: {
    backgroundColor: '#FFFBEB',
  },
  tipDanger: {
    backgroundColor: '#FEF2F2',
  },
  tipTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  tipText: {
    ...theme.typography.bodySm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.s2,
  },
});
