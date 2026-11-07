import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { todayISO } from '../lib/format';
import type { Todo } from '../types/api';
import { useLocalStorage } from './useLocalStorage';

const PREF_KEY = 'kanbot.reminders';
const SEEN_KEY = 'kanbot.reminders.seen';

const supported = (): boolean => typeof window !== 'undefined' && 'Notification' in window;

/** Opt-in browser reminders (only while the app is open). */
export function useReminderPref() {
  const [enabled, setEnabled] = useLocalStorage<boolean>(PREF_KEY, false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    supported() ? Notification.permission : 'unsupported',
  );

  const enable = useCallback(async () => {
    if (!supported()) return;
    const result = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    setPermission(result);
    setEnabled(result === 'granted');
  }, [setEnabled]);

  const disable = useCallback(() => setEnabled(false), [setEnabled]);
  return { enabled: enabled && permission === 'granted', permission, enable, disable };
}

/** Shows one notification per todo per day when it is due today or overdue. Checks every minute. */
export function useReminders(todos: Todo[] | undefined): void {
  const { t } = useI18n();
  const { enabled } = useReminderPref();

  useEffect(() => {
    if (!enabled || !todos) return undefined;
    const check = () => {
      const today = todayISO();
      let seen: string[] = [];
      try {
        seen = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') as string[];
      } catch {
        seen = [];
      }
      const fresh = seen.filter((s) => s.endsWith(today));
      todos
        .filter((x) => x.status !== 'done' && x.dueDate !== null && x.dueDate <= today)
        .forEach((x) => {
          const mark = `${x.id}:${today}`;
          if (fresh.includes(mark)) return;
          const overdue = (x.dueDate ?? today) < today;
          new Notification('Kanbot', { body: t(overdue ? 'remind.overdue' : 'remind.today', { key: x.key, title: x.title }), tag: mark });
          fresh.push(mark);
        });
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify(fresh));
      } catch {
        /* storage unavailable */
      }
    };
    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, [enabled, todos, t]);
}
