import React, { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';

import { WaltrackCard } from './WaltrackCard';
import { useTheme } from '../contexts/ThemeContext';

interface LinkItem {
  label: string;
  onPress: () => void;
}

export function AboutCard() {
  const router = useRouter();
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: expanded ? contentHeight : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [expanded, contentHeight, anim]);

  const onContentLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h && h !== contentHeight) setContentHeight(h);
  };

  const links: LinkItem[] = [
    { label: 'Privacy Policy', onPress: () => router.push('/privacy-policy') },
    { label: 'Terms & Conditions', onPress: () => router.push('/terms-conditions') },
    { label: 'Contact Us', onPress: () => router.push('/contact-us') },
    {
      label: 'Send Feedback',
      onPress: () => Linking.openURL('https://forms.gle/Umn63tAkxqViUM5x7'),
    },
  ];

  return (
    <WaltrackCard style={styles.cardWrap}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={styles.titleRow}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>About WalTrack</Text>
        </View>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={theme.colors.text.secondary}
        />
      </Pressable>

      <Animated.View style={[styles.collapsible, { height: anim }]}> 
        {/* Inner measured content */}
        <View onLayout={onContentLayout} style={styles.innerContent}>
          <View style={styles.versionRow}>
            <Text style={[styles.versionLabel, { color: theme.colors.text.secondary }]}>Version</Text>
            <Text style={[styles.versionValue, { color: theme.colors.text.primary }]}>1.0.0</Text>
          </View>

          {links.map((item) => (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.linkRow,
                { borderTopColor: theme.colors.secondary.border },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
            >
              <Text style={[styles.linkText, { color: theme.colors.text.primary }]}>{item.label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.text.secondary} />
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </WaltrackCard>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '600',
  },
  collapsible: {
    overflow: 'hidden',
  },
  innerContent: {
    paddingTop: 12,
    gap: 12,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 28,
  },
  versionLabel: {
    fontSize: 13,
    lineHeight: 20,
  },
  versionValue: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: 'transparent',
  },
  linkText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
});

export default AboutCard;
