import type { ReactNode } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { useI18n } from '../../i18n';
import { Logo } from '../../components/ui/Logo';
import { TypingText } from '../../components/ui/TypingText';
import { LangToggle } from '../layout/LangToggle';
import type { TodoPriority } from '../../types/api';

/** Mini static board shown on the brand side of the auth pages (decorative). */
function BoardPreview() {
  const { t } = useI18n();
  const cols: Array<{ tone: string; name: string; cards: Array<[string, string, TodoPriority]> }> = [
    { tone: 'todo', name: t('status.todo'), cards: [['KAN-14', t('auth.preview.t1'), 'high'], ['KAN-17', t('auth.preview.t2'), 'medium']] },
    { tone: 'in_progress', name: t('status.in_progress'), cards: [['KAN-12', t('auth.preview.t3'), 'urgent']] },
    { tone: 'done', name: t('status.done'), cards: [['KAN-09', t('auth.preview.t4'), 'low'], ['KAN-10', t('auth.preview.t5'), 'medium']] },
  ];
  return (
    <div className="preview" aria-hidden="true">
      {cols.map((c, ci) => (
        <div key={c.tone} className={`preview-col preview-${c.tone}`} style={{ animationDelay: `${0.15 + ci * 0.1}s` }}>
          <div className="preview-head">{c.name}</div>
          {c.cards.map(([key, title, prio]) => (
            <div key={key} className="preview-card">
              <span className={`preview-notch prio-bar-${prio}`} />
              <span className="preview-key" dir="ltr">{key}</span>
              <span className="preview-title">{title}</span>
            </div>
          ))}
        </div>
      ))}
   
      <div className="preview-ai">
        <Sparkles size={14} />
        <span>{t('auth.preview.ai')}</span>
      </div>
    </div>
  );
}

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const { t } = useI18n();
  return (
    <div className="auth">
      <aside className="auth-brand">
        <Logo size={38} className="logo-light" />
        <div className="auth-pitch">
          <h2>{t('auth.pitch.title')}</h2>
          <p className="hero-typed">
            <TypingText phrases={[t('auth.type.1'), t('auth.type.2'), t('auth.type.3'), t('auth.type.4')]} />
          </p>
          <p>{t('auth.pitch.text')}</p>
        </div>
        <BoardPreview />
        <div className="brand-foot">
          <ShieldCheck size={16} aria-hidden="true" /> {t('auth.secure')}
        </div>
      </aside>
      <main className="auth-main">
        <div className="auth-lang">
          <LangToggle />
        </div>
        <div className="auth-card">
          <div className="auth-mobile-logo">
            <Logo size={34} />
          </div>
          <h1 className="auth-title">{title}</h1>
          <p className="auth-sub">{subtitle}</p>
          {children}
          <div className="auth-foot">{footer}</div>
        </div>
      </main>
    </div>
  );
}
