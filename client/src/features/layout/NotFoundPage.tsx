import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useI18n } from '../../i18n';
import { EmptyState } from '../../components/ui/Feedback';

export default function NotFoundPage({ what = 'page' }: { what?: 'page' | 'project' | 'sprint' }) {
  const { t } = useI18n();
  return (
    <div className="page-narrow">
      <EmptyState
        icon={Compass}
        title={t(`notfound.${what}.title`)}
        description={t(what === 'project' ? 'notfound.project.desc' : 'notfound.page.desc')}
        actions={
          <Link to="/projects" className="btn btn-primary">
            <span>{t('notfound.back')}</span>
          </Link>
        }
      />
    </div>
  );
}
