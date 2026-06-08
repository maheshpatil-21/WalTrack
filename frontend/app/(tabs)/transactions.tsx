import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useMemo, useState } from 'react';
import {
  SectionList,
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

import { useRouter } from 'expo-router';
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

interface EditForm {
  id: string;
  amountInput: string;
  category: Category;
  note: string;
  date: string;
}

export default function TransactionsScreen() {
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);

  const router = useRouter();
  const { theme } = useTheme();
  const { expenses, deleteExpense, updateExpense, currency } = useExpenseStore();

  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const [searchText, setSearchText] = useState('');

  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
  const [dateFilter, setDateFilter] = useState<'All Time' | 'Today' | 'Yesterday' | 'This Week' | 'This Month'>('All Time');

  const sortedExpenses = useMemo(
    () => [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses]
  );

  const filteredExpenses = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const now = new Date();

    const startOfWeek = new Date(now);
    // Monday-based week start for consistent UX.
    const day = startOfWeek.getDay(); // 0 (Sun) - 6 (Sat)
    const diffToMonday = (day + 6) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    startOfNextMonth.setHours(0, 0, 0, 0);

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isSameDate = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    const matchesDate = (d: Date) => {
      if (dateFilter === 'All Time') return true;
      if (dateFilter === 'Today') return isSameDate(d, now);
      if (dateFilter === 'Yesterday') return isSameDate(d, yesterday);
      if (dateFilter === 'This Week') return d >= startOfWeek && d < endOfWeek;
      if (dateFilter === 'This Month') return d >= startOfMonth && d < startOfNextMonth;
      return true;
    };

    const matchesSearch = (e: Expense) => {
      if (!q) return true;
      const note = (e.note ?? '').toLowerCase();
      const cat = (e.category ?? '').toLowerCase();
      return note.includes(q) || cat.includes(q);
    };

    const matchesCategory = (e: Expense) => {
      if (categoryFilter === 'All') return true;
      return e.category === categoryFilter;
    };

    return sortedExpenses.filter((e) => {
      const d = new Date(e.date);
      return matchesCategory(e) && matchesDate(d) && matchesSearch(e);
    });
  }, [sortedExpenses, searchText, categoryFilter, dateFilter]);

  const sections = useMemo(() => {
    const grouped: Record<string, { title: string; data: Expense[]; sortKey: number }> = {};
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isSameDate = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    const formatSectionTitle = (date: Date) => {
      if (isSameDate(date, now)) {
        return 'Today';
      }
      if (isSameDate(date, yesterday)) {
        return 'Yesterday';
      }
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    filteredExpenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      const key = expenseDate.toDateString();
      if (!grouped[key]) {
        grouped[key] = {
          title: formatSectionTitle(expenseDate),
          data: [],
          sortKey: expenseDate.getTime(),
        };
      }
      grouped[key].data.push(expense);
    });

    return Object.values(grouped).sort((a, b) => b.sortKey - a.sortKey);
  }, [filteredExpenses]);




  const openEdit = (expense: Expense) => {
    setEditForm({
      id: expense.id,
      amountInput: String(expense.amount),
      category: expense.category,
      note: expense.note,
      date: expense.date,
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
      date: editForm.date,
    });
    setEditForm(null);
  };

  return (
    <ScreenWrapper scrollable={false} contentStyle={styles.screenContent}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>Transactions</Text>
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          {filteredExpenses.length} shown • {sortedExpenses.length} total expenses
        </Text>
      </View>

      <View style={styles.filtersWrap}>
        <View style={styles.searchAndFilterRow}>
          <View style={[styles.searchBar, { borderColor: theme.colors.secondary.border, backgroundColor: theme.colors.surface }]}>
            <MaterialCommunityIcons name="magnify" size={18} color={theme.colors.text.secondary} />
            <TextInput
              testID="transactions-search-input"
              accessibilityLabel="Search transactions"
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search notes or categories"
              placeholderTextColor={theme.colors.text.tertiary}
              style={[styles.searchInput, { color: theme.colors.text.primary }]}
            />
            {searchText.trim().length > 0 ? (
              <Pressable
                testID="transactions-search-clear"
                accessibilityLabel="Clear search"
                onPress={() => setSearchText('')}
                style={styles.searchClear}
              >
                <MaterialCommunityIcons name="close" size={16} color={theme.colors.text.tertiary} />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            testID="transactions-filters-button"
            accessibilityLabel="Open filters"
            onPress={() => setIsFiltersModalOpen(true)}
            style={[styles.filtersIconButton, { borderColor: theme.colors.secondary.border, backgroundColor: theme.colors.surface }]}
          >
            <MaterialCommunityIcons name="tune-variant" size={18} color={theme.colors.text.secondary} />
          </Pressable>
        </View>

        {(categoryFilter !== 'All' || dateFilter !== 'All Time') ? (
          <Pressable
            testID="transactions-filters-indicator"
            accessibilityLabel="Active filters"
            onPress={() => {
              if (categoryFilter !== 'All' || dateFilter !== 'All Time') {
                setCategoryFilter('All');
                setDateFilter('All Time');
              }
            }}
            style={[styles.filtersIndicatorWrap, { borderColor: theme.colors.secondary.border }]}
          >
            <Text style={[styles.filtersIndicatorText, { color: theme.colors.text.primary }]}>
              {(() => {
                const count = (categoryFilter !== 'All' ? 1 : 0) + (dateFilter !== 'All Time' ? 1 : 0);
                if (count === 1) return '1 Filter Applied';
                return `${count} Filters Applied ✕`;
              })()}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <SectionList
        sections={sections}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.sectionHeader, { backgroundColor: theme.colors.surface }]}> 
            <Text style={[styles.sectionHeaderText, { color: theme.colors.text.secondary }]}>{title}</Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          filteredExpenses.length === 0 && sortedExpenses.length > 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="magnify" size={72} color={theme.colors.secondary.gray} style={styles.emptyIcon} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>🔍 No matching transactions found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>Try adjusting your search or filters.</Text>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="wallet-outline" size={80} color={theme.colors.secondary.gray} style={styles.emptyIcon} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>No expenses yet</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>Start tracking your spending to see daily summaries and category trends.</Text>
              <ScaleButton
                label="Add first expense"
                onPress={() => router.push('/add-expense')}
                testID="transactions-empty-add-expense"
                accessibilityLabel="Add first expense"
                style={styles.emptyActionButton}
              />
            </View>
          )
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

                <Pressable
                  testID="edit-date-field"
                  accessibilityLabel="Edit expense date"
                  onPress={() => {
                    const d = new Date(editForm?.date ?? Date.now());
                    setTempDate(d);
                    setIsDatePickerOpen(true);
                  }}
                  style={[styles.dateField, { borderColor: theme.colors.secondary.border, backgroundColor: theme.colors.surface }]}
                >
                  <Text style={[styles.dateFieldLabel, { color: theme.colors.text.secondary }]}>Date</Text>
                  <View style={styles.dateFieldRow}>
                    <Text style={[styles.dateFieldValue, { color: theme.colors.text.primary }]}>
                      {new Date(editForm?.date ?? Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                    <Text style={[styles.dateEditIcon, { color: theme.colors.primary.dark }]}>✏️</Text>
                  </View>
                </Pressable>

                <View style={styles.categoryGrid}>
                  <Modal
                    visible={isDatePickerOpen}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setIsDatePickerOpen(false)}
                  >
                    <View style={styles.calendarOverlay}>
                      <View
                        style={[
                          styles.calendarModal,
                          { backgroundColor: theme.colors.background, borderColor: theme.colors.secondary.border },
                        ]}
                      >
                        <View style={styles.calendarHeaderRow}>
                          <Pressable
                            testID="calendar-prev-month"
                            accessibilityLabel="Previous month"
                            onPress={() => {
                              const d = new Date(tempDate);
                              d.setMonth(d.getMonth() - 1);
                              setTempDate(d);
                            }}
                            style={[styles.calendarNavBtn, { borderColor: theme.colors.secondary.border }]}
                          >
                            <MaterialCommunityIcons name="chevron-left" size={20} color={theme.colors.text.primary} />
                          </Pressable>

                          <Text style={[styles.calendarMonthTitle, { color: theme.colors.text.primary }]}>
                            {tempDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                          </Text>

                          <Pressable
                            testID="calendar-next-month"
                            accessibilityLabel="Next month"
                            onPress={() => {
                              const d = new Date(tempDate);
                              d.setMonth(d.getMonth() + 1);
                              setTempDate(d);
                            }}
                            style={[styles.calendarNavBtn, { borderColor: theme.colors.secondary.border }]}
                          >
                            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.text.primary} />
                          </Pressable>
                        </View>

                        <View style={styles.calendarWeekDaysRow}>
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
                            <Text key={w} style={[styles.calendarWeekDay, { color: theme.colors.text.secondary }]}>
                              {w}
                            </Text>
                          ))}
                        </View>

                        <View style={styles.calendarGrid}>
                          {(() => {
                            const year = tempDate.getFullYear();
                            const month = tempDate.getMonth();
                            const firstDay = new Date(year, month, 1);
                            const daysInMonth = new Date(year, month + 1, 0).getDate();
                            const leadingEmpty = firstDay.getDay(); // 0..6 (Sun..Sat)

                            const cells: Array<{ day: number | null; iso: string | null }> = [];
                            for (let i = 0; i < leadingEmpty; i++) {
                              cells.push({ day: null, iso: null });
                            }
                            for (let day = 1; day <= daysInMonth; day++) {
                              const d = new Date(year, month, day);
                              const iso = d.toISOString();
                              cells.push({ day, iso });
                            }

                            // trailing blanks to complete 6 weeks grid (42 cells)
                            while (cells.length < 42) {
                              cells.push({ day: null, iso: null });
                            }

                            const selected = new Date(tempDate);
                            const selectedY = selected.getFullYear();
                            const selectedM = selected.getMonth();
                            const selectedD = selected.getDate();

                            return cells.map((c, idx) => {
                              if (!c.day || c.iso === null) {
                                return <View key={`empty-${idx}`} style={styles.calendarDayEmpty} />;
                              }

                              const isSelected =
                                selectedY === year && selectedM === month && selectedD === c.day;

                              const d = new Date(c.iso);
                              const isToday =
                                d.getFullYear() === new Date().getFullYear() &&
                                d.getMonth() === new Date().getMonth() &&
                                d.getDate() === new Date().getDate();

                              return (
                                <Pressable
                                  key={c.iso}
                                  testID={`calendar-day-${c.day}`}
                                  accessibilityLabel={`Select ${c.day} ${tempDate.toLocaleDateString('en-IN', { month: 'long' })}`}
                                  onPress={() => {
                                    const next = new Date(year, month, c.day as number);
                                    console.log('Day clicked:', c.day);
                                    console.log('Temp date:', next);
                                    setTempDate(next);
                                  }}
                                  style={[
                                    styles.calendarDay,
                                    isSelected && {
                                      backgroundColor: theme.colors.primary.bg,
                                      borderColor: theme.colors.primary.DEFAULT,
                                    },
                                    !isSelected && isToday && { borderColor: theme.colors.primary.bg },
                                    { borderColor: theme.colors.secondary.border },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.calendarDayText,
                                      { color: isSelected ? theme.colors.primary.dark : theme.colors.text.primary },
                                    ]}
                                  >
                                    {c.day}
                                  </Text>
                                </Pressable>
                              );
                            });
                          })()}
                        </View>

                        <View style={styles.calendarActionsRow}>
                          <ScaleButton
                            label="Cancel"
                            testID="calendar-cancel"
                            accessibilityLabel="Cancel date selection"
                            style={styles.calendarActionBtn}
                            onPress={() => {
                              setIsDatePickerOpen(false);
                              setTempDate(new Date(editForm?.date ?? Date.now()));
                            }}
                          />
                          <ScaleButton
                            label="Select"
                            testID="calendar-select"
                            accessibilityLabel="Select date"
                            style={styles.calendarActionBtn}
                            onPress={() => {
                              if (!editForm) return;
                              const chosen = new Date(tempDate);
                              const iso = chosen.toISOString();
                              setEditForm((prev) => (prev ? { ...prev, date: iso } : prev));
                              setIsDatePickerOpen(false);
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  </Modal>

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
                          active && {
                            backgroundColor: theme.colors.primary.bg,
                            borderColor: theme.colors.primary.DEFAULT,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            { color: active ? theme.colors.primary.dark : theme.colors.text.secondary },
                            active && styles.categoryChipTextActive,
                          ]}
                        >
                          {item}
                        </Text>
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
  filtersWrap: {
    gap: 10,
  },
  searchBar: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  searchClear: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    gap: 10,
    paddingVertical: 6,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
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
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 260,
  },
  emptyActionButton: {
    marginTop: 18,
    alignSelf: 'center',
  },
  sectionHeader: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 18,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
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
  dateField: {
    minHeight: 54,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
    marginTop: 12,
  },
  dateFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  dateFieldValue: {
    fontSize: 16,
    fontWeight: '700',
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

  dateFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateEditIcon: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },

  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  calendarModal: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  calendarNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  calendarWeekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  calendarWeekDay: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'space-between',
  },
  calendarDay: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  calendarDayEmpty: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  calendarDayText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  calendarActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
  },
  calendarActionBtn: {
    flex: 1,
  },
});

