import { put, del, list } from '@vercel/blob';
import type { IncomingMessage, ServerResponse } from 'node:http';

const BLOB_PATH = 'data.json';

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
  const { blobs } = await list({ prefix: BLOB_PATH, limit: 1 });
  if (blobs.length === 0) return EMPTY;

  const res = await fetch(blobs[0].url);
  if (!res.ok) return EMPTY;
  return (await res.json()) as AppData;
}

async function writeData(data: AppData): Promise<void> {
  await put(BLOB_PATH, JSON.stringify(data), {
    contentType: 'application/json',
    access: 'public',
    addRandomSuffix: false,
  });
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

  try {
    if (req.method === 'GET') {
      const data = await readData();
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify(data));
      return;
    }

    if (req.method === 'POST') {
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
      return;
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('API /data error:', message, err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: message }));
  }
}
