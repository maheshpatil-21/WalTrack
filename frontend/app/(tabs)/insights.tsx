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
import { useTheme } from '../../contexts/ThemeContext';
import { useExpenseStore } from '../../hooks/useExpenseStore';
import { logInsightsView } from '../../utils/analytics';
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
  const { theme } = useTheme();
  const { expenses, monthlyBudget, currency, userProfile } = useExpenseStore();

  useEffect(() => {
    void logInsightsView();
  }, []);
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
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>Insights</Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>Monthly reports and history</Text>
        </View>
        <Pressable
          testID="month-selector-toggle"
          accessibilityLabel="Open month selector"
          style={[styles.monthToggle, { borderColor: theme.colors.secondary.border, backgroundColor: theme.colors.background }]}
          onPress={() => setIsMonthPickerOpen((prev) => !prev)}
        >
          <Text style={[styles.monthToggleText, { color: theme.colors.text.primary }]}>{selectedMonth?.label ?? 'Select Month'}</Text>
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
                selectedMonth?.key === option.key && { backgroundColor: theme.colors.primary.bg },
              ]}
              onPress={() => {
                setSelectedMonthKey(option.key);
                setIsMonthPickerOpen(false);
              }}
            >
              <Text
                style={[
                  styles.monthOptionText,
                  { color: selectedMonth?.key === option.key ? theme.colors.primary.dark : theme.colors.text.secondary },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </WaltrackCard>
      )}

      <WaltrackCard style={styles.reportCard}>
        <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>Monthly Report</Text>
        <View style={styles.metricsGrid}>
          <View style={[styles.metricItem, { borderColor: theme.colors.secondary.border }]}>
            <Text style={[styles.metricLabel, { color: theme.colors.text.secondary }]}>Total Spending</Text>
            <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>{formatCurrency(monthlySpending, currency)}</Text>
          </View>
          <View style={[styles.metricItem, { borderColor: theme.colors.secondary.border }]}>
            <Text style={[styles.metricLabel, { color: theme.colors.text.secondary }]}>Remaining Budget</Text>
            <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>{formatCurrency(remainingBudget, currency)}</Text>
          </View>
          <View style={[styles.metricItem, { borderColor: theme.colors.secondary.border }]}>
            <Text style={[styles.metricLabel, { color: theme.colors.text.secondary }]}>Highest Category</Text>
            <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>{highestCategory.label}</Text>
          </View>
          <View style={[styles.metricItem, { borderColor: theme.colors.secondary.border }]}>
            <Text style={[styles.metricLabel, { color: theme.colors.text.secondary }]}>Avg Daily Spend</Text>
            <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>{formatCurrency(averageDailySpending, currency)}</Text>
          </View>
        </View>
      </WaltrackCard>

      <WaltrackCard style={styles.cardGap}>
        <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>Monthly budget progress</Text>
        <View style={[styles.progressTrack, { backgroundColor: theme.colors.secondary.lightGray }]}>
          <View style={[styles.progressFill, { width: `${budgetProgress * 100}%`, backgroundColor: theme.colors.primary.DEFAULT }]} />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.text.secondary }]}>
          {formatCurrency(monthlySpending, currency)} spent of {formatCurrency(monthlyBudget, currency)}
        </Text>
      </WaltrackCard>

      <WaltrackCard style={styles.cardGap}>
        <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>Category distribution</Text>
        {categoryBreakdown.length ? (
          <>
            <PieChart
              donut
              data={categoryBreakdown}
              radius={88}
              innerRadius={56}
              innerCircleColor={theme.colors.background}
              centerLabelComponent={() => (
                <Text style={[styles.centerPieText, { color: theme.colors.text.primary }]}>{formatCurrency(monthlySpending, currency)}</Text>
              )}
            />
            <View style={styles.categoryWrap}>
              {categoryBreakdown.map((item) => (
                <View key={item.label} style={styles.categoryRow}>
                  <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.categoryLabel, { color: theme.colors.text.secondary }]}>{item.label}</Text>
                  <Text style={[styles.categoryValue, { color: theme.colors.text.primary }]}>{formatCurrency(item.value, currency)}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>No category data for selected month.</Text>
        )}
      </WaltrackCard>

      <WaltrackCard style={styles.cardGap}>
        <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>Weekly spending (selected month)</Text>
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
          xAxisLabelTextStyle={[styles.axisLabel, { color: theme.colors.text.secondary }]}
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
        <Text style={[styles.tipTitle, { color: theme.colors.text.primary }]}>{suggestion.title}</Text>
        <Text style={[styles.tipText, { color: theme.colors.text.secondary, marginTop: 8 }]}>{suggestion.message}</Text>
      </WaltrackCard>

      <WaltrackCard style={styles.exportCard}>
        <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>Export Data</Text>
        <Text style={[styles.exportHint, { color: theme.colors.text.secondary }]}>
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
        {!!exportStatus && <Text style={[styles.exportStatus, { color: theme.colors.primary.dark }]}>{exportStatus}</Text>}
      </WaltrackCard>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  monthToggle: {
    minHeight: 44,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  monthToggleText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  monthPickerCard: {
    marginBottom: 16,
    gap: 8,
  },
  monthOption: {
    minHeight: 44,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  monthOptionActive: {
    // Background color applied inline
  },
  monthOptionText: {
    fontSize: 13,
    lineHeight: 20,
  },
  monthOptionTextActive: {
    fontWeight: '700',
  },
  reportCard: {
    marginBottom: 16,
    gap: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  metricItem: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 4,
    minHeight: 88,
  },
  metricLabel: {
    fontSize: 12,
    lineHeight: 18,
  },
  metricValue: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  cardGap: {
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '600',
  },
  axisLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  progressTrack: {
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 7,
  },
  progressText: {
    fontSize: 13,
    lineHeight: 20,
  },
  centerPieText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    width: 70,
    textAlign: 'center',
  },
  categoryWrap: {
    gap: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
    gap: 8,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryLabel: {
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  categoryValue: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
  },
  tipCard: {
    marginBottom: 16,
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
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '600',
  },
  tipText: {
    fontSize: 13,
    lineHeight: 20,
  },
  exportCard: {
    marginBottom: 32,
    gap: 12,
  },
  exportHint: {
    fontSize: 13,
    lineHeight: 20,
  },
  exportButtonsWrap: {
    gap: 12,
  },
  exportStatus: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
});
