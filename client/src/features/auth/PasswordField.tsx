import { useState, type ChangeEvent } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useI18n } from '../../i18n';
import { TextField } from '../../components/ui/Field';

interface Props {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  hint?: string;
  autoComplete: string;
  autoFocus?: boolean;
}

/** Password input with a show/hide toggle. */
export function PasswordField({ label, value, onChange, error, hint, autoComplete, autoFocus }: Props) {
  const { t } = useI18n();
  const [shown, setShown] = useState(false);
  return (
    <TextField
      label={label}
      type={shown ? 'text' : 'password'}
      autoComplete={autoComplete}
      value={value}
      onChange={onChange}
      error={error}
      hint={hint}
      icon={Lock}
      required
      dir="ltr"
      data-autofocus={autoFocus ? '' : undefined}
      adornment={
        <button type="button" className="adorn-btn" onClick={() => setShown((s) => !s)} aria-label={shown ? t('auth.hidePassword') : t('auth.showPassword')} aria-pressed={shown}>
          {shown ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
        </button>
      }
    />
  );
}

/** 0 = too short … 3 = strong */
export function passwordScore(pw: string): number {
  if (pw.length < 8) return 0;
  let score = 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw)) score += 1;
  if (pw.length >= 12 || /[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(score, 3);
}

export function StrengthMeter({ password }: { password: string }) {
  const { t } = useI18n();
  if (!password) return null;
  const score = passwordScore(password);
  return (
    <div className={`strength strength-${score}`} role="status" aria-label={`${t('auth.strength')}: ${t(`auth.strength.${score}` as 'auth.strength.0')}`}>
      <span className="strength-bars" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className={i <= score ? 'on' : ''} />
        ))}
      </span>
      <span className="strength-label">{t(`auth.strength.${score}` as 'auth.strength.0')}</span>
    </div>
  );
}
