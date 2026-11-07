import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { FullPageLoader } from '../../components/ui/Feedback';
import { LogoMark } from '../../components/ui/Logo';

/** Only allow same-site relative redirects. */
export function safeRedirect(value: string | null | undefined): string {
  if (value && value.startsWith('/') && !value.startsWith('//')) return value;
  return '/projects';
}

export function ProtectedRoute() {
  const { status, retry } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  if (status === 'loading') return <FullPageLoader />;
  if (status === 'error') {
    return (
      <div className="fullpage">
        <LogoMark size={52} />
        <h1 className="fullpage-title">{t('server.unreachable.title')}</h1>
        <p>{t('server.unreachable.text')}</p>
        <Button variant="primary" onClick={retry}>
          {t('common.tryAgain')}
        </Button>
      </div>
    );
  }
  if (status !== 'authed') {
    const here = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(here)}`} replace />;
  }
  return <Outlet />;
}

export function GuestRoute() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageLoader />;
  if (status === 'authed') {
    const redirect = new URLSearchParams(location.search).get('redirect');
    return <Navigate to={safeRedirect(redirect)} replace />;
  }
  return <Outlet />;
}
