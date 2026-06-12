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
    () => getAverageDailySpending(monthExpenses, selectedMonthDate.getFullYear(), selectedMonthDate.getMonth()),
    [monthExpenses, selectedMonthDate]
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

      // Budget health/status removed from PDF per redesign requirements.
      const categoryTableRows = categoryBreakdown
        .map(
          (row) =>
            `<tr>
              <td style="padding: 10px 12px; color:#374151; font-weight:600;">${escapeHtml(row.label)}</td>
              <td style="padding: 10px 12px; text-align:right; color:#111827; font-weight:700;">${formatCurrency(row.value, currency)}</td>
            </tr>`
        )
        .join('');

      const transactionsTableRows = [...expenses]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((expense, idx) => {
          const even = idx % 2 === 0;
          const bg = even ? '#FFFFFF' : '#F9FAFB';
          return `<tr style="background:${bg}">
            <td style="padding: 10px 12px; color:#6B7280; font-weight:600;">${new Date(expense.date).toLocaleDateString('en-US')}</td>
            <td style="padding: 10px 12px; color:#111827; font-weight:700;">
              <span style="display:inline-block; padding:4px 10px; border-radius:999px; background:#ECFDF5; color:#065F46; font-size:12px; font-weight:800; border:1px solid #B7F7DD;">${escapeHtml(expense.category)}</span>
            </td>
            <td style="padding: 10px 12px; text-align:right; color:#111827; font-weight:800;">${formatCurrency(expense.amount, currency)}</td>
            <td style="padding: 10px 12px; color:#374151; font-weight:600;">${escapeHtml(expense.note || '-')}</td>
          </tr>`;
        })
        .join('');

      const donut = (() => {
        const size = 180;
        const stroke = 20;
        const r = (size - stroke) / 2;
        const c = 2 * Math.PI * r;
        const total = monthlySpending;
        const safeTotal = total > 0 ? total : 1;

        let acc = 0;
        const segments = categoryBreakdown.length ? categoryBreakdown : [];

        const rings = segments
          .filter((s) => s.value > 0)
          .map((s, i) => {
            const frac = s.value / safeTotal;
            const dash = frac * c;
            const gap = c - dash;
            const offset = c * (1 - acc);
            acc += frac;
            return `<circle
              cx="${size / 2}" cy="${size / 2}" r="${r}"
              fill="none" stroke="${s.color}"
              stroke-width="${stroke}"
              stroke-dasharray="${dash} ${gap}"
              stroke-dashoffset="-${offset}"
              stroke-linecap="butt"
              transform="rotate(-90 ${size / 2} ${size / 2})" />`;
          })
          .join('');

        return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#E5E7EB" stroke-width="${stroke}" opacity="0.35" />
          ${rings}
          <text x="${size / 2}" y="${size / 2}" text-anchor="middle" dominant-baseline="middle" font-size="14" font-weight="800" fill="#111827">${escapeHtml(
            formatCurrency(monthlySpending, currency)
          )}</text>
        </svg>`;
      })();

      const weeklyBarsSvg = (() => {
        const widthSvg = 520;
        const heightSvg = 190;
        const pad = 18;
        const chartW = widthSvg - pad * 2;
        const chartH = heightSvg - pad * 2;
        const bars = weeklySeries && weeklySeries.length ? weeklySeries : [
          { value: 0, label: 'W1' },
          { value: 0, label: 'W2' },
          { value: 0, label: 'W3' },
          { value: 0, label: 'W4' },
          { value: 0, label: 'W5' },
        ];
        const max = Math.max(...bars.map((b) => b.value), 0);
        const count = bars.length;
        const gap = 10;
        const barW = Math.max(10, Math.floor((chartW - gap * (count - 1)) / count));
        const totalNeeded = barW * count + gap * (count - 1);
        const startX = pad + Math.max(0, Math.floor((chartW - totalNeeded) / 2));
        const color = '#10B981';

        const rects = bars
          .map((b, i) => {
            const frac = max > 0 ? b.value / max : 0;
            const h = Math.round(frac * chartH);
            const x = startX + i * (barW + gap);
            const y = pad + (chartH - h);
            return `<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="8" ry="8" fill="${color}" opacity="0.95" />`;
          })
          .join('');

        const axisY = pad + chartH;

        return `<div style="display:flex; flex-direction:column; align-items:stretch; gap:6px;">
          <svg width="${widthSvg}" height="${heightSvg}" viewBox="0 0 ${widthSvg} ${heightSvg}" xmlns="http://www.w3.org/2000/svg">
            <line x1="${pad}" y1="${axisY}" x2="${pad + chartW}" y2="${axisY}" stroke="#E5E7EB" stroke-width="1" />
            ${rects}
          </svg>
          <div style="display:grid; grid-template-columns: repeat(${count}, 1fr); gap: 10px;">
            ${bars
              .map(
                (b) =>
                  `<div style="text-align:center; font-size:12px; font-weight:800; color:#6B7280;">${escapeHtml(
                    b.label
                  )}</div>`
              )
              .join('')}
          </div>
        </div>`;
      })();

      const categoryCard = categoryBreakdown.length
        ? `<table style="width:100%; border-collapse:collapse; margin-top:12px;">
            <thead>
              <tr>
                <th style="text-align:left; padding:10px 12px; font-size:12px; letter-spacing:0.2px; color:#6B7280;">Category</th>
                <th style="text-align:right; padding:10px 12px; font-size:12px; letter-spacing:0.2px; color:#6B7280;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${categoryTableRows}
            </tbody>
          </table>`
        : `<div style="margin-top:12px; color:#6B7280; font-weight:700; font-size:13px;">No category data</div>`;

      const budgetUsagePct = monthlyBudget > 0 ? Math.round((monthlySpending / monthlyBudget) * 100) : 0;
      const budgetUsagePctClamped = Math.max(0, Math.min(100, budgetUsagePct));

      const html = `
        <html>
          <body style="font-family: Arial, Helvetica, sans-serif; margin:0; padding: 28px; color:#111827; background:#FFFFFF;">
            <div style="max-width: 980px; margin: 0 auto;">
              <!-- HERO -->
              <div style="border:1px solid #E5E7EB; border-radius: 18px; padding: 22px 22px; background: linear-gradient(180deg, #ECFDF5 0%, #FFFFFF 65%);">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;">
                  <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:44px; height:44px; border-radius:14px; background:#10B981; display:flex; align-items:center; justify-content:center; font-weight:900; color:#FFFFFF;">W</div>
                    <div>
                      <div style="font-size:14px; font-weight:800; color:#065F46; letter-spacing:0.4px;">WALTRACK</div>
                      <div style="font-size:22px; font-weight:900; line-height: 28px;">Expense Report</div>
                      <div style="font-size:12px; font-weight:800; color:#6B7280; margin-top:2px;">Your spending summary and insights</div>
                    </div>
                  </div>
                  <div style="text-align:right; min-width: 260px;">
                    <div style="font-size:12px; font-weight:800; color:#6B7280;">Generated</div>
                    <div style="font-size:13px; font-weight:800; color:#111827; margin-top:2px;">${escapeHtml(new Date().toLocaleString())}</div>
                  </div>
                </div>
              </div>

              <!-- GRID: PROFILE + INSIGHTS CARDS -->
              <div style="display:grid; grid-template-columns: 1fr; gap: 14px; margin-top: 16px;">
                <!-- PROFILE CARD -->
                <div style="border:1px solid #E5E7EB; border-radius: 16px; padding: 16px; background:#FFFFFF;">
                  <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
                    <div>
                      <div style="font-size:14px; font-weight:900; color:#111827;">Profile</div>
                      <div style="font-size:12px; font-weight:800; color:#6B7280; margin-top:2px;">Account details used for this report</div>
                    </div>
                    <div style="font-size:12px; font-weight:900; color:#10B981;">${escapeHtml(selectedMonth?.label ?? 'N/A')}</div>
                  </div>

                  <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top: 14px;">
                    <div style="border:1px solid #E5E7EB; border-radius: 14px; padding: 12px; background:#F9FAFB;">
                      <div style="font-size:11px; font-weight:900; color:#6B7280;">NAME</div>
                      <div style="font-size:14px; font-weight:900; color:#111827; margin-top:6px;">${escapeHtml(userProfile?.name ?? '-')}</div>
                    </div>
                    <div style="border:1px solid #E5E7EB; border-radius: 14px; padding: 12px; background:#F9FAFB;">
                      <div style="font-size:11px; font-weight:900; color:#6B7280;">EMAIL</div>
                      <div style="font-size:14px; font-weight:900; color:#111827; margin-top:6px;">${escapeHtml(userProfile?.email ?? '-')}</div>
                    </div>
                    <div style="border:1px solid #E5E7EB; border-radius: 14px; padding: 12px; background:#F9FAFB;">
                      <div style="font-size:11px; font-weight:900; color:#6B7280;">MOBILE</div>
                      <div style="font-size:14px; font-weight:900; color:#111827; margin-top:6px;">${escapeHtml(userProfile?.phone ?? '-')}</div>
                    </div>
                    <div style="border:1px solid #E5E7EB; border-radius: 14px; padding: 12px; background:#F9FAFB;">
                      <div style="font-size:11px; font-weight:900; color:#6B7280;">AGE</div>
                      <div style="font-size:14px; font-weight:900; color:#111827; margin-top:6px;">${escapeHtml(String(userProfile?.age ?? '-'))}</div>
                    </div>
                  </div>
                </div>

                <!-- INSIGHT CARDS ROW -->
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 14px; page-break-inside: avoid;">
                  <div style="border:1px solid #E5E7EB; border-radius: 16px; padding: 16px; background:#FFFFFF; page-break-inside: avoid;">
                    <div style="display:flex; align-items:center; justify-content:space-between;">
                      <div>
                        <div style="font-size:12px; font-weight:900; color:#6B7280;">Total Spending</div>
                        <div style="font-size:26px; font-weight:1000; color:#10B981; margin-top: 8px;">${formatCurrency(monthlySpending, currency)}</div>
                      </div>
                      <div style="width:36px; height:36px; border-radius: 14px; background:#ECFDF5; display:flex; align-items:center; justify-content:center; font-weight:900; color:#065F46;">₹</div>
                    </div>
                  </div>

                  <div style="border:1px solid #E5E7EB; border-radius: 16px; padding: 16px; background:#FFFFFF; page-break-inside: avoid;">
                    <div style="display:flex; align-items:center; justify-content:space-between;">
                      <div>
                        <div style="font-size:12px; font-weight:900; color:#6B7280;">Remaining Budget</div>
                        <div style="font-size:26px; font-weight:1000; color:#111827; margin-top: 8px;">${formatCurrency(remainingBudget, currency)}</div>
                      </div>
                      <div style="width:36px; height:36px; border-radius: 14px; background:#F3F4F6; display:flex; align-items:center; justify-content:center; font-weight:900; color:#374151;">◎</div>
                    </div>
                  </div>

                  <div style="border:1px solid #E5E7EB; border-radius: 16px; padding: 16px; background:#FFFFFF; page-break-inside: avoid;">
                    <div style="display:flex; align-items:center; justify-content:space-between;">
                      <div>
                        <div style="font-size:12px; font-weight:900; color:#6B7280;">Highest Spending Category</div>
                        <div style="font-size:18px; font-weight:1000; color:#111827; margin-top: 8px;">${escapeHtml(highestCategory.label)}</div>
                        <div style="font-size:14px; font-weight:900; color:#10B981; margin-top: 2px;">${formatCurrency(highestCategory.value, currency)}</div>
                      </div>
                      <div style="width:36px; height:36px; border-radius: 14px; background:#ECFDF5; display:flex; align-items:center; justify-content:center; font-weight:900; color:#065F46;">★</div>
                    </div>
                  </div>

                  <div style="border:1px solid #E5E7EB; border-radius: 16px; padding: 16px; background:#FFFFFF; page-break-inside: avoid;">
                    <div style="display:flex; align-items:center; justify-content:space-between;">
                      <div>
                        <div style="font-size:12px; font-weight:900; color:#6B7280;">Average Daily Spending</div>
                        <div style="font-size:26px; font-weight:1000; color:#10B981; margin-top: 8px;">${formatCurrency(averageDailySpending, currency)}</div>
                      </div>
                      <div style="width:36px; height:36px; border-radius: 14px; background:#ECFDF5; display:flex; align-items:center; justify-content:center; font-weight:900; color:#065F46;">⏱</div>
                    </div>
                  </div>
                </div>

                <!-- CATEGORY DISTRIBUTION + DONUT -->
                <div style="border:1px solid #E5E7EB; border-radius: 16px; padding: 16px; background:#FFFFFF; page-break-inside: avoid;">
                  <div style="display:flex; align-items:center; justify-content:space-between; gap: 10px; flex-wrap:wrap;">
                    <div>
                      <div style="font-size:14px; font-weight:1000; color:#111827;">Category Distribution</div>
                      <div style="font-size:12px; font-weight:800; color:#6B7280; margin-top:4px;">Category + amount</div>
                    </div>
                  </div>
                  <div style="display:flex; align-items:center; gap:18px; margin-top: 14px; page-break-inside: avoid;">
                    <div style="flex:0 0 240px; display:flex; align-items:center; justify-content:center; border:1px solid #E5E7EB; border-radius: 16px; padding: 8px; background: linear-gradient(180deg, #ECFDF5 0%, #FFFFFF 70%); page-break-inside: avoid;">
                      ${donut}
                    </div>
                    <div style="flex:1; page-break-inside: avoid;">
                      ${categoryCard}
                    </div>
                  </div>
                </div>

                <!-- TRANSACTIONS -->
                <div style="border:1px solid #E5E7EB; border-radius: 16px; padding: 16px; background:#FFFFFF;">
                  <div style="font-size:14px; font-weight:1000; color:#111827;">Transactions</div>
                  <div style="font-size:12px; font-weight:800; color:#6B7280; margin-top:4px;">Latest expenses first • unlimited rows supported</div>

                  <table style="width:100%; border-collapse:collapse; margin-top: 6px;">
                    <thead>
                      <tr>
                        <th style="text-align:left; padding:10px 12px; font-size:12px; color:#6B7280; border-bottom:1px solid #E5E7EB;">Date</th>
                        <th style="text-align:left; padding:10px 12px; font-size:12px; color:#6B7280; border-bottom:1px solid #E5E7EB;">Category</th>
                        <th style="text-align:right; padding:10px 12px; font-size:12px; color:#6B7280; border-bottom:1px solid #E5E7EB;">Amount</th>
                        <th style="text-align:left; padding:10px 12px; font-size:12px; color:#6B7280; border-bottom:1px solid #E5E7EB;">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${transactionsTableRows || '<tr><td colspan="4" style="padding:16px; font-weight:800; color:#6B7280;">No transactions available</td></tr>'}
                    </tbody>
                  </table>
                </div>

              </div>

              <!-- FOOTER -->
              <div style="margin-top: 18px; padding: 18px 12px; text-align:center; color:#6B7280; page-break-inside: avoid;">
                <div style="font-size:14px; font-weight:1000; color:#111827;">Thank you for using WalTrack!</div>
                <div style="font-size:12px; font-weight:900; margin-top:6px;">Track smarter. Spend wiser.</div>
              </div>
            </div>
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
