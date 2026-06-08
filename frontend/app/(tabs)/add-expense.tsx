import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from 'react-native';

import { ScaleButton } from '../../components/ScaleButton';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { useTheme } from '../../contexts/ThemeContext';
import { useExpenseStore } from '../../hooks/useExpenseStore';
import { CATEGORY_OPTIONS, Category, categoryIconMap } from '../../types/expense';

export default function AddExpenseScreen() {
  const { theme } = useTheme();
  const { addExpense, currency } = useExpenseStore();
  const [amountInput, setAmountInput] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const submitExpense = async () => {
    const amount = Number(amountInput);
    if (Number.isNaN(amount) || amount <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    await addExpense({
      amount,
      category,
      note: note.trim(),
    });

    setError('');
    setAmountInput('');
    setNote('');
    setCategory('Food');
  };

  return (
    <ScreenWrapper scrollable={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, gap: theme.spacing.s6 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>Quick expense entry</Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary, marginTop: theme.spacing.s1 }]}>Log in seconds, stay in control.</Text>
          </View>

          <View style={[styles.amountBlock, { borderBottomColor: theme.colors.secondary.border }]}>
            <Text style={[styles.amountPrefix, { color: theme.colors.primary.DEFAULT }]}>{currency === 'INR' ? '₹' : '$'}</Text>
            <TextInput
              testID="amount-input"
              accessibilityLabel="Expense amount"
              value={amountInput}
              onChangeText={(value) => {
                setError('');
                setAmountInput(value.replace(/[^0-9.]/g, ''));
              }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={theme.colors.text.tertiary}
              style={[styles.amountInput, { color: theme.colors.text.primary }]}
            />
          </View>

          <View style={[styles.sectionGap, { gap: theme.spacing.s3 }]}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Choose category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORY_OPTIONS.map((item) => (
                <Pressable
                  key={item}
                  testID={`category-${item}`}
                  accessibilityLabel={`Select ${item} category`}
                  onPress={() => setCategory(item)}
                  style={[
                    styles.categoryChip,
                    { borderColor: theme.colors.secondary.border, backgroundColor: theme.colors.background },
                    category === item && [styles.categoryChipActive, { borderColor: theme.colors.primary.DEFAULT, backgroundColor: theme.colors.primary.bg }]
                  ]}
                >
                  <MaterialCommunityIcons
                    name={categoryIconMap[item] as any}
                    size={22}
                    color={category === item ? theme.colors.primary.dark : theme.colors.text.secondary}
                  />
                  <Text style={[
                    styles.categoryLabel,
                    { color: theme.colors.text.secondary },
                    category === item && { color: theme.colors.primary.dark, fontWeight: '700' }
                  ]}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[styles.sectionGap, { gap: theme.spacing.s3 }]}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Note (optional)</Text>
            <TextInput
              testID="note-input"
              accessibilityLabel="Expense note"
              value={note}
              onChangeText={setNote}
              placeholder="Lunch with friends"
              placeholderTextColor={theme.colors.text.tertiary}
              style={[styles.noteInput, { borderBottomColor: theme.colors.secondary.border, color: theme.colors.text.primary }]}
            />
          </View>

          <View style={[styles.footerWrap, { gap: theme.spacing.s3 }]}>
            {!!error && <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>}
            <ScaleButton
              testID="save-expense-button"
              accessibilityLabel="Save expense"
              label="Save Expense"
              onPress={submitExpense}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  amountBlock: {
    borderBottomWidth: 1,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountPrefix: {
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 46,
  },
  amountInput: {
    flex: 1,
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 46,
    minHeight: 78,
  },
  sectionGap: {
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    width: '31%',
    minHeight: 78,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  categoryChipActive: {
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    textAlign: 'center',
  },
  categoryLabelActive: {
  },
  noteInput: {
    minHeight: 48,
    borderBottomWidth: 1,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  footerWrap: {
    paddingBottom: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
});
