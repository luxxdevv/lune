'use client';
import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { money } from '@/lib/catalog';

export function GiftcardBalance() {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ text: string; ok: boolean } | null>(null);
  async function check(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setResult(null);
    try {
      const response = await fetch('/api/giftcard-balance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code.trim() }), signal: AbortSignal.timeout(15_000) });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || 'Could not check this gift card. Please try again.');
      if (!Number.isFinite(value.balance) || typeof value.currency !== 'string') throw new Error('Could not check this gift card. Please try again.');
      setResult({ text: `${money(value.balance, value.currency)} ${value.currency} remaining`, ok: true });
    } catch (error) {
      setResult({ text: error instanceof Error && error.name !== 'TimeoutError' ? error.message : 'The balance checker is temporarily unavailable. Please try again.', ok: false });
    } finally { setBusy(false); }
  }
  return <section className="buyer-panel giftcard-panel" aria-labelledby="giftcard-title">
    <h2 id="giftcard-title">Gift card balance</h2>
    <form onSubmit={check} aria-busy={busy}>
      <input aria-label="Gift card number" placeholder="Enter gift card number" name="gift-card-number" value={code} onChange={event => { setCode(event.target.value); setResult(null); }} required minLength={5} maxLength={64} autoComplete="off" spellCheck={false} disabled={busy}/>
      <button type="submit" disabled={busy || code.trim().length < 5}>{busy ? <LoaderCircle className="spinning" size={16} aria-label="Checking"/> : 'Check'}</button>
    </form>
    <p className={`giftcard-result ${result?.ok ? 'is-success' : ''}`} role="status" aria-live="polite">{result?.text}</p>
  </section>;
}
