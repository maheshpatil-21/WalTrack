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
} from 'react-native';

import { ScaleButton } from '../../components/ScaleButton';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { theme } from '../../constants/theme';
import { useExpenseStore } from '../../hooks/useExpenseStore';
import { CATEGORY_OPTIONS, Category, categoryIconMap } from '../../types/expense';

export default function AddExpenseScreen() {
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
        style={styles.keyboardContainer}
      >
        <View>
          <Text style={styles.title}>Quick expense entry</Text>
          <Text style={styles.subtitle}>Log in seconds, stay in control.</Text>
        </View>

        <View style={styles.amountBlock}>
          <Text style={styles.amountPrefix}>{currency === 'INR' ? '₹' : '$'}</Text>
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
            style={styles.amountInput}
          />
        </View>

        <View style={styles.sectionGap}>
          <Text style={styles.label}>Choose category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORY_OPTIONS.map((item) => (
              <Pressable
                key={item}
                testID={`category-${item}`}
                accessibilityLabel={`Select ${item} category`}
                onPress={() => setCategory(item)}
                style={[styles.categoryChip, category === item && styles.categoryChipActive]}
              >
                <MaterialCommunityIcons
                  name={categoryIconMap[item]}
                  size={22}
                  color={category === item ? theme.colors.primary.dark : theme.colors.text.secondary}
                />
                <Text style={[styles.categoryLabel, category === item && styles.categoryLabelActive]}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.sectionGap}>
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            testID="note-input"
            accessibilityLabel="Expense note"
            value={note}
            onChangeText={setNote}
            placeholder="Lunch with friends"
            placeholderTextColor={theme.colors.text.tertiary}
            style={styles.noteInput}
          />
        </View>

        <View style={styles.footerWrap}>
          {!!error && <Text style={styles.errorText}>{error}</Text>}
          <ScaleButton
            testID="save-expense-button"
            accessibilityLabel="Save expense"
            label="Save Expense"
            onPress={submitExpense}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    justifyContent: 'space-between',
    gap: theme.spacing.s6,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
  },
  subtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.s1,
  },
  amountBlock: {
    borderBottomColor: theme.colors.secondary.border,
    borderBottomWidth: 1,
    paddingBottom: theme.spacing.s2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s2,
  },
  amountPrefix: {
    ...theme.typography.amount,
    color: theme.colors.primary.DEFAULT,
  },
  amountInput: {
    flex: 1,
    ...theme.typography.amount,
    color: theme.colors.text.primary,
    minHeight: 78,
  },
  sectionGap: {
    gap: theme.spacing.s3,
  },
  label: {
    ...theme.typography.bodySm,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.s2,
  },
  categoryChip: {
    width: '31%',
    minHeight: 78,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.secondary.border,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.s1,
  },
  categoryChipActive: {
    borderColor: theme.colors.primary.DEFAULT,
    backgroundColor: theme.colors.primary.bg,
  },
  categoryLabel: {
    ...theme.typography.bodyXs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: theme.colors.primary.dark,
    fontWeight: '700',
  },
  noteInput: {
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary.border,
    color: theme.colors.text.primary,
    ...theme.typography.body,
  },
  footerWrap: {
    gap: theme.spacing.s3,
    paddingBottom: theme.spacing.s2,
  },
  errorText: {
    ...theme.typography.bodySm,
    color: theme.colors.danger,
  },
});
