import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../contexts/ThemeContext';

interface Props {
  children: React.ReactNode;
  scrollable?: boolean;
  contentStyle?: ViewStyle;
}

export function ScreenWrapper({ children, scrollable = true, contentStyle }: Props) {
  const { theme } = useTheme();

  const safeAreaStyle = {
    backgroundColor: theme.colors.background,
  };

  const contentContainerStyle = {
    ...styles.content,
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s6,
    paddingBottom: theme.spacing.s6,
  };

  const contentStaticStyle = {
    ...styles.contentStatic,
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s6,
    paddingBottom: theme.spacing.s6,
  };

  if (!scrollable) {
    return (
      <SafeAreaView style={[styles.safeArea, safeAreaStyle]}>
        <View style={[contentStaticStyle, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, safeAreaStyle]}>
      <ScrollView
        contentContainerStyle={[contentContainerStyle, contentStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  contentStatic: {
    flex: 1,
  },
});
