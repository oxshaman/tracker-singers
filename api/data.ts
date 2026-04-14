import { put, head, list } from '@vercel/blob';
import type { IncomingMessage, ServerResponse } from 'node:http';

const BLOB_PATH = 'xpensetracker/data.json';

interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
}

interface Transaction {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string;
  type: 'expense' | 'income';
  paidBy?: string;
}

interface AppData {
  categories: Category[];
  transactions: Transaction[];
}

const EMPTY: AppData = { categories: [], transactions: [] };

async function readData(): Promise<AppData> {
  try {
    const { blobs } = await list({ prefix: BLOB_PATH });
    if (blobs.length === 0) return EMPTY;

    const latest = blobs[blobs.length - 1];
    const res = await fetch(latest.url);
    if (!res.ok) return EMPTY;
    return (await res.json()) as AppData;
  } catch {
    return EMPTY;
  }
}

async function writeData(data: AppData): Promise<void> {
  // Clean up old blobs first
  const { blobs } = await list({ prefix: BLOB_PATH });
  
  await put(BLOB_PATH, JSON.stringify(data), {
    contentType: 'application/json',
    access: 'public',
    addRandomSuffix: false,
  });

  // Delete old versions if any existed before the write
  const { del } = await import('@vercel/blob');
  for (const blob of blobs) {
    try { await del(blob.url); } catch { /* ignore */ }
  }
}

function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === 'GET') {
    const data = await readData();
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify(data));
    return;
  }

  if (req.method === 'POST') {
    try {
      const raw = await parseBody(req);
      const { action, payload } = JSON.parse(raw);
      const data = await readData();

      switch (action) {
        case 'addCategory':
          data.categories.push(payload);
          break;

        case 'deleteCategory':
          data.categories = data.categories.filter((c) => c.id !== payload.id);
          data.transactions = data.transactions.filter((t) => t.categoryId !== payload.id);
          break;

        case 'addTransaction':
          data.transactions.push(payload);
          break;

        case 'deleteTransaction':
          data.transactions = data.transactions.filter((t) => t.id !== payload.id);
          break;

        default:
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Unknown action' }));
          return;
      }

      await writeData(data);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify(data));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal error' }));
    }
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}
