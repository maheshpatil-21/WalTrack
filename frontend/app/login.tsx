import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WaltrackCard } from '../components/WaltrackCard';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

function parseFirebaseError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { signUp, signIn } = useAuth();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const switchMode = (next: 'signup' | 'signin') => {
    clearForm();
    setMode(next);
  };

  const handleSubmit = async () => {
    setError('');
    const trimEmail = email.trim().toLowerCase();
    const trimPass = password.trim();

    if (!trimEmail || !trimPass) {
      setError('Please fill in all fields.');
      return;
    }

    if (mode === 'signup') {
      if (trimPass !== confirmPassword.trim()) {
        setError('Passwords do not match.');
        return;
      }
      if (trimPass.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUp(trimEmail, trimPass);
      } else {
        await signIn(trimEmail, trimPass);
      }
      // AuthContext user state updates → index.tsx handles routing
      router.replace('/');
    } catch (e: any) {
      const code = e?.code ?? '';
      setError(parseFirebaseError(code));
    } finally {
      setLoading(false);
    }
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
    header: { gap: 6, marginBottom: 28 },
    logo: { ...theme.typography.h1, color: theme.colors.text.primary },
    logoDot: { color: theme.colors.primary.DEFAULT },
    subtitle: { ...theme.typography.body, color: theme.colors.text.secondary },
    tabRow: {
      flexDirection: 'row',
      backgroundColor: theme.colors.secondary.lightGray,
      borderRadius: 999,
      padding: 4,
      marginBottom: 20,
    },
    tab: {
      flex: 1,
      minHeight: 40,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabActive: { backgroundColor: theme.colors.background },
    tabText: { ...theme.typography.bodySm, fontWeight: '600', color: theme.colors.text.secondary },
    tabTextActive: { color: theme.colors.primary.dark },
    card: { gap: 16 },
    fieldWrap: { gap: 6 },
    label: { ...theme.typography.bodySm, fontWeight: '600', color: theme.colors.text.secondary },
    input: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: theme.colors.secondary.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: 14,
      color: theme.colors.text.primary,
      ...theme.typography.body,
    },
    errorText: { ...theme.typography.bodySm, color: theme.colors.danger },
    btn: {
      minHeight: 50,
      borderRadius: 999,
      backgroundColor: theme.colors.primary.DEFAULT,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    btnText: { ...theme.typography.body, fontWeight: '700', color: theme.colors.text.inverse },
    switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 4 },
    switchText: { ...theme.typography.bodySm, color: theme.colors.text.secondary },
    switchLink: { ...theme.typography.bodySm, fontWeight: '700', color: theme.colors.primary.DEFAULT },
  });

  return (
    <View style={s.outer}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.header}>
            <Text style={s.logo}>Waltrack<Text style={s.logoDot}>.</Text></Text>
            <Text style={s.subtitle}>
              {mode === 'signup' ? 'Create an account to start tracking.' : 'Welcome back. Sign in to continue.'}
            </Text>
          </View>

          <View style={s.tabRow}>
            {(['signup', 'signin'] as const).map((tab) => (
              <Pressable key={tab} style={[s.tab, mode === tab && s.tabActive]} onPress={() => switchMode(tab)}>
                <Text style={[s.tabText, mode === tab && s.tabTextActive]}>
                  {tab === 'signup' ? 'Sign Up' : 'Sign In'}
                </Text>
              </Pressable>
            ))}
          </View>

          <WaltrackCard style={s.card}>
            <View style={s.fieldWrap}>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={(v) => { setError(''); setEmail(v); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="you@example.com"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>

            <View style={s.fieldWrap}>
              <Text style={s.label}>Password</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={(v) => { setError(''); setPassword(v); }}
                secureTextEntry
                placeholder="Min. 6 characters"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>

            {mode === 'signup' && (
              <View style={s.fieldWrap}>
                <Text style={s.label}>Confirm Password</Text>
                <TextInput
                  style={s.input}
                  value={confirmPassword}
                  onChangeText={(v) => { setError(''); setConfirmPassword(v); }}
                  secureTextEntry
                  placeholder="Re-enter password"
                  placeholderTextColor={theme.colors.text.secondary}
                />
              </View>
            )}

            {!!error && <Text style={s.errorText}>{error}</Text>}

            <Pressable style={s.btn} onPress={handleSubmit} disabled={loading} accessibilityLabel={mode === 'signup' ? 'Create account' : 'Sign in'}>
              {loading
                ? <ActivityIndicator color={theme.colors.text.inverse} />
                : <Text style={s.btnText}>{mode === 'signup' ? 'Create Account' : 'Sign In'}</Text>
              }
            </Pressable>
          </WaltrackCard>

          <View style={s.switchRow}>
            <Text style={s.switchText}>
              {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <Pressable onPress={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}>
              <Text style={s.switchLink}>{mode === 'signup' ? 'Sign In' : 'Sign Up'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
