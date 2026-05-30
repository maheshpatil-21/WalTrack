import { useRouter } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenWrapper } from '../components/ScreenWrapper';
import { WaltrackCard } from '../components/WaltrackCard';
import { useTheme } from '../contexts/ThemeContext';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { theme } = useTheme();

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
    sectionWrap: {
      gap: 8,
    },
    sectionTitle: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '700',
      color: theme.colors.text.primary,
    },
    sectionText: {
      fontSize: 14,
      lineHeight: 22,
      color: theme.colors.text.secondary,
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
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.subtitle}>How WalTrack handles your data and privacy.</Text>
      </View>

      <WaltrackCard style={styles.contentCard}>
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Introduction</Text>
          <Text style={styles.sectionText}>
            WalTrack is a personal expense tracker designed to keep your financial details private and local. This policy explains how we collect, use, and store your information.
          </Text>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Data Storage</Text>
          <Text style={styles.sectionText}>
            Expense data is stored locally on your device. WalTrack does not sell personal data to third parties, and your information remains under your control.
          </Text>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Text style={styles.sectionText}>
            WalTrack uses notifications only for reminders. We do not use notifications for marketing or tracking purposes.
          </Text>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>User Control</Text>
          <Text style={styles.sectionText}>
            You may delete app data at any time. All stored expense information is managed on your device, and you can remove it through app settings or device storage controls.
          </Text>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.sectionText}>
            For support or privacy questions, contact us at waltrack.official@gmail.com.
          </Text>
        </View>
      </WaltrackCard>
    </ScreenWrapper>
  );
}
