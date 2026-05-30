import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
}

export function ScaleButton({
  label,
  onPress,
  disabled = false,
  style,
  testID,
  accessibilityLabel,
}: Props) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const buttonStyle = {
    minHeight: 48,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary.DEFAULT,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: theme.spacing.s6,
    paddingVertical: theme.spacing.s3,
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: theme.colors.secondary.border,
  };

  const textStyle = {
    color: theme.colors.text.inverse,
    fontSize: 16,
    fontWeight: '700' as const,
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 13, stiffness: 220 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 13, stiffness: 220 });
        }}
        style={({ pressed }) => [
          buttonStyle,
          pressed && !disabled && { opacity: 0.92 },
          disabled && disabledButtonStyle,
        ]}
      >
        <Text style={textStyle}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}
