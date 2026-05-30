import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function WaltrackCard({ children, style }: Props) {
  const { theme, mode } = useTheme();

  const cardStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.secondary.border,
    padding: theme.spacing.s4,
    shadowColor: mode === 'dark' ? '#00000080' : '#00000010',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  };

  return <View style={[cardStyle, style]}>{children}</View>;
}
