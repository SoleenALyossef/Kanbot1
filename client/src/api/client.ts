import type { ApiErrorBody, ErrorCode } from '../types/api';

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, '');
const TOKEN_KEY = 'kanbot.token';

/** The JWT is the only thing stored client-side. Never log it. */
export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

/** `NETWORK_ERROR` is a client-side code for "fetch itself failed". */
export type ClientErrorCode = ErrorCode | 'NETWORK_ERROR';

export class ApiError extends Error {
  status: number;
  code: ClientErrorCode;
  details?: { path: string; message: string }[];

  constructor(init: { status: number; code: ClientErrorCode; message: string; details?: ApiError['details'] }) {
    super(init.message);
    this.name = 'ApiError';
    this.status = init.status;
    this.code = init.code;
    this.details = init.details;
  }
}

let unauthorizedHandler: ((error: ApiError) => void) | null = null;
/** Registered by the AuthProvider: clears the session on any 401 (AUTH-6). */
export function setUnauthorizedHandler(fn: ((error: ApiError) => void) | null): void {
  unauthorizedHandler = fn;
}

const PUBLIC_PATHS = ['/auth/login', '/auth/register'];

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Cannot reach the server. Is it running?' });
  }

  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }

  if (!res.ok) {
    const e = (data as Partial<ApiErrorBody> | null)?.error;
    const error = new ApiError({
      status: res.status,
      code: e?.code ?? 'INTERNAL_ERROR',
      message: e?.message ?? 'Something went wrong. Please try again.',
      details: e?.details,
    });
    if (res.status === 401 && !PUBLIC_PATHS.includes(path)) unauthorizedHandler?.(error);
    throw error;
  }
  return data as T;
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown = {}) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown = {}) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

/** Maps VALIDATION_ERROR details[] to { field: message } for forms. */
export function fieldErrors(error: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (error instanceof ApiError) {
    (error.details ?? []).forEach((d) => {
      if (d.path && !out[d.path]) out[d.path] = d.message;
    });
  }
  return out;
}

export function buildQuery(params: Record<string, string | undefined> | undefined): string {
  const sp = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v) sp.set(k, v);
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}
