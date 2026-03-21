import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { Currency, Expense, NewExpense } from '../types/expense';

const STORAGE_KEY = 'waltrack_store_v1';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  age: number;
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

async function writeState(nextState: ExpenseStoreState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ExpenseStoreState>(initialState);
  const [isReady, setIsReady] = useState(false);
  const updateQueueRef = useRef(Promise.resolve());

  const runStateUpdate = async (updater: (prev: ExpenseStoreState) => ExpenseStoreState) => {
    updateQueueRef.current = updateQueueRef.current.then(async () => {
      let computedState: ExpenseStoreState | null = null;
      setState((prev) => {
        computedState = updater(prev);
        return computedState;
      });

      if (computedState) {
        await writeState(computedState);
      }
    });

    await updateQueueRef.current;
  };

  useEffect(() => {
    const loadStore = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<ExpenseStoreState>;
          setState({
            expenses: parsed.expenses ?? [],
            monthlyBudget: parsed.monthlyBudget ?? 10000,
            dailyLimit:
              parsed.dailyLimit ?? defaultDailyLimit(parsed.monthlyBudget ?? initialState.monthlyBudget),
            currency: parsed.currency ?? 'INR',
            userProfile: parsed.userProfile ?? null,
            reminderSettings: {
              enabled: parsed.reminderSettings?.enabled ?? defaultReminderSettings.enabled,
              hour: parsed.reminderSettings?.hour ?? defaultReminderSettings.hour,
              minute: parsed.reminderSettings?.minute ?? defaultReminderSettings.minute,
              period: parsed.reminderSettings?.period ?? defaultReminderSettings.period,
              notificationId:
                parsed.reminderSettings?.notificationId ?? defaultReminderSettings.notificationId,
            },
          });
        }
      } catch {
        setState(initialState);
      } finally {
        setIsReady(true);
      }
    };

    loadStore();
  }, []);

  const addExpense = async (newExpense: NewExpense) => {
    const expense: Expense = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      amount: newExpense.amount,
      category: newExpense.category,
      note: newExpense.note,
      date: new Date().toISOString(),
    };

    await runStateUpdate((prev) => ({ ...prev, expenses: [expense, ...prev.expenses] }));
  };

  const updateExpense = async (id: string, nextExpense: NewExpense) => {
    await runStateUpdate((prev) => ({
      ...prev,
      expenses: prev.expenses.map((expense) => {
        if (expense.id !== id) {
          return expense;
        }
        return {
          ...expense,
          amount: nextExpense.amount,
          category: nextExpense.category,
          note: nextExpense.note,
        };
      }),
    }));
  };

  const deleteExpense = async (id: string) => {
    await runStateUpdate((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((expense) => expense.id !== id),
    }));
  };

  const setMonthlyBudget = async (budget: number) => {
    await runStateUpdate((prev) => ({ ...prev, monthlyBudget: budget }));
  };

  const setDailyLimitValue = async (limit: number) => {
    await runStateUpdate((prev) => ({ ...prev, dailyLimit: limit }));
  };

  const setCurrencyValue = async (currency: Currency) => {
    await runStateUpdate((prev) => ({ ...prev, currency }));
  };

  const setUserProfileValue = async (profile: UserProfile) => {
    await runStateUpdate((prev) => ({ ...prev, userProfile: profile }));
  };

  const setReminderSettingsValue = async (settings: ReminderSettings) => {
    await runStateUpdate((prev) => ({ ...prev, reminderSettings: settings }));
  };

  const value = useMemo(
    () => ({
      ...state,
      isReady,
      addExpense,
      updateExpense,
      deleteExpense,
      setMonthlyBudget,
      setDailyLimit: setDailyLimitValue,
      setCurrency: setCurrencyValue,
      setUserProfile: setUserProfileValue,
      setReminderSettings: setReminderSettingsValue,
    }),
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
