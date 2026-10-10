// Display currencies. Tebex returns every price in the store's base currency (USD); the
// storefront converts them with the daily ECB reference rates for display only. Tebex decides
// the currency actually charged (Regional Pricing) and offers local payment methods at checkout.
export const CURRENCIES: { code: string; name: string }[] = [
  { code: 'USD', name: 'US Dollar' }, { code: 'EUR', name: 'Euro' }, { code: 'GBP', name: 'British Pound' },
  { code: 'CAD', name: 'Canadian Dollar' }, { code: 'AUD', name: 'Australian Dollar' }, { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'BRL', name: 'Brazilian Real' }, { code: 'MXN', name: 'Mexican Peso' },
  { code: 'PLN', name: 'Polish Zloty' }, { code: 'CZK', name: 'Czech Koruna' }, { code: 'HUF', name: 'Hungarian Forint' }, { code: 'RON', name: 'Romanian Leu' }, { code: 'BGN', name: 'Bulgarian Lev' },
  { code: 'SEK', name: 'Swedish Krona' }, { code: 'NOK', name: 'Norwegian Krone' }, { code: 'DKK', name: 'Danish Krone' }, { code: 'ISK', name: 'Icelandic Krona' }, { code: 'CHF', name: 'Swiss Franc' },
  { code: 'TRY', name: 'Turkish Lira' }, { code: 'ILS', name: 'Israeli Shekel' }, { code: 'ZAR', name: 'South African Rand' },
  { code: 'INR', name: 'Indian Rupee' }, { code: 'PHP', name: 'Philippine Peso' }, { code: 'IDR', name: 'Indonesian Rupiah' }, { code: 'MYR', name: 'Malaysian Ringgit' }, { code: 'THB', name: 'Thai Baht' },
  { code: 'SGD', name: 'Singapore Dollar' }, { code: 'HKD', name: 'Hong Kong Dollar' }, { code: 'CNY', name: 'Chinese Yuan' }, { code: 'JPY', name: 'Japanese Yen' }, { code: 'KRW', name: 'South Korean Won' },
];
export type Rates = { base: string; date: string; rates: Record<string, number> };
const EURO = new Set(['AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK']);
const REGIONS: Record<string, string> = { US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD', BR: 'BRL', MX: 'MXN', PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'BGN', SE: 'SEK', NO: 'NOK', DK: 'DKK', IS: 'ISK', CH: 'CHF', LI: 'CHF', TR: 'TRY', IL: 'ILS', ZA: 'ZAR', IN: 'INR', PH: 'PHP', ID: 'IDR', MY: 'MYR', TH: 'THB', SG: 'SGD', HK: 'HKD', CN: 'CNY', JP: 'JPY', KR: 'KRW' };

export function isCurrency(code: unknown): code is string { return typeof code === 'string' && CURRENCIES.some(c => c.code === code); }
// Best guess from the browser locale, e.g. de-DE -> EUR, pl -> PLN. Falls back to the store's base currency.
export function guessCurrency(locale: string, base: string): string {
  try {
    const region = new Intl.Locale(locale).maximize().region || '';
    if (EURO.has(region)) return 'EUR';
    return REGIONS[region] || base;
  } catch { return base; }
}
export function convert(amount: number, from: string, to: string, rates: Rates | null): number | null {
  if (from === to) return amount;
  if (!rates || rates.base !== from || !Number.isFinite(rates.rates[to])) return null;
  return amount * rates.rates[to];
}
export function formatMoney(amount: number, currency: string) {
  try { return new Intl.NumberFormat('en', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).format(amount); }
  catch { return `${amount.toFixed(2)} ${currency}`; }
}
