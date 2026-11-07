import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ChevronsDown,
  ChevronsUp,
  CornerUpLeft,
  Download,
  FilePlus2,
  ExternalLink,
  Inbox,
  Layers,
  Plus,
  Rocket,
  Search,
  Sparkles,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { useAssistant } from '../../context/AssistantContext';
import { useCurrentProject } from '../../context/ProjectContext';
import { useTodoDetails } from '../../context/TodoDetailsContext';
import { useToast } from '../../context/ToastContext';
import { useDebounced } from '../../hooks/useDebounced';
import { useTypingLoop } from '../../hooks/useTyping';
import { useDeleteSprint, useSprints } from '../../hooks/useSprints';
import { useBulkAction, useDeleteTodo, useMoveTodo, useTodos, type BulkAction } from '../../hooks/useTodos';
import { useI18n } from '../../i18n';
import { apiMessage } from '../../i18n/apiMessage';
import { useFormat } from '../../i18n/useFormat';
import { cn } from '../../lib/cn';
import { END_OF_LIST, PRIORITIES, TYPES } from '../../lib/constants';
import { downloadText, todosToCSV, todosToMarkdown } from '../../lib/export';
import { sumPoints } from '../../lib/todoMoves';
import { SortableList, useSortableLists, type DropInfo } from '../../components/dnd';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback';
import { Menu, type MenuItem } from '../../components/ui/Menu';
import type { Sprint, Todo, TodoListQuery, TodoPriority, TodoType } from '../../types/api';
import { TemplatesDialog } from '../todos/TemplatesDialog';
import { SprintFormDialog } from '../sprints/SprintFormDialog';
import { StartSprintDialog } from '../sprints/StartSprintDialog';
import { BulkBar } from './BulkBar';
import { QuickCreate } from './QuickCreate';
import { SprintSection } from './SprintSection';
import { SortableTodoRow, TodoRowView } from './TodoRow';

const byOrder = (a: Todo, b: Todo) => a.order - b.order;

export default function BacklogPage() {
  const { t, tp } = useI18n();
  const { daysLeftLabel } = useFormat();
  const project = useCurrentProject();
  const projectId = project.id;
  const toast = useToast();
  const { openTodo } = useTodoDetails();
  const assistant = useAssistant();
  const quickRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── filters live in the URL (?q=&priority=&type=) ──
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const priority = params.get('priority') ?? '';
  const type = params.get('type') ?? '';
  const [searchInput, setSearchInput] = useState(q);
  const debounced = useDebounced(searchInput, 300);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchExamples = useMemo(() => [t('search.ex1'), t('search.ex2'), t('search.ex3')], [t]);
  const searchTyped = useTypingLoop(searchExamples, { enabled: !searchFocused && searchInput === '', typeMs: 55, pauseMs: 1500 });

  const setParam = (name: string, value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(name, value);
        else next.delete(name);
        return next;
      },
      { replace: true },
    );

  useEffect(() => {
    if (debounced.trim() !== q) setParam('q', debounced.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // "/" focuses the search box
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable)) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const filters = useMemo<TodoListQuery>(() => {
    const f: TodoListQuery = {};
    if (q) f.search = q;
    if (priority) f.priority = priority as TodoPriority;
    if (type) f.type = type as TodoType;
    return f;
  }, [q, priority, type]);
  const filtersActive = Object.keys(filters).length > 0;

  const todosQuery = useTodos(projectId, filters);
  const sprintsQuery = useSprints(projectId);
  const moveTodo = useMoveTodo(projectId);
  const deleteTodo = useDeleteTodo(projectId);
  const deleteSprint = useDeleteSprint(projectId);
  const bulk = useBulkAction(projectId);

  const [sprintForm, setSprintForm] = useState<{ sprint?: Sprint } | null>(null);
  const [startFor, setStartFor] = useState<Sprint | null>(null);
  const [sprintToDelete, setSprintToDelete] = useState<Sprint | null>(null);
  const [todoToDelete, setTodoToDelete] = useState<Todo | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDelete, setBulkDelete] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  // Shortcuts / command palette hand over intent through the URL (?new=1, ?newSprint=1).
  useEffect(() => {
    if (params.get('new')) {
      quickRef.current?.focus();
      setParam('new', '');
    }
    if (params.get('template')) {
      setTemplatesOpen(true);
      setParam('template', '');
    }
    if (params.get('newSprint')) {
      setSprintForm({});
      setParam('newSprint', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const sprints = useMemo(() => sprintsQuery.data?.sprints ?? [], [sprintsQuery.data]);
  const planned = useMemo(() => sprints.filter((s) => s.status === 'planned'), [sprints]);
  const activeSprint = sprints.find((s) => s.status === 'active') ?? null;
  const targetSprints = useMemo(() => sprints.filter((s) => s.status === 'planned' || s.status === 'active'), [sprints]);

  const lists = useMemo(() => {
    const out: Record<string, Todo[]> = { backlog: [] };
    planned.forEach((s) => {
      out[s.id] = [];
    });
    (todosQuery.data?.todos ?? []).forEach((x) => {
      if (x.sprintId === null) out.backlog?.push(x);
      else out[x.sprintId]?.push(x);
    });
    Object.values(out).forEach((list) => list.sort(byOrder));
    return out;
  }, [todosQuery.data, planned]);

  function moveTo(todoId: string, sprintId: string | null, position: number) {
    moveTodo.mutate({ todoId, move: { sprintId, position } });
  }

  function handleDrop({ todoId, container, index, orderedIds }: DropInfo) {
    if (container === 'backlog') {
      moveTo(todoId, null, index);
      return;
    }
    // Inside a sprint the "list" is one status column: count only items with the same status before the drop point.
    const dragged = todosById.get(todoId);
    const before = orderedIds
      .slice(0, index)
      .map((id) => todosById.get(id))
      .filter((x) => x && dragged && x.status === dragged.status).length;
    moveTo(todoId, container, before);
  }

  const { ids, todosById, wrap } = useSortableLists({
    lists,
    onMove: handleDrop,
    renderOverlay: (todo) => <TodoRowView todo={todo} overlay />,
  });

  function menuItemsFor(todo: Todo): MenuItem[] {
    const items: MenuItem[] = [
      { label: t('row.open'), icon: ExternalLink, onSelect: () => openTodo(todo) },
      { separator: true },
      { label: t('row.top'), icon: ChevronsUp, disabled: filtersActive, onSelect: () => moveTo(todo.id, todo.sprintId, 0) },
      { label: t('row.bottom'), icon: ChevronsDown, disabled: filtersActive, onSelect: () => moveTo(todo.id, todo.sprintId, END_OF_LIST) },
    ];
    const targets = targetSprints.filter((s) => s.id !== todo.sprintId);
    if (targets.length || todo.sprintId !== null) items.push({ separator: true });
    targets.forEach((s) =>
      items.push({
        label: s.status === 'active' ? t('row.moveToActive', { name: s.name }) : t('row.moveTo', { name: s.name }),
        icon: s.status === 'active' ? Rocket : Layers,
        onSelect: () => moveTo(todo.id, s.id, END_OF_LIST),
      }),
    );
    if (todo.sprintId !== null) items.push({ label: t('row.toBacklog'), icon: CornerUpLeft, onSelect: () => moveTo(todo.id, null, END_OF_LIST) });
    items.push({ separator: true }, { label: t('row.delete'), icon: Trash2, danger: true, onSelect: () => setTodoToDelete(todo) });
    return items;
  }

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const renderRows = (containerId: string) =>
    (ids[containerId] ?? []).map((id) => {
      const todo = todosById.get(id);
      return todo ? (
        <SortableTodoRow key={id} todo={todo} dragDisabled={filtersActive} menuItems={menuItemsFor(todo)} onOpen={openTodo} selected={selected.has(id)} onToggleSelect={toggleSelect} />
      ) : null;
    });

  function clearFilters() {
    setSearchInput('');
    setParams({}, { replace: true });
  }

  async function runBulk(action: BulkAction) {
    const list = [...selected];
    try {
      const n = await bulk.mutateAsync({ ids: list, action });
      toast.success(tp('bulk.updated', n));
      setSelected(new Set());
      setBulkDelete(false);
    } catch (err) {
      toast.error(apiMessage(err, t));
    }
  }

  async function confirmDeleteTodo() {
    if (!todoToDelete) return;
    try {
      await deleteTodo.mutateAsync(todoToDelete.id);
      toast.success(t('td.deleted', { key: todoToDelete.key }));
      setTodoToDelete(null);
    } catch (err) {
      toast.error(apiMessage(err, t));
    }
  }

  async function confirmDeleteSprint() {
    if (!sprintToDelete) return;
    try {
      await deleteSprint.mutateAsync(sprintToDelete.id);
      toast.success(t('ss.deleted', { name: sprintToDelete.name }));
      setSprintToDelete(null);
    } catch (err) {
      toast.error(apiMessage(err, t));
    }
  }

  function exportAs(kind: 'csv' | 'md') {
    const all = [...(todosQuery.data?.todos ?? [])].sort((a, b) => a.order - b.order);
    const sprintName = (id: string | null) => (id ? (sprints.find((s) => s.id === id)?.name ?? '') : t('td.backlogOpt'));
    if (kind === 'csv') downloadText(`${project.key}-backlog.csv`, todosToCSV(all, sprintName, t), 'text/csv');
    else downloadText(`${project.key}-backlog.md`, todosToMarkdown(`${project.name}: ${t('nav.backlog')}`, all, t), 'text/markdown');
    toast.success(t('export.done'));
  }

  const loading = todosQuery.isLoading || sprintsQuery.isLoading;
  const error = todosQuery.error ?? sprintsQuery.error;
  const backlog = lists.backlog ?? [];
  const totalAll = (todosQuery.data?.todos ?? []).length;
  const backlogIds = ids.backlog ?? [];

  return (
    <div className={cn('page-wide', selected.size > 0 && 'selecting')}>
      <div className="page-head">
        <div>
          <h2 className="page-title">{t('nav.backlog')}</h2>
          <p className="page-sub">{t('backlog.sub')}</p>
        </div>
        <div className="page-actions">
          <Button icon={Plus} onClick={() => setSprintForm({})}>
            {t('backlog.createSprint')}
          </Button>
          <Button icon={FilePlus2} onClick={() => setTemplatesOpen(true)}>
            {t('tpl.btn')}
          </Button>
          <Menu
            label={t('export.menu')}
            items={[
              { label: t('export.csv'), icon: Download, onSelect: () => exportAs('csv') },
              { label: t('export.md'), icon: Download, onSelect: () => exportAs('md') },
            ]}
            trigger={(props) => (
              <button {...props} className="btn btn-secondary">
                <Download size={16} aria-hidden="true" />
                <span>{t('export.menu')}</span>
              </button>
            )}
          />
          <Button variant="ai" icon={Sparkles} onClick={assistant.openGenerate}>
            {t('backlog.generate')}
          </Button>
          <Button variant="ai" icon={Target} onClick={assistant.openPlan}>
            {t('backlog.plan')}
          </Button>
        </div>
      </div>

      {activeSprint ? (
        <Link to={`/projects/${projectId}/board`} className="active-banner">
          <span className="live-dot" aria-hidden="true" />
          <span>
            <strong>{activeSprint.name}</strong> {t('backlog.activeBanner', { name: '', left: daysLeftLabel(activeSprint.endDate) }).replace(/^\s*/, '')}
          </span>
          <span className="active-banner-cta">{t('backlog.openBoard')}</span>
        </Link>
      ) : null}

      <div className="toolbar" role="search">
        <div className="search">
          <Search size={16} aria-hidden="true" />
          <input ref={searchRef} type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={searchFocused || searchInput ? t('backlog.search') : searchTyped || ' '} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} aria-label={t('backlog.searchLabel')} />
          <kbd aria-hidden="true">/</kbd>
        </div>
        <select className="input select toolbar-select" value={priority} onChange={(e) => setParam('priority', e.target.value)} aria-label={t('backlog.filterPriority')}>
          <option value="">{t('backlog.allPriorities')}</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {t(`priority.${p}`)}
            </option>
          ))}
        </select>
        <select className="input select toolbar-select" value={type} onChange={(e) => setParam('type', e.target.value)} aria-label={t('backlog.filterType')}>
          <option value="">{t('backlog.allTypes')}</option>
          {TYPES.map((x) => (
            <option key={x} value={x}>
              {t(`type.${x}`)}
            </option>
          ))}
        </select>
        {filtersActive ? (
          <Button variant="ghost" icon={X} onClick={clearFilters}>
            {t('common.clearFilters')}
          </Button>
        ) : null}
      </div>
      {filtersActive ? (
        <p className="section-note" role="status">
          {t('backlog.reorderPaused')}
        </p>
      ) : null}

      {loading ? (
        <Skeleton lines={6} />
      ) : error ? (
        <ErrorState
          error={error}
          title={t('backlog.loadError')}
          onRetry={() => {
            void todosQuery.refetch();
            void sprintsQuery.refetch();
          }}
        />
      ) : (
        wrap(
          <>
            {planned.map((sprint) => {
              const sIds = ids[sprint.id] ?? [];
              return (
                <SprintSection
                  key={sprint.id}
                  sprint={sprint}
                  itemIds={sIds}
                  count={sIds.length}
                  points={sumPoints(sIds.map((id) => todosById.get(id)).filter((x): x is Todo => !!x))}
                  blockedBy={activeSprint}
                  onStart={() => setStartFor(sprint)}
                  onEdit={() => setSprintForm({ sprint })}
                  onDelete={() => setSprintToDelete(sprint)}
                >
                  {renderRows(sprint.id)}
                </SprintSection>
              );
            })}

            <section className="list-section" aria-label={t('backlog.section')}>
              <header className="section-head">
                <div className="section-title">
                  <h3>{t('backlog.section')}</h3>
                </div>
                <div className="section-stats">
                  {tp('count.todos', backlogIds.length)} · {t('common.pts', { n: sumPoints(backlog) })}
                  {filtersActive ? ` ${t('backlog.filtered')}` : ''}
                </div>
              </header>
              <SortableList id="backlog" itemIds={backlogIds} className="todo-list" aria-label={t('backlog.todosIn')}>
                {renderRows('backlog')}
              </SortableList>

              {backlog.length === 0 ? (
                filtersActive ? (
                  <EmptyState compact icon={Search} title={t('backlog.noMatch.title')} description={t('backlog.noMatch.desc')} actions={<Button onClick={clearFilters}>{t('common.clearFilters')}</Button>} />
                ) : totalAll === 0 ? (
                  <EmptyState
                    icon={Inbox}
                    title={t('backlog.empty.title')}
                    description={t('backlog.empty.desc')}
                    actions={
                      <>
                        <Button variant="primary" icon={Plus} onClick={() => quickRef.current?.focus()}>
                          {t('backlog.createTodo')}
                        </Button>
                        <Button variant="ai" icon={Sparkles} onClick={assistant.openGenerate}>
                          {t('backlog.generateAi')}
                        </Button>
                      </>
                    }
                  />
                ) : (
                  <p className="list-placeholder">{t('backlog.allPlanned')}</p>
                )
              ) : null}

              <QuickCreate ref={quickRef} projectId={projectId} />
            </section>
          </>,
        )
      )}

      {selected.size > 0 ? (
        <BulkBar
          count={selected.size}
          sprints={targetSprints}
          busy={bulk.isPending}
          onMove={(sprintId) => void runBulk({ kind: 'move', sprintId })}
          onPriority={(p) => void runBulk({ kind: 'priority', priority: p })}
          onDelete={() => setBulkDelete(true)}
          onClear={() => setSelected(new Set())}
        />
      ) : null}

      {templatesOpen ? <TemplatesDialog projectId={projectId} onClose={() => setTemplatesOpen(false)} /> : null}
      {sprintForm ? <SprintFormDialog projectId={projectId} sprint={sprintForm.sprint} onClose={() => setSprintForm(null)} /> : null}
      {startFor ? <StartSprintDialog projectId={projectId} sprint={startFor} blockedBy={activeSprint} onClose={() => setStartFor(null)} /> : null}

      {sprintToDelete ? (
        <ConfirmDialog title={t('ss.deleteTitle', { name: sprintToDelete.name })} confirmLabel={t('ss.deleteBtn')} danger loading={deleteSprint.isPending} onCancel={() => setSprintToDelete(null)} onConfirm={() => void confirmDeleteSprint()}>
          <p>{t('ss.deleteBody')}</p>
        </ConfirmDialog>
      ) : null}

      {todoToDelete ? (
        <ConfirmDialog title={t('td.deleteTitle', { key: todoToDelete.key })} confirmLabel={t('td.deleteBtn')} danger loading={deleteTodo.isPending} onCancel={() => setTodoToDelete(null)} onConfirm={() => void confirmDeleteTodo()}>
          <p>{t('td.deleteBody', { title: todoToDelete.title })}</p>
        </ConfirmDialog>
      ) : null}

      {bulkDelete ? (
        <ConfirmDialog title={tp('bulk.deleteTitle', selected.size)} confirmLabel={t('common.delete')} danger loading={bulk.isPending} onCancel={() => setBulkDelete(false)} onConfirm={() => void runBulk({ kind: 'delete' })}>
          <p>{t('bulk.deleteBody')}</p>
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
