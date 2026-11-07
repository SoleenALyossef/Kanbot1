import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronsUpDown, FolderKanban, Plus } from 'lucide-react';
import { useProject, useProjects } from '../../hooks/useProjects';
import { useI18n } from '../../i18n';
import { Menu, type MenuItem } from '../../components/ui/Menu';
import { ProjectFormDialog } from '../projects/ProjectFormDialog';
import { projectTone } from '../projects/projectTone';

export function ProjectSwitcher({ projectId }: { projectId: string | undefined }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const projects = useProjects();
  const current = useProject(projectId).data?.project;
  const [creating, setCreating] = useState(false);

  const items: MenuItem[] = [
    { heading: t('switcher.label') },
    ...(projects.data?.projects ?? []).map<MenuItem>((p) => ({
      label: `${p.name} · ${p.key}`,
      icon: p.id === projectId ? Check : undefined,
      onSelect: () => navigate(`/projects/${p.id}/backlog`),
    })),
    ...(projects.isLoading ? [{ label: t('switcher.loading'), disabled: true } as MenuItem] : []),
    { separator: true },
    { label: t('switcher.all'), icon: FolderKanban, onSelect: () => navigate('/projects') },
    { label: t('switcher.new'), icon: Plus, onSelect: () => setCreating(true) },
  ];

  return (
    <>
      <Menu
        label={t('switcher.label')}
        align="start"
        items={items}
        trigger={(props) => (
          <button {...props} className="switcher">
            <span className={`key-chip ${current ? projectTone(current.key) : 'tone-0'}`} dir="ltr">{current?.key ?? '—'}</span>
            <span className="switcher-text">
              <span className="switcher-name">{current?.name ?? t('switcher.none')}</span>
              <span className="switcher-sub">{current ? t('switcher.current') : t('switcher.hint')}</span>
            </span>
            <ChevronsUpDown size={16} aria-hidden="true" />
          </button>
        )}
      />
      {creating ? (
        <ProjectFormDialog
          onClose={() => setCreating(false)}
          onSaved={(project) => {
            setCreating(false);
            navigate(`/projects/${project.id}/backlog`);
          }}
        />
      ) : null}
    </>
  );
}
