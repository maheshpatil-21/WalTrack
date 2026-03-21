import { categoryColorMap, Category, Currency, Expense } from '../types/expense';

export interface MonthOption {
  key: string;
  year: number;
  month: number;
  label: string;
}

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function formatCurrency(value: number, currency: Currency) {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function getMonthlySpending(expenses: Expense[], baseDate = new Date()) {
  return expenses
    .filter((expense) => isSameMonth(new Date(expense.date), baseDate))
    .reduce((sum, expense) => sum + expense.amount, 0);
}

export function getTodaySpending(expenses: Expense[], baseDate = new Date()) {
  return expenses
    .filter((expense) => isSameDate(new Date(expense.date), baseDate))
    .reduce((sum, expense) => sum + expense.amount, 0);
}

export function getCategoryBreakdown(expenses: Expense[], baseDate = new Date()) {
  const grouped = expenses
    .filter((expense) => isSameMonth(new Date(expense.date), baseDate))
    .reduce<Record<Category, number>>(
      (acc, expense) => {
        acc[expense.category] += expense.amount;
        return acc;
      },
      {
        Food: 0,
        Travel: 0,
        Shopping: 0,
        Entertainment: 0,
        Others: 0,
      }
    );

  return (Object.keys(grouped) as Category[])
    .filter((key) => grouped[key] > 0)
    .map((key) => ({
      label: key,
      value: grouped[key],
      color: categoryColorMap[key],
    }));
}

export function getLast7DaysSeries(expenses: Expense[], baseDate = new Date()) {
  const data = [];
  const cursor = new Date(baseDate);

  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(cursor);
    day.setDate(cursor.getDate() - i);
    const total = expenses
      .filter((expense) => isSameDate(new Date(expense.date), day))
      .reduce((sum, expense) => sum + expense.amount, 0);
    data.push({
      value: total,
      label: day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
      fullDay: day.toLocaleDateString('en-US', { weekday: 'long' }),
    });
  }
  return data;
}

export function getHighestSpendDay(expenses: Expense[]) {
  const series = getLast7DaysSeries(expenses);
  return series.reduce(
    (prev, current) => (current.value > prev.value ? current : prev),
    series[0] ?? { value: 0, label: '-', fullDay: 'No data' }
  );
}

export function getBudgetSuggestion(monthlyBudget: number, monthlySpent: number) {
  const utilization = monthlyBudget > 0 ? monthlySpent / monthlyBudget : 0;

  if (utilization >= 1) {
    return {
      tone: 'danger' as const,
      title: 'Budget exceeded',
      message: 'You crossed your monthly budget. Pause non-essential purchases this week.',
    };
  }

  if (utilization >= 0.8) {
    return {
      tone: 'warning' as const,
      title: 'Approaching budget limit',
      message: 'Keep your next 3 days lean to stay on track this month.',
    };
  }

  return {
    tone: 'good' as const,
    title: 'Nice pace',
    message: 'You are spending within your budget. Keep this momentum going.',
  };
}

export function getAvailableMonths(expenses: Expense[]) {
  const map = new Map<string, MonthOption>();

  expenses.forEach((expense) => {
    const date = new Date(expense.date);
    const key = monthKey(date.getFullYear(), date.getMonth());
    if (!map.has(key)) {
      map.set(key, {
        key,
        year: date.getFullYear(),
        month: date.getMonth(),
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      });
    }
  });

  if (!map.size) {
    const now = new Date();
    const nowKey = monthKey(now.getFullYear(), now.getMonth());
    map.set(nowKey, {
      key: nowKey,
      year: now.getFullYear(),
      month: now.getMonth(),
      label: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    });
  }

  return [...map.values()].sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return b.month - a.month;
  });
}

export function getExpensesForMonth(expenses: Expense[], month: MonthOption) {
  return expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getFullYear() === month.year && expenseDate.getMonth() === month.month;
  });
}

export function getHighestCategory(categoryData: { label: string; value: number }[]) {
  if (!categoryData.length) {
    return { label: 'N/A', value: 0 };
  }
  return categoryData.reduce((prev, current) => (current.value > prev.value ? current : prev), categoryData[0]);
}

export function getAverageDailySpending(total: number, year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return daysInMonth > 0 ? total / daysInMonth : 0;
}

export function getWeeklySpendingForMonth(expenses: Expense[]) {
  const buckets = [0, 0, 0, 0, 0];

  expenses.forEach((expense) => {
    const dayOfMonth = new Date(expense.date).getDate();
    const bucketIndex = Math.min(Math.floor((dayOfMonth - 1) / 7), 4);
    buckets[bucketIndex] += expense.amount;
  });

  return buckets.map((value, index) => ({
    value,
    label: `W${index + 1}`,
  }));
}
