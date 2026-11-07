export type ActivityKind =
  | 'todo.created'
  | 'todo.updated'
  | 'todo.moved'
  | 'todo.deleted'
  | 'todo.bulk'
  | 'sprint.created'
  | 'sprint.updated'
  | 'sprint.started'
  | 'sprint.completed'
  | 'sprint.deleted';

export interface ActivityEvent {
  id: string;
  at: number;
  kind: ActivityKind;
  projectId: string;
  label: string;
  n?: number;
}

export const ACTIVITY_KEY = 'kanbot.activity';
const MAX = 200;

const KINDS: readonly string[] = [
  'todo.created', 'todo.updated', 'todo.moved', 'todo.deleted', 'todo.bulk',
  'sprint.created', 'sprint.updated', 'sprint.started', 'sprint.completed', 'sprint.deleted',
];

export function loadActivity(): ActivityEvent[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    return raw ? (JSON.parse(raw) as ActivityEvent[]) : [];
  } catch {
    return [];
  }
}

/** Called by the QueryClient's MutationCache after any successful mutation that declares `meta.activity`. */
export function recordActivity(meta: Record<string, unknown> | undefined, data: unknown): void {
  const kind = meta?.activity;
  const projectId = meta?.projectId;
  if (typeof kind !== 'string' || !KINDS.includes(kind) || typeof projectId !== 'string') return;
  const d = (data ?? {}) as { todo?: { key?: string }; sprint?: { name?: string }; todos?: unknown[] };
  const event: ActivityEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: Date.now(),
    kind: kind as ActivityKind,
    projectId,
    label: d.todo?.key ?? d.sprint?.name ?? '',
    n: d.todos?.length,
  };
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify([event, ...loadActivity()].slice(0, MAX)));
    window.dispatchEvent(new CustomEvent('kanbot:storage', { detail: ACTIVITY_KEY }));
  } catch {
    /* storage unavailable */
  }
}
