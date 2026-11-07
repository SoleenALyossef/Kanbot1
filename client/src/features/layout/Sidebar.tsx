import { Link, NavLink } from 'react-router-dom';
import { Activity, CalendarDays, FolderKanban, History, KanbanSquare, LayoutDashboard, ListTodo, LogOut, Moon, Search, Sun, Sunrise, Timer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../hooks/useProjects';
import { useI18n } from '../../i18n';
import { cn } from '../../lib/cn';
import { Logo } from '../../components/ui/Logo';
import { AccentPicker } from './AccentPicker';
import { LangToggle } from './LangToggle';
import { ProjectSwitcher } from './ProjectSwitcher';

interface SidebarProps {
  projectId: string | undefined;
  open: boolean;
  onOpenPalette: () => void;
}

export function Sidebar({ projectId, open, onOpenPalette }: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  const active = useProject(projectId).data?.project.stats.activeSprint;
  const base = projectId ? `/projects/${projectId}` : null;
  const linkClass = ({ isActive }: { isActive: boolean }) => cn('nav-link', isActive && 'is-active');

  return (
    <aside className={cn('sidebar', open && 'sidebar-open')} aria-label={t('nav.main')}>
      <Link to="/projects" className="sidebar-logo" aria-label={t('nav.home')}>
        <Logo size={34} className="logo-light" />
      </Link>

      <ProjectSwitcher projectId={projectId} />

      <button type="button" className="palette-trigger" onClick={onOpenPalette}>
        <Search size={16} aria-hidden="true" />
        <span>{t('cmd.open')}</span>
        <kbd dir="ltr">Ctrl K</kbd>
      </button>

      <nav className="sidebar-nav">
        <NavLink to="/projects" end className={linkClass}>
          <FolderKanban size={18} aria-hidden="true" />
          <span>{t('nav.projects')}</span>
        </NavLink>
        {base ? (
          <>
            <div className="nav-group">{t('nav.planning')}</div>
            <NavLink to={`${base}/overview`} className={linkClass}>
              <LayoutDashboard size={18} aria-hidden="true" />
              <span>{t('nav.overview')}</span>
            </NavLink>
            <NavLink to={`${base}/backlog`} className={linkClass}>
              <ListTodo size={18} aria-hidden="true" />
              <span>{t('nav.backlog')}</span>
            </NavLink>
            <NavLink to={`${base}/board`} className={linkClass}>
              <KanbanSquare size={18} aria-hidden="true" />
              <span>{t('nav.board')}</span>
              {active ? <span className="live-dot" title={t('nav.activeSprint', { name: active.name })} /> : null}
            </NavLink>
            <NavLink to={`${base}/sprints`} className={linkClass}>
              <History size={18} aria-hidden="true" />
              <span>{t('nav.sprints')}</span>
            </NavLink>
            <div className="nav-group">{t('nav.work')}</div>
            <NavLink to={`${base}/today`} className={linkClass}>
              <Sunrise size={18} aria-hidden="true" />
              <span>{t('nav.today')}</span>
            </NavLink>
            <NavLink to={`${base}/focus`} className={linkClass}>
              <Timer size={18} aria-hidden="true" />
              <span>{t('nav.focus')}</span>
            </NavLink>
            <NavLink to={`${base}/calendar`} className={linkClass}>
              <CalendarDays size={18} aria-hidden="true" />
              <span>{t('nav.calendar')}</span>
            </NavLink>
            <NavLink to={`${base}/activity`} className={linkClass}>
              <Activity size={18} aria-hidden="true" />
              <span>{t('nav.activity')}</span>
            </NavLink>
          </>
        ) : null}
      </nav>

      <div className="sidebar-foot">
        <div className="foot-row">
          <AccentPicker />
          <LangToggle variant="dark" />
        </div>
        <button type="button" className="nav-link nav-button" onClick={toggle} aria-pressed={theme === 'dark'}>
          <span className="theme-icon" key={theme}>
            {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </span>
          <span>{theme === 'dark' ? t('theme.light') : t('theme.dark')}</span>
        </button>
        <div className="user-chip">
          <span className="avatar" aria-hidden="true">
            {(user?.name ?? '?').trim().charAt(0).toUpperCase()}
          </span>
          <span className="user-text">
            <span className="user-name">{user?.name}</span>
            <span className="user-email" dir="ltr">{user?.email}</span>
          </span>
          <button type="button" className="icon-btn icon-btn-dark" onClick={logout} aria-label={t('user.logout')} title={t('user.logout')}>
            <LogOut size={17} aria-hidden="true" className="flip-rtl" />
          </button>
        </div>
      </div>
    </aside>
  );
}
