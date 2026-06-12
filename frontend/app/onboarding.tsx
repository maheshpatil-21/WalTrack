import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScaleButton } from '../components/ScaleButton';
import { WaltrackCard } from '../components/WaltrackCard';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useExpenseStore } from '../hooks/useExpenseStore';

export default function OnboardingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { setUserProfile } = useExpenseStore();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [college, setCollege] = useState('');
  const [error, setError] = useState('');

  const isFormFilled = useMemo(
    () => name.trim() && phone.trim() && age.trim() && college.trim(),
    [name, phone, age, college]
  );

  const submitProfile = async () => {
    const validPhone = /^[0-9]{10}$/.test(phone.trim());
    const parsedAge = Number(age);
    const validAge = Number.isFinite(parsedAge) && parsedAge > 0 && parsedAge < 120;

    if (!isFormFilled) {
      setError('Please fill in all fields.');
      return;
    }
    if (!validPhone) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!validAge) {
      setError('Please enter a valid age.');
      return;
    }

    await setUserProfile({
      name: name.trim(),
      email: user?.email ?? '',
      phone: phone.trim(),
      age: parsedAge,
      college: college.trim(),
    });

    router.replace('/dashboard');
  };

  const s = StyleSheet.create({
    outer: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 32,
    },
    headerWrap: { gap: 6, marginBottom: 24 },
    logoText: { ...theme.typography.h1, color: theme.colors.text.primary },
    logoDot: { color: theme.colors.primary.DEFAULT },
    subtitle: { ...theme.typography.body, color: theme.colors.text.secondary },
    emailNote: { ...theme.typography.bodySm, color: theme.colors.text.secondary, marginTop: 4 },
    emailValue: { fontWeight: '700', color: theme.colors.text.primary },
    formCard: { gap: theme.spacing.s4 },
    fieldWrap: { gap: theme.spacing.s2 },
    label: { ...theme.typography.bodySm, color: theme.colors.text.secondary, fontWeight: '600' },
    input: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: theme.colors.secondary.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.s3,
      color: theme.colors.text.primary,
      ...theme.typography.body,
    },
    errorText: { ...theme.typography.bodySm, color: theme.colors.danger },
  });

  return (
    <View style={s.outer}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.headerWrap}>
            <Text style={s.logoText}>
              Waltrack<Text style={s.logoDot}>.</Text>
            </Text>
            <Text style={s.subtitle}>Complete your profile to start tracking smarter.</Text>
            {!!user?.email && (
              <Text style={s.emailNote}>
                Signed in as <Text style={s.emailValue}>{user.email}</Text>
              </Text>
            )}
          </View>

          <WaltrackCard style={s.formCard}>
            <View style={s.fieldWrap}>
              <Text style={s.label}>Full Name</Text>
              <TextInput
                testID="onboarding-name-input"
                accessibilityLabel="Enter your full name"
                value={name}
                onChangeText={(v) => { setError(''); setName(v); }}
                style={s.input}
                placeholder="Your full name"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>

            <View style={s.fieldWrap}>
              <Text style={s.label}>Mobile Number</Text>
              <TextInput
                testID="onboarding-phone-input"
                accessibilityLabel="Enter your mobile number"
                value={phone}
                onChangeText={(v) => { setError(''); setPhone(v.replace(/[^0-9]/g, '')); }}
                keyboardType="phone-pad"
                style={s.input}
                placeholder="10-digit mobile number"
                placeholderTextColor={theme.colors.text.secondary}
                maxLength={10}
              />
            </View>

            <View style={s.fieldWrap}>
              <Text style={s.label}>Age</Text>
              <TextInput
                testID="onboarding-age-input"
                accessibilityLabel="Enter your age"
                value={age}
                onChangeText={(v) => { setError(''); setAge(v.replace(/[^0-9]/g, '')); }}
                keyboardType="numeric"
                style={s.input}
                placeholder="Your age"
                placeholderTextColor={theme.colors.text.secondary}
                maxLength={3}
              />
            </View>

            <View style={s.fieldWrap}>
              <Text style={s.label}>College / City</Text>
              <TextInput
                testID="onboarding-college-input"
                accessibilityLabel="Enter your college or city"
                value={college}
                onChangeText={(v) => { setError(''); setCollege(v); }}
                style={s.input}
                placeholder="e.g. IIT Delhi or Mumbai"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>

            {!!error && <Text style={s.errorText}>{error}</Text>}

            <ScaleButton
              label="Start Using Waltrack"
              onPress={submitProfile}
              testID="onboarding-submit"
              accessibilityLabel="Start using Waltrack"
            />
          </WaltrackCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
