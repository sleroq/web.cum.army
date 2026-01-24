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
  const [retryCount, setRetryCount] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);

  // 1. Connect to get Session ID
  useEffect(() => {
    if (!enabled || !streamKey) {
      setSessionId(null);
      setStatus('disconnected');
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
  }, [streamKey, enabled, retryCount]);


  // 2. Subscribe to SSE
  useEffect(() => {
    if (!sessionId || !enabled) return;

    const url = `${apiPath}/chat/sse/${sessionId}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setStatus('connected');
    };

    const handleMessages = (newMessages: Message[]) => {
      setMessages((prev) => {
        // Use a local set for deduplication to keep the updater pure.
        // Side-effects like updating a ref inside setMessages can cause
        // messages to be dropped in React 18 Strict Mode.
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

    eventSource.addEventListener('message', (event) => {
      try {
        const rawMessage = JSON.parse(event.data) as Message | { message: Message };
        // Handle both flat Message and nested { message: Message } formats
        const newMessage = 'message' in rawMessage ? rawMessage.message : rawMessage;
        handleMessages([newMessage]);
      } catch (err) {
        console.error('ChatMessageParseError', err);
      }
    });

    eventSource.onerror = (err) => {
      console.error('Connection lost. Re-authenticating...', err);
      eventSource.close();
      // Trigger reconnection by resetting session and potentially retrying
      setSessionId(null);
      // Optional: Add a small delay or just let the user effect handle it
      // Since we need to re-fetch /connect, we need to trigger the first effect.
      // We can do this by forcing a dependency update.
      setRetryCount((prev) => prev + 1);
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      // Reset messages when session changes or disabled
      setMessages([]);
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
