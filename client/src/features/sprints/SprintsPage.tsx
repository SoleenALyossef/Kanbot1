import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, History, Plus } from 'lucide-react';
import { useCurrentProject } from '../../context/ProjectContext';
import { useSprints } from '../../hooks/useSprints';
import { useI18n } from '../../i18n';
import { useFormat } from '../../i18n/useFormat';
import { percent } from '../../lib/format';
import { SprintStatusBadge } from '../../components/ui/Badges';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback';
import { ProgressBar } from '../../components/ui/Progress';
import type { Sprint } from '../../types/api';
import { SprintFormDialog } from './SprintFormDialog';
import { Velocity } from './Velocity';

/** Completed sprints show their final snapshot, others the live numbers. */
export function sprintNumbers(sprint: Sprint) {
  const s = sprint.status === 'completed' && sprint.completedStats ? sprint.completedStats : sprint.stats;
  return { donePoints: s.donePoints, totalPoints: s.totalPoints, doneTodos: s.doneTodos, totalTodos: s.totalTodos };
}

export default function SprintsPage() {
  const { t } = useI18n();
  const { formatRange } = useFormat();
  const project = useCurrentProject();
  const query = useSprints(project.id);
  const [creating, setCreating] = useState(false);
  const sprints = query.data?.sprints ?? [];

  return (
    <div className="page-wide">
      <div className="page-head">
        <div>
          <h2 className="page-title">{t('sp.title')}</h2>
          <p className="page-sub">{t('sp.sub', { name: project.name })}</p>
        </div>
        <Button icon={Plus} onClick={() => setCreating(true)}>
          {t('backlog.createSprint')}
        </Button>
      </div>

      {query.isLoading ? (
        <Skeleton lines={4} height={78} />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} title={t('sp.loadError')} />
      ) : sprints.length === 0 ? (
        <EmptyState
          icon={History}
          title={t('sp.empty.title')}
          description={t('sp.empty.desc')}
          actions={
            <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>
              {t('backlog.createSprint')}
            </Button>
          }
        />
      ) : (
        <>
          <Velocity sprints={sprints} />
          <ul className="sprint-list stagger">
            {sprints.map((sprint, i) => {
              const n = sprintNumbers(sprint);
              return (
                <li key={sprint.id} className="sprint-row spot" data-spotlight style={{ '--i': Math.min(i, 10) } as CSSProperties}>
                  <div className="sprint-row-main">
                    <div className="sprint-row-title">
                      <h3>
                        <Link to={`/projects/${project.id}/sprints/${sprint.id}`} className="card-link">
                          {sprint.name}
                        </Link>
                      </h3>
                      <SprintStatusBadge status={sprint.status} />
                    </div>
                    <p className="muted">{formatRange(sprint.startDate, sprint.endDate)}</p>
                    {sprint.goal ? <p className="sprint-row-goal">{sprint.goal}</p> : null}
                  </div>
                  <div className="sprint-row-progress">
                    <div className="progress-num">{t('sp.ptsOf', { done: n.donePoints, total: n.totalPoints })}</div>
                    <ProgressBar value={percent(n.donePoints, n.totalPoints)} label={t('sh.pointsAria', { done: n.donePoints, total: n.totalPoints })} />
                    <div className="muted">{t('sp.todosOf', { done: n.doneTodos, total: n.totalTodos })}</div>
                  </div>
                  <ChevronRight size={18} className="row-chevron flip-rtl" aria-hidden="true" />
                </li>
              );
            })}
          </ul>
        </>
      )}

      {creating ? <SprintFormDialog projectId={project.id} onClose={() => setCreating(false)} /> : null}
    </div>
  );
}
