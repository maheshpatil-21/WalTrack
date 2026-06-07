import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

import { firestore, getAppVersion } from './firebase';

const INSTALL_TRACKED_KEY = '@waltrack:installTracked';
const INSTALL_ID_KEY = '@waltrack:installId';
const INSTALLS_COLLECTION = 'installs';

async function hasTrackedInstall(): Promise<boolean> {
  const value = await AsyncStorage.getItem(INSTALL_TRACKED_KEY);
  return value === 'true';
}

async function markInstallTracked(): Promise<void> {
  await AsyncStorage.setItem(INSTALL_TRACKED_KEY, 'true');
}

function createUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

async function getInstallId(): Promise<string> {
  const storedId = await AsyncStorage.getItem(INSTALL_ID_KEY);
  if (storedId) {
    return storedId;
  }

  const newId = createUuid();
  await AsyncStorage.setItem(INSTALL_ID_KEY, newId);
  return newId;
}

export async function trackFirstInstall(): Promise<void> {
  const alreadyTracked = await hasTrackedInstall();
  if (alreadyTracked) {
    return;
  }

  try {
    const installId = await getInstallId();
    const installRef = doc(collection(firestore, INSTALLS_COLLECTION));

    await setDoc(installRef, {
      installId,
      createdAt: serverTimestamp(),
      platform: Platform.OS,
      appVersion: getAppVersion(),
    });

    await markInstallTracked();
  } catch {
    // Swallow errors to avoid affecting app startup.
  }
}
