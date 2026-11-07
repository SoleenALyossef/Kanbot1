import { useEffect, useState } from 'react';
import { Outlet, useLocation, useMatch } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { AssistantProvider } from '../../context/AssistantContext';
import { TodoDetailsProvider } from '../../context/TodoDetailsContext';
import { useOnline } from '../../hooks/useOnline';
import { useReminders } from '../../hooks/useReminders';
import { useSpotlight } from '../../hooks/useSpotlight';
import { useTodos } from '../../hooks/useTodos';
import { useI18n } from '../../i18n';
import { AssistantDrawer } from '../ai/AssistantDrawer';
import { CommandPalette } from '../palette/CommandPalette';
import { ShortcutsDialog } from '../palette/ShortcutsDialog';
import { useGlobalShortcuts } from '../palette/useGlobalShortcuts';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

function ShellInner({ projectId }: { projectId: string | undefined }) {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const online = useOnline();
  const [navOpen, setNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);
  useSpotlight();
  useReminders(useTodos(projectId, {}).data?.todos);
  useGlobalShortcuts({ projectId, onPalette: () => setPaletteOpen((o) => !o), onHelp: () => setHelpOpen(true) });

  return (
    <>
      <a href="#main" className="skip-link">
        {t('common.skip')}
      </a>
      <div className="shell">
        <Sidebar projectId={projectId} open={navOpen} onOpenPalette={() => setPaletteOpen(true)} />
        {navOpen ? <div className="scrim" onClick={() => setNavOpen(false)} aria-hidden="true" /> : null}
        <div className="shell-main">
          {!online ? (
            <div className="offline-banner" role="status">
              <WifiOff size={16} aria-hidden="true" /> {t('offline.banner')}
            </div>
          ) : null}
          <Topbar projectId={projectId} onMenu={() => setNavOpen(true)} />
          <main id="main" className="page" tabIndex={-1}>
            <div className="page-enter" key={pathname}>
              <Outlet />
            </div>
          </main>
        </div>
        {projectId ? <AssistantDrawer /> : null}
      </div>
      {paletteOpen ? <CommandPalette projectId={projectId} onClose={() => setPaletteOpen(false)} onHelp={() => setHelpOpen(true)} /> : null}
      {helpOpen ? <ShortcutsDialog onClose={() => setHelpOpen(false)} /> : null}
    </>
  );
}

export default function AppShell() {
  const match = useMatch('/projects/:projectId/*');
  const projectId = match?.params.projectId;
  return (
    <AssistantProvider projectId={projectId}>
      <TodoDetailsProvider>
        <ShellInner projectId={projectId} />
      </TodoDetailsProvider>
    </AssistantProvider>
  );
}
