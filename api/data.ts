import { put, get, BlobNotFoundError } from '@vercel/blob';

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

/**
 * Reads the private blob via the authenticated `get` helper.
 *
 * A plain `fetch(downloadUrl)` will NOT work for private blobs: it returns
 * 401/403 and — if its failure is swallowed — callers end up treating the
 * store as empty and overwriting real data on the next write.
 *
 * We intentionally distinguish "blob missing" (first run) from "read failed"
 * (bug / auth issue / network). Only the former is safe to treat as empty.
 */
async function readData(): Promise<AppData> {
  try {
    const result = await get(BLOB_PATH, { access: 'private', useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return EMPTY;
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as AppData;
  } catch (err) {
    if (err instanceof BlobNotFoundError) return EMPTY;
    throw err;
  }
}

async function writeData(data: AppData): Promise<void> {
  await put(BLOB_PATH, JSON.stringify(data), {
    contentType: 'application/json',
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function GET() {
  try {
    const data = await readData();
    return json(data);
  } catch (err: unknown) {
    console.error('[api/data] GET failed:', err);
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
    console.error('[api/data] POST failed:', err);
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
