import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';

import { auth, firestore } from '../utils/firebase';

interface AuthContextValue {
  user: User | null;
  isAuthReady: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
    });
    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string): Promise<void> => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
  };

  const deleteAccount = async (): Promise<void> => {
    if (!user) throw new Error('No authenticated user.');
    const expensesSnap = await getDocs(collection(firestore, 'users', user.uid, 'expenses'));
    await Promise.all(expensesSnap.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(doc(firestore, 'users', user.uid));
    await deleteUser(user);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthReady, signUp, signIn, signOut, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
