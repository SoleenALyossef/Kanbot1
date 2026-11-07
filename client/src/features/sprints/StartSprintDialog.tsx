import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, fieldErrors } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useStartSprint } from '../../hooks/useSprints';
import { useI18n } from '../../i18n';
import { apiMessage } from '../../i18n/apiMessage';
import { addDaysISO, todayISO } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { FormError, TextField } from '../../components/ui/Field';
import type { Sprint } from '../../types/api';

interface Props {
  projectId: string;
  sprint: Sprint;
  /** The currently active sprint, if any (only one can be active). */
  blockedBy: Sprint | null;
  onClose: () => void;
}

/** SPR-3 */
export function StartSprintDialog({ projectId, sprint, blockedBy, onClose }: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const start = useStartSprint(projectId);
  const [values, setValues] = useState(() => {
    const startDate = sprint.startDate && sprint.startDate >= todayISO() ? sprint.startDate : todayISO();
    return { startDate, endDate: sprint.endDate && sprint.endDate >= startDate ? sprint.endDate : addDaysISO(startDate, 14) };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (start.isPending || blockedBy) return;
    if (values.endDate < values.startDate) {
      setErrors({ endDate: t('sf.err.end') });
      return;
    }
    setErrors({});
    setFormError('');
    try {
      await start.mutateAsync({ id: sprint.id, body: values });
      toast.success(t('st.started', { name: sprint.name }));
      onClose();
      navigate(`/projects/${projectId}/board`);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR' && err.details?.length) setErrors(fieldErrors(err));
      else setFormError(apiMessage(err, t));
    }
  }

  return (
    <Dialog
      title={t('st.title', { name: sprint.name })}
      description={t('st.desc')}
      size="sm"
      onClose={start.isPending ? undefined : onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={start.isPending}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="submit" form="start-form" loading={start.isPending} disabled={!!blockedBy}>
            {t('st.btn')}
          </Button>
        </>
      }
    >
      <form id="start-form" onSubmit={onSubmit} noValidate className="form">
        {blockedBy ? <FormError>{t('st.blocked', { name: blockedBy.name })}</FormError> : null}
        <FormError>{formError}</FormError>
        <TextField label={t('sf.start')} type="date" value={values.startDate} onChange={(e) => setValues((v) => ({ ...v, startDate: e.target.value }))} error={errors.startDate} required data-autofocus dir="ltr" />
        <TextField label={t('sf.end')} type="date" value={values.endDate} min={values.startDate} onChange={(e) => setValues((v) => ({ ...v, endDate: e.target.value }))} error={errors.endDate} required dir="ltr" />
      </form>
    </Dialog>
  );
}
