import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ExpenseProvider } from '../hooks/useExpenseStore';
import { trackFirstInstall } from '../utils/installTracking';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function RootNavigator() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const nextRoute = response.notification.request.content.data?.route;
      if (typeof nextRoute === 'string') {
        router.push(nextRoute as '/add-expense');
      } else {
        router.push('/add-expense');
      }
    });
    return () => subscription.remove();
  }, [router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  useEffect(() => {
    void trackFirstInstall();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ExpenseProvider>
          <RootNavigator />
        </ExpenseProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
