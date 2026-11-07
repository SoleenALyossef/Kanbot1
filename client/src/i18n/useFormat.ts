import { useMemo } from 'react';
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale/ar';
import { enUS } from 'date-fns/locale/en-US';
import { daysLeft } from '../lib/format';
import { useI18n } from './index';

/** Locale-aware date helpers (month names, relative time, "3 days left"…). */
export function useFormat() {
  const { lang, t, tp } = useI18n();
  return useMemo(() => {
    const locale = lang === 'ar' ? arLocale : enUS;
    const toDate = (value: string | null | undefined) => {
      if (!value) return null;
      const d = parseISO(value);
      return isValid(d) ? d : null;
    };

    const formatDay = (value: string | null | undefined): string => {
      const d = toDate(value);
      if (!d) return '';
      return format(d, d.getFullYear() === new Date().getFullYear() ? 'd MMM' : 'd MMM yyyy', { locale });
    };

    const formatRange = (start: string | null, end: string | null): string => {
      if (!start && !end) return t('dates.none');
      if (start && !end) return t('dates.starts', { d: formatDay(start) });
      if (!start && end) return t('dates.ends', { d: formatDay(end) });
      return `${formatDay(start)} – ${formatDay(end)}`;
    };

    const daysLeftLabel = (end: string | null): string => {
      const n = daysLeft(end);
      if (n === null) return t('days.none');
      if (n < 0) return tp('days.ended', Math.abs(n));
      if (n === 0) return t('days.endsToday');
      return tp('days.left', n);
    };

    const timeAgo = (iso: string | null | undefined): string => {
      const d = toDate(iso);
      return d ? formatDistanceToNow(d, { addSuffix: true, locale }) : '';
    };

    const shortDay = (value: string): string => {
      const d = toDate(value);
      return d ? format(d, 'd MMM', { locale }) : value;
    };

    return { formatDay, formatRange, daysLeftLabel, timeAgo, shortDay, locale };
  }, [lang, t, tp]);
}
