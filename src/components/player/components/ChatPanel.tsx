import React, { useEffect, useRef, useState } from 'react';
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, UserIcon } from '@heroicons/react/20/solid';
import { useChatSession } from '../../../hooks/useChatSession';
import ModalTextInput from '../../shared/ModalTextInput';

interface ChatPanelProps {
  streamKey: string;
  variant?: 'sidebar' | 'below';
  isOpen: boolean;
  cinemaMode?: boolean;
}

const getUsernameColor = (username: string) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 80%, 75%)`;
};

const ChatPanel = ({
  streamKey,
  variant = 'sidebar',
  isOpen,
  cinemaMode = false,
}: ChatPanelProps) => {
  const [displayName, setDisplayName] = useState<string>(() => {
    return localStorage.getItem('chatDisplayName') || '';
  });
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);

  const { messages, status, error, sendMessage } = useChatSession({
    streamKey,
    enabled: isOpen,
    displayName,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      const container = scrollRef.current;
      if (container) {
        // Only auto-scroll if user is already near bottom
        const isNearBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (isNearBottom || lastMessageCountRef.current === 0) {
          container.scrollTop = container.scrollHeight;
        }
      }
    }
    lastMessageCountRef.current = messages.length;
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isSending) return;

    if (!displayName) {
      setIsNameModalOpen(true);
      return;
    }

    setIsSending(true);
    try {
      await sendMessage(inputText.trim());
      setInputText('');
    } catch {
      // Error handled by hook/console
    } finally {
      setIsSending(false);
    }
  };

  const handleNameAccept = (name: string) => {
    const trimmed = name.trim();
    if (trimmed) {
      setDisplayName(trimmed);
      localStorage.setItem('chatDisplayName', trimmed);
      setIsNameModalOpen(false);
    }
  };

  const isSidebar = variant === 'sidebar';

  return (
    <>
      {isNameModalOpen && (
        <ModalTextInput
          title="Set Display Name"
          message="Choose a name to show in chat"
          isOpen={isNameModalOpen}
          onClose={() => setIsNameModalOpen(false)}
          onAccept={handleNameAccept}
          initialValue={displayName}
        />
      )}

      <div
        className={`flex flex-col bg-surface border-border transition-all duration-300 overflow-hidden h-full bg-clip-padding ${
          isSidebar
            ? `w-full ${
                isOpen
                  ? `opacity-100 ${
                      cinemaMode
                        ? 'rounded-none border-y-0 border-r-0 border-l border-border shadow-none'
                        : 'rounded-xl border border-border shadow-[0_20px_60px_rgba(0,0,0,0.55)]'
                    }`
                  : 'opacity-0'
              }`
            : `w-full border-t ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-foreground/5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="size-4 text-brand" />
            <span className="text-sm font-semibold">Chat</span>
            <div
              className={`size-2 rounded-full ${
                status === 'connected'
                  ? 'bg-green-500'
                  : status === 'connecting'
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-red-500'
              }`}
            />
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-border"
        >
          {messages.length === 0 && status === 'connected' && (
            <p className="text-center text-muted text-xs italic mt-4">
              No messages yet. Say hello!
            </p>
          )}
          {error && <p className="text-center text-red-500 text-xs mt-4">{error}</p>}
          {messages.map((m) => (
            <div key={m.id} className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-xs font-bold truncate max-w-[120px]"
                  style={{ color: getUsernameColor(m.displayName) }}
                >
                  {m.displayName}
                </span>
                <span className="text-[10px] text-muted">
                  {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-foreground break-words">{m.text}</p>
            </div>
          ))}
        </div>

        {/* Composer */}
        <form
          onSubmit={handleSend}
          className="p-3 bg-foreground/5 border-t border-border flex gap-2 shrink-0"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={displayName ? 'Send a message...' : 'Set name to chat'}
              maxLength={2000}
              className="w-full bg-input border border-border rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand/50 placeholder:text-muted"
            />
            {inputText.length > 1800 && (
              <span className="absolute right-10 bottom-full mb-1 text-[10px] text-muted bg-surface px-1 rounded border border-border">
                {inputText.length}/2000
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsNameModalOpen(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-brand transition-colors"
              title="Change display name"
            >
              <UserIcon className="size-4" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!inputText.trim() || isSending || status !== 'connected'}
            className="p-2 bg-brand hover:bg-brand-hover disabled:bg-muted/20 disabled:text-muted text-white rounded-lg transition-colors shrink-0"
          >
            <PaperAirplaneIcon className="size-4" />
          </button>
        </form>
      </div>
    </>
  );
};

export default ChatPanel;
