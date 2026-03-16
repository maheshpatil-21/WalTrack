import { Stack } from 'expo-router';

import { ExpenseProvider } from '../hooks/useExpenseStore';

export default function RootLayout() {
  return (
    <ExpenseProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ExpenseProvider>
  );
}
