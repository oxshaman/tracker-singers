import { useState, useCallback } from 'react';
import { TrendingDown, TrendingUp, Layers, Music2, Loader2, X, FileText } from 'lucide-react';
import { useApiData } from './hooks/useApiData';
import { SummaryCards } from './components/SummaryCards';
import { Modal } from './components/Modal';
import { AddCategoryForm } from './components/AddCategoryForm';
import { AddTransactionForm } from './components/AddTransactionForm';
import { TransactionList } from './components/TransactionList';
import { CategoryList } from './components/CategoryList';
import { ExportView } from './components/ExportView';
import type { Category, Transaction } from './types';

type ModalType = 'category' | 'expense' | 'income' | null;

function App() {
  const {
    categories,
    transactions,
    loading,
    error,
    clearError,
    addCategory,
    deleteCategory,
    addTransaction,
    deleteTransaction,
  } = useApiData();

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [showExport, setShowExport] = useState(false);
  const closeModal = useCallback(() => setActiveModal(null), []);

  const handleAddCategory = useCallback(
    (cat: Category) => addCategory(cat),
    [addCategory],
  );

  const handleDeleteCategory = useCallback(
    (id: string) => deleteCategory(id),
    [deleteCategory],
  );

  const handleAddTransaction = useCallback(
    (tx: Transaction) => addTransaction(tx),
    [addTransaction],
  );

  const handleDeleteTransaction = useCallback(
    (id: string) => deleteTransaction(id),
    [deleteTransaction],
  );

  if (loading) {
    return (
      <div className="min-h-dvh bg-surface-page font-sora flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-ink-muted">
          <Loader2 size={24} className="animate-spin" />
          <span className="text-[13px]">Učitavanje...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface-page font-sora">
      {/* Error toast */}
      {error && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[13px] font-medium">
            <span>{error}</span>
            <button onClick={clearError} className="p-0.5 rounded hover:bg-rose-100 transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border">
        <div className="max-w-[640px] mx-auto px-5 h-14 flex items-center gap-3">
          <Music2 size={20} strokeWidth={1.8} className="text-peri-500" />
          <div className="flex items-baseline gap-2">
            <h1 className="text-[15px] font-semibold tracking-tight text-ink">
              Blagajna
            </h1>
            <span className="text-[11px] font-medium tracking-wide uppercase text-ink-muted">
              Pjevačka skupina
            </span>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setShowExport(true)}
            disabled={transactions.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-ink-secondary hover:bg-surface-page hover:text-peri-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Izvoz / Ispis"
          >
            <FileText size={15} strokeWidth={1.8} />
            <span className="hidden sm:inline">Izvoz</span>
          </button>
        </div>
      </header>

      <main className="max-w-[640px] mx-auto px-5 pb-32 pt-6">
        <div className="stagger">
          {/* Summary */}
          <section>
            <SummaryCards transactions={transactions} />
          </section>

          {/* Actions */}
          <section className="mt-6">
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => setActiveModal('income')}
                className="group relative flex flex-col items-center gap-2.5 p-4 sm:p-5 rounded-2xl bg-surface border border-border hover:border-sage-400 transition-colors duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-sage-50 border border-sage-200 flex items-center justify-center transition-colors group-hover:bg-sage-100">
                  <TrendingUp size={18} strokeWidth={1.8} className="text-sage-600" />
                </div>
                <span className="text-[12px] sm:text-[13px] font-medium text-ink-secondary group-hover:text-sage-700 transition-colors">
                  Dodaj uplatu
                </span>
              </button>

              <button
                onClick={() => setActiveModal('expense')}
                className="group relative flex flex-col items-center gap-2.5 p-4 sm:p-5 rounded-2xl bg-surface border border-border hover:border-rose-400 transition-colors duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center transition-colors group-hover:bg-rose-100">
                  <TrendingDown size={18} strokeWidth={1.8} className="text-rose-600" />
                </div>
                <span className="text-[12px] sm:text-[13px] font-medium text-ink-secondary group-hover:text-rose-700 transition-colors">
                  Dodaj trošak
                </span>
              </button>

              <button
                onClick={() => setActiveModal('category')}
                className="group relative flex flex-col items-center gap-2.5 p-4 sm:p-5 rounded-2xl bg-surface border border-border hover:border-peri-400 transition-colors duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-peri-50 border border-peri-200 flex items-center justify-center transition-colors group-hover:bg-peri-100">
                  <Layers size={18} strokeWidth={1.8} className="text-peri-600" />
                </div>
                <span className="text-[12px] sm:text-[13px] font-medium text-ink-secondary group-hover:text-peri-700 transition-colors">
                  Kategorija
                </span>
              </button>
            </div>
          </section>

          {/* Categories */}
          {categories.length > 0 && (
            <section className="mt-6">
              <CategoryList categories={categories} onDelete={handleDeleteCategory} />
            </section>
          )}

          {/* History */}
          <section className="mt-8">
            <h2 className="text-[11px] font-semibold tracking-widest uppercase text-ink-muted mb-4">
              Povijest
            </h2>
            <TransactionList
              transactions={transactions}
              categories={categories}
              onDelete={handleDeleteTransaction}
            />
          </section>
        </div>
      </main>

      {/* Modals */}
      <Modal isOpen={activeModal === 'category'} onClose={closeModal} title="Nova kategorija">
        <AddCategoryForm onAdd={handleAddCategory} onClose={closeModal} />
      </Modal>

      <Modal isOpen={activeModal === 'expense'} onClose={closeModal} title="Novi trošak">
        <AddTransactionForm
          type="expense"
          categories={categories}
          onAdd={handleAddTransaction}
          onClose={closeModal}
          onOpenAddCategory={() => setActiveModal('category')}
        />
      </Modal>

      <Modal isOpen={activeModal === 'income'} onClose={closeModal} title="Nova uplata">
        <AddTransactionForm
          type="income"
          categories={categories}
          onAdd={handleAddTransaction}
          onClose={closeModal}
          onOpenAddCategory={() => setActiveModal('category')}
        />
      </Modal>

      {showExport && (
        <ExportView
          transactions={transactions}
          categories={categories}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}

export default App;
