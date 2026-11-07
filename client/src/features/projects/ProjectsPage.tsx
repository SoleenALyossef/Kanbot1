import { useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderPlus, Layers, ListTodo, Pencil, Plus, Rocket, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TypingText } from '../../components/ui/TypingText';
import { useDeleteProject, useProjects } from '../../hooks/useProjects';
import { useI18n } from '../../i18n';
import { apiMessage } from '../../i18n/apiMessage';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState, ErrorState } from '../../components/ui/Feedback';
import { Menu } from '../../components/ui/Menu';
import type { ProjectWithStats } from '../../types/api';
import { ProjectFormDialog } from './ProjectFormDialog';
import { projectTone } from './projectTone';

function ProjectCard({ project, index, onEdit, onDelete }: { project: ProjectWithStats; index: number; onEdit: () => void; onDelete: () => void }) {
  const { t } = useI18n();
  const { stats } = project;
  return (
    <li className="project-card spot" data-spotlight style={{ '--i': index } as CSSProperties}>
      <div className="project-card-top">
        <span className={`key-chip key-chip-lg ${projectTone(project.key)}`} dir="ltr">{project.key}</span>
        <Menu
          label={t('projects.actionsFor', { name: project.name })}
          items={[
            { label: t('projects.edit'), icon: Pencil, onSelect: onEdit },
            { separator: true },
            { label: t('projects.delete'), icon: Trash2, danger: true, onSelect: onDelete },
          ]}
        />
      </div>
      <h2 className="project-name">
        <Link to={`/projects/${project.id}/backlog`} className="card-link">
          {project.name}
        </Link>
      </h2>
      <p className="project-desc">{project.description || t('projects.noDesc')}</p>
      <div className="project-meta">
        <span>
          <ListTodo size={15} aria-hidden="true" /> {t('projects.inBacklog', { n: stats.backlogCount })}
        </span>
        <span>
          <Layers size={15} aria-hidden="true" /> {t('projects.total', { n: stats.totalTodos })}
        </span>
      </div>
      <div className="project-sprint">
        {stats.activeSprint ? (
          <span className="pill sprint-pill sprint-active">
            <Rocket size={13} aria-hidden="true" /> {stats.activeSprint.name}
          </span>
        ) : (
          <span className="muted">{t('projects.noActive')}</span>
        )}
      </div>
    </li>
  );
}

export default function ProjectsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greetKey = hour < 12 ? 'greet.morning' : hour < 18 ? 'greet.afternoon' : 'greet.evening';
  const navigate = useNavigate();
  const toast = useToast();
  const query = useProjects();
  const del = useDeleteProject();
  const [formState, setFormState] = useState<{ project?: ProjectWithStats } | null>(null);
  const [toDelete, setToDelete] = useState<ProjectWithStats | null>(null);

  const projects = query.data?.projects ?? [];

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success(t('projects.deleted', { name: toDelete.name }));
      setToDelete(null);
    } catch (err) {
      toast.error(apiMessage(err, t));
    }
  }

  return (
    <div className="page-wide">
      <div className="page-head">
        <div>
          <p className="greeting">
            <TypingText phrases={[t(greetKey, { name: (user?.name ?? '').split(' ')[0] ?? '' })]} loop={false} typeMs={45} />
          </p>
          <h2 className="page-title">{t('projects.title')}</h2>
          <p className="page-sub">{t('projects.sub')}</p>
        </div>
        {projects.length > 0 ? (
          <Button variant="primary" icon={Plus} onClick={() => setFormState({})}>
            {t('projects.new')}
          </Button>
        ) : null}
      </div>

      {query.isLoading ? (
        <ul className="project-grid" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="project-card skeleton" style={{ height: 190 }} />
          ))}
        </ul>
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} title={t('projects.loadError')} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderPlus}
          title={t('projects.empty.title')}
          description={t('projects.empty.desc')}
          actions={
            <Button variant="primary" icon={Plus} onClick={() => setFormState({})}>
              {t('projects.empty.title')}
            </Button>
          }
        />
      ) : (
        <ul className="project-grid stagger">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={Math.min(i, 10)} onEdit={() => setFormState({ project: p })} onDelete={() => setToDelete(p)} />
          ))}
        </ul>
      )}

      {formState ? (
        <ProjectFormDialog
          project={formState.project}
          onClose={() => setFormState(null)}
          onSaved={(project) => {
            const wasNew = !formState.project;
            setFormState(null);
            if (wasNew) navigate(`/projects/${project.id}/backlog`);
          }}
        />
      ) : null}

      {toDelete ? (
        <ConfirmDialog
          title={t('projects.deleteTitle', { name: toDelete.name })}
          confirmLabel={t('projects.delete')}
          danger
          loading={del.isPending}
          onCancel={() => setToDelete(null)}
          onConfirm={() => void confirmDelete()}
        >
          <p>{t('projects.deleteBody', { name: toDelete.name })}</p>
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
