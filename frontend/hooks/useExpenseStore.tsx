import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { Currency, Expense, NewExpense } from '../types/expense';

const STORAGE_KEY = 'waltrack_store_v1';

interface ExpenseStoreState {
  expenses: Expense[];
  monthlyBudget: number;
  currency: Currency;
}

interface ExpenseStoreContextValue extends ExpenseStoreState {
  isReady: boolean;
  addExpense: (newExpense: NewExpense) => Promise<void>;
  updateExpense: (id: string, nextExpense: NewExpense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setMonthlyBudget: (budget: number) => Promise<void>;
  setCurrency: (currency: Currency) => Promise<void>;
}

const initialState: ExpenseStoreState = {
  expenses: [],
  monthlyBudget: 10000,
  currency: 'INR',
};

const ExpenseStoreContext = createContext<ExpenseStoreContextValue | undefined>(undefined);

async function writeState(nextState: ExpenseStoreState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ExpenseStoreState>(initialState);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadStore = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<ExpenseStoreState>;
          setState({
            expenses: parsed.expenses ?? [],
            monthlyBudget: parsed.monthlyBudget ?? 10000,
            currency: parsed.currency ?? 'INR',
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

    const nextState = { ...state, expenses: [expense, ...state.expenses] };
    setState(nextState);
    await writeState(nextState);
  };

  const updateExpense = async (id: string, nextExpense: NewExpense) => {
    const nextState = {
      ...state,
      expenses: state.expenses.map((expense) => {
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
    };
    setState(nextState);
    await writeState(nextState);
  };

  const deleteExpense = async (id: string) => {
    const nextState = {
      ...state,
      expenses: state.expenses.filter((expense) => expense.id !== id),
    };
    setState(nextState);
    await writeState(nextState);
  };

  const setMonthlyBudget = async (budget: number) => {
    const nextState = { ...state, monthlyBudget: budget };
    setState(nextState);
    await writeState(nextState);
  };

  const setCurrencyValue = async (currency: Currency) => {
    const nextState = { ...state, currency };
    setState(nextState);
    await writeState(nextState);
  };

  const value = useMemo(
    () => ({
      ...state,
      isReady,
      addExpense,
      updateExpense,
      deleteExpense,
      setMonthlyBudget,
      setCurrency: setCurrencyValue,
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
