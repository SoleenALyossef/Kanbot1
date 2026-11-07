import { Check } from 'lucide-react';
import { ACCENTS, useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';

/** Five accent colours, remembered per browser. */
export function AccentPicker() {
  const { accent, setAccent } = useTheme();
  const { t } = useI18n();
  return (
    <div className="accent-picker" role="radiogroup" aria-label={t('accent.label')}>
      {ACCENTS.map((a) => (
        <button
          key={a}
          type="button"
          role="radio"
          aria-checked={accent === a}
          aria-label={t(`accent.${a}`)}
          title={t(`accent.${a}`)}
          className={`swatch swatch-${a}`}
          onClick={() => setAccent(a)}
        >
          {accent === a ? <Check size={13} aria-hidden="true" /> : null}
        </button>
      ))}
    </div>
  );
}
