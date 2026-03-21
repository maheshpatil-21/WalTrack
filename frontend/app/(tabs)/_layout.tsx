import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { theme } from '../../constants/theme';
import { useExpenseStore } from '../../hooks/useExpenseStore';

export default function TabsLayout() {
  const { isReady, userProfile } = useExpenseStore();

  if (!isReady) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
      </View>
    );
  }

  if (!userProfile) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary.DEFAULT,
        tabBarInactiveTintColor: theme.colors.secondary.gray,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.secondary.border,
          height: 68,
          paddingTop: 6,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarButtonTestID: 'tab-dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-expense"
        options={{
          title: 'Add Expense',
          tabBarButtonTestID: 'tab-add-expense',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="plus-circle" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarButtonTestID: 'tab-transactions',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="format-list-bulleted" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarButtonTestID: 'tab-insights',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-box-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarButtonTestID: 'tab-settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});
