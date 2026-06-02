import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ScaleButton } from '../components/ScaleButton';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { WaltrackCard } from '../components/WaltrackCard';
import { useTheme } from '../contexts/ThemeContext';

const SUPPORT_EMAIL = 'waltrack.official@gmail.com';

export default function ContactUsScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const sendEmail = async () => {
    const url = `mailto:${SUPPORT_EMAIL}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch {
      // Intentionally silent; mailto will be handled by the device if supported.
    }
  };

  const styles = StyleSheet.create({
    headerWrap: {
      marginBottom: 18,
      gap: 8,
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    backText: {
      color: theme.colors.primary.DEFAULT,
      fontSize: 15,
      fontWeight: '600',
    },
    title: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '700',
      color: theme.colors.text.primary,
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 20,
      color: theme.colors.text.secondary,
    },
    contentCard: {
      gap: 18,
    },
    fieldRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    label: {
      fontSize: 13,
      lineHeight: 20,
      color: theme.colors.text.secondary,
    },
    value: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '700',
      color: theme.colors.text.primary,
      textAlign: 'right',
    },
    emailText: {
      fontSize: 14,
      lineHeight: 22,
      color: theme.colors.primary.DEFAULT,
      marginTop: 6,
    },
    actionRow: {
      marginTop: 6,
      alignItems: 'flex-start',
    },
  });

  return (
    <ScreenWrapper>
      <View style={styles.headerWrap}>
        <Pressable
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.backRow}
        >
          <MaterialCommunityIcons name="chevron-left" size={20} color={theme.colors.primary.DEFAULT} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Contact Us</Text>
        <Text style={styles.subtitle}>Get in touch with WalTrack support.</Text>
      </View>

      <WaltrackCard style={styles.contentCard}>
        <View style={styles.fieldRow}>
          <Text style={styles.label}>App Name</Text>
          <Text style={styles.value}>WalTrack</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.label}>Version</Text>
          <Text style={styles.value}>1.0.0</Text>
        </View>

        <View style={[styles.fieldRow, { flexDirection: 'column', alignItems: 'flex-start' }]}> 
          <Text style={styles.label}>Support Email</Text>
          <Text style={styles.emailText}>{SUPPORT_EMAIL}</Text>
        </View>

        <View style={styles.actionRow}>
          <ScaleButton
            label="Send Email"
            onPress={sendEmail}
            accessibilityLabel="Send an email to WalTrack support"
          />
        </View>
      </WaltrackCard>
    </ScreenWrapper>
  );
}
