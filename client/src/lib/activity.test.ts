import { describe, expect, it } from 'vitest';
import { ACTIVITY_KEY, loadActivity, recordActivity } from './activity';

// Works under jsdom (vitest) and under plain Node.
if (typeof localStorage === 'undefined') {
  const store = new Map<string, string>();
  Object.assign(globalThis, {
    localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) },
  });
}
if (typeof window === 'undefined') Object.assign(globalThis, { window: globalThis, dispatchEvent: () => true });

describe('recordActivity', () => {
  it('stores events that declare meta.activity and ignores the rest', () => {
    localStorage.removeItem(ACTIVITY_KEY);
    recordActivity({ activity: 'todo.created', projectId: 'p1' }, { todo: { key: 'KAN-7' } });
    recordActivity({ activity: 'sprint.started', projectId: 'p1' }, { sprint: { name: 'Sprint 2' } });
    recordActivity({ activity: 'nope', projectId: 'p1' }, {});
    recordActivity(undefined, {});
    const events = loadActivity();
    expect(events.length).toBe(2);
    expect(events[0]?.kind).toBe('sprint.started');
    expect(events[0]?.label).toBe('Sprint 2');
    expect(events[1]?.label).toBe('KAN-7');
  });

  it('keeps only the latest 200', () => {
    localStorage.removeItem(ACTIVITY_KEY);
    for (let i = 0; i < 205; i += 1) recordActivity({ activity: 'todo.updated', projectId: 'p' }, { todo: { key: `K-${i}` } });
    expect(loadActivity().length).toBe(200);
    expect(loadActivity()[0]?.label).toBe('K-204');
  });
});
