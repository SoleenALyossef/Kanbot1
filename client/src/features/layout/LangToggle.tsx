import { Languages } from 'lucide-react';
import { useI18n } from '../../i18n';

/** Switches between English (LTR) and Arabic (RTL). */
export function LangToggle({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { t, toggleLang } = useI18n();
  return (
    <button type="button" className={`lang-toggle lang-toggle-${variant}`} onClick={toggleLang} aria-label={t('lang.switchLabel')}>
      <Languages size={16} aria-hidden="true" />
      <span>{t('lang.switchTo')}</span>
    </button>
  );
}
