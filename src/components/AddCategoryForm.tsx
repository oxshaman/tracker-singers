import { useState } from 'react';
import type { Category, TransactionType } from '../types';
import { generateId } from '../utils';

interface AddCategoryFormProps {
  onAdd: (category: Category) => void;
  onClose: () => void;
}

export function AddCategoryForm({ onAdd, onClose }: AddCategoryFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({ id: generateId(), name: trimmed, type });
    setName('');
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <fieldset>
        <legend className="text-[12px] font-medium text-ink-secondary mb-2">Vrsta</legend>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-2.5 rounded-xl text-[13px] font-medium border transition-all duration-150 ${
              type === 'expense'
                ? 'bg-rose-50 border-rose-400 text-rose-700'
                : 'bg-surface border-border text-ink-muted hover:border-ink-faint'
            }`}
          >
            Trošak
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-2.5 rounded-xl text-[13px] font-medium border transition-all duration-150 ${
              type === 'income'
                ? 'bg-sage-50 border-sage-400 text-sage-700'
                : 'bg-surface border-border text-ink-muted hover:border-ink-faint'
            }`}
          >
            Uplata
          </button>
        </div>
      </fieldset>

      <div>
        <label htmlFor="cat-name" className="block text-[12px] font-medium text-ink-secondary mb-2">
          Naziv kategorije
        </label>
        <input
          id="cat-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="npr. Članarina, Putovanje..."
          autoFocus
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-ink text-[13px] placeholder:text-ink-faint focus:border-peri-400 focus:outline-none transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={!name.trim()}
        className="w-full py-3 rounded-xl bg-peri-500 hover:bg-peri-600 text-white text-[13px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        Dodaj kategoriju
      </button>
    </form>
  );
}
