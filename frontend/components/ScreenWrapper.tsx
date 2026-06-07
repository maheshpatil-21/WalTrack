import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../contexts/ThemeContext';

interface Props {
  children: React.ReactNode;
  scrollable?: boolean;
  contentStyle?: ViewStyle;
  /**
   * Safe area edges to apply. Defaults to all edges so screen content is
   * inset correctly on devices with bottom home indicators and on Android
   * edge-to-edge displays.
   */
  edges?: Edge[];
}

// Default edges include bottom so content cannot extend under the bottom tab bar.
const DEFAULT_EDGES: Edge[] = ['top', 'left', 'right', 'bottom'];

export function ScreenWrapper({
  children,
  scrollable = true,
  contentStyle,
  edges = DEFAULT_EDGES,
}: Props) {
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
      <SafeAreaView edges={edges} style={[styles.safeArea, safeAreaStyle]}>
        <View style={[contentStaticStyle, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, safeAreaStyle]}>
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