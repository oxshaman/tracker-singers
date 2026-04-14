import { useState } from 'react';
import type { Category, Transaction, TransactionType } from '../types';
import { generateId } from '../utils';

interface AddTransactionFormProps {
  type: TransactionType;
  categories: Category[];
  onAdd: (transaction: Transaction) => void;
  onClose: () => void;
  onOpenAddCategory: () => void;
}

export function AddTransactionForm({ type, categories, onAdd, onClose, onOpenAddCategory }: AddTransactionFormProps) {
  const filteredCategories = categories.filter((c) => c.type === type);
  const [categoryId, setCategoryId] = useState(filteredCategories[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!categoryId || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAdd({
      id: generateId(),
      categoryId,
      amount: parsedAmount,
      description: description.trim(),
      date: new Date(date).toISOString(),
      type,
      ...(paidBy.trim() && { paidBy: paidBy.trim() }),
    });

    setAmount('');
    setPaidBy('');
    setDescription('');
    onClose();
  };

  const isExpense = type === 'expense';

  if (filteredCategories.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-[13px] text-ink-muted mb-3">
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
    );
  }

  const inputClasses =
    'w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-ink text-[13px] placeholder:text-ink-faint focus:border-peri-400 focus:outline-none transition-colors';

  const submitColor = isExpense
    ? 'bg-rose-500 hover:bg-rose-600'
    : 'bg-sage-500 hover:bg-sage-600';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="tx-category" className="block text-[12px] font-medium text-ink-secondary mb-2">
          Kategorija
        </label>
        <select
          id="tx-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={`${inputClasses} appearance-none`}
        >
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="tx-paid-by" className="block text-[12px] font-medium text-ink-secondary mb-2">
          {isExpense ? 'Tko je platio/la' : 'Tko je uplatio/la'}
        </label>
        <input
          id="tx-paid-by"
          type="text"
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          placeholder="Ime i prezime"
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="tx-amount" className="block text-[12px] font-medium text-ink-secondary mb-2">
          Iznos (€)
        </label>
        <input
          id="tx-amount"
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          autoFocus
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="tx-date" className="block text-[12px] font-medium text-ink-secondary mb-2">
          Datum
        </label>
        <input
          id="tx-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="tx-desc" className="block text-[12px] font-medium text-ink-secondary mb-2">
          Opis <span className="font-normal text-ink-faint">(opcionalno)</span>
        </label>
        <input
          id="tx-desc"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kratki opis..."
          className={inputClasses}
        />
      </div>

      <button
        type="submit"
        disabled={!categoryId || !amount || !paidBy.trim()}
        className={`w-full py-3 rounded-xl text-white text-[13px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] ${submitColor}`}
      >
        Dodaj {isExpense ? 'trošak' : 'uplatu'}
      </button>
    </form>
  );
}
