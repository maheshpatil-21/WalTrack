export const CATEGORY_OPTIONS = [
  'Food',
  'Travel',
  'Shopping',
  'Entertainment',
  'Others',
] as const;

export type Category = (typeof CATEGORY_OPTIONS)[number];

export type Currency = 'INR' | 'USD';

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  note: string;
  date: string;
}

export interface NewExpense {
  amount: number;
  category: Category;
  note: string;
}

export const categoryIconMap: Record<Category, string> = {
  Food: 'food-apple-outline',
  Travel: 'airplane',
  Shopping: 'shopping-outline',
  Entertainment: 'movie-open-outline',
  Others: 'dots-horizontal-circle-outline',
};

export const categoryColorMap: Record<Category, string> = {
  Food: '#10B981',
  Travel: '#34D399',
  Shopping: '#06B6D4',
  Entertainment: '#8B5CF6',
  Others: '#9CA3AF',
};
