'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CURRENCIES, convert, formatMoney, guessCurrency, isCurrency, type Rates } from '@/lib/currency';
import { money } from '@/lib/catalog';

type CurrencyContextValue = {
  base: string; code: string; setCode: (code: string) => void; rates: Rates | null; converted: boolean;
  fmt: (amount: number, currency?: string) => string;
};
const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ base, children }: { base: string; children: React.ReactNode }) {
  const [code, setCodeState] = useState(base);
  const [rates, setRates] = useState<Rates | null>(null);
  useEffect(() => {
    let saved = '';
    try { saved = localStorage.getItem('server-template-currency') || ''; } catch { /* private browsing */ }
    setCodeState(isCurrency(saved) ? saved : guessCurrency(navigator.language, base));
  }, [base]);
  useEffect(() => {
    let active = true;
    fetch(`/api/rates?base=${base}`).then(r => r.json()).then((data: Rates) => { if (active && data && data.base === base) setRates(data); }).catch(() => { /* prices stay in the base currency */ });
    return () => { active = false; };
  }, [base]);
  const value = useMemo<CurrencyContextValue>(() => {
    const converted = code !== base && !!rates && Number.isFinite(rates.rates[code]);
    return {
      base, code, rates, converted,
      setCode: next => { if (!isCurrency(next)) return; setCodeState(next); try { localStorage.setItem('server-template-currency', next); } catch { /* ignore */ } },
      fmt: (amount, currency = base) => {
        const local = currency === base ? convert(amount, base, code, rates) : null;
        return local === null || code === currency ? money(amount, currency) : formatMoney(local, code);
      },
    };
  }, [base, code, rates]);
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
export function useCurrency() {
  const value = useContext(CurrencyContext);
  if (!value) throw new Error('useCurrency needs a CurrencyProvider');
  return value;
}
export function CurrencySelect() {
  const { code, setCode, rates, base } = useCurrency();
  return <select className="currency-select" value={code} onChange={e => setCode(e.target.value)} aria-label="Display currency">
    {CURRENCIES.map(c => <option key={c.code} value={c.code} title={c.name} disabled={c.code !== base && !!rates && !Number.isFinite(rates.rates[c.code])}>{c.code}</option>)}
  </select>;
}
// Shown wherever a converted price could be mistaken for the charged amount.
export function CurrencyNote({ className = 'price-note' }: { className?: string }) {
  const { base, code, converted, rates } = useCurrency();
  if (!converted) return null;
  return <p className={className}>Prices shown in {code} at the {rates?.date || 'latest'} exchange rate. Packages are priced in {base}; Tebex shows your local currency and payment methods at checkout.</p>;
}
