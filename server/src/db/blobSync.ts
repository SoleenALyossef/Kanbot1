import { list, put } from '@vercel/blob';
import type { NextFunction, Request, Response } from 'express';
import { seedData } from './seedData.js';
import { db, type Data } from './store.js';

/**
 * Vercel serverless instances do not share a disk, so the JSON database is
 * mirrored to Vercel Blob: loaded before every API request and saved before
 * every write response is sent. Without BLOB_READ_WRITE_TOKEN it does nothing
 * (local development keeps using the JSON file).
 */
const PATHNAME = 'kanbot/db.json';
const token = process.env.BLOB_READ_WRITE_TOKEN;
let access: 'public' | 'private' = 'public';

async function save(): Promise<void> {
  const body = JSON.stringify(db.data);
  const options = { contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60 };
  try {
    await put(PATHNAME, body, { ...options, access } as any);
  } catch (err) {
    if (access !== 'public') throw err;
    access = 'private'; // the store may be private: retry once
    await put(PATHNAME, body, { ...options, access } as any);
  }
}

async function load(): Promise<void> {
  const { blobs } = await list({ prefix: PATHNAME, limit: 1 });
  const blob = blobs.find((b) => b.pathname === PATHNAME);
  if (!blob) {
    db.data = structuredClone(seedData) as Data; // first run: start with the demo account
    await save();
    return;
  }
  const url = `${blob.url}${blob.url.includes('?') ? '&' : '?'}t=${Date.now()}`;
  const res = await fetch(url, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (!res.ok) throw new Error(`blob read failed: ${res.status}`);
  db.data = { users: [], projects: [], sprints: [], todos: [], ...((await res.json()) as Partial<Data>) };
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
