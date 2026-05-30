import { useRouter } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenWrapper } from '../components/ScreenWrapper';
import { WaltrackCard } from '../components/WaltrackCard';
import { useTheme } from '../contexts/ThemeContext';

export default function TermsConditionsScreen() {
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
        <Text style={styles.title}>Terms & Conditions</Text>
        <Text style={styles.subtitle}>The terms for using WalTrack responsibly.</Text>
      </View>

      <WaltrackCard style={styles.contentCard}>
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Acceptance of Terms</Text>
          <Text style={styles.sectionText}>
            By using WalTrack, you agree to these terms and to use the app for personal expense tracking only.
          </Text>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>App Usage</Text>
          <Text style={styles.sectionText}>
            WalTrack is a personal expense tracking tool. It is intended to help you manage and review your own financial records.
          </Text>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>User Responsibilities</Text>
          <Text style={styles.sectionText}>
            You are responsible for verifying your financial records and maintaining accurate expense information within the app.
          </Text>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Limitation of Liability</Text>
          <Text style={styles.sectionText}>
            WalTrack does not provide financial, legal, tax, or investment advice. The app is provided as-is, and we are not responsible for user decisions.
          </Text>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Updates</Text>
          <Text style={styles.sectionText}>
            We may update these terms periodically. Continued use of WalTrack after updates means you accept the revised terms.
          </Text>
        </View>
      </WaltrackCard>
    </ScreenWrapper>
  );
}
