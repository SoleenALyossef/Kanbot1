import { afterEach, describe, expect, it } from 'vitest';
import { ApiError, buildQuery, fieldErrors, http, setUnauthorizedHandler, tokenStore } from './client';

const realFetch = globalThis.fetch;
const respond = (status: number, body?: unknown) => {
  globalThis.fetch = (async () => new Response(body === undefined ? null : JSON.stringify(body), { status })) as typeof fetch;
};

afterEach(() => {
  globalThis.fetch = realFetch;
  setUnauthorizedHandler(null);
  tokenStore.clear();
});

describe('api client', () => {
  it('returns undefined for 204', async () => {
    respond(204);
    expect(await http.delete('/x')).toBeUndefined();
  });

  it('maps the error body to ApiError', async () => {
    respond(400, { error: { code: 'VALIDATION_ERROR', message: 'bad', details: [{ path: 'email', message: 'Invalid' }] } });
    const err = await http.post('/auth/login', {}).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe('VALIDATION_ERROR');
    expect(fieldErrors(err)).toEqual({ email: 'Invalid' });
  });

  it('calls the unauthorized handler on 401 except for login', async () => {
    let calls = 0;
    setUnauthorizedHandler(() => {
      calls += 1;
    });
    respond(401, { error: { code: 'UNAUTHORIZED', message: 'no' } });
    await http.get('/projects').catch(() => undefined);
    await http.post('/auth/login', {}).catch(() => undefined);
    expect(calls).toBe(1);
  });

  it('turns a failed fetch into NETWORK_ERROR', async () => {
    globalThis.fetch = (async () => {
      throw new TypeError('down');
    }) as typeof fetch;
    const err = await http.get('/x').catch((e: unknown) => e);
    expect((err as ApiError).code).toBe('NETWORK_ERROR');
  });

  it('builds query strings without empty values', () => {
    expect(buildQuery({ search: 'a b', priority: undefined, type: '' })).toBe('?search=a+b');
    expect(buildQuery({})).toBe('');
  });
});
