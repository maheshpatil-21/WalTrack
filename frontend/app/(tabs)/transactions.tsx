import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
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
import {
  CATEGORY_OPTIONS,
  Category,
  Expense,
  categoryIconMap,
  categoryColorMap,
} from '../../types/expense';
import { formatCurrency } from '../../utils/expenseAnalytics';

interface EditForm {
  id: string;
  amountInput: string;
  category: Category;
  note: string;
}

export default function TransactionsScreen() {
  const { expenses, deleteExpense, updateExpense, currency } = useExpenseStore();
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const sortedExpenses = useMemo(
    () => [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses]
  );

  const openEdit = (expense: Expense) => {
    setEditForm({
      id: expense.id,
      amountInput: String(expense.amount),
      category: expense.category,
      note: expense.note,
    });
  };

  const saveEdit = async () => {
    if (!editForm) {
      return;
    }
    const amount = Number(editForm.amountInput);
    if (Number.isNaN(amount) || amount <= 0) {
      return;
    }
    await updateExpense(editForm.id, {
      amount,
      category: editForm.category,
      note: editForm.note,
    });
    setEditForm(null);
  };

  return (
    <ScreenWrapper scrollable={false} contentStyle={styles.screenContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.subtitle}>{sortedExpenses.length} total expenses</Text>
      </View>

      <FlatList
        data={sortedExpenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="wallet-outline" size={80} color={theme.colors.secondary.gray} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptySubtitle}>Start by adding your first expense.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.transactionItem}>
            <View style={styles.leftBlock}>
              <View style={[styles.iconWrap, { backgroundColor: `${categoryColorMap[item.category]}20` }]}>
                <MaterialCommunityIcons
                  name={categoryIconMap[item.category]}
                  size={20}
                  color={categoryColorMap[item.category]}
                />
              </View>
              <View style={styles.textBlock}>
                <Text style={styles.categoryText}>{item.category}</Text>
                <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
                {item.note ? <Text style={styles.noteText}>{item.note}</Text> : null}
              </View>
            </View>
            <View style={styles.rightBlock}>
              <Text style={styles.amountText}>{formatCurrency(item.amount, currency)}</Text>
              <View style={styles.actionRow}>
                <Pressable
                  testID={`edit-expense-${item.id}`}
                  accessibilityLabel={`Edit expense ${item.category}`}
                  onPress={() => openEdit(item)}
                  style={styles.iconButton}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.colors.primary.dark} />
                </Pressable>
                <Pressable
                  testID={`delete-expense-${item.id}`}
                  accessibilityLabel={`Delete expense ${item.category}`}
                  onPress={() => deleteExpense(item.id)}
                  style={styles.iconButton}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.colors.danger} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      <Modal visible={!!editForm} transparent animationType="slide" onRequestClose={() => setEditForm(null)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Edit expense</Text>
              <TextInput
                testID="edit-amount-input"
                accessibilityLabel="Edit expense amount"
                value={editForm?.amountInput ?? ''}
                keyboardType="numeric"
                onChangeText={(value) =>
                  setEditForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          amountInput: value.replace(/[^0-9.]/g, ''),
                        }
                      : null
                  )
                }
                style={styles.modalInput}
              />

              <View style={styles.categoryGrid}>
                {CATEGORY_OPTIONS.map((item) => {
                  const active = editForm?.category === item;
                  return (
                    <Pressable
                      key={item}
                      testID={`edit-category-${item}`}
                      accessibilityLabel={`Set category to ${item}`}
                      onPress={() =>
                        setEditForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                category: item,
                              }
                            : null
                        )
                      }
                      style={[styles.categoryChip, active && styles.categoryChipActive]}
                    >
                      <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{item}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                testID="edit-note-input"
                accessibilityLabel="Edit expense note"
                value={editForm?.note ?? ''}
                onChangeText={(value) =>
                  setEditForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          note: value,
                        }
                      : null
                  )
                }
                placeholder="Note"
                placeholderTextColor={theme.colors.text.tertiary}
                style={styles.modalInput}
              />

              <View style={styles.modalActions}>
                <ScaleButton
                  label="Cancel"
                  onPress={() => setEditForm(null)}
                  style={styles.modalButton}
                  testID="cancel-edit-expense"
                  accessibilityLabel="Cancel editing expense"
                />
                <ScaleButton
                  label="Save"
                  onPress={saveEdit}
                  style={styles.modalButton}
                  testID="save-edit-expense"
                  accessibilityLabel="Save edited expense"
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    gap: theme.spacing.s4,
  },
  header: {
    marginBottom: theme.spacing.s2,
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
  listContent: {
    paddingBottom: theme.spacing.s12,
    gap: theme.spacing.s3,
  },
  transactionItem: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.secondary.border,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.s4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.s3,
  },
  leftBlock: {
    flexDirection: 'row',
    flex: 1,
    gap: theme.spacing.s3,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
    gap: theme.spacing.s1,
  },
  categoryText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  dateText: {
    ...theme.typography.bodyXs,
    color: theme.colors.text.secondary,
  },
  noteText: {
    ...theme.typography.bodySm,
    color: theme.colors.text.secondary,
  },
  rightBlock: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  amountText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.s2,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.secondary.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    marginTop: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    opacity: 0.3,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.s3,
  },
  emptySubtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.s1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.35)',
    justifyContent: 'flex-end',
    padding: theme.spacing.s4,
  },
  modalCard: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.s4,
    gap: theme.spacing.s3,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  modalInput: {
    minHeight: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.secondary.border,
    paddingHorizontal: theme.spacing.s3,
    color: theme.colors.text.primary,
    ...theme.typography.body,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.s2,
  },
  categoryChip: {
    minHeight: 36,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.secondary.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s3,
  },
  categoryChipActive: {
    borderColor: theme.colors.primary.DEFAULT,
    backgroundColor: theme.colors.primary.bg,
  },
  categoryChipText: {
    ...theme.typography.bodyXs,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: theme.colors.primary.dark,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.s3,
  },
  modalButton: {
    flex: 1,
  },
});
