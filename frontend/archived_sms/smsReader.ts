// Archived for future WalTrack versions. Not used in WalTrack v1.0.
import {
  getProcessedSMSIds,
  generateSmsId,
  saveProcessedSMSId,
} from './processedSMS';

import { parseExpenseSMS } from './expenseParser';

import SmsAndroid from 'react-native-get-sms-android';

import {
  PermissionsAndroid,
  Platform,
} from 'react-native';

export const requestSMSPermission = async () => {

  if (Platform.OS === 'android') {

    const granted =
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: 'SMS Permission',
          message:
            'WalTrack needs access to your SMS to track expenses automatically.',
          buttonPositive: 'Allow',
        }
      );

    return (
      granted ===
      PermissionsAndroid.RESULTS.GRANTED
    );
  }

  return false;
};

export const readSMSMessages = async (
  addExpense: any
) => {

  const hasPermission =
    await requestSMSPermission();

  if (!hasPermission) {
    console.log('SMS permission denied');
    return;
  }

  SmsAndroid.list(
    JSON.stringify({
      box: 'inbox',
      maxCount: 20,
    }),

    (fail: string) => {
      console.log(
        'Failed with this error: ' + fail
      );
    },

    async (
      count: number,
      smsList: string
    ) => {

      console.log('Count: ', count);

      const messages = JSON.parse(smsList);
      const processedIds = await getProcessedSMSIds();

      for (const message of messages) {
        const smsId = generateSmsId({
          address: message.address,
          date: message.date,
          body: message.body,
        });

        if (processedIds.includes(smsId)) {
          continue;
        }

        const parsedExpense = parseExpenseSMS(message.body || '');
        if (!parsedExpense) {
          continue;
        }

        console.log('💸 Parsed Expense:', parsedExpense);

        addExpense({
          amount: parsedExpense.amount,
          category: parsedExpense.category,
          note: parsedExpense.merchant,
        });

        await saveProcessedSMSId(smsId);
      }
    }
  );
};
