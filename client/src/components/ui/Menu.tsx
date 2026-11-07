import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import { useI18n } from '../../i18n';
import { cn } from '../../lib/cn';

export type MenuItem =
  | { separator: true }
  | { heading: string }
  | { label: string; icon?: LucideIcon; onSelect?: () => void; danger?: boolean; disabled?: boolean };

export interface MenuTriggerProps {
  ref: RefObject<HTMLButtonElement | null>;
  type: 'button';
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}

interface MenuProps {
  label?: string;
  items: MenuItem[];
  trigger?: (props: MenuTriggerProps) => ReactNode;
  className?: string;
  align?: 'start' | 'end';
}

/**
 * Popover menu rendered in a portal (never clipped by scrolling lists), RTL-aware.
 * Keyboard: Arrow keys move, Enter/Space select, Esc closes and returns focus.
 */
export function Menu({ label, items, trigger, className, align = 'end' }: MenuProps) {
  const { t } = useI18n();
  const menuLabel = label ?? t('common.moreActions');
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !menuRef.current) return;
    const tr = triggerRef.current.getBoundingClientRect();
    const m = menuRef.current.getBoundingClientRect();
    const rtl = document.documentElement.dir === 'rtl';
    const alignRight = (align === 'end') !== rtl; // "end" is the right edge in LTR, the left edge in RTL
    let left = alignRight ? tr.right - m.width : tr.left;
    left = Math.max(8, Math.min(left, window.innerWidth - m.width - 8));
    let top = tr.bottom + 6;
    if (top + m.height > window.innerHeight - 8) top = Math.max(8, tr.top - m.height - 6);
    setPos({ top, left });
  }, [open, align]);

  useEffect(() => {
    if (!open) return undefined;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus();
    const onDown = (e: globalThis.MouseEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) setOpen(false);
    };
    const onScroll = (e: Event) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  function onMenuKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!menuRef.current) return;
    const nodes = [...menuRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])')];
    const i = nodes.indexOf(document.activeElement as HTMLElement);
    const focusAt = (n: number) => nodes[(n + nodes.length) % nodes.length]?.focus();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusAt(i + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusAt(i - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusAt(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusAt(nodes.length - 1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === 'Tab') {
      close(false);
    }
  }

  const triggerProps: MenuTriggerProps = {
    ref: triggerRef,
    type: 'button',
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    onClick: (e) => {
      e.stopPropagation();
      setOpen((o) => !o);
    },
  };

  return (
    <>
      {trigger ? (
        trigger(triggerProps)
      ) : (
        <button {...triggerProps} className={cn('icon-btn', className)} aria-label={menuLabel} title={menuLabel}>
          <MoreHorizontal size={18} aria-hidden="true" />
        </button>
      )}
      {open
        ? createPortal(
            <div ref={menuRef} className="menu" role="menu" aria-label={menuLabel} style={{ top: pos.top, left: pos.left }} onKeyDown={onMenuKeyDown}>
              {items.map((item, i) => {
                if ('separator' in item) return <div key={`sep-${i}`} className="menu-sep" role="separator" />;
                if ('heading' in item) {
                  return (
                    <div key={`h-${i}`} className="menu-heading" role="presentation">
                      {item.heading}
                    </div>
                  );
                }
                const Icon = item.icon;
                return (
                  <button
                    key={`${item.label}-${i}`}
                    type="button"
                    role="menuitem"
                    className={cn('menu-item', item.danger && 'menu-item-danger')}
                    disabled={item.disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      close(false);
                      item.onSelect?.();
                    }}
                  >
                    {Icon ? <Icon size={16} aria-hidden="true" /> : <span className="menu-icon-gap" />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
