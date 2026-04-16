import { useState, useEffect, useCallback, useRef } from 'react';
import type { Category, Transaction } from '../types';

interface AppData {
  categories: Category[];
  transactions: Transaction[];
}

const API_URL = '/api/data';

async function fetchData(): Promise<AppData> {
  const res = await fetch(API_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load data');
  const body = await res.json();
  if (body && typeof body === 'object' && 'error' in body) {
    throw new Error(String(body.error));
  }
  return body as AppData;
}

async function postAction(action: string, payload: unknown): Promise<AppData> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to save');
  const body = await res.json();
  if (body && typeof body === 'object' && 'error' in body) {
    throw new Error(String(body.error));
  }
  return body as AppData;
}

export function useApiData() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pendingOps = useRef(0);

  useEffect(() => {
    fetchData()
      .then((data) => {
        setCategories(data.categories);
        setTransactions(data.transactions);
      })
      .catch(() => setError('Greška pri učitavanju podataka.'))
      .finally(() => setLoading(false));
  }, []);

  const syncFromResponse = useCallback((data: AppData) => {
    setCategories(data.categories);
    setTransactions(data.transactions);
  }, []);

  const addCategory = useCallback((cat: Category) => {
    setCategories((prev) => [...prev, cat]);
    pendingOps.current++;
    postAction('addCategory', cat)
      .then(syncFromResponse)
      .catch(() => setError('Greška pri spremanju.'))
      .finally(() => { pendingOps.current--; });
  }, [syncFromResponse]);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setTransactions((prev) => prev.filter((t) => t.categoryId !== id));
    pendingOps.current++;
    postAction('deleteCategory', { id })
      .then(syncFromResponse)
      .catch(() => setError('Greška pri brisanju.'))
      .finally(() => { pendingOps.current--; });
  }, [syncFromResponse]);

  const addTransaction = useCallback((tx: Transaction) => {
    setTransactions((prev) => [...prev, tx]);
    pendingOps.current++;
    postAction('addTransaction', tx)
      .then(syncFromResponse)
      .catch(() => setError('Greška pri spremanju.'))
      .finally(() => { pendingOps.current--; });
  }, [syncFromResponse]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    pendingOps.current++;
    postAction('deleteTransaction', { id })
      .then(syncFromResponse)
      .catch(() => setError('Greška pri brisanju.'))
      .finally(() => { pendingOps.current--; });
  }, [syncFromResponse]);

  const clearError = useCallback(() => setError(null), []);

  return {
    categories,
    transactions,
    loading,
    error,
    clearError,
    addCategory,
    deleteCategory,
    addTransaction,
    deleteTransaction,
  };
}
