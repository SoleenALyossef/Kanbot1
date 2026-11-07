import { ApiError } from '../api/client';
import type { TFn } from './index';

/** Server messages we know (English). In other languages they are replaced by a translation. */
const KNOWN_SERVER_MESSAGES: Record<string, 'api.badLogin'> = {
  'Incorrect email or password.': 'api.badLogin',
};

/** Human message for any error, translated when we recognise it, otherwise the server's own text. */
export function apiMessage(error: unknown, t: TFn): string {
  if (!(error instanceof ApiError)) return t('api.generic');
  switch (error.code) {
    case 'NETWORK_ERROR':
      return t('api.network');
    case 'RATE_LIMITED':
      return t('api.rate');
    case 'AI_ERROR':
      return t('api.ai');
    default: {
      const known = KNOWN_SERVER_MESSAGES[error.message];
      return known ? t(known) : error.message || t('api.generic');
    }
  }
}
