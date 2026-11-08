import { del, list, put } from '@vercel/blob';
import type { NextFunction, Request, Response } from 'express';
import { seedData } from './seedData.js';
import { db, type Data } from './store.js';

/**
 * Vercel serverless instances do not share a disk, so the JSON database is
 * mirrored to Vercel Blob: loaded before every API request and saved before
 * every write response is sent. Without BLOB_READ_WRITE_TOKEN it does nothing
 * (local development keeps using the JSON file).
 *
 * Every save writes a NEW blob (kanbot/db-<timestamp>.json) and loads read the
 * newest one. Overwriting a single blob is not safe: the CDN keeps serving the
 * old copy for up to a minute, which made fresh accounts look "logged out".
 */
const PREFIX = 'kanbot/db-';
const KEEP = 4;
const token = process.env.BLOB_READ_WRITE_TOKEN;
let access: 'public' | 'private' = 'public';

async function newestFirst() {
  const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
  return blobs.sort((a, b) => (a.pathname < b.pathname ? 1 : -1));
}

async function putVersion(body: string): Promise<void> {
  const pathname = `${PREFIX}${String(Date.now()).padStart(15, '0')}.json`;
  const options = { contentType: 'application/json', addRandomSuffix: false };
  try {
    await put(pathname, body, { ...options, access } as any);
  } catch (err) {
    if (access !== 'public') throw err;
    access = 'private'; // the store may be private: retry once
    await put(pathname, body, { ...options, access } as any);
  }
}

async function save(): Promise<void> {
  await putVersion(JSON.stringify(db.data));
  try {
    const blobs = await newestFirst();
    if (blobs.length > KEEP + 2) await del(blobs.slice(KEEP).map((b) => b.url));
  } catch (err) {
    console.error('[blob] cleanup failed', err);
  }
}

async function load(): Promise<void> {
  const blobs = await newestFirst();
  if (blobs.length === 0) {
    db.data = structuredClone(seedData) as Data; // first run: start with the demo account
    await save();
    return;
  }
  let lastStatus = 0;
  for (const blob of blobs.slice(0, 3)) {
    const res = await fetch(blob.url, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (res.ok) {
      db.data = { users: [], projects: [], sprints: [], todos: [], ...((await res.json()) as Partial<Data>) };
      return;
    }
    lastStatus = res.status;
  }
  throw new Error(`blob read failed: ${lastStatus}`);
}

export function blobSync() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!token || req.method === 'OPTIONS' || req.path === '/api/health') return next();

    let loaded = false;
    try {
      await load();
      loaded = true;
    } catch (err) {
      console.error('[blob] load failed', err);
    }

    // Only persist when this request started from fresh data, so a failed load can never overwrite it.
    if (loaded && req.method !== 'GET' && req.method !== 'HEAD') {
      const end = res.end.bind(res) as (...args: unknown[]) => Response;
      (res as any).end = (...args: unknown[]) => {
        save()
          .catch((err) => console.error('[blob] save failed', err))
          .finally(() => end(...args));
        return res;
      };
    }
    next();
  };
}
