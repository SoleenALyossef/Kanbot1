import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';
import { ApiError, fieldErrors } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { apiMessage } from '../../i18n/apiMessage';
import { Button } from '../../components/ui/Button';
import { FormError, TextField } from '../../components/ui/Field';
import { AuthLayout } from './AuthLayout';
import { PasswordField } from './PasswordField';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Field = 'email' | 'password';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const [params] = useSearchParams();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [expired] = useState(params.get('reason') === 'expired');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (name: Field) => (e: ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [name]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    const next: Partial<Record<Field, string>> = {};
    if (!values.email.trim()) next.email = t('auth.err.emailRequired');
    else if (!EMAIL_RE.test(values.email.trim())) next.email = t('auth.err.emailInvalid');
    if (!values.password) next.password = t('auth.err.passwordRequired');
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await login({ email: values.email.trim(), password: values.password });
      // GuestRoute redirects to ?redirect= (or /projects) once the session is set.
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR' && err.details?.length) setErrors(fieldErrors(err));
      else setFormError(apiMessage(err, t));
      setLoading(false);
    }
  }

  const redirect = params.get('redirect');
  const search = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';

  return (
    <AuthLayout
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={
        <>
          {t('auth.newHere')} <Link to={`/register${search}`}>{t('auth.createLink')}</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="form">
        <FormError>{formError || (expired ? t('auth.expired') : '')}</FormError>
        <TextField label={t('auth.email')} type="email" autoComplete="email" value={values.email} onChange={set('email')} error={errors.email} icon={Mail} required data-autofocus dir="ltr" />
        <PasswordField label={t('auth.password')} autoComplete="current-password" value={values.password} onChange={set('password')} error={errors.password} />
        <Button type="submit" variant="primary" loading={loading} iconEnd={ArrowRight} className="btn-block btn-cta">
          {t('auth.login.btn')}
        </Button>
        <button type="button" className="demo-hint" onClick={() => setValues({ email: 'demo@kanbot.dev', password: 'password123' })}>
          {t('auth.demo.hint')} <strong>{t('auth.demo.fill')}</strong>
        </button>
      </form>
    </AuthLayout>
  );
}
