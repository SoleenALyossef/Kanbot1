import { Component, type ErrorInfo, type ReactNode } from 'react';
import { LogoMark } from '../../components/ui/Logo';
import { translate, type Lang } from '../../i18n';

interface State {
  failed: boolean;
}

/** Last line of defence: a friendly screen instead of a white page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const lang: Lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
    return (
      <div className="fullpage" role="alert">
        <LogoMark size={52} />
        <h1 className="fullpage-title">{translate(lang, 'err.title')}</h1>
        <p>{translate(lang, 'err.text')}</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          <span>{translate(lang, 'err.reload')}</span>
        </button>
      </div>
    );
  }
}
