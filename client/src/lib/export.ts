import type { Sprint, Todo, TodoStatus } from '../types/api';
import type { TFn } from '../i18n';
import { STATUSES } from './constants';

export function downloadText(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const csvCell = (value: string | number | null): string => {
  const s = value === null ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV with a BOM so Excel opens Arabic text correctly. */
export function todosToCSV(todos: Todo[], sprintName: (id: string | null) => string, t: TFn): string {
  const header = [
    t('export.colKey'),
    t('export.colTitle'),
    t('export.colType'),
    t('export.colStatus'),
    t('export.colPriority'),
    t('export.colPoints'),
    t('export.colSprint'),
    t('export.colLabels'),
    t('export.colDue'),
  ];
  const rows = todos.map((x) => [
    x.key,
    x.title,
    t(`type.${x.type}`),
    t(`status.${x.status}`),
    t(`priority.${x.priority}`),
    x.storyPoints,
    sprintName(x.sprintId),
    x.labels.join('; '),
    x.dueDate,
  ]);
  return '\uFEFF' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}

export function todosToMarkdown(title: string, todos: Todo[], t: TFn): string {
  const lines = [`# ${title}`, ''];
  todos.forEach((x) => {
    const pts = x.storyPoints === null ? '' : ` · ${t('common.pts', { n: x.storyPoints })}`;
    lines.push(`- **${x.key}** ${x.title} _(${t(`type.${x.type}`)}, ${t(`priority.${x.priority}`)}${pts})_`);
  });
  return lines.join('\n') + '\n';
}

export function sprintToMarkdown(
  sprint: Sprint,
  columns: Record<TodoStatus, Todo[]>,
  t: TFn,
  range: string,
): string {
  const s = sprint.status === 'completed' && sprint.completedStats ? sprint.completedStats : sprint.stats;
  const lines = [`# ${sprint.name}`, ''];
  if (sprint.goal) lines.push(`> ${sprint.goal}`, '');
  lines.push(
    range,
    '',
    `- ${t('sd.completed')}: ${s.doneTodos}/${s.totalTodos}`,
    `- ${t('sd.points')}: ${s.donePoints}/${s.totalPoints}`,
    '',
  );
  if (sprint.summary) lines.push(`## ${t('sum.title')}`, '', sprint.summary.content, '');
  STATUSES.forEach((status) => {
    const list = columns[status] ?? [];
    if (!list.length) return;
    lines.push(`## ${t(`status.${status}`)} (${list.length})`, '');
    list.forEach((x) => lines.push(`- **${x.key}** ${x.title}${x.storyPoints === null ? '' : ` · ${x.storyPoints}`}`));
    lines.push('');
  });
  return lines.join('\n');
}
