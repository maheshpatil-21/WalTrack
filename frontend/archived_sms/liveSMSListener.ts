// Archived for future WalTrack versions. Not used in WalTrack v1.0.
// @ts-ignore
import SmsListener from 'react-native-android-sms-listener';

import { parseExpenseSMS } from './expenseParser';

import {
  getProcessedSMSIds,
  saveProcessedSMSId,
} from './processedSMS';

export const startSMSListener = (
  addExpense: any
) => {

  SmsListener.addListener(
    async (message: any) => {

      const processedIds =
        await getProcessedSMSIds();

      const smsId =
        message.originatingAddress +
        message.timestamp;

      if (processedIds.includes(smsId)) {
        return;
      }

      const parsedExpense =
        parseExpenseSMS(message.body || '');

      if (parsedExpense) {
        console.log(
          '🔥 Live Expense:',
          parsedExpense
        );

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
