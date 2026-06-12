import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDnFnnmzx4YHssOq2RDzBMA0ncT-OflR-8',
  authDomain: 'waltrack-21.firebaseapp.com',
  projectId: 'waltrack-21',
  storageBucket: 'waltrack-21.firebasestorage.app',
  messagingSenderId: '871196608964',
  appId: '1:871196608964:android:8f14ec2d1b6579a808fc91',
};

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  return initializeApp(firebaseConfig);
}

// Auth is initialised once with AsyncStorage persistence so the user stays
// logged in across app restarts and device reboots.
let _auth: Auth | null = null;
function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  _auth = initializeAuth(getFirebaseApp(), {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  return _auth;
}

export const firestore = getFirestore(getFirebaseApp());
export const auth = getFirebaseAuth();

export function getAppVersion(): string {
  // Constants.expoConfig is the correct field in Expo SDK 46+.
  return Constants.expoConfig?.version ?? 'unknown';
}
