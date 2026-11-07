import { describe, expect, it } from 'vitest';
import { ar } from './ar';
import { en } from './en';
import { interpolate, pluralIndex, translate, translatePlural } from './index';

describe('dictionaries', () => {
  it('Arabic has exactly the English keys', () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
  });

  it('keeps the same {placeholders} in both languages', () => {
    const ph = (s: string) => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1] as string))].sort();
    const keys = Object.keys(en) as Array<keyof typeof en>;
    // Plain strings must match exactly.
    const plain = keys.filter((k) => !en[k].includes('|') && JSON.stringify(ph(en[k])) !== JSON.stringify(ph(ar[k])));
    // Plural strings: Arabic forms like "مهمتان" may omit {n}, but must not invent placeholders.
    const plural = keys.filter((k) => en[k].includes('|') && ph(ar[k]).some((p) => !ph(en[k]).includes(p)));
    expect([...plain, ...plural]).toEqual([]);
  });
});

describe('translate', () => {
  it('interpolates params', () => {
    expect(interpolate('Hi {name}', { name: 'Sara' })).toBe('Hi Sara');
    expect(translate('en', 'td.saved', { key: 'KAN-1' })).toBe('KAN-1 saved');
  });

  it('English plurals', () => {
    expect(translatePlural('en', 'count.todos', 1)).toBe('1 todo');
    expect(translatePlural('en', 'count.todos', 3)).toBe('3 todos');
  });

  it('Arabic plural forms (one, two, few, many)', () => {
    expect([1, 2, 5, 12, 0].map((n) => pluralIndex('ar', n))).toEqual([0, 1, 2, 3, 2]);
    expect(translatePlural('ar', 'count.todos', 2)).toBe('مهمتان');
    expect(translatePlural('ar', 'count.todos', 5)).toBe('5 مهام');
    expect(translatePlural('ar', 'count.todos', 12)).toBe('12 مهمة');
  });
});
