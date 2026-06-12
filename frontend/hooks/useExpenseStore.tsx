import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';

import { useAuth } from '../contexts/AuthContext';
import { Currency, Expense, NewExpense } from '../types/expense';
import { firestore } from '../utils/firebase';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  age: number;
  college?: string;
}

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
  period: 'AM' | 'PM';
  notificationId: string | null;
}

interface ExpenseStoreState {
  expenses: Expense[];
  monthlyBudget: number;
  dailyLimit: number;
  currency: Currency;
  userProfile: UserProfile | null;
  reminderSettings: ReminderSettings;
}

interface ExpenseStoreContextValue extends ExpenseStoreState {
  isReady: boolean;
  addExpense: (newExpense: NewExpense) => Promise<void>;
  updateExpense: (id: string, nextExpense: NewExpense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setMonthlyBudget: (budget: number) => Promise<void>;
  setDailyLimit: (limit: number) => Promise<void>;
  setCurrency: (currency: Currency) => Promise<void>;
  setUserProfile: (profile: UserProfile) => Promise<void>;
  setReminderSettings: (settings: ReminderSettings) => Promise<void>;
}

function defaultDailyLimit(monthlyBudget: number) {
  return Math.max(Math.round(monthlyBudget / 30), 1);
}

const defaultReminderSettings: ReminderSettings = {
  enabled: false,
  hour: 9,
  minute: 0,
  period: 'PM',
  notificationId: null,
};

const initialState: ExpenseStoreState = {
  expenses: [],
  monthlyBudget: 10000,
  dailyLimit: defaultDailyLimit(10000),
  currency: 'INR',
  userProfile: null,
  reminderSettings: defaultReminderSettings,
};

const ExpenseStoreContext = createContext<ExpenseStoreContextValue | undefined>(undefined);

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<ExpenseStoreState>(initialState);
  const [isReady, setIsReady] = useState(false);

  // ── Load from Firestore whenever the logged-in user changes ─────────────
  useEffect(() => {
    if (!user) {
      setState(initialState);
      setIsReady(false);
      return;
    }

    const load = async () => {
      setIsReady(false);
      try {
        const uid = user.uid;

        // Load user document (profile + settings)
        const userSnap = await getDoc(doc(firestore, 'users', uid));
        const userData = userSnap.exists() ? userSnap.data() : null;

        // Load expenses sub-collection
        const expSnap = await getDocs(collection(firestore, 'users', uid, 'expenses'));
        const expenses: Expense[] = expSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Expense, 'id'>),
        }));
        expenses.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const budget = userData?.monthlyBudget ?? 10000;
        setState({
          expenses,
          monthlyBudget: budget,
          dailyLimit: userData?.dailyLimit ?? defaultDailyLimit(budget),
          currency: userData?.currency ?? 'INR',
          userProfile: userData?.profile ?? null,
          reminderSettings: userData?.reminderSettings ?? defaultReminderSettings,
        });
      } catch {
        setState(initialState);
      } finally {
        setIsReady(true);
      }
    };

    load();
  }, [user?.uid]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const userRef = user ? doc(firestore, 'users', user.uid) : null;

  const mergeUser = async (fields: Record<string, unknown>) => {
    if (!userRef) return;
    await setDoc(userRef, fields, { merge: true });
  };

  // ── Expense operations ───────────────────────────────────────────────────
  const addExpense = async (newExpense: NewExpense): Promise<void> => {
    if (!user) return;
    const expense: Expense = {
      id: generateId(),
      amount: newExpense.amount,
      category: newExpense.category,
      note: newExpense.note,
      date: new Date().toISOString(),
    };
    // Optimistic update
    setState((prev) => ({ ...prev, expenses: [expense, ...prev.expenses] }));
    try {
      await setDoc(doc(firestore, 'users', user.uid, 'expenses', expense.id), {
        amount: expense.amount,
        category: expense.category,
        note: expense.note,
        date: expense.date,
      });
    } catch {
      // Rollback on failure
      setState((prev) => ({
        ...prev,
        expenses: prev.expenses.filter((e) => e.id !== expense.id),
      }));
    }
  };

const updateExpense = async (
  id: string,
  nextExpense: NewExpense
): Promise<void> => {
  if (!user) return;

  setState((prev) => ({
    ...prev,
    expenses: prev.expenses.map((e) =>
      e.id !== id
        ? e
        : {
            ...e,
            amount: nextExpense.amount,
            category: nextExpense.category,
            note: nextExpense.note,
            date: nextExpense.date ?? e.date,
          }
    ),
  }));

  await setDoc(
    doc(firestore, 'users', user.uid, 'expenses', id),
    {
      amount: nextExpense.amount,
      category: nextExpense.category,
      note: nextExpense.note,
      date: nextExpense.date,
    },
    { merge: true }
  );
};

  const deleteExpense = async (id: string): Promise<void> => {
    if (!user) return;
    setState((prev) => ({ ...prev, expenses: prev.expenses.filter((e) => e.id !== id) }));
    await deleteDoc(doc(firestore, 'users', user.uid, 'expenses', id));
  };

  // ── Settings operations ──────────────────────────────────────────────────
  const setMonthlyBudget = async (budget: number): Promise<void> => {
    setState((prev) => ({ ...prev, monthlyBudget: budget }));
    await mergeUser({ monthlyBudget: budget });
  };

  const setDailyLimit = async (limit: number): Promise<void> => {
    setState((prev) => ({ ...prev, dailyLimit: limit }));
    await mergeUser({ dailyLimit: limit });
  };

  const setCurrency = async (currency: Currency): Promise<void> => {
    setState((prev) => ({ ...prev, currency }));
    await mergeUser({ currency });
  };

  const setUserProfile = async (profile: UserProfile): Promise<void> => {
    setState((prev) => ({ ...prev, userProfile: profile }));
    await mergeUser({ profile });
  };

  const setReminderSettings = async (settings: ReminderSettings): Promise<void> => {
    setState((prev) => ({ ...prev, reminderSettings: settings }));
    await mergeUser({ reminderSettings: settings });
  };

  const value = useMemo(
    () => ({
      ...state,
      isReady,
      addExpense,
      updateExpense,
      deleteExpense,
      setMonthlyBudget,
      setDailyLimit,
      setCurrency,
      setUserProfile,
      setReminderSettings,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, isReady]
  );

  return <ExpenseStoreContext.Provider value={value}>{children}</ExpenseStoreContext.Provider>;
}

export function useExpenseStore() {
  const context = useContext(ExpenseStoreContext);
  if (!context) {
    throw new Error('useExpenseStore must be used within ExpenseProvider');
  }
  return context;
}
