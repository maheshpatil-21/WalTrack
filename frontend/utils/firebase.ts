import Constants from 'expo-constants';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
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

export const firestore = getFirestore(getFirebaseApp());

export function getAppVersion(): string {
  return (
    Constants.manifest?.version ??
    (Constants.expoConfig as any)?.version ??
    'unknown'
  );
}
