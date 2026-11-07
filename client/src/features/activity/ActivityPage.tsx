import { useMemo } from 'react';
import { Activity, ArrowRightLeft, FilePlus2, Flag, Pencil, Play, Trash2, CheckCheck, type LucideIcon } from 'lucide-react';
import { useCurrentProject } from '../../context/ProjectContext';
import { useActivity } from '../../hooks/useActivity';
import { useI18n, type MsgKey } from '../../i18n';
import { useFormat } from '../../i18n/useFormat';
import type { ActivityEvent, ActivityKind } from '../../lib/activity';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/Feedback';

const ICON: Record<ActivityKind, LucideIcon> = {
  'todo.created': FilePlus2, 'todo.updated': Pencil, 'todo.moved': ArrowRightLeft, 'todo.deleted': Trash2, 'todo.bulk': FilePlus2,
  'sprint.created': Flag, 'sprint.updated': Pencil, 'sprint.started': Play, 'sprint.completed': CheckCheck, 'sprint.deleted': Trash2,
};

const dayKey = (at: number) => new Date(at).toDateString();

/** A simple local log: everything done through this browser. */
export default function ActivityPage() {
  const { t } = useI18n();
  const { formatDay, timeAgo } = useFormat();
  const project = useCurrentProject();
  const { events, clear } = useActivity(project.id);

  const groups = useMemo(() => {
    const map = new Map<string, ActivityEvent[]>();
    events.forEach((e) => map.set(dayKey(e.at), [...(map.get(dayKey(e.at)) ?? []), e]));
    return [...map.entries()];
  }, [events]);

  const heading = (key: string, at: number) => {
    if (key === new Date().toDateString()) return t('act.today');
    if (key === new Date(Date.now() - 86400000).toDateString()) return t('act.yesterday');
    return formatDay(new Date(at).toISOString().slice(0, 10));
  };

  return (
    <div className="page-narrow-lg">
      <div className="page-head">
        <div>
          <h2 className="page-title">{t('act.title')}</h2>
          <p className="page-sub">{t('act.sub')}</p>
        </div>
        {events.length ? (
          <Button icon={Trash2} onClick={clear}>
            {t('act.clear')}
          </Button>
        ) : null}
      </div>

      {events.length === 0 ? (
        <EmptyState icon={Activity} title={t('act.title')} description={t('act.empty')} />
      ) : (
        <div className="timeline">
          {groups.map(([key, list]) => (
            <section key={key}>
              <h3 className="timeline-day">{heading(key, list[0]?.at ?? Date.now())}</h3>
              <ul>
                {list.map((e) => {
                  const Icon = ICON[e.kind];
                  return (
                    <li key={e.id} className="timeline-item row-enter">
                      <span className="timeline-dot"><Icon size={14} aria-hidden="true" /></span>
                      <span className="timeline-text">{t(`act.${e.kind}` as MsgKey, { label: e.label, n: e.n ?? 0 })}</span>
                      <span className="muted timeline-time">{timeAgo(new Date(e.at).toISOString())}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          <p className="muted timeline-note">{t('act.note')}</p>
        </div>
      )}
    </div>
  );
}
