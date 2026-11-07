import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { ApiError } from '../../api/client';
import { useCurrentProject } from '../../context/ProjectContext';
import { useBoard } from '../../hooks/useSprints';
import { useI18n } from '../../i18n';
import { useFormat } from '../../i18n/useFormat';
import { STATUSES } from '../../lib/constants';
import { downloadText, todosToCSV } from '../../lib/export';
import { percent } from '../../lib/format';
import { flattenColumns } from '../../lib/todoMoves';
import { Button } from '../../components/ui/Button';
import { ErrorState, PageLoader } from '../../components/ui/Feedback';
import { Logo } from '../../components/ui/Logo';
import { Markdown } from '../../components/ui/Markdown';
import NotFoundPage from '../layout/NotFoundPage';

/** A clean one-page report. "Print / Save as PDF" uses the browser's print dialog. */
export default function SprintReportPage() {
  const { t } = useI18n();
  const { formatRange, timeAgo } = useFormat();
  const project = useCurrentProject();
  const { sprintId } = useParams<{ sprintId: string }>();
  const query = useBoard(sprintId);

  if (query.isLoading) return <PageLoader />;
  const status = query.error instanceof ApiError ? query.error.status : 0;
  if (status === 404 || status === 400) return <NotFoundPage what="sprint" />;
  if (query.error || !query.data) return <ErrorState error={query.error} onRetry={() => void query.refetch()} title={t('sd.loadError')} />;

  const { sprint, columns } = query.data;
  const s = sprint.status === 'completed' && sprint.completedStats ? sprint.completedStats : sprint.stats;
  const all = flattenColumns(columns);
  const generated = new Date().toISOString();

  return (
    <div className="report">
      <div className="report-actions no-print">
        <Link to={`/projects/${project.id}/sprints/${sprint.id}`} className="back-link">
          <ArrowLeft size={16} aria-hidden="true" className="flip-rtl" /> {t('report.back')}
        </Link>
        <span className="spacer" />
        <Button icon={Download} onClick={() => downloadText(`${sprint.name.replace(/\s+/g, '-').toLowerCase()}.csv`, todosToCSV(all, () => sprint.name, t), 'text/csv')}>
          {t('report.csv')}
        </Button>
        <Button variant="primary" icon={Printer} onClick={() => window.print()}>
          {t('report.print')}
        </Button>
      </div>

      <article className="report-sheet">
        <header className="report-head">
          <Logo size={28} />
          <span className="muted">{t('report.title')}</span>
        </header>
        <p className="muted">{t('report.project')}: {project.name} ({project.key})</p>
        <h1 className="report-title">{sprint.name}</h1>
        <p className="muted">{formatRange(sprint.startDate, sprint.endDate)} · {t(`sprint.${sprint.status}`)}</p>
        {sprint.goal ? <p className="report-goal"><strong>{t('report.goal')}:</strong> {sprint.goal}</p> : null}

        <h2>{t('report.numbers')}</h2>
        <div className="report-numbers">
          <div><strong>{s.doneTodos}/{s.totalTodos}</strong><span>{t('sd.completed')}</span></div>
          <div><strong>{s.donePoints}/{s.totalPoints}</strong><span>{t('sd.points')}</span></div>
          <div><strong>{percent(s.donePoints, s.totalPoints)}%</strong><span>{t('sd.completion')}</span></div>
          <div><strong>{sprint.completedStats?.carriedOver ?? '–'}</strong><span>{t('sd.carried')}</span></div>
        </div>

        {sprint.summary ? (
          <>
            <h2>{t('sum.title')}</h2>
            <Markdown>{sprint.summary.content}</Markdown>
          </>
        ) : null}

        <h2>{t('report.todos')}</h2>
        <table className="report-table">
          <thead>
            <tr>
              <th>{t('export.colKey')}</th>
              <th>{t('export.colTitle')}</th>
              <th>{t('export.colStatus')}</th>
              <th>{t('export.colPriority')}</th>
              <th>{t('export.colPoints')}</th>
            </tr>
          </thead>
          <tbody>
            {STATUSES.flatMap((st) =>
              (columns[st] ?? []).map((x) => (
                <tr key={x.id}>
                  <td dir="ltr">{x.key}</td>
                  <td>{x.title}</td>
                  <td>{t(`status.${st}`)}</td>
                  <td>{t(`priority.${x.priority}`)}</td>
                  <td>{x.storyPoints ?? '–'}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
        <footer className="report-foot muted">{t('report.generated', { when: timeAgo(generated) || '—' })} · Kanbot</footer>
      </article>
    </div>
  );
}
