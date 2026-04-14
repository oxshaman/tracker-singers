import { Trash2 } from 'lucide-react';
import type { Transaction, Category } from '../types';
import { formatCurrency, formatDate } from '../utils';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onDelete: (id: string) => void;
}

export function TransactionList({ transactions, categories, onDelete }: TransactionListProps) {
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? 'Nepoznato';

  if (sorted.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[13px] text-ink-muted">Nema unesenih stavki.</p>
        <p className="text-[11px] text-ink-faint mt-1">Započnite dodavanjem uplate ili troška.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sorted.map((t) => {
        const isIncome = t.type === 'income';
        return (
          <div
            key={t.id}
            className="group flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-surface transition-colors duration-150"
          >
            {/* Accent dot */}
            <div
              className={`shrink-0 w-2 h-2 rounded-full ${
                isIncome ? 'bg-sage-400' : 'bg-rose-400'
              }`}
            />

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-ink truncate">
                {isIncome && t.paidBy ? t.paidBy : getCategoryName(t.categoryId)}
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5 truncate">
                {isIncome && t.paidBy && (
                  <span className="text-ink-secondary">{getCategoryName(t.categoryId)} · </span>
                )}
                {formatDate(t.date)}
                {t.description && <span className="text-ink-faint"> · {t.description}</span>}
              </p>
            </div>

            {/* Amount */}
            <span
              className={`shrink-0 text-[13px] font-semibold tabular-nums ${
                isIncome ? 'text-sage-600' : 'text-rose-600'
              }`}
            >
              {isIncome ? '+' : '−'}{formatCurrency(t.amount)}
            </span>

            {/* Delete */}
            <button
              onClick={() => onDelete(t.id)}
              className="shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-ink-faint hover:text-rose-500 transition-all duration-150"
              aria-label="Obriši"
            >
              <Trash2 size={14} strokeWidth={1.8} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
