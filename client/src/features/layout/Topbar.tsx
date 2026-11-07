import { Link, useLocation } from 'react-router-dom';
import { Menu as MenuIcon, Sparkles } from 'lucide-react';
import { useAssistant } from '../../context/AssistantContext';
import { useProject } from '../../hooks/useProjects';
import { useI18n, type MsgKey } from '../../i18n';
import { Button } from '../../components/ui/Button';

function pageTitleKey(pathname: string): MsgKey | null {
  if (/\/overview$/.test(pathname)) return 'nav.overview';
  if (/\/today$/.test(pathname)) return 'nav.today';
  if (/\/focus$/.test(pathname)) return 'nav.focus';
  if (/\/calendar$/.test(pathname)) return 'nav.calendar';
  if (/\/activity$/.test(pathname)) return 'nav.activity';
  if (/\/sprints\/[^/]+\/report$/.test(pathname)) return 'report.title';
  if (/\/backlog$/.test(pathname)) return 'nav.backlog';
  if (/\/board$/.test(pathname)) return 'nav.board';
  if (/\/sprints\/[^/]+$/.test(pathname)) return 'nav.sprintDetails';
  if (/\/sprints$/.test(pathname)) return 'nav.sprints';
  if (pathname.startsWith('/projects')) return 'nav.projects';
  return null;
}

export function Topbar({ projectId, onMenu }: { projectId: string | undefined; onMenu: () => void }) {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const { open, setOpen } = useAssistant();
  const project = useProject(projectId).data?.project;
  const key = pageTitleKey(pathname);

  return (
    <header className="topbar">
      <button type="button" className="icon-btn menu-toggle" onClick={onMenu} aria-label={t('nav.open')}>
        <MenuIcon size={20} aria-hidden="true" />
      </button>
      <div className="crumbs">
        {project ? (
          <>
            <Link to={`/projects/${project.id}/backlog`} className="crumb-project">
              {project.name}
            </Link>
            <span className="crumb-sep" aria-hidden="true">
              /
            </span>
          </>
        ) : null}
        <h1 className="crumb-title">{key ? t(key) : ''}</h1>
      </div>
      <div className="topbar-actions">
        {projectId ? (
          <Button variant="ai" icon={Sparkles} onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="assistant-panel">
            {t('topbar.askAi')}
          </Button>
        ) : null}
      </div>
    </header>
  );
}
