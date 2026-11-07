import { forwardRef, useMemo, useState } from 'react';
import { useTypingLoop } from '../../hooks/useTyping';
import { Plus } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useCreateTodo } from '../../hooks/useTodos';
import { useI18n } from '../../i18n';
import { apiMessage } from '../../i18n/apiMessage';

/** BL-2: type a title, press Enter, keep typing. Escape clears. */
export const QuickCreate = forwardRef<HTMLInputElement, { projectId: string }>(function QuickCreate({ projectId }, ref) {
  const { t } = useI18n();
  const create = useCreateTodo(projectId);
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [focused, setFocused] = useState(false);
  const examples = useMemo(() => [t('quick.ex1'), t('quick.ex2'), t('quick.ex3')], [t]);
  const typed = useTypingLoop(examples, { enabled: !focused && title === '', typeMs: 48, pauseMs: 1400 });

  async function submit() {
    const value = title.trim();
    if (!value) return;
    setTitle('');
    try {
      const res = await create.mutateAsync({ title: value.slice(0, 200) });
      toast.success(t('quick.created', { key: res.todo.key }));
    } catch (err) {
      setTitle(value);
      toast.error(apiMessage(err, t));
    }
  }

  return (
    <form
      className="quick-create"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <Plus size={16} aria-hidden="true" />
      <input
        ref={ref}
        value={title}
        maxLength={200}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setTitle('');
            e.currentTarget.blur();
          }
        }}
        placeholder={focused || title ? t('quick.placeholder') : typed || ' '}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label={t('quick.label')}
        autoComplete="off"
      />
      <span className="quick-hint" aria-hidden="true">
        {t('quick.hint')}
      </span>
    </form>
  );
});
