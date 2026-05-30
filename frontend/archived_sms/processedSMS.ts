// Archived for future WalTrack versions. Not used in WalTrack v1.0.
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'processed_sms_ids';

export const getProcessedSMSIds = async () => {

  const storedIds =
    await AsyncStorage.getItem(STORAGE_KEY);

  return storedIds
    ? JSON.parse(storedIds)
    : [];
};

export const saveProcessedSMSId = async (
  smsId: string
) => {

  const existingIds =
    await getProcessedSMSIds();

  if (!existingIds.includes(smsId)) {

    existingIds.push(smsId);

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(existingIds)
    );
  }
};

export const generateSmsId = (sms: {
  address?: string;
  date?: string | number;
  body?: string;
}) => {
  const normalizedAddress = (sms.address || 'unknown').trim().toLowerCase();
  const normalizedDate = String(sms.date || '0');
  const normalizedBody = (sms.body || '').trim().replace(/\s+/g, ' ').toLowerCase();
  return `${normalizedAddress}::${normalizedDate}::${normalizedBody}`;
};
