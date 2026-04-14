import type { Transaction } from '../types';
import { calculateSummary, formatCurrency, getStartOfWeek, getStartOfMonth } from '../utils';

interface SummaryCardsProps {
  transactions: Transaction[];
}

interface PeriodCardProps {
  label: string;
  income: number;
  expense: number;
  balance: number;
  accent: 'sage' | 'peri' | 'rose';
}

const accentMap = {
  sage: {
    border: 'border-l-sage-400',
    label: 'text-sage-600',
  },
  peri: {
    border: 'border-l-peri-400',
    label: 'text-peri-600',
  },
  rose: {
    border: 'border-l-rose-400',
    label: 'text-rose-600',
  },
};

function PeriodCard({ label, income, expense, balance, accent }: PeriodCardProps) {
  const a = accentMap[accent];

  return (
    <div className={`bg-surface rounded-2xl p-4 border border-border border-l-[3px] ${a.border}`}>
      <h3 className={`text-[11px] font-semibold uppercase tracking-widest mb-3 ${a.label}`}>
        {label}
      </h3>

      <div className="space-y-2.5">
        <Row label="Uplate" value={income} color="text-sage-600" />
        <Row label="Troškovi" value={expense} color="text-rose-600" />

        <div className="border-t border-border-light pt-2.5">
          <Row
            label="Stanje"
            value={balance}
            color={balance >= 0 ? 'text-sage-700' : 'text-rose-700'}
            bold
          />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color, bold }: { label: string; value: number; color: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-ink-muted tracking-wide">{label}</span>
      <span className={`text-[13px] tabular-nums ${color} ${bold ? 'font-semibold' : 'font-medium'}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

export function SummaryCards({ transactions }: SummaryCardsProps) {
  const weekly = calculateSummary(transactions, getStartOfWeek());
  const monthly = calculateSummary(transactions, getStartOfMonth());
  const allTime = calculateSummary(transactions);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <PeriodCard label="Tjedan" accent="sage" {...weekly} />
      <PeriodCard label="Mjesec" accent="peri" {...monthly} />
      <PeriodCard label="Ukupno" accent="rose" {...allTime} />
    </div>
  );
}
