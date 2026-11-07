import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from './api/client';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './features/layout/ErrorBoundary';
import { I18nProvider } from './i18n';
import { recordActivity } from './lib/activity';
import { AppRoutes } from './router';
import './styles/index.css';

const queryClient = new QueryClient({
  // Every successful mutation that declares `meta.activity` lands in the local activity log.
  mutationCache: new MutationCache({
    onSuccess: (data, _variables, _context, mutation) => recordActivity(mutation.meta, data),
  }),
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      // Don't retry client errors or an unreachable server: show the error state straight away.
      retry: (count, error) => {
        const status = error instanceof ApiError ? error.status : 500;
        return !(status === 0 || (status >= 400 && status < 500)) && count < 1;
      },
    },
  },
});

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ThemeProvider>
              <ToastProvider>
                <AuthProvider>
                  <AppRoutes />
                </AuthProvider>
              </ToastProvider>
            </ThemeProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </I18nProvider>
    </ErrorBoundary>
  </StrictMode>,
);
