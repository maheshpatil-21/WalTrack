import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScaleButton } from '../components/ScaleButton';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { WaltrackCard } from '../components/WaltrackCard';
import { useTheme } from '../contexts/ThemeContext';
import { useExpenseStore } from '../hooks/useExpenseStore';

export default function OnboardingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { setUserProfile } = useExpenseStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');

  const isFormFilled = useMemo(
    () => name.trim() && email.trim() && phone.trim() && age.trim(),
    [name, email, phone, age]
  );

  const submitProfile = async () => {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const validPhone = /^[0-9]+$/.test(phone.trim());
    const parsedAge = Number(age);
    const validAge = Number.isFinite(parsedAge) && parsedAge > 0;

    if (!isFormFilled || !validEmail || !validPhone || !validAge) {
      setError('Please complete all fields with valid details.');
      return;
    }

    await setUserProfile({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      age: parsedAge,
    });
    router.replace('/dashboard');
  };

  const styles = StyleSheet.create({
    container: {
      justifyContent: 'center',
    },
    keyboardWrap: {
      gap: theme.spacing.s6,
    },
    headerWrap: {
      gap: theme.spacing.s2,
    },
    logoText: {
      ...theme.typography.h1,
      color: theme.colors.text.primary,
    },
    logoDot: {
      color: theme.colors.primary.DEFAULT,
    },
    subtitle: {
      ...theme.typography.body,
      color: theme.colors.text.secondary,
    },
    formCard: {
      gap: theme.spacing.s4,
      borderRadius: theme.radius.xl,
    },
    fieldWrap: {
      gap: theme.spacing.s2,
    },
    label: {
      ...theme.typography.bodySm,
      color: theme.colors.text.secondary,
      fontWeight: '600',
    },
    input: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: theme.colors.secondary.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.s3,
      color: theme.colors.text.primary,
      ...theme.typography.body,
    },
    errorText: {
      ...theme.typography.bodySm,
      color: theme.colors.danger,
    },
  });

  return (
    <ScreenWrapper scrollable={false} contentStyle={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardWrap}>
        <View style={styles.headerWrap}>
          <Text style={styles.logoText}>
            Waltrack<Text style={styles.logoDot}>.</Text>
          </Text>
          <Text style={styles.subtitle}>Set up your profile to start tracking smarter.</Text>
        </View>

        <WaltrackCard style={styles.formCard}>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              testID="onboarding-name-input"
              accessibilityLabel="Enter your name"
              value={name}
              onChangeText={(value) => {
                setError('');
                setName(value);
              }}
              style={styles.input}
              placeholder="Your full name"
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Email ID</Text>
            <TextInput
              testID="onboarding-email-input"
              accessibilityLabel="Enter your email"
              value={email}
              onChangeText={(value) => {
                setError('');
                setEmail(value);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              placeholder="you@example.com"
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              testID="onboarding-phone-input"
              accessibilityLabel="Enter your mobile number"
              value={phone}
              onChangeText={(value) => {
                setError('');
                setPhone(value.replace(/[^0-9]/g, ''));
              }}
              keyboardType="phone-pad"
              style={styles.input}
              placeholder="9876543210"
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              testID="onboarding-age-input"
              accessibilityLabel="Enter your age"
              value={age}
              onChangeText={(value) => {
                setError('');
                setAge(value.replace(/[^0-9]/g, ''));
              }}
              keyboardType="numeric"
              style={styles.input}
              placeholder="21"
            />
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <ScaleButton
            label="Start Using Waltrack"
            onPress={submitProfile}
            testID="onboarding-submit"
            accessibilityLabel="Start using Waltrack"
          />
        </WaltrackCard>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
