import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { theme } from '../constants/theme';
import { useExpenseStore } from '../hooks/useExpenseStore';

export default function Index() {
  const { isReady, userProfile } = useExpenseStore();

  if (!isReady) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
      </View>
    );
  }

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
