import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Mail, User } from 'lucide-react';
import { ApiError, fieldErrors } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { apiMessage } from '../../i18n/apiMessage';
import { Button } from '../../components/ui/Button';
import { FormError, TextField } from '../../components/ui/Field';
import { AuthLayout } from './AuthLayout';
import { PasswordField, StrengthMeter } from './PasswordField';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Field = 'name' | 'email' | 'password' | 'confirm';

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useI18n();
  const [params] = useSearchParams();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (name: Field) => (e: ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [name]: e.target.value }));

  function validate(): Partial<Record<Field, string>> {
    const next: Partial<Record<Field, string>> = {};
    if (!values.name.trim()) next.name = t('auth.err.nameRequired');
    else if (values.name.trim().length > 80) next.name = t('common.err.max80');
    if (!values.email.trim()) next.email = t('auth.err.emailRequired');
    else if (!EMAIL_RE.test(values.email.trim())) next.email = t('auth.err.emailInvalid');
    if (!values.password) next.password = t('auth.err.passwordChoose');
    else if (values.password.length < 8) next.password = t('auth.err.passwordShort');
    if (!values.confirm) next.confirm = t('auth.err.confirmRequired');
    else if (values.confirm !== values.password) next.confirm = t('auth.err.confirmMismatch');
    return next;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    const next = validate();
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await register({ name: values.name.trim(), email: values.email.trim(), password: values.password });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setErrors({ email: t('auth.err.emailTaken') });
      else if (err instanceof ApiError && err.code === 'VALIDATION_ERROR' && err.details?.length) setErrors(fieldErrors(err));
      else setFormError(apiMessage(err, t));
      setLoading(false);
    }
  }

  const redirect = params.get('redirect');
  const search = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';

  return (
    <AuthLayout
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={
        <>
          {t('auth.haveAccount')} <Link to={`/login${search}`}>{t('auth.loginLink')}</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="form">
        <FormError>{formError}</FormError>
        <TextField label={t('auth.name')} autoComplete="name" value={values.name} onChange={set('name')} error={errors.name} icon={User} required data-autofocus />
        <TextField label={t('auth.email')} type="email" autoComplete="email" value={values.email} onChange={set('email')} error={errors.email} icon={Mail} required dir="ltr" />
        <PasswordField label={t('auth.password')} autoComplete="new-password" value={values.password} onChange={set('password')} error={errors.password} hint={t('auth.passwordHint')} />
        <StrengthMeter password={values.password} />
        <PasswordField label={t('auth.confirm')} autoComplete="new-password" value={values.confirm} onChange={set('confirm')} error={errors.confirm} />
        <Button type="submit" variant="primary" loading={loading} iconEnd={ArrowRight} className="btn-block btn-cta">
          {t('auth.register.btn')}
        </Button>
      </form>
    </AuthLayout>
  );
}
