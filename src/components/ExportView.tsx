import { useMemo, useState } from 'react';
import { ArrowLeft, Printer, Download, FileSpreadsheet } from 'lucide-react';
import type { Category, Transaction, TransactionType } from '../types';
import { DatePicker } from './DatePicker';
import { dmyToIsoDate, dateToDmy, formatCurrency, parseDmy } from '../utils';

interface ExportViewProps {
  transactions: Transaction[];
  categories: Category[];
  onClose: () => void;
}

type FilterType = 'all' | TransactionType;

function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function formatAmount(n: number): string {
  return new Intl.NumberFormat('hr-HR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function escapeCsv(value: string): string {
  if (/[",;\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function ExportView({ transactions, categories, onClose }: ExportViewProps) {
  const allDates = transactions.map((t) => new Date(t.date));
  const min = allDates.length ? new Date(Math.min(...allDates.map((d) => d.getTime()))) : new Date();
  const max = allDates.length ? new Date(Math.max(...allDates.map((d) => d.getTime()))) : new Date();

  const [fromDate, setFromDate] = useState<string>(dateToDmy(min));
  const [toDate, setToDate] = useState<string>(dateToDmy(max));
  const [filter, setFilter] = useState<FilterType>('all');

  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? 'Nepoznato';

  const filtered = useMemo(() => {
    const fromParsed = parseDmy(fromDate);
    const toParsed = parseDmy(toDate);
    const from = fromParsed
      ? new Date(fromParsed.getFullYear(), fromParsed.getMonth(), fromParsed.getDate(), 0, 0, 0)
      : null;
    const to = toParsed
      ? new Date(toParsed.getFullYear(), toParsed.getMonth(), toParsed.getDate(), 23, 59, 59)
      : null;
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        if (from && d < from) return false;
        if (to && d > to) return false;
        if (filter !== 'all' && t.type !== filter) return false;
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, fromDate, toDate, filter]);

  const { rows, totalIncome, totalExpense } = useMemo(() => {
    let running = 0;
    let tIncome = 0;
    let tExpense = 0;
    const r = filtered.map((t, idx) => {
      if (t.type === 'income') {
        running += t.amount;
        tIncome += t.amount;
      } else {
        running -= t.amount;
        tExpense += t.amount;
      }
      return { idx: idx + 1, t, balance: running };
    });
    return { rows: r, totalIncome: tIncome, totalExpense: tExpense };
  }, [filtered]);

  const balance = totalIncome - totalExpense;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const header = ['#', 'Datum', 'Vrsta', 'Kategorija', 'Platio/la', 'Opis', 'Uplata', 'Trošak', 'Stanje'];
    const lines = [header.join(';')];
    rows.forEach(({ idx, t, balance: bal }) => {
      const vrsta = t.type === 'income' ? 'Uplata' : 'Trošak';
      const income = t.type === 'income' ? formatAmount(t.amount) : '';
      const expense = t.type === 'expense' ? formatAmount(t.amount) : '';
      lines.push(
        [
          idx,
          formatDateShort(t.date),
          vrsta,
          escapeCsv(categoryName(t.categoryId)),
          escapeCsv(t.paidBy ?? ''),
          escapeCsv(t.description ?? ''),
          income,
          expense,
          formatAmount(bal),
        ].join(';'),
      );
    });
    lines.push('');
    lines.push(['', '', '', '', '', 'UKUPNO', formatAmount(totalIncome), formatAmount(totalExpense), formatAmount(balance)].join(';'));

    const csv = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blagajna_${dmyToIsoDate(fromDate) || 'od'}_${dmyToIsoDate(toDate) || 'do'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white font-sora overflow-auto print-root">
      {/* Toolbar (hidden on print) */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-border">
        <div className="max-w-[960px] mx-auto px-5 h-14 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-ink-secondary hover:bg-surface-page transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={1.8} />
            Natrag
          </button>

          <div className="flex-1" />

          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-[13px] font-medium text-ink-secondary hover:border-peri-400 hover:text-peri-700 transition-colors"
          >
            <Download size={15} strokeWidth={1.8} />
            CSV
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-peri-600 text-white text-[13px] font-medium hover:bg-peri-700 transition-colors"
          >
            <Printer size={15} strokeWidth={1.8} />
            Ispis
          </button>
        </div>

        {/* Filters */}
        <div className="max-w-[960px] mx-auto px-5 py-3 flex flex-wrap items-center gap-3 border-t border-border-light">
          <div className="flex items-center gap-2 text-[12px] text-ink-secondary">
            <span>Od</span>
            <div className="w-[140px]">
              <DatePicker
                value={fromDate}
                onChange={setFromDate}
                ariaLabel="Od datuma"
                inputClassName="!px-2.5 !py-1 !rounded-md !text-[12px]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-ink-secondary">
            <span>Do</span>
            <div className="w-[140px]">
              <DatePicker
                value={toDate}
                onChange={setToDate}
                ariaLabel="Do datuma"
                inputClassName="!px-2.5 !py-1 !rounded-md !text-[12px]"
              />
            </div>
          </div>
          <div className="flex rounded-md border border-border overflow-hidden text-[12px]">
            {(['all', 'income', 'expense'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 font-medium transition-colors ${
                  filter === f
                    ? 'bg-peri-600 text-white'
                    : 'bg-surface text-ink-secondary hover:bg-surface-page'
                }`}
              >
                {f === 'all' ? 'Sve' : f === 'income' ? 'Uplate' : 'Troškovi'}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-[11px] text-ink-muted">
            <FileSpreadsheet size={13} strokeWidth={1.8} />
            {rows.length} stavki
          </div>
        </div>
      </div>

      {/* Printable document */}
      <div className="print-sheet max-w-[960px] mx-auto px-6 sm:px-10 py-8">
        {/* Document header */}
        <div className="flex items-start justify-between gap-6 pb-5 border-b-2 border-ink">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-ink">Blagajna</h1>
            <p className="text-[12px] uppercase tracking-widest text-ink-secondary mt-0.5">
              Pjevačka skupina
            </p>
          </div>
          <div className="text-right text-[11px] text-ink-secondary leading-relaxed">
            <p>
              <span className="uppercase tracking-wider">Razdoblje:</span>{' '}
              <span className="text-ink font-medium">
                {formatDateShort(fromDate)} – {formatDateShort(toDate)}
              </span>
            </p>
            <p>
              <span className="uppercase tracking-wider">Izdano:</span>{' '}
              <span className="text-ink">{formatDateTime(new Date())}</span>
            </p>
            <p>
              <span className="uppercase tracking-wider">Prikaz:</span>{' '}
              <span className="text-ink">
                {filter === 'all' ? 'Sve stavke' : filter === 'income' ? 'Samo uplate' : 'Samo troškovi'}
              </span>
            </p>
          </div>
        </div>

        {/* Totals strip */}
        <div className="grid grid-cols-3 gap-0 mt-5 border border-ink">
          <div className="p-3 border-r border-ink">
            <div className="text-[10px] uppercase tracking-widest text-ink-secondary">Ukupno uplata</div>
            <div className="text-[16px] font-semibold tabular-nums text-ink mt-0.5">
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="p-3 border-r border-ink">
            <div className="text-[10px] uppercase tracking-widest text-ink-secondary">Ukupno troškova</div>
            <div className="text-[16px] font-semibold tabular-nums text-ink mt-0.5">
              {formatCurrency(totalExpense)}
            </div>
          </div>
          <div className="p-3">
            <div className="text-[10px] uppercase tracking-widest text-ink-secondary">Stanje</div>
            <div
              className={`text-[16px] font-semibold tabular-nums mt-0.5 ${
                balance >= 0 ? 'text-ink' : 'text-rose-700'
              }`}
            >
              {formatCurrency(balance)}
            </div>
          </div>
        </div>

        {/* Ledger */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-[12px] ledger-table">
            <thead>
              <tr className="bg-surface-page text-ink">
                <th className="border border-ink px-2 py-2 text-center font-semibold w-[36px]">#</th>
                <th className="border border-ink px-2 py-2 text-left font-semibold w-[92px]">Datum</th>
                <th className="border border-ink px-2 py-2 text-left font-semibold w-[80px]">Vrsta</th>
                <th className="border border-ink px-2 py-2 text-left font-semibold">Kategorija</th>
                <th className="border border-ink px-2 py-2 text-left font-semibold">Platio/la</th>
                <th className="border border-ink px-2 py-2 text-left font-semibold">Opis</th>
                <th className="border border-ink px-2 py-2 text-right font-semibold w-[110px]">Uplata</th>
                <th className="border border-ink px-2 py-2 text-right font-semibold w-[110px]">Trošak</th>
                <th className="border border-ink px-2 py-2 text-right font-semibold w-[120px]">Stanje</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="border border-ink px-2 py-8 text-center text-ink-muted"
                  >
                    Nema stavki za odabrano razdoblje.
                  </td>
                </tr>
              ) : (
                rows.map(({ idx, t, balance: bal }) => {
                  const isIncome = t.type === 'income';
                  return (
                    <tr key={t.id} className="align-top">
                      <td className="border border-ink px-2 py-1.5 text-center tabular-nums text-ink-secondary">
                        {idx}
                      </td>
                      <td className="border border-ink px-2 py-1.5 tabular-nums">
                        {formatDateShort(t.date)}
                      </td>
                      <td className="border border-ink px-2 py-1.5">
                        {isIncome ? 'Uplata' : 'Trošak'}
                      </td>
                      <td className="border border-ink px-2 py-1.5">
                        {categoryName(t.categoryId)}
                      </td>
                      <td className="border border-ink px-2 py-1.5">{t.paidBy || '—'}</td>
                      <td className="border border-ink px-2 py-1.5">{t.description || '—'}</td>
                      <td className="border border-ink px-2 py-1.5 text-right tabular-nums">
                        {isIncome ? formatAmount(t.amount) : ''}
                      </td>
                      <td className="border border-ink px-2 py-1.5 text-right tabular-nums">
                        {!isIncome ? formatAmount(t.amount) : ''}
                      </td>
                      <td className="border border-ink px-2 py-1.5 text-right tabular-nums font-medium">
                        {formatAmount(bal)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-surface-page font-semibold">
                  <td
                    colSpan={6}
                    className="border border-ink px-2 py-2 text-right uppercase tracking-wider text-[11px]"
                  >
                    Ukupno
                  </td>
                  <td className="border border-ink px-2 py-2 text-right tabular-nums">
                    {formatAmount(totalIncome)}
                  </td>
                  <td className="border border-ink px-2 py-2 text-right tabular-nums">
                    {formatAmount(totalExpense)}
                  </td>
                  <td className="border border-ink px-2 py-2 text-right tabular-nums">
                    {formatAmount(balance)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Signature */}
        <div className="mt-16 grid grid-cols-2 gap-12 text-[11px] text-ink-secondary signature-row">
          <div>
            <div className="border-t border-ink pt-2">Sastavio/la</div>
          </div>
          <div>
            <div className="border-t border-ink pt-2">Potpis</div>
          </div>
        </div>
      </div>
    </div>
  );
}
