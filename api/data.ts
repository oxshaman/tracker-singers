import { put, list } from '@vercel/blob';

const BLOB_PATH = 'data.json';

interface AppData {
  categories: Array<{ id: string; name: string; type: 'expense' | 'income' }>;
  transactions: Array<{
    id: string;
    categoryId: string;
    amount: number;
    description: string;
    date: string;
    type: 'expense' | 'income';
    paidBy?: string;
  }>;
}

const EMPTY: AppData = { categories: [], transactions: [] };

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });

async function readData(): Promise<AppData> {
  try {
    const { blobs } = await list({ prefix: BLOB_PATH, limit: 1 });
    if (blobs.length === 0) return EMPTY;
    const res = await fetch(blobs[0].url);
    if (!res.ok) return EMPTY;
    return (await res.json()) as AppData;
  } catch {
    return EMPTY;
  }
}

async function writeData(data: AppData): Promise<void> {
  await put(BLOB_PATH, JSON.stringify(data), {
    contentType: 'application/json',
    access: 'public',
    addRandomSuffix: false,
  });
}

export async function GET() {
  try {
    const data = await readData();
    return json(data);
  } catch (err: unknown) {
    return json({ error: err instanceof Error ? err.message : 'Read failed' }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const { action, payload } = await request.json();
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
        return json({ error: 'Unknown action' }, 400);
    }

    await writeData(data);
    return json(data);
  } catch (err: unknown) {
    return json({ error: err instanceof Error ? err.message : 'Write failed' }, 500);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
