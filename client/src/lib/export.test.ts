import { describe, expect, it } from 'vitest';
import { translate } from '../i18n';
import type { Todo } from '../types/api';
import { todosToCSV } from './export';

describe('todosToCSV', () => {
  it('escapes quotes/commas and starts with a BOM', () => {
    const x = { key: 'K-1', title: 'Say "hi", ok', type: 'task', status: 'todo', priority: 'high', storyPoints: 3, sprintId: null, labels: ['a', 'b'], dueDate: null } as Todo;
    const csv = todosToCSV([x], () => 'Backlog', (k, p) => translate('en', k, p));
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Say ""hi"", ok"');
    expect(csv).toContain('a; b');
  });
});
