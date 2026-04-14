import { X } from 'lucide-react';
import type { Category } from '../types';

interface CategoryListProps {
  categories: Category[];
  onDelete: (id: string) => void;
}

export function CategoryList({ categories, onDelete }: CategoryListProps) {
  if (categories.length === 0) return null;

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  const renderGroup = (cats: Category[], label: string) => {
    if (cats.length === 0) return null;
    return (
      <div>
        <h4 className="text-[11px] font-semibold tracking-widest uppercase text-ink-muted mb-2.5">
          {label}
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {cats.map((c) => (
            <span
              key={c.id}
              className={`group inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full text-[12px] font-medium border transition-colors duration-150 ${
                c.type === 'expense'
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-sage-50 border-sage-200 text-sage-700'
              }`}
            >
              {c.name}
              <button
                onClick={() => onDelete(c.id)}
                className="p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-black/5 transition-all duration-150"
                aria-label={`Obriši ${c.name}`}
              >
                <X size={12} strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderGroup(incomeCategories, 'Kategorije uplata')}
      {renderGroup(expenseCategories, 'Kategorije troškova')}
    </div>
  );
}
