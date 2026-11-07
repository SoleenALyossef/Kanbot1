import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, CalendarCheck, FileText, ListPlus, MessageSquarePlus, Send, Sparkles, Target, X } from 'lucide-react';
import { useAssistant, type UiMessage } from '../../context/AssistantContext';
import { useAiStatus, useSprintSummary } from '../../hooks/useAi';
import { useProject } from '../../hooks/useProjects';
import { useTodos } from '../../hooks/useTodos';
import { useTypingLoop } from '../../hooks/useTyping';
import { useI18n, type MsgKey } from '../../i18n';
import { apiMessage } from '../../i18n/apiMessage';
import { Button } from '../../components/ui/Button';
import { Markdown } from '../../components/ui/Markdown';
import { Typewriter } from '../../components/ui/Typewriter';

const EMPTY_MESSAGES: UiMessage[] = [];

function suggestionKeys(pathname: string): MsgKey[] {
  if (/\/board$/.test(pathname) || /\/sprints\//.test(pathname)) return ['ai.sug.risks', 'ai.sug.scope', 'ai.sug.review'];
  if (/\/backlog$/.test(pathname)) return ['ai.sug.next', 'ai.sug.estimates', 'ai.sug.scope'];
  return ['ai.sug.next', 'ai.sug.estimates', 'ai.sug.status'];
}

function Thinking() {
  const { t } = useI18n();
  return (
    <div className="msg msg-assistant" role="status" aria-label={t('ai.thinkingAria')}>
      <span className="msg-avatar working">
        <Sparkles size={14} aria-hidden="true" />
      </span>
      <div className="bubble bubble-thinking">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
        <span className="sr-only">{t('ai.thinking')}</span>
      </div>
    </div>
  );
}

export function AssistantDrawer() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const a = useAssistant();
  // Guard the drawer against stale/incompatible context values during auth or HMR transitions.
  const messages = Array.isArray(a.messages) ? a.messages : EMPTY_MESSAGES;
  const status = useAiStatus();
  const project = useProject(a.projectId).data?.project;
  const allTodos = useTodos(a.projectId, {}).data?.todos;
  const summarize = useSprintSummary(a.projectId ?? '');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [composerFocused, setComposerFocused] = useState(false);
  const phExamples = useMemo(() => [t('ai.ph1'), t('ai.ph2'), t('ai.ph3')], [t]);
  const phTyped = useTypingLoop(phExamples, { enabled: a.open && !composerFocused && draft === '', typeMs: 50 });
  const [actionError, setActionError] = useState<unknown>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { markSeen } = a;

  useEffect(() => {
    if (a.open) inputRef.current?.focus();
  }, [a.open]);

  const scrollEnd = useCallback((): void => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, []);
  useEffect(() => {
    scrollEnd();
  }, [scrollEnd, messages, a.pending, busy, a.error, actionError, a.open]);

  // Answers are typed out once; after a few seconds they count as "seen" so reopening shows them instantly.
  useEffect(() => {
    const fresh = messages.filter((m) => m.fresh).map((m) => m.id);
    if (!fresh.length) return undefined;
    const id = window.setTimeout(() => fresh.forEach(markSeen), 3500);
    return () => window.clearTimeout(id);
  }, [messages, markSeen]);

  const suggestions = useMemo(() => suggestionKeys(pathname), [pathname]);

  if (!a.open) return null;

  const mock = status.data?.mode === 'mock';
  const working = a.pending || busy;

  function submit() {
    if (!draft.trim() || working) return;
    a.send(draft);
    setDraft('');
  }

  async function runSummary() {
    const sprint = project?.stats.activeSprint;
    setActionError(null);
    if (!sprint) {
      a.addAssistantMessage(t('ai.noActiveSprint'));
      return;
    }
    setBusy(true);
    try {
      const res = await summarize.mutateAsync(sprint.id);
      a.addAssistantMessage(res.summary.content, res.summary.source);
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(false);
    }
  }

  function runStandup() {
    const dayAgo = Date.now() - 48 * 3600 * 1000;
    const list = allTodos ?? [];
    const line = (x: { key: string; title: string }) => `- ${x.key}: ${x.title}`;
    const done = list.filter((x) => x.completedAt && new Date(x.completedAt).getTime() >= dayAgo).map(line);
    const doing = list.filter((x) => x.status === 'in_progress').map(line);
    a.send(t('ai.prompt.standup', { done: done.join('\n') || t('ai.none'), doing: doing.join('\n') || t('ai.none') }));
  }

  const error = a.error ?? actionError;

  return (
    <aside
      id="assistant-panel"
      className="drawer"
      aria-label={t('ai.panel')}
      onKeyDown={(e) => {
        if (e.key === 'Escape') a.setOpen(false);
      }}
    >
      <header className="drawer-head">
        <div className="drawer-title">
          <span className={working ? 'spark-badge working' : 'spark-badge'}>
            <Sparkles size={16} aria-hidden="true" />
          </span>
          <div>
            <h2>{t('ai.title')}</h2>
            <p>{mock ? t('ai.subtitleMock') : (status.data?.model ?? t('ai.subtitle'))}</p>
            {mock ? <span className="mock-badge drawer-badge">{t('ai.mock')}</span> : null}
          </div>
        </div>
        <div className="drawer-head-actions">
          <button type="button" className="icon-btn" onClick={a.reset} aria-label={t('ai.newChat')} title={t('ai.newChat')} disabled={messages.length === 0}>
            <MessageSquarePlus size={18} aria-hidden="true" />
          </button>
          <button type="button" className="icon-btn" onClick={() => a.setOpen(false)} aria-label={t('ai.close')} title={t('ai.close')}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="quick-actions" role="group" aria-label={t('ai.quick')}>
        <Button size="sm" icon={ListPlus} onClick={a.openGenerate}>
          {t('ai.createTodos')}
        </Button>
        <Button size="sm" icon={Target} onClick={a.openPlan}>
          {t('ai.planSprint')}
        </Button>
        <Button size="sm" icon={FileText} onClick={() => void runSummary()} loading={busy}>
          {t('ai.summarizeSprint')}
        </Button>
        <Button size="sm" icon={CalendarCheck} onClick={runStandup} disabled={working}>
          {t('ai.standup')}
        </Button>
      </div>

      <div className="messages" role="log" aria-live="polite" aria-label={t('ai.conversation')}>
        {messages.length === 0 && !working ? (
          <div className="chat-empty">
            <p>{t('ai.empty')}</p>
            <div className="suggestions">
              {suggestions.map((key) => (
                <button key={key} type="button" className="suggestion" onClick={() => a.send(t(key))}>
                  {t(key)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="msg msg-user">
              <div className="bubble">{typeof m.content === 'string' ? m.content : ''}</div>
            </div>
          ) : (
            <div key={m.id} className="msg msg-assistant">
              <span className="msg-avatar">
                <Sparkles size={14} aria-hidden="true" />
              </span>
              <div className="bubble">{m.fresh ? <Typewriter text={typeof m.content === 'string' ? m.content : ''} animate onProgress={scrollEnd} /> : <Markdown>{typeof m.content === 'string' ? m.content : ''}</Markdown>}</div>
            </div>
          ),
        )}

        {working ? <Thinking /> : null}

        {error && !working ? (
          <div className="chat-error" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            <div>
              <strong>{apiMessage(error, t)}</strong>
              <Button size="sm" onClick={a.error ? a.retry : () => void runSummary()}>
                {t('common.tryAgain')}
              </Button>
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <footer className="composer">
        <label htmlFor="chat-input" className="sr-only">
          {t('ai.inputLabel')}
        </label>
        <textarea
          id="chat-input"
          ref={inputRef}
          value={draft}
          rows={2}
          maxLength={4000}
          placeholder={composerFocused || draft ? t('ai.inputPlaceholder') : phTyped || ' '}
          onFocus={() => setComposerFocused(true)}
          onBlur={() => setComposerFocused(false)}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button variant="ai" icon={Send} onClick={submit} disabled={!draft.trim() || working} aria-label={t('ai.send')} className="send-btn" />
        <p className="ai-foot">{t('ai.composerHint')}</p>
      </footer>
    </aside>
  );
}
