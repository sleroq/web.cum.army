import { useCallback, useEffect, useRef, useState } from 'react';

export interface Message {
  id: string;
  ts: number;
  text: string;
  displayName: string;
}

export type ChatStatus = 'connecting' | 'connected' | 'error' | 'disconnected';

interface UseChatSessionOptions {
  streamKey: string;
  enabled: boolean;
  displayName: string;
}

const apiPath = import.meta.env.VITE_API_PATH;

export const useChatSession = ({ streamKey, enabled, displayName }: UseChatSessionOptions) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ChatStatus>('disconnected');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lastEventIdRef = useRef<string | null>(null);

  // Reset state when streamKey changes
  useEffect(() => {
    setMessages([]);
    lastEventIdRef.current = null;
    setSessionId(null);
    setStatus('disconnected');
    setError(null);
  }, [streamKey]);

  // 1. Connect to get Session ID
  useEffect(() => {
    if (!enabled || !streamKey) {
      setSessionId(null);
      setStatus('disconnected');
      setError(null);
      return;
    }

    // If we already have a session or are currently connecting/in error state, skip
    // This prevents infinite loops and multiple parallel requests
    if (sessionId || status === 'connecting' || status === 'error') {
      return;
    }

    setStatus('connecting');
    setError(null);

    const connect = async () => {
      try {
        const response = await fetch(`${apiPath}/chat/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ streamKey }),
        });

        if (!response.ok) {
          throw new Error(`Failed to connect to chat: ${response.statusText}`);
        }

        const data = await response.json();
        setSessionId(data.chatSessionId);
      } catch (err) {
        console.error('ChatConnectError', err);
        setError(err instanceof Error ? err.message : 'Unknown connection error');
        setStatus('error');
      }
    };

    connect();
  }, [streamKey, enabled, sessionId, status]);

  // 2. Subscribe to SSE via fetch (to support Last-Event-ID header)
  useEffect(() => {
    if (!sessionId || !enabled) return;

    const abortController = new AbortController();
    let retryTimeout: ReturnType<typeof setTimeout>;

    const startSSE = async () => {
      const url = `${apiPath}/chat/sse/${sessionId}`;

      try {
        const headers: Record<string, string> = {
          Accept: 'text/event-stream',
        };
        if (lastEventIdRef.current) {
          headers['Last-Event-ID'] = lastEventIdRef.current;
        }

        const response = await fetch(url, {
          headers,
          signal: abortController.signal,
        });

        if (!response.ok) {
          if (response.status === 404 || response.status === 401) {
            // Session expired or invalid, need to re-authenticate
            setSessionId(null);
            return;
          }
          throw new Error(`SSE fetch failed: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';
        let currentEventData = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) {
              if (currentEventData) {
                try {
                  // Remove trailing newline
                  const data = currentEventData.endsWith('\n')
                    ? currentEventData.slice(0, -1)
                    : currentEventData;
                  const newMessage = JSON.parse(data) as Message;
                  handleMessages([newMessage]);
                } catch (err) {
                  console.error('ChatMessageParseError', err);
                }
                currentEventData = '';
              }
              continue;
            }

            const colonIndex = line.indexOf(':');
            if (colonIndex === 0) continue; // Comment

            const field = colonIndex < 0 ? line : line.slice(0, colonIndex);
            const value = colonIndex < 0 ? '' : line.slice(colonIndex + 1).replace(/^\s/, '');

            if (field === 'id') {
              lastEventIdRef.current = value;
            } else if (field === 'data') {
              currentEventData += value + '\n';
            } else if (field === 'event') {
              if (value === 'connected') {
                setStatus('connected');
              }
            }
          }
        }
      } catch (err) {
        if (abortController.signal.aborted) return;

        console.error('SSE Connection Error', err);
        setStatus('connecting');

        // Retry after a delay
        retryTimeout = setTimeout(startSSE, 3000);
      }
    };

    const handleMessages = (newMessages: Message[]) => {
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const filtered = newMessages.filter((m) => m && m.id && !existingIds.has(m.id));

        if (filtered.length === 0) return prev;

        const combined = [...prev, ...filtered];
        if (combined.length > 1000) {
          return combined.slice(-1000);
        }
        return combined;
      });
    };

    startSSE();

    return () => {
      abortController.abort();
      clearTimeout(retryTimeout);
    };
  }, [sessionId, enabled]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!sessionId || !text.trim()) return;

      try {
        const response = await fetch(`${apiPath}/chat/send/${sessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, displayName }),
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 404) {
            setSessionId(null);
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to send message: ${response.status}`);
        }
      } catch (err) {
        console.error('ChatSendError', err);
        throw err;
      }
    },
    [sessionId, displayName]
  );

  return {
    messages,
    status,
    error,
    sendMessage,
  };
};
