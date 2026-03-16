import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { theme } from '../constants/theme';

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
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
          styles.button,
          pressed && !disabled && styles.buttonPressed,
          disabled && styles.buttonDisabled,
        ]}
      >
        <Text style={styles.text}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.s6,
    paddingVertical: theme.spacing.s3,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.secondary.border,
  },
  text: {
    color: theme.colors.text.inverse,
    fontSize: 16,
    fontWeight: '700',
  },
});
