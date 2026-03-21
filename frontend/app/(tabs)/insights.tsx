import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ScaleButton } from '../../components/ScaleButton';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { WaltrackCard } from '../../components/WaltrackCard';
import { theme } from '../../constants/theme';
import { useExpenseStore } from '../../hooks/useExpenseStore';
import {
  formatCurrency,
  getAverageDailySpending,
  getAvailableMonths,
  getBudgetSuggestion,
  getCategoryBreakdown,
  getExpensesForMonth,
  getHighestCategory,
  getMonthlySpending,
  getWeeklySpendingForMonth,
} from '../../utils/expenseAnalytics';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function InsightsScreen() {
  const { expenses, monthlyBudget, currency, userProfile } = useExpenseStore();
  const { width } = useWindowDimensions();
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState('');
  const [exportStatus, setExportStatus] = useState('');

  const monthOptions = useMemo(() => getAvailableMonths(expenses), [expenses]);

  useEffect(() => {
    if (!selectedMonthKey || !monthOptions.some((option) => option.key === selectedMonthKey)) {
      setSelectedMonthKey(monthOptions[0]?.key ?? '');
    }
  }, [monthOptions, selectedMonthKey]);

  const selectedMonth = useMemo(
    () => monthOptions.find((option) => option.key === selectedMonthKey) ?? monthOptions[0],
    [monthOptions, selectedMonthKey]
  );

  const selectedMonthDate = useMemo(
    () => new Date(selectedMonth?.year ?? new Date().getFullYear(), selectedMonth?.month ?? new Date().getMonth(), 1),
    [selectedMonth]
  );

  const monthExpenses = useMemo(
    () => (selectedMonth ? getExpensesForMonth(expenses, selectedMonth) : []),
    [expenses, selectedMonth]
  );

  const monthlySpending = useMemo(
    () => getMonthlySpending(expenses, selectedMonthDate),
    [expenses, selectedMonthDate]
  );

  const categoryBreakdown = useMemo(
    () => getCategoryBreakdown(expenses, selectedMonthDate),
    [expenses, selectedMonthDate]
  );

  const highestCategory = useMemo(() => getHighestCategory(categoryBreakdown), [categoryBreakdown]);

  const averageDailySpending = useMemo(
    () => getAverageDailySpending(monthlySpending, selectedMonthDate.getFullYear(), selectedMonthDate.getMonth()),
    [monthlySpending, selectedMonthDate]
  );

  const weeklySeries = useMemo(() => getWeeklySpendingForMonth(monthExpenses), [monthExpenses]);

  const suggestion = useMemo(
    () => getBudgetSuggestion(monthlyBudget, monthlySpending),
    [monthlyBudget, monthlySpending]
  );

  const remainingBudget = monthlyBudget - monthlySpending;
  const chartWidth = Math.max(width - 110, 240);
  const budgetProgress = Math.min(monthlySpending / Math.max(monthlyBudget, 1), 1);

  const exportCsv = async () => {
    try {
      const header = 'Date,Category,Amount,Note';
      const body = expenses
        .map((expense) => {
          const date = new Date(expense.date).toLocaleDateString('en-US');
          const note = expense.note ? `"${expense.note.replace(/"/g, '""')}"` : '""';
          return `${date},${expense.category},${expense.amount},${note}`;
        })
        .join('\n');

      const csv = `${header}\n${body}`;

      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `waltrack-expenses-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setExportStatus('CSV downloaded successfully');
        setTimeout(() => setExportStatus(''), 2600);
        return;
      }

      const csvUri = `${FileSystem.cacheDirectory}waltrack-expenses-${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(csvUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(csvUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Waltrack CSV',
        });
      }

      setExportStatus('CSV exported successfully');
      setTimeout(() => setExportStatus(''), 2600);
    } catch {
      setExportStatus('CSV export failed. Please try again.');
    }
  };

  const exportPdf = async () => {
    try {
      const insightRows = `
        <li><strong>Total spending this month:</strong> ${formatCurrency(monthlySpending, currency)}</li>
        <li><strong>Remaining monthly budget:</strong> ${formatCurrency(remainingBudget, currency)}</li>
        <li><strong>Highest spending category:</strong> ${escapeHtml(highestCategory.label)} (${formatCurrency(
          highestCategory.value,
          currency
        )})</li>
        <li><strong>Average daily spending:</strong> ${formatCurrency(averageDailySpending, currency)}</li>
      `;

      const categoryRows = categoryBreakdown
        .map(
          (row) =>
            `<tr><td>${escapeHtml(row.label)}</td><td style="text-align:right;">${formatCurrency(
              row.value,
              currency
            )}</td></tr>`
        )
        .join('');

      const transactionRows = [...expenses]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(
          (expense) => `<tr>
            <td>${new Date(expense.date).toLocaleDateString('en-US')}</td>
            <td>${escapeHtml(expense.category)}</td>
            <td style="text-align:right;">${formatCurrency(expense.amount, currency)}</td>
            <td>${escapeHtml(expense.note || '-')}</td>
          </tr>`
        )
        .join('');

      const html = `
        <html>
          <body style="font-family: Arial; padding: 24px; color: #111827;">
            <h1 style="color:#10B981; margin-bottom: 6px;">Waltrack Expense Report</h1>
            <p style="margin-top:0; color:#6B7280;">Generated on ${new Date().toLocaleString()}</p>

            <h2>Profile</h2>
            <p><strong>Name:</strong> ${escapeHtml(userProfile?.name ?? '-')}</p>
            <p><strong>Email:</strong> ${escapeHtml(userProfile?.email ?? '-')}</p>
            <p><strong>Mobile:</strong> ${escapeHtml(userProfile?.phone ?? '-')}</p>
            <p><strong>Age:</strong> ${escapeHtml(String(userProfile?.age ?? '-'))}</p>

            <h2>Monthly Insights (${escapeHtml(selectedMonth?.label ?? 'N/A')})</h2>
            <ul>${insightRows}</ul>

            <h2>Category Distribution</h2>
            <table border="1" cellspacing="0" cellpadding="8" style="width:100%; border-collapse: collapse;">
              <thead><tr><th align="left">Category</th><th align="right">Amount</th></tr></thead>
              <tbody>${categoryRows || '<tr><td colspan="2">No category data</td></tr>'}</tbody>
            </table>

            <h2>All Transactions</h2>
            <table border="1" cellspacing="0" cellpadding="8" style="width:100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th align="left">Date</th>
                  <th align="left">Category</th>
                  <th align="right">Amount</th>
                  <th align="left">Note</th>
                </tr>
              </thead>
              <tbody>${transactionRows || '<tr><td colspan="4">No transactions available</td></tr>'}</tbody>
            </table>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        setExportStatus('Opening print dialog...');
        setTimeout(async () => {
          try {
            await Print.printAsync({ html });
            setExportStatus('Print dialog opened. Save as PDF to export.');
            setTimeout(() => setExportStatus(''), 3000);
          } catch {
            setExportStatus('PDF export failed. Please try again.');
          }
        }, 1200);
        return;
      }

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export Waltrack PDF',
        });
      }

      setExportStatus('PDF exported successfully');
      setTimeout(() => setExportStatus(''), 2600);
    } catch {
      setExportStatus('PDF export failed. Please try again.');
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.subtitle}>Monthly reports and history</Text>
        </View>
        <Pressable
          testID="month-selector-toggle"
          accessibilityLabel="Open month selector"
          style={styles.monthToggle}
          onPress={() => setIsMonthPickerOpen((prev) => !prev)}
        >
          <Text style={styles.monthToggleText}>{selectedMonth?.label ?? 'Select Month'}</Text>
          <MaterialCommunityIcons
            name={isMonthPickerOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.colors.text.secondary}
          />
        </Pressable>
      </View>

      {isMonthPickerOpen && (
        <WaltrackCard style={styles.monthPickerCard}>
          {monthOptions.map((option) => (
            <Pressable
              key={option.key}
              testID={`month-option-${option.key}`}
              accessibilityLabel={`Select ${option.label}`}
              style={[
                styles.monthOption,
                selectedMonth?.key === option.key && styles.monthOptionActive,
              ]}
              onPress={() => {
                setSelectedMonthKey(option.key);
                setIsMonthPickerOpen(false);
              }}
            >
              <Text
                style={[
                  styles.monthOptionText,
                  selectedMonth?.key === option.key && styles.monthOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </WaltrackCard>
      )}

      <WaltrackCard style={styles.reportCard}>
        <Text style={styles.cardTitle}>Monthly Report</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Total Spending</Text>
            <Text style={styles.metricValue}>{formatCurrency(monthlySpending, currency)}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Remaining Budget</Text>
            <Text style={styles.metricValue}>{formatCurrency(remainingBudget, currency)}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Highest Category</Text>
            <Text style={styles.metricValue}>{highestCategory.label}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Avg Daily Spend</Text>
            <Text style={styles.metricValue}>{formatCurrency(averageDailySpending, currency)}</Text>
          </View>
        </View>
      </WaltrackCard>

      <WaltrackCard style={styles.cardGap}>
        <Text style={styles.cardTitle}>Monthly budget progress</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${budgetProgress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {formatCurrency(monthlySpending, currency)} spent of {formatCurrency(monthlyBudget, currency)}
        </Text>
      </WaltrackCard>

      <WaltrackCard style={styles.cardGap}>
        <Text style={styles.cardTitle}>Category distribution</Text>
        {categoryBreakdown.length ? (
          <>
            <PieChart
              donut
              data={categoryBreakdown}
              radius={88}
              innerRadius={56}
              innerCircleColor={theme.colors.background}
              centerLabelComponent={() => (
                <Text style={styles.centerPieText}>{formatCurrency(monthlySpending, currency)}</Text>
              )}
            />
            <View style={styles.categoryWrap}>
              {categoryBreakdown.map((item) => (
                <View key={item.label} style={styles.categoryRow}>
                  <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                  <Text style={styles.categoryLabel}>{item.label}</Text>
                  <Text style={styles.categoryValue}>{formatCurrency(item.value, currency)}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.emptyText}>No category data for selected month.</Text>
        )}
      </WaltrackCard>

      <WaltrackCard style={styles.cardGap}>
        <Text style={styles.cardTitle}>Weekly spending (selected month)</Text>
        <BarChart
          data={weeklySeries}
          width={chartWidth}
          height={180}
          spacing={24}
          barWidth={26}
          roundedTop
          noOfSections={4}
          frontColor={theme.colors.primary.DEFAULT}
          yAxisThickness={0}
          xAxisThickness={0}
          hideRules
          xAxisLabelTextStyle={styles.axisLabel}
        />
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

      <WaltrackCard style={styles.exportCard}>
        <Text style={styles.cardTitle}>Export Data</Text>
        <Text style={styles.exportHint}>
          Export PDF with profile, all transactions, and insights summary.
        </Text>
        <View style={styles.exportButtonsWrap}>
          <ScaleButton
            label="Export as PDF"
            onPress={exportPdf}
            testID="export-pdf-button"
            accessibilityLabel="Export data as PDF"
          />
          <ScaleButton
            label="Export as CSV"
            onPress={exportCsv}
            testID="export-csv-button"
            accessibilityLabel="Export data as CSV"
          />
        </View>
        {!!exportStatus && <Text style={styles.exportStatus}>{exportStatus}</Text>}
      </WaltrackCard>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: theme.spacing.s4,
    gap: theme.spacing.s3,
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
  monthToggle: {
    minHeight: 44,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.secondary.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s3,
    backgroundColor: theme.colors.background,
  },
  monthToggleText: {
    ...theme.typography.bodySm,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  monthPickerCard: {
    marginBottom: theme.spacing.s4,
    gap: theme.spacing.s2,
  },
  monthOption: {
    minHeight: 44,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.s3,
  },
  monthOptionActive: {
    backgroundColor: theme.colors.primary.bg,
  },
  monthOptionText: {
    ...theme.typography.bodySm,
    color: theme.colors.text.secondary,
  },
  monthOptionTextActive: {
    color: theme.colors.primary.dark,
    fontWeight: '700',
  },
  reportCard: {
    marginBottom: theme.spacing.s4,
    gap: theme.spacing.s3,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: theme.spacing.s3,
  },
  metricItem: {
    width: '48%',
    borderWidth: 1,
    borderColor: theme.colors.secondary.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.s3,
    gap: theme.spacing.s1,
    minHeight: 88,
  },
  metricLabel: {
    ...theme.typography.bodyXs,
    color: theme.colors.text.secondary,
  },
  metricValue: {
    ...theme.typography.bodySm,
    color: theme.colors.text.primary,
    fontWeight: '700',
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
  progressTrack: {
    height: 14,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.secondary.lightGray,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary.DEFAULT,
  },
  progressText: {
    ...theme.typography.bodySm,
    color: theme.colors.text.secondary,
  },
  centerPieText: {
    ...theme.typography.bodySm,
    color: theme.colors.text.primary,
    fontWeight: '700',
    width: 70,
    textAlign: 'center',
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
  tipCard: {
    marginBottom: theme.spacing.s4,
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
  exportCard: {
    marginBottom: theme.spacing.s8,
    gap: theme.spacing.s3,
  },
  exportHint: {
    ...theme.typography.bodySm,
    color: theme.colors.text.secondary,
  },
  exportButtonsWrap: {
    gap: theme.spacing.s3,
  },
  exportStatus: {
    ...theme.typography.bodySm,
    color: theme.colors.primary.dark,
    fontWeight: '700',
  },
});
