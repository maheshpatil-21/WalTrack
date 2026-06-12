import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { theme } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useExpenseStore } from '../hooks/useExpenseStore';

export default function Index() {
  const { isAuthReady, user } = useAuth();
  const { isReady, userProfile } = useExpenseStore();

  // 1. Wait for Firebase Auth to resolve the session
  if (!isAuthReady) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
      </View>
    );
  }

  // 2. Not logged in → go to login
  if (!user) {
    return <Redirect href="/login" />;
  }

  // 3. Logged in — wait for Firestore data to load
  if (!isReady) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
      </View>
    );
  }

  // 4. Profile not set → onboarding; otherwise → dashboard
  return <Redirect href={userProfile ? '/dashboard' : '/onboarding'} />;
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
