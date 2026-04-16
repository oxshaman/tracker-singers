import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';
import type { Category, Transaction, TransactionType } from '../types';
import { generateId } from '../utils';

interface MultiAddViewProps {
  type: TransactionType;
  categories: Category[];
  onAdd: (transaction: Transaction) => void;
  onClose: () => void;
  onOpenAddCategory: () => void;
}

interface DraftRow {
  key: string;
  categoryId: string;
  paidBy: string;
  amount: string;
  date: string;
  description: string;
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

function emptyRow(defaultCategoryId: string): DraftRow {
  return {
    key: generateId(),
    categoryId: defaultCategoryId,
    paidBy: '',
    amount: '',
    date: todayIso(),
    description: '',
  };
}

function isRowTouched(r: DraftRow): boolean {
  return (
    r.paidBy.trim() !== '' ||
    r.amount.trim() !== '' ||
    r.description.trim() !== ''
  );
}

function parseAmount(v: string): number {
  return parseFloat(v.replace(',', '.'));
}

function isRowValid(r: DraftRow): boolean {
  if (!r.categoryId) return false;
  const n = parseAmount(r.amount);
  if (isNaN(n) || n <= 0) return false;
  if (!r.date) return false;
  return true;
}

export function MultiAddView({
  type,
  categories,
  onAdd,
  onClose,
  onOpenAddCategory,
}: MultiAddViewProps) {
  const isExpense = type === 'expense';
  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );
  const defaultCategoryId = filteredCategories[0]?.id ?? '';

  const [rows, setRows] = useState<DraftRow[]>(() => [emptyRow(defaultCategoryId)]);
  const firstCellRef = useRef<HTMLSelectElement | null>(null);

  useEffect(() => {
    if (defaultCategoryId) {
      setRows((prev) =>
        prev.map((r) => (r.categoryId ? r : { ...r, categoryId: defaultCategoryId })),
      );
    }
  }, [defaultCategoryId]);

  useEffect(() => {
    const t = setTimeout(() => firstCellRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const ensureTrailingEmptyRow = useCallback(() => {
    setRows((prev) => {
      const last = prev[prev.length - 1];
      if (last && isRowTouched(last)) {
        return [...prev, emptyRow(defaultCategoryId)];
      }
      return prev;
    });
  }, [defaultCategoryId]);

  const updateRow = useCallback((key: string, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }, []);

  const removeRow = useCallback(
    (key: string) => {
      setRows((prev) => {
        const next = prev.filter((r) => r.key !== key);
        return next.length === 0 ? [emptyRow(defaultCategoryId)] : next;
      });
    },
    [defaultCategoryId],
  );

  const addRowManual = useCallback(() => {
    setRows((prev) => [...prev, emptyRow(defaultCategoryId)]);
  }, [defaultCategoryId]);

  const touchedRows = rows.filter(isRowTouched);
  const validRows = touchedRows.filter(isRowValid);
  const invalidTouchedCount = touchedRows.length - validRows.length;

  const handleSaveAll = () => {
    if (validRows.length === 0) return;
    validRows.forEach((r) => {
      onAdd({
        id: generateId(),
        categoryId: r.categoryId,
        amount: parseAmount(r.amount),
        description: r.description.trim(),
        date: new Date(r.date).toISOString(),
        type,
        ...(r.paidBy.trim() && { paidBy: r.paidBy.trim() }),
      });
    });
    onClose();
  };

  const title = isExpense ? 'Dodaj više troškova' : 'Dodaj više uplata';
  const accentBtn = isExpense
    ? 'bg-rose-500 hover:bg-rose-600'
    : 'bg-sage-500 hover:bg-sage-600';
  const headerDot = isExpense ? 'bg-rose-500' : 'bg-sage-500';

  if (filteredCategories.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-surface-page font-sora overflow-auto">
        <div className="sticky top-0 z-10 bg-surface/90 backdrop-blur-md border-b border-border">
          <div className="max-w-[960px] mx-auto px-5 h-14 flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-ink-secondary hover:bg-surface-page transition-colors"
            >
              <ArrowLeft size={16} strokeWidth={1.8} />
              Natrag
            </button>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${headerDot}`} />
              <h1 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h1>
            </div>
          </div>
        </div>
        <div className="max-w-[640px] mx-auto px-5 py-16 text-center">
          <p className="text-[13px] text-ink-muted mb-4">
            Nemate kategorija za {isExpense ? 'troškove' : 'uplate'}.
          </p>
          <button
            type="button"
            onClick={onOpenAddCategory}
            className="text-[13px] font-medium text-peri-600 hover:text-peri-700 transition-colors"
          >
            + Dodaj kategoriju
          </button>
        </div>
      </div>
    );
  }

  const cellInput =
    'w-full px-2.5 py-2 rounded-lg border border-transparent bg-transparent text-ink text-[13px] placeholder:text-ink-faint focus:border-peri-400 focus:bg-surface focus:outline-none transition-colors';

  return (
    <div className="fixed inset-0 z-50 bg-surface-page font-sora overflow-auto">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-surface/90 backdrop-blur-md border-b border-border">
        <div className="max-w-[960px] mx-auto px-5 h-14 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-ink-secondary hover:bg-surface-page transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={1.8} />
            Natrag
          </button>
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${headerDot}`} />
            <h1 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h1>
          </div>
          <div className="flex-1" />
          <span className="hidden sm:inline text-[12px] text-ink-muted">
            {validRows.length > 0
              ? `${validRows.length} spremno za dodati`
              : 'Ispunite barem jedan red'}
          </span>
          <button
            onClick={handleSaveAll}
            disabled={validRows.length === 0}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${accentBtn}`}
          >
            Spremi {validRows.length > 0 ? `(${validRows.length})` : 'sve'}
          </button>
        </div>
        {invalidTouchedCount > 0 && (
          <div className="max-w-[960px] mx-auto px-5 pb-2 -mt-1">
            <p className="text-[11px] text-rose-600">
              {invalidTouchedCount}{' '}
              {invalidTouchedCount === 1 ? 'red je nepotpun' : 'redova je nepotpuno'} — potrebni su
              kategorija, iznos i datum.
            </p>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="max-w-[960px] mx-auto px-2 sm:px-5 py-6">
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="bg-surface-page border-b border-border">
                  <th className="w-8 px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted text-left">
                    #
                  </th>
                  <th className="px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted text-left">
                    Kategorija
                  </th>
                  <th className="px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted text-left">
                    {isExpense ? 'Tko je platio/la' : 'Tko je uplatio/la'}
                  </th>
                  <th className="px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted text-left w-[120px]">
                    Iznos (€)
                  </th>
                  <th className="px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted text-left w-[160px]">
                    Datum
                  </th>
                  <th className="px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted text-left">
                    Opis
                  </th>
                  <th className="w-10" aria-label="Akcije" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const touched = isRowTouched(row);
                  const valid = isRowValid(row);
                  const amountNum = parseAmount(row.amount);
                  const showAmountError =
                    row.amount.trim() !== '' && (isNaN(amountNum) || amountNum <= 0);
                  return (
                    <tr
                      key={row.key}
                      className={`border-b border-border-light last:border-b-0 ${
                        touched && !valid ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      <td className="px-2 py-1 text-[12px] text-ink-faint align-middle">
                        {idx + 1}
                      </td>
                      <td className="px-1 py-1 align-middle">
                        <select
                          ref={idx === 0 ? firstCellRef : undefined}
                          value={row.categoryId}
                          onChange={(e) => {
                            updateRow(row.key, { categoryId: e.target.value });
                            ensureTrailingEmptyRow();
                          }}
                          className={`${cellInput} appearance-none pr-6`}
                        >
                          {filteredCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-1 py-1 align-middle">
                        <input
                          type="text"
                          value={row.paidBy}
                          onChange={(e) => {
                            updateRow(row.key, { paidBy: e.target.value });
                            ensureTrailingEmptyRow();
                          }}
                          placeholder="Ime i prezime"
                          className={cellInput}
                        />
                      </td>
                      <td className="px-1 py-1 align-middle">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={row.amount}
                          onChange={(e) => {
                            updateRow(row.key, { amount: e.target.value });
                            ensureTrailingEmptyRow();
                          }}
                          placeholder="0,00"
                          className={`${cellInput} tabular-nums ${
                            showAmountError ? 'text-rose-600' : ''
                          }`}
                        />
                      </td>
                      <td className="px-1 py-1 align-middle">
                        <input
                          type="date"
                          value={row.date}
                          onChange={(e) => {
                            updateRow(row.key, { date: e.target.value });
                            ensureTrailingEmptyRow();
                          }}
                          className={cellInput}
                        />
                      </td>
                      <td className="px-1 py-1 align-middle">
                        <input
                          type="text"
                          value={row.description}
                          onChange={(e) => {
                            updateRow(row.key, { description: e.target.value });
                            ensureTrailingEmptyRow();
                          }}
                          placeholder="Kratki opis..."
                          className={cellInput}
                        />
                      </td>
                      <td className="px-1 py-1 align-middle">
                        <button
                          type="button"
                          onClick={() => removeRow(row.key)}
                          disabled={rows.length === 1 && !touched}
                          className="p-1.5 rounded-lg text-ink-faint hover:text-rose-600 hover:bg-rose-50 disabled:opacity-0 disabled:cursor-not-allowed transition-colors"
                          aria-label="Ukloni red"
                          tabIndex={-1}
                        >
                          <Trash2 size={14} strokeWidth={1.8} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 px-3 py-2.5 border-t border-border-light bg-surface-page">
            <button
              type="button"
              onClick={addRowManual}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-ink-secondary hover:bg-surface hover:text-peri-700 transition-colors"
            >
              <Plus size={14} strokeWidth={2} />
              Dodaj red
            </button>
            <span className="text-[11px] text-ink-faint hidden sm:inline">
              Novi red se automatski dodaje kad počnete upisivati u zadnji red. Koristite Tab za
              navigaciju.
            </span>
          </div>
        </div>

        {/* Mobile helper */}
        <p className="sm:hidden mt-3 text-[11px] text-ink-faint text-center">
          Pomaknite tablicu vodoravno za sve stupce.
        </p>
      </div>
    </div>
  );
}
