import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCheck, Pause, Play, RotateCcw } from 'lucide-react';
import { useCurrentProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useTodos, useUpdateTodo } from '../../hooks/useTodos';
import { useI18n } from '../../i18n';
import { apiMessage } from '../../i18n/apiMessage';
import { todayISO } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { EmptyState, Skeleton } from '../../components/ui/Feedback';
import { SelectField } from '../../components/ui/Field';
import { TypeIcon } from '../../components/ui/Badges';
import { Timer } from 'lucide-react';

type Mode = 'work' | 'break';
interface Settings {
  work: number;
  brk: number;
}
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function FocusPage() {
  const { t } = useI18n();
  const toast = useToast();
  const project = useCurrentProject();
  const [params, setParams] = useSearchParams();
  const todos = useTodos(project.id, {});
  const update = useUpdateTodo(project.id);
  const [settings, setSettings] = useLocalStorage<Settings>('kanbot.focus.settings', { work: 25, brk: 5 });
  const [sessions, setSessions] = useLocalStorage<number>(`kanbot.focus.sessions.${todayISO()}`, 0);

  const [mode, setMode] = useState<Mode>('work');
  const [left, setLeft] = useState(settings.work * 60);
  const [running, setRunning] = useState(false);
  const endAt = useRef(0);

  const open = useMemo(() => (todos.data?.todos ?? []).filter((x) => x.status !== 'done'), [todos.data]);
  const selected = open.find((x) => x.id === params.get('todo')) ?? null;
  const total = (mode === 'work' ? settings.work : settings.brk) * 60;

  // Idle timer follows the settings.
  useEffect(() => {
    if (!running) setLeft(total);
  }, [total, running]);

  const finish = useCallback(() => {
    setRunning(false);
    if (mode === 'work') {
      setSessions((n) => n + 1);
      toast.success(t('focus.sessionDone'));
      setMode('break');
      setLeft(settings.brk * 60);
    } else {
      toast.info(t('focus.breakDone'));
      setMode('work');
      setLeft(settings.work * 60);
    }
  }, [mode, settings, setSessions, toast, t]);

  useEffect(() => {
    if (!running) return undefined;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) finish();
    }, 250);
    return () => window.clearInterval(id);
  }, [running, finish]);

  useEffect(() => {
    if (!running) return undefined;
    const previous = document.title;
    document.title = `${fmt(left)} · ${mode === 'work' ? t('focus.work') : t('focus.break')}`;
    return () => {
      document.title = previous;
    };
  }, [running, left, mode, t]);

  function toggle() {
    if (!running) endAt.current = Date.now() + left * 1000;
    setRunning((r) => !r);
  }
  function reset() {
    setRunning(false);
    setLeft(total);
  }

  async function markDone() {
    if (!selected) return;
    try {
      await update.mutateAsync({ id: selected.id, body: { status: 'done' } });
      toast.success(t('focus.done', { key: selected.key }));
      setParams({}, { replace: true });
    } catch (err) {
      toast.error(apiMessage(err, t));
    }
  }

  const pct = total > 0 ? (left / total) * 100 : 0;
  const lengths = (min: number[]) => min.map((m) => ({ value: String(m), label: String(m) }));

  return (
    <div className="page-narrow-lg">
      <div className="page-head">
        <div>
          <h2 className="page-title">{t('focus.title')}</h2>
          <p className="page-sub">{t('focus.sub')}</p>
        </div>
      </div>

      {todos.isLoading ? (
        <Skeleton lines={3} height={80} />
      ) : open.length === 0 ? (
        <EmptyState icon={Timer} title={t('focus.title')} description={t('focus.noTodos')} />
      ) : (
        <div className={`focus focus-${mode}${running ? ' is-running' : ''}`}>
          <SelectField
            label={t('focus.pick')}
            value={selected?.id ?? ''}
            onChange={(e) => setParams(e.target.value ? { todo: e.target.value } : {}, { replace: true })}
            options={[{ value: '', label: t('focus.none') }, ...open.map((x) => ({ value: x.id, label: `${x.key} · ${x.title}` }))]}
          />

          <div className="focus-clock" role="timer" aria-label={t('focus.timer', { time: fmt(left) })}>
            <svg viewBox="0 0 42 42" aria-hidden="true">
              <circle cx="21" cy="21" r="18" className="clock-track" />
              <circle cx="21" cy="21" r="18" className="clock-fill" pathLength={100} strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset="25" />
            </svg>
            <div className="clock-center">
              <span className="clock-mode">{mode === 'work' ? t('focus.work') : t('focus.break')}</span>
              <strong className="clock-time" dir="ltr">{fmt(left)}</strong>
            </div>
          </div>

          {selected ? (
            <p className="focus-todo">
              <TypeIcon type={selected.type} /> <span className="todo-key" dir="ltr">{selected.key}</span> {selected.title}
            </p>
          ) : null}

          <div className="focus-actions">
            <Button variant="primary" icon={running ? Pause : Play} onClick={toggle}>
              {running ? t('focus.pause') : left < total ? t('focus.resume') : t('focus.start')}
            </Button>
            <Button icon={RotateCcw} onClick={reset}>
              {t('focus.reset')}
            </Button>
            <Button icon={CheckCheck} onClick={() => void markDone()} disabled={!selected} loading={update.isPending}>
              {t('focus.markDone')}
            </Button>
          </div>

          <div className="focus-foot">
            <span className="muted">{t('focus.sessions', { n: sessions })}</span>
            <div className="focus-settings">
              <SelectField label={t('focus.workLen')} value={String(settings.work)} onChange={(e) => setSettings({ ...settings, work: Number(e.target.value) })} options={lengths([15, 25, 35, 45, 50])} disabled={running} />
              <SelectField label={t('focus.breakLen')} value={String(settings.brk)} onChange={(e) => setSettings({ ...settings, brk: Number(e.target.value) })} options={lengths([3, 5, 10, 15])} disabled={running} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
