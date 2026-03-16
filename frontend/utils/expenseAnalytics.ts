import { categoryColorMap, Category, Currency, Expense } from '../types/expense';

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
