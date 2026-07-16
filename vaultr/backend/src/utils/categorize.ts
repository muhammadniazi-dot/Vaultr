/**
 * Auto-categorizes a transaction from its merchant name/title using simple
 * keyword matching. Only used as a fallback when the caller doesn't supply an
 * explicit `category` — an existing category is always preserved as-is.
 */

export const TRANSACTION_CATEGORIES = [
  'Food',
  'Transport',
  'Entertainment',
  'Shopping',
  'Bills',
  'Income',
  'Transfers',
  'Other',
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

// Checked in order — first matching category wins. Keep specific/well-known
// merchant names above generic words so e.g. "Uber" (Transport) doesn't get
// shadowed by a broader rule.
const KEYWORD_RULES: { category: TransactionCategory; keywords: string[] }[] = [
  {
    category: 'Food',
    keywords: [
      'tim hortons',
      'tim horton',
      'starbucks',
      'mcdonald',
      'subway',
      'pizza',
      'restaurant',
      'coffee',
      'cafe',
      'diner',
      'bakery',
    ],
  },
  {
    category: 'Transport',
    keywords: ['ttc', 'uber', 'lyft', 'gas', 'petro', 'shell', 'esso', 'parking', 'transit', 'taxi', 'fuel'],
  },
  {
    category: 'Entertainment',
    keywords: [
      'netflix',
      'spotify',
      'cinema',
      'movie',
      'theatre',
      'theater',
      'disney',
      'hulu',
      'concert',
      'game',
    ],
  },
  {
    category: 'Bills',
    keywords: [
      'hydro',
      'phone',
      'internet',
      'bell canada',
      'rogers',
      'telus',
      'utility',
      'utilities',
      'insurance',
      'mortgage',
      'rent',
    ],
  },
  {
    category: 'Shopping',
    keywords: ['amazon', 'walmart', 'shoppers drug mart', 'best buy', 'mall', 'store'],
  },
  {
    category: 'Income',
    keywords: ['payroll', 'salary', 'paycheck', 'paycheque', 'deposit', 'employer'],
  },
  {
    category: 'Transfers',
    keywords: ['transfer', 'e-transfer', 'interac'],
  },
];

/** Returns a category matched purely from keywords, or null if nothing matched. */
export function categorizeByMerchant(merchantOrTitle: string): TransactionCategory | null {
  const name = merchantOrTitle.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((keyword) => name.includes(keyword))) {
      return rule.category;
    }
  }
  return null;
}

/**
 * Full categorization: try merchant keywords first, then fall back to a hint
 * from the transaction type (deposit-like → Income, transfer-like →
 * Transfers), and finally `Other`.
 */
export function categorizeTransaction(merchantOrTitle: string, typeHint?: string): TransactionCategory {
  const byMerchant = categorizeByMerchant(merchantOrTitle);
  if (byMerchant) return byMerchant;

  const key = typeHint?.trim().toUpperCase();
  if (key === 'CREDIT' || key === 'DEPOSIT') return 'Income';
  if (key === 'TRANSFER') return 'Transfers';

  return 'Other';
}
