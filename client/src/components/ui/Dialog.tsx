import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useI18n } from '../../i18n';
import { cn } from '../../lib/cn';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

let openDialogs = 0;

interface DialogProps {
  title: ReactNode;
  description?: ReactNode;
  /** Omit to make the dialog non-dismissable (e.g. while saving). */
  onClose?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Accessible modal: focus trap, Esc closes, focus returns to the opener,
 * body scroll locked. Put `data-autofocus` on the element that should get focus first.
 */
export function Dialog({ title, description, onClose, children, footer, size = 'md' }: DialogProps) {
  const { t } = useI18n();
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement;
    openDialogs += 1;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    return () => {
      openDialogs -= 1;
      if (openDialogs === 0) document.body.style.overflow = '';
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
    };
  }, []);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose?.();
      return;
    }
    if (e.key !== 'Tab' || !panelRef.current) return;
    const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) {
      e.preventDefault();
      return;
    }
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        className={cn('dialog', `dialog-${size}`)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <header className="dialog-head">
          <div>
            <h2 id={titleId} className="dialog-title">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="dialog-desc">
                {description}
              </p>
            ) : null}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} disabled={!onClose} aria-label={t('common.close')}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="dialog-body">{children}</div>
        {footer ? <footer className="dialog-foot">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
