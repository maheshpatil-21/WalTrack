import * as Analytics from 'expo-firebase-analytics';

async function safeLogEvent(eventName: string) {
  try {
    await Analytics.logEvent(eventName);
  } catch {
    // Analytics failures must never crash the app
  }
}

export async function logAppOpen() {
  await safeLogEvent('app_open');
}

export async function logDashboardView() {
  await safeLogEvent('dashboard_view');
}

export async function logTransactionsView() {
  await safeLogEvent('transactions_view');
}

export async function logInsightsView() {
  await safeLogEvent('insights_view');
}

export async function logSettingsView() {
  await safeLogEvent('settings_view');
}

export async function logAddExpense() {
  await safeLogEvent('add_expense');
}
