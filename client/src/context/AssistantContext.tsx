import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useI18n } from '../i18n';
import { useAiStatus, useChat } from '../hooks/useAi';
import { GenerateTodosDialog } from '../features/ai/GenerateTodosDialog';
import { PlanSprintDialog } from '../features/ai/PlanSprintDialog';
import type { AiSource, ChatMessage } from '../types/api';

export interface UiMessage extends ChatMessage {
  id: number;
  source?: AiSource;
  /** True only for answers that just arrived (they are typed out once). */
  fresh?: boolean;
}

interface AssistantValue {
  projectId: string | undefined;
  open: boolean;
  setOpen: (open: boolean) => void;
  messages: UiMessage[];
  pending: boolean;
  error: unknown;
  send: (text: string) => void;
  /** Opens the panel and sends a message in one go. */
  ask: (text: string) => void;
  retry: () => void;
  reset: () => void;
  addAssistantMessage: (content: string, source?: AiSource) => void;
  markSeen: (id: number) => void;
  openGenerate: () => void;
  openPlan: () => void;
}

const AssistantContext = createContext<AssistantValue | null>(null);

/** The whole conversation is sent every time (server is stateless): max 30 messages, 4000 chars each. */
function toApiMessages(list: UiMessage[], replyHint: string, hint: boolean): ChatMessage[] {
  const safeList = Array.isArray(list) ? list : [];
  let msgs: ChatMessage[] = safeList.map(({ role, content }) => ({ role, content: content.slice(0, 4000) })).slice(-29);
  while (msgs.length && msgs[0]?.role !== 'user') msgs = msgs.slice(1);
  const last = msgs[msgs.length - 1];
  if (hint && last && last.role === 'user') {
    // Ask the model to answer in the interface language (kept within the 4000 character limit).
    msgs = [...msgs.slice(0, -1), { role: 'user', content: `${last.content.slice(0, 3900)}\n\n${replyHint}` }];
  }
  return msgs;
}

export function AssistantProvider({ projectId, children }: { projectId: string | undefined; children: ReactNode }) {
  const { lang, t } = useI18n();
  const chat = useChat(projectId ?? '');
  const aiMode = useAiStatus().data?.mode;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const nextId = useRef(1);

  // The conversation is kept while the panel is closed and reset on project switch (AI-1).
  useEffect(() => {
    setMessages([]);
    setError(null);
    setPending(false);
    setOpen(false);
    setGenerateOpen(false);
    setPlanOpen(false);
  }, [projectId]);

  const run = useCallback(
    async (list: UiMessage[]) => {
      setPending(true);
      setError(null);
      try {
        const res = await chat.mutateAsync(toApiMessages(list, t('ai.replyLang'), lang === 'ar' && aiMode === 'ai'));
        const content = res?.message?.content;
        if (typeof content !== 'string' || content.trim().length === 0) {
          throw new Error('The AI service returned an empty or unexpected response. Check the server chat response format.');
        }
        const id = nextId.current++;
        setMessages((current) => [
          ...(Array.isArray(current) ? current : []),
          { id, role: 'assistant', content, source: res.source, fresh: true },
        ]);
      } catch (err) {
        setError(err);
      } finally {
        setPending(false);
      }
    },
    // `chat.mutateAsync` is stable between renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chat.mutateAsync, lang, t, aiMode],
  );

  const send = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content || pending || !projectId) return;
      const currentMessages = Array.isArray(messages) ? messages : [];
      const list: UiMessage[] = [...currentMessages, { id: nextId.current++, role: 'user', content: content.slice(0, 4000) }];
      setMessages(list);
      void run(list);
    },
    [messages, pending, projectId, run],
  );

  const ask = useCallback(
    (text: string) => {
      setOpen(true);
      send(text);
    },
    [send],
  );

  const retry = useCallback(() => void run(Array.isArray(messages) ? messages : []), [messages, run]);
  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);
  const addAssistantMessage = useCallback((content: string, source?: AiSource) => {
    setMessages((current) => [...(Array.isArray(current) ? current : []), { id: nextId.current++, role: 'assistant', content, source, fresh: true }]);
  }, []);
  const markSeen = useCallback((id: number) => {
    setMessages((current) => (Array.isArray(current) ? current : []).map((x) => (x.id === id && x.fresh ? { ...x, fresh: false } : x)));
  }, []);

  const value = useMemo<AssistantValue>(
    () => ({
      projectId,
      open,
      setOpen,
      messages,
      pending,
      error,
      send,
      ask,
      retry,
      reset,
      addAssistantMessage,
      markSeen,
      openGenerate: () => setGenerateOpen(true),
      openPlan: () => setPlanOpen(true),
    }),
    [projectId, open, messages, pending, error, send, ask, retry, reset, addAssistantMessage, markSeen],
  );

  return (
    <AssistantContext.Provider value={value}>
      {children}
      {projectId && generateOpen ? <GenerateTodosDialog projectId={projectId} onClose={() => setGenerateOpen(false)} /> : null}
      {projectId && planOpen ? <PlanSprintDialog projectId={projectId} onClose={() => setPlanOpen(false)} /> : null}
    </AssistantContext.Provider>
  );
}

export function useAssistant(): AssistantValue {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error('useAssistant must be used inside AssistantProvider');
  // Keep consumers resilient if a stale hot-reload value or a future persisted context is malformed.
  return Array.isArray(ctx.messages) ? ctx : { ...ctx, messages: [] };
}
