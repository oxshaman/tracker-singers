import type { Transaction } from './types';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/** Today as dd/mm/yyyy */
export function todayDmy(): string {
  return dateToDmy(new Date());
}

/** Date → dd/mm/yyyy */
export function dateToDmy(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** ISO yyyy-mm-dd → dd/mm/yyyy (empty string tolerated). */
export function isoDateToDmy(iso: string): string {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** dd/mm/yyyy → yyyy-mm-dd, or empty string if invalid. */
export function dmyToIsoDate(dmy: string): string {
  const d = parseDmy(dmy);
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Progressively formats numeric input into dd/mm/yyyy while the user types.
 * Strips non-digits and caps at 8 digits.
 */
export function formatDmyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Strict dd/mm/yyyy parser with round-trip sanity check. Returns null if invalid. */
export function parseDmy(dmy: string): Date | null {
  const m = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) return null;
  const d = new Date(year, month - 1, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('hr-HR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(now);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getStartOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export interface PeriodSummary {
  income: number;
  expense: number;
  balance: number;
}

export function calculateSummary(transactions: Transaction[], since?: Date): PeriodSummary {
  const filtered = since
    ? transactions.filter((t) => new Date(t.date) >= since)
    : transactions;

  const income = filtered
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return { income, expense, balance: income - expense };
}
