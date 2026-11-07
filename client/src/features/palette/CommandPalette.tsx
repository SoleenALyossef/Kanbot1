import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  CornerDownLeft,
  FolderKanban,
  History,
  CalendarDays,
  FilePlus2,
  Keyboard,
  Sunrise,
  Timer,
  Activity as ActivityIcon,
  LayoutDashboard,
  KanbanSquare,
  Languages,
  ListChecks,
  ListTodo,
  LogOut,
  Moon,
  Plus,
  Rocket,
  Search,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { useAssistant } from '../../context/AssistantContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTodoDetails } from '../../context/TodoDetailsContext';
import { useProjects } from '../../hooks/useProjects';
import { useTodos } from '../../hooks/useTodos';
import { useI18n } from '../../i18n';
import { cn } from '../../lib/cn';

type Group = 'nav' | 'actions' | 'projects' | 'todos';
interface Command {
  id: string;
  group: Group;
  label: string;
  hint?: string;
  icon: LucideIcon;
  search: string;
  run: () => void;
}

interface Props {
  projectId: string | undefined;
  onClose: () => void;
  onHelp: () => void;
}

/** Ctrl/Cmd+K: jump anywhere, run actions, find a todo by key or title. */
export function CommandPalette({ projectId, onClose, onHelp }: Props) {
  const { t, toggleLang } = useI18n();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toggle: toggleTheme } = useTheme();
  const { openTodo } = useTodoDetails();
  const assistant = useAssistant();
  const projects = useProjects().data?.projects;
  const todos = useTodos(projectId, {}).data?.todos;
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const opener = document.activeElement;
    inputRef.current?.focus();
    return () => {
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
    };
  }, []);

  const commands = useMemo<Command[]>(() => {
    const go = (path: string) => () => navigate(path);
    const base = projectId ? `/projects/${projectId}` : null;
    const list: Command[] = [{ id: 'nav-projects', group: 'nav', label: t('nav.projects'), icon: FolderKanban, search: 'projects', run: go('/projects') }];
    if (base) {
      list.push(
        { id: 'nav-overview', group: 'nav', label: t('nav.overview'), icon: LayoutDashboard, search: 'overview dashboard insights', run: go(`${base}/overview`) },
        { id: 'nav-today', group: 'nav', label: t('nav.today'), icon: Sunrise, search: 'today due overdue', run: go(`${base}/today`) },
        { id: 'nav-focus', group: 'nav', label: t('nav.focus'), icon: Timer, search: 'focus pomodoro timer', run: go(`${base}/focus`) },
        { id: 'nav-calendar', group: 'nav', label: t('nav.calendar'), icon: CalendarDays, search: 'calendar due dates', run: go(`${base}/calendar`) },
        { id: 'nav-activity', group: 'nav', label: t('nav.activity'), icon: ActivityIcon, search: 'activity log history', run: go(`${base}/activity`) },
        { id: 'act-template', group: 'actions', label: t('tpl.btn'), icon: FilePlus2, search: 'template new from', run: go(`${base}/backlog?template=1`) },
        { id: 'nav-backlog', group: 'nav', label: t('nav.backlog'), icon: ListTodo, search: 'backlog', run: go(`${base}/backlog`) },
        { id: 'nav-board', group: 'nav', label: t('nav.board'), icon: KanbanSquare, search: 'board', run: go(`${base}/board`) },
        { id: 'nav-sprints', group: 'nav', label: t('nav.sprints'), icon: History, search: 'sprints', run: go(`${base}/sprints`) },
        { id: 'act-todo', group: 'actions', label: t('cmd.createTodo'), icon: Plus, search: 'create new todo', run: go(`${base}/backlog?new=1`) },
        { id: 'act-sprint', group: 'actions', label: t('cmd.createSprint'), icon: Rocket, search: 'create new sprint', run: go(`${base}/backlog?newSprint=1`) },
        { id: 'act-gen', group: 'actions', label: t('backlog.generate'), icon: Sparkles, search: 'generate ai todos', run: assistant.openGenerate },
        { id: 'act-plan', group: 'actions', label: t('backlog.plan'), icon: Target, search: 'plan ai sprint', run: assistant.openPlan },
        { id: 'act-ai', group: 'actions', label: t('topbar.askAi'), icon: Sparkles, search: 'ask ai assistant chat', run: () => assistant.setOpen(true) },
      );
    }
    list.push(
      { id: 'act-theme', group: 'actions', label: t('cmd.toggleTheme'), icon: Moon, search: 'theme dark light', run: toggleTheme },
      { id: 'act-lang', group: 'actions', label: t('cmd.toggleLang'), icon: Languages, search: 'language arabic english', run: toggleLang },
      { id: 'act-keys', group: 'actions', label: t('cmd.shortcuts'), icon: Keyboard, search: 'keyboard shortcuts help', run: onHelp },
      { id: 'act-logout', group: 'actions', label: t('user.logout'), icon: LogOut, search: 'logout sign out', run: logout },
    );
    projects?.forEach((p) =>
      list.push({ id: `prj-${p.id}`, group: 'projects', label: p.name, hint: p.key, icon: FolderKanban, search: `${p.name} ${p.key}`, run: go(`/projects/${p.id}/backlog`) }),
    );
    todos?.forEach((x) =>
      list.push({ id: `todo-${x.id}`, group: 'todos', label: x.title, hint: x.key, icon: ListChecks, search: `${x.key} ${x.title} ${x.labels.join(' ')}`, run: () => openTodo(x) }),
    );
    return list;
  }, [t, navigate, projectId, assistant, toggleTheme, toggleLang, onHelp, logout, projects, todos, openTodo]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands.filter((c) => c.group !== 'todos');
    const match = commands.filter((c) => `${c.label} ${c.search}`.toLowerCase().includes(q));
    const todosHit = match.filter((c) => c.group === 'todos').slice(0, 8);
    return [...match.filter((c) => c.group !== 'todos'), ...todosHit];
  }, [commands, query]);

  useEffect(() => {
    setActive(0);
  }, [query]);
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function run(cmd: Command | undefined) {
    if (!cmd) return;
    onClose();
    cmd.run();
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(results[active]);
    } else if (e.key === 'Tab') {
      e.preventDefault();
    }
  }

  let lastGroup: Group | null = null;
  return createPortal(
    <div className="overlay overlay-top" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label={t('cmd.title')} onKeyDown={onKeyDown}>
        <div className="palette-input">
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('cmd.placeholder')}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
            aria-label={t('cmd.title')}
            autoComplete="off"
          />
        </div>
        <ul id="palette-list" ref={listRef} className="palette-list" role="listbox">
          {results.length === 0 ? <li className="palette-empty">{t('cmd.empty')}</li> : null}
          {results.map((c, i) => {
            const header = c.group !== lastGroup;
            lastGroup = c.group;
            const Icon = c.icon;
            return (
              <li key={c.id} role="presentation">
                {header ? <div className="palette-group">{t(`cmd.${c.group}`)}</div> : null}
                <div
                  id={`cmd-${c.id}`}
                  role="option"
                  aria-selected={i === active}
                  className={cn('palette-item', i === active && 'is-active')}
                  onMouseMove={() => setActive(i)}
                  onClick={() => run(c)}
                >
                  <Icon size={17} aria-hidden="true" />
                  <span className="palette-label">{c.label}</span>
                  {c.hint ? <span className="palette-hint" dir="ltr">{c.hint}</span> : null}
                  {i === active ? <CornerDownLeft size={14} aria-hidden="true" className="flip-rtl" /> : null}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="palette-foot">{t('cmd.hint')}</div>
      </div>
    </div>,
    document.body,
  );
}
