import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScaleButton } from '../../components/ScaleButton';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { useTheme } from '../../contexts/ThemeContext';
import { useExpenseStore } from '../../hooks/useExpenseStore';
import {
  CATEGORY_OPTIONS,
  Category,
  Expense,
  categoryIconMap,
  categoryColorMap,
} from '../../types/expense';
import { formatCurrency } from '../../utils/expenseAnalytics';
import { logTransactionsView } from '../../utils/analytics';

interface EditForm {
  id: string;
  amountInput: string;
  category: Category;
  note: string;
}

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const { expenses, deleteExpense, updateExpense, currency } = useExpenseStore();

  useEffect(() => {
    void logTransactionsView();
  }, []);
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
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>Transactions</Text>
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>{sortedExpenses.length} total expenses</Text>
      </View>

      <FlatList
        data={sortedExpenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="wallet-outline" size={80} color={theme.colors.secondary.gray} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>No expenses yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>Start by adding your first expense.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.transactionItem, { borderColor: theme.colors.secondary.border, backgroundColor: theme.colors.background }]}>
            <View style={styles.leftBlock}>
              <View style={[styles.iconWrap, { backgroundColor: `${categoryColorMap[item.category]}20` }]}>
                <MaterialCommunityIcons
                  name={categoryIconMap[item.category]}
                  size={20}
                  color={categoryColorMap[item.category]}
                />
              </View>
              <View style={styles.textBlock}>
                <Text style={[styles.categoryText, { color: theme.colors.text.primary }]}>{item.category}</Text>
                <Text style={[styles.dateText, { color: theme.colors.text.secondary }]}>{new Date(item.date).toLocaleDateString()}</Text>
                {item.note ? <Text style={[styles.noteText, { color: theme.colors.text.secondary }]}>{item.note}</Text> : null}
              </View>
            </View>
            <View style={styles.rightBlock}>
              <Text style={[styles.amountText, { color: theme.colors.text.primary }]}>{formatCurrency(item.amount, currency)}</Text>
              <View style={styles.actionRow}>
                <Pressable
                  testID={`edit-expense-${item.id}`}
                  accessibilityLabel={`Edit expense ${item.category}`}
                  onPress={() => openEdit(item)}
                  style={[styles.iconButton, { borderColor: theme.colors.secondary.border }]}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.colors.primary.dark} />
                </Pressable>
                <Pressable
                  testID={`delete-expense-${item.id}`}
                  accessibilityLabel={`Delete expense ${item.category}`}
                  onPress={() => deleteExpense(item.id)}
                  style={[styles.iconButton, { borderColor: theme.colors.secondary.border }]}
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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardWrap}
          >
            <View style={[styles.modalCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.secondary.border }]}>
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>Edit expense</Text>
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
                  placeholderTextColor={theme.colors.text.tertiary}
                  style={[styles.modalInput, { borderColor: theme.colors.secondary.border, color: theme.colors.text.primary }]}
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
                        style={[
                          styles.categoryChip,
                          { borderColor: theme.colors.secondary.border },
                          active && { backgroundColor: theme.colors.primary.bg, borderColor: theme.colors.primary.DEFAULT },
                        ]}
                      >
                        <Text style={[
                          styles.categoryChipText,
                          { color: active ? theme.colors.primary.dark : theme.colors.text.secondary },
                          active && styles.categoryChipTextActive,
                        ]}>{item}</Text>
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
                  style={[styles.modalInput, { borderColor: theme.colors.secondary.border, color: theme.colors.text.primary }]}
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
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 48,
    gap: 12,
  },
  transactionItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  leftBlock: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  categoryText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    lineHeight: 18,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 20,
  },
  rightBlock: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  amountText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
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
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  modalKeyboardWrap: {
    width: '100%',
  },
  modalCard: {
    borderRadius: 20,
    maxHeight: '88%',
    padding: 16,
    borderWidth: 1,
  },
  modalScroll: {
    maxHeight: '100%',
  },
  modalScrollContent: {
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '600',
  },
  modalInput: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    lineHeight: 22,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  categoryChipActive: {
    // Color applied inline
  },
  categoryChipText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    // Color applied inline
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
