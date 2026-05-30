export type ParsedExpense = {
  amount: number;
  merchant: string;
  category: string;
};

const categoryMap: Record<string, string> = {
  swiggy: 'Food',
  zomato: 'Food',
  dominos: 'Food',
  mcdonalds: 'Food',
  starbucks: 'Food',
  uber: 'Travel',
  ola: 'Travel',
  indigo: 'Travel',
  yatra: 'Travel',
  cleartrip: 'Travel',
  amazon: 'Shopping',
  flipkart: 'Shopping',
  myntra: 'Shopping',
  ajio: 'Shopping',
  nykaa: 'Shopping',
  paytm: 'Shopping',
  phonepe: 'Shopping',
  gpay: 'Shopping',
  'google pay': 'Shopping',
  googlepay: 'Shopping',
  netflix: 'Entertainment',
  bookmyshow: 'Entertainment',
  hotstar: 'Entertainment',
  spotify: 'Entertainment',
  airtel: 'Others',
  jio: 'Others',
  'indian oil': 'Travel',
  bpcl: 'Travel',
  hpcl: 'Travel',
  'bharat petrol': 'Travel',
};

const normalizeText = (input: string) =>
  input.replace(/\s+/g, ' ').trim().toLowerCase();

const extractAmount = (message: string) => {
  const normalized = message.replace(/,/g, '');
  const amountMatch =
    normalized.match(/(?:₹|inr|rs\.?|rs)\s?([0-9]+(?:\.[0-9]+)?)/i) ||
    normalized.match(/([0-9]+(?:\.[0-9]+)?)\s?(?:₹|inr|rs\.?|rs)/i);

  if (!amountMatch) {
    return 0;
  }

  return Number(amountMatch[1]);
};

const hasPattern = (
  text: string,
  patterns: Array<string | RegExp>
) =>
  patterns.some((pattern) =>
    typeof pattern === 'string'
      ? text.includes(pattern)
      : pattern.test(text)
  );

// Core debit patterns: covers basic transaction signals
const debitPatterns: Array<string | RegExp> = [
  /\bdebited\b/, 
  /\bdr\.?\b/, 
  /\bpaid\b/, 
  /\bspent\b/, 
  /\bpurchase\b/, 
  /\bdeducted\b/, 
  /\bwithdrawn\b/, 
  /\bpayment\b/, 
  /\btransferred\b/, 
  /\bsent\b/, 
  /\b(?:paid|sent|transferred|debited).*\b(?:to|via|through|from)\b/, 
  /\b(?:upi|google pay|gpay|phonepe|paytm)\b.*\b(?:paid|sent|debited|success|txn)\b/, 
  /\b(?:txn|transaction)\b.*\b(?:debit|paid|sent|success)\b/, 
];

// UPI-specific patterns
const upiPatterns: Array<string | RegExp> = [
  /\bupi\s+(?:payment|txn|transfer|paid)\b/, 
  /\b(?:paid|sent|transferred)\s+via\s+(?:upi|gpay|phonepe|paytm)\b/, 
  /\bupi\s+(?:to|rupees)\b/, 
];

// Bank transfer patterns (NEFT, IMPS, fund transfer)
const bankTransferPatterns: Array<string | RegExp> = [
  /\b(?:neft|imps|rtgs)\b.*\b(?:transferred|paid|sent)\b/, 
  /\b(?:transferred|sent)\s+(?:via|through)?\s+(?:neft|imps|rtgs|bank)\b/, 
  /\bfund\s+transfer\b/, 
  /\b(?:amount|rupees)\s+transferred\b/, 
];

// Debit card patterns
const debitCardPatterns: Array<string | RegExp> = [
  /\bdebit\s+card\b.*\b(?:charged|debited|paid)\b/, 
  /\b(?:card|debit)\b.*\b(?:purchase|payment|transaction)\b/, 
];

// Wallet and payment app patterns
const walletPatterns: Array<string | RegExp> = [
  /\b(?:paytm|phonepe|googlepay|gpay|amazonpay|airtelpaymentsbank)\b.*\b(?:paid|sent|debited)\b/, 
  /\b(?:paid|sent|transferred)\s+(?:via|through|using)\s+(?:paytm|phonepe|googlepay|gpay|wallet)\b/, 
  /\bwallet\s+(?:debited|charged)\b/, 
];

// Transaction success patterns
const txnSuccessPatterns: Array<string | RegExp> = [
  /\b(?:txn|transaction|payment|transfer)\s+(?:successful|success|done|completed)\b/, 
  /\b(?:successful|success|done)\s+(?:txn|transaction|payment|transfer)\b/, 
  /\bamount\s+deducted\b/, 
  /\bpayment\s+done\b/, 
];

const creditPatterns: Array<string | RegExp> = [
  /\bcredited\b/, 
  /\bcr\.?\b(?!\s+to\b)/, 
  /\breceived\b/, 
  /\bdeposited\b/, 
  /\brefund\b/, 
  /\bcashback\b/, 
  /\bincoming\b/, 
  /\breversal\b/, 
  /\bchargeback\b/, 
];

const recipientCreditPatterns: Array<string | RegExp> = [
  /\bcr\.?\s+to\b/, 
  /\bcredited\s+to\b/, 
];

const strongDebitPatterns: Array<string | RegExp> = [
  /\bdr\.?\s+from\b/, 
  /\bdebited\s+from\b/, 
  /\bsent\s+via\s+(?:upi|gpay|phonepe|paytm)\b/, 
  /\bpaid\s+to\b/, 
  /\bdeducted\s+from\b/, 
  /\bwithdrawn\s+from\b/, 
  /\btransferred\s+to\b/, 
];

const ignorePatterns: Array<string | RegExp> = [
  /\boffer\b/, 
  /\bstarting at\b/, 
  /\bloan\b/, 
];

// Telemetry mode: log unmatched SMS patterns for continuous improvement
const TELEMETRY_MODE = false; // Set to true to enable debug logging

const logUnmatchedPattern = (
  message: string,
  lowerMessage: string,
  amount: number
) => {
  if (!TELEMETRY_MODE) return;

  console.warn('[SMS_TELEMETRY] Unmatched SMS (debit-like but rejected):', {
    originalMessage: message.substring(0, 100),
    normalizedMessage: lowerMessage.substring(0, 100),
    amount,
    hasAmount: amount > 0,
    suspiciousKeywords: [
      'paid', 'sent', 'transfer', 'debit', 'upi', 'txn', 'payment',
    ].filter((kw) => lowerMessage.includes(kw)),
  });
};

const logUnknownTransactionFormat = (
  message: string,
  lowerMessage: string
) => {
  if (!TELEMETRY_MODE) return;

  const hasMoneyKeywords = ['₹', 'rs', 'inr', 'amount', 'rupees'].some((kw) =>
    message.toLowerCase().includes(kw)
  );

  const hasTransactionKeywords = [
    'paid', 'sent', 'transfer', 'debit', 'transaction', 'payment', 'upi', 'txn',
  ].some((kw) => lowerMessage.includes(kw));

  if (hasMoneyKeywords && hasTransactionKeywords) {
    console.warn('[SMS_TELEMETRY] Unknown transaction format:', {
      originalMessage: message.substring(0, 120),
      normalizedMessage: lowerMessage.substring(0, 120),
    });
  }
};


const inferMerchant = (message: string, lowerMessage: string) => {
  const knownKey = Object.keys(categoryMap).find((key) =>
    lowerMessage.includes(key)
  );

  if (knownKey) {
    return knownKey
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  const merchantPatterns = [
    /(?:to|at|with|via|for)\s+([a-z0-9 &]+?)(?:\.|,| on | for | through | via |$)/i,
    /(?:merchant|payee)\s*[:\-]\s*([a-z0-9 &]+)/i,
  ];

  for (const pattern of merchantPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return 'Unknown';
};

const inferCategory = (lowerMessage: string, merchant: string) => {
  const knownKey = Object.keys(categoryMap).find((key) =>
    lowerMessage.includes(key)
  );

  if (knownKey) {
    return categoryMap[knownKey];
  }

  if (merchant !== 'Unknown') {
    const normalizedMerchant = merchant.toLowerCase();
    if (normalizedMerchant.includes('petrol') || normalizedMerchant.includes('bpcl') || normalizedMerchant.includes('hpcl') || normalizedMerchant.includes('bharat petrol') || normalizedMerchant.includes('indian oil')) {
      return 'Travel';
    }
    if (normalizedMerchant.includes('netflix') || normalizedMerchant.includes('spotify') || normalizedMerchant.includes('hotstar') || normalizedMerchant.includes('bookmyshow')) {
      return 'Entertainment';
    }
    if (normalizedMerchant.includes('uber') || normalizedMerchant.includes('ola') || normalizedMerchant.includes('yatra') || normalizedMerchant.includes('cleartrip')) {
      return 'Travel';
    }
  }

  return 'Others';
};

export const parseExpenseSMS = (
  message: string
): ParsedExpense | null => {
  const lowerMessage = normalizeText(message);
  const amount = extractAmount(message);

  const matchedDebitPatterns = debitPatterns
    .filter((pattern) =>
      typeof pattern === 'string'
        ? lowerMessage.includes(pattern)
        : pattern.test(lowerMessage)
    )
    .map((pattern) =>
      typeof pattern === 'string' ? pattern : pattern.toString()
    );

  const matchedUpiPatterns = upiPatterns
    .filter((pattern) =>
      typeof pattern === 'string'
        ? lowerMessage.includes(pattern)
        : pattern.test(lowerMessage)
    )
    .map((pattern) =>
      typeof pattern === 'string' ? pattern : pattern.toString()
    );

  const matchedBankTransferPatterns = bankTransferPatterns
    .filter((pattern) =>
      typeof pattern === 'string'
        ? lowerMessage.includes(pattern)
        : pattern.test(lowerMessage)
    )
    .map((pattern) =>
      typeof pattern === 'string' ? pattern : pattern.toString()
    );

  const matchedDebitCardPatterns = debitCardPatterns
    .filter((pattern) =>
      typeof pattern === 'string'
        ? lowerMessage.includes(pattern)
        : pattern.test(lowerMessage)
    )
    .map((pattern) =>
      typeof pattern === 'string' ? pattern : pattern.toString()
    );

  const matchedWalletPatterns = walletPatterns
    .filter((pattern) =>
      typeof pattern === 'string'
        ? lowerMessage.includes(pattern)
        : pattern.test(lowerMessage)
    )
    .map((pattern) =>
      typeof pattern === 'string' ? pattern : pattern.toString()
    );

  const matchedTxnSuccessPatterns = txnSuccessPatterns
    .filter((pattern) =>
      typeof pattern === 'string'
        ? lowerMessage.includes(pattern)
        : pattern.test(lowerMessage)
    )
    .map((pattern) =>
      typeof pattern === 'string' ? pattern : pattern.toString()
    );

  const matchedCreditPatterns = creditPatterns
    .filter((pattern) =>
      typeof pattern === 'string'
        ? lowerMessage.includes(pattern)
        : pattern.test(lowerMessage)
    )
    .map((pattern) =>
      typeof pattern === 'string' ? pattern : pattern.toString()
    );

  const matchedIgnorePatterns = ignorePatterns
    .filter((pattern) =>
      typeof pattern === 'string'
        ? lowerMessage.includes(pattern)
        : pattern.test(lowerMessage)
    )
    .map((pattern) =>
      typeof pattern === 'string' ? pattern : pattern.toString()
    );

  const matchedRecipientCreditPatterns = recipientCreditPatterns
    .filter((pattern) =>
      typeof pattern === 'string'
        ? lowerMessage.includes(pattern)
        : pattern.test(lowerMessage)
    )
    .map((pattern) =>
      typeof pattern === 'string' ? pattern : pattern.toString()
    );

  const hasRecipientCreditSignal =
    matchedRecipientCreditPatterns.length > 0;

  const hasStrongDebitSignal = hasPattern(lowerMessage, strongDebitPatterns);

  const hasCreditSignal =
    matchedCreditPatterns.length > 0 ||
    matchedIgnorePatterns.length > 0;

  const hasDebitSignal = matchedDebitPatterns.length > 0;

  const hasPaymentMethodSignal =
    matchedUpiPatterns.length > 0 ||
    matchedBankTransferPatterns.length > 0 ||
    matchedDebitCardPatterns.length > 0 ||
    matchedWalletPatterns.length > 0 ||
    matchedTxnSuccessPatterns.length > 0;

  const hasAnyDebitIndicator = hasDebitSignal || hasPaymentMethodSignal;

  let reason: string;
  if (amount <= 0) {
    reason = 'no amount found';
    logUnknownTransactionFormat(message, lowerMessage);
  } else if (hasCreditSignal && !(hasStrongDebitSignal && hasRecipientCreditSignal)) {
    reason = 'credit/incoming signal detected';
    logUnmatchedPattern(message, lowerMessage, amount);
  } else if (!hasAnyDebitIndicator) {
    reason = 'no debit pattern matched';
    logUnknownTransactionFormat(message, lowerMessage);
  } else {
    reason = 'accepted as debit expense';
  }

  console.debug('[parseExpenseSMS]', {
    normalizedMessage: lowerMessage,
    extractedAmount: amount,
    matchedDebitPatterns,
    matchedUpiPatterns,
    matchedBankTransferPatterns,
    matchedDebitCardPatterns,
    matchedWalletPatterns,
    matchedTxnSuccessPatterns,
    matchedCreditPatterns,
    matchedRecipientCreditPatterns,
    matchedIgnorePatterns,
    hasStrongDebitSignal,
    hasDebitSignal,
    hasPaymentMethodSignal,
    hasCreditSignal,
    hasRecipientCreditSignal,
    hasAnyDebitIndicator,
    classificationReason: reason,
  });

  if (
    amount <= 0 ||
    (hasCreditSignal && !(hasStrongDebitSignal && hasRecipientCreditSignal)) ||
    !hasAnyDebitIndicator
  ) {
    return null;
  }

  const merchant = inferMerchant(message, lowerMessage);
  const category = inferCategory(lowerMessage, merchant);

  return {
    amount,
    merchant,
    category,
  };
};