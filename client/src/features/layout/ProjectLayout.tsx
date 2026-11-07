import { Outlet, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { ProjectContext } from '../../context/ProjectContext';
import { useProject } from '../../hooks/useProjects';
import { useI18n } from '../../i18n';
import { ErrorState, PageLoader } from '../../components/ui/Feedback';
import NotFoundPage from './NotFoundPage';

export default function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const { t } = useI18n();
  const query = useProject(projectId);

  if (query.isLoading) return <PageLoader />;
  const status = query.error instanceof ApiError ? query.error.status : 0;
  if (status === 404 || status === 400) return <NotFoundPage what="project" />;
  if (query.error || !query.data) return <ErrorState error={query.error} onRetry={() => void query.refetch()} title={t('project.loadError')} />;

  return (
    <ProjectContext.Provider value={query.data.project}>
      <Outlet />
    </ProjectContext.Provider>
  );
}
