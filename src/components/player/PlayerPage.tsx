import React, { useState } from 'react';
import Player from './Player';
import ModalTextInput from '../shared/ModalTextInput';
import { useCinemaMode } from '../../providers/CinemaModeContext';
import ChatPanel from './components/ChatPanel';

const PlayerPage = () => {
  const { cinemaMode } = useCinemaMode();

  const [streamKeys, setStreamKeys] = useState<string[]>([window.location.pathname.substring(1)]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(() => {
    return localStorage.getItem('chat-open') !== 'false';
  });

  const addStream = (streamKey: string) => {
    if (streamKeys.some((key: string) => key.toLowerCase() === streamKey.toLowerCase())) {
      return;
    }
    setStreamKeys((prev) => [...prev, streamKey]);
    setIsModalOpen((prev) => !prev);
  };

  const removeStream = (index: number) => {
    setStreamKeys((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleChat = () => {
    setIsChatOpen((prev) => {
      const next = !prev;
      localStorage.setItem('chat-open', next ? 'true' : 'false');
      return next;
    });
  };

  const isSingleStream = streamKeys.length === 1;

  return (
    <div className="bg-background text-foreground">
      {isModalOpen && (
        <ModalTextInput<string>
          title="Add stream"
          message={'Insert stream key to add to multi stream'}
          isOpen={isModalOpen}
          canCloseOnBackgroundClick={false}
          onClose={() => setIsModalOpen(false)}
          onAccept={(result: string) => addStream(result)}
        />
      )}

      <div
        className={`mx-auto transition-all duration-300 ${
          cinemaMode ? 'max-w-full px-0 py-0' : 'max-w-[1600px] px-2 sm:px-4 md:px-6 py-4 md:py-10'
        }`}
      >
        <div className="flex flex-col items-center gap-6 md:gap-8">
          {!cinemaMode && (
            <div
              className={`w-full flex items-baseline justify-between transition-all duration-300 ${
                cinemaMode ? 'max-w-full' : 'max-w-full'
              }`}
            >
              <div className="flex items-center gap-4">
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                  Welcome to{' '}
                  <code className="font-mono bg-foreground/10 px-1.5 py-0.5 rounded text-brand-hover">
                    {streamKeys[0]}
                  </code>{' '}
                  stream <span className="text-brand">•</span>
                </h1>
              </div>
              <span className="text-sm text-muted">
                {streamKeys.length} stream{streamKeys.length === 1 ? '' : 's'}
              </span>
            </div>
          )}

          <div
            className={
              `w-full transition-all duration-300 ` +
              `${isSingleStream && !cinemaMode ? 'max-w-[1200px]' : ''} ` +
              `${isSingleStream && cinemaMode ? 'max-w-full' : ''} `
            }
          >
            {isSingleStream ? (
              <div
                className={`flex flex-col lg:flex-row ${cinemaMode || !isChatOpen ? 'gap-0' : 'gap-4'} w-full items-start`}
              >
                <div
                  className={`flex-1 w-full overflow-hidden bg-surface transition-all duration-300 relative bg-clip-padding ${
                    cinemaMode
                      ? 'rounded-none border-0 shadow-none'
                      : 'rounded-xl border border-border shadow-[0_20px_60px_var(--color-shadow)]'
                  }`}
                >
                  <Player
                    streamKey={streamKeys[0]}
                    canClose={false}
                    onClose={() => removeStream(0)}
                    isChatOpen={isChatOpen}
                    onToggleChat={toggleChat}
                  />
                </div>
                <div
                  className={`transition-all duration-300 overflow-hidden shrink-0 bg-surface bg-clip-padding ${
                    isChatOpen
                      ? 'w-full lg:w-80 h-[500px] lg:h-(--player-height,0px) opacity-100'
                      : 'w-0 h-0 opacity-0'
                  } ${
                    cinemaMode || !isChatOpen
                      ? 'rounded-none border-0 shadow-none'
                      : 'rounded-xl border border-border shadow-[0_20px_60px_var(--color-shadow)]'
                  }`}
                >
                  <ChatPanel streamKey={streamKeys[0]} variant="sidebar" isOpen={isChatOpen} />
                </div>
              </div>
            ) : (
              <div
                className={`grid w-full grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 transition-all duration-300`}
              >
                {streamKeys.map((streamKey, index) => (
                  <div
                    key={`${streamKey}_frame`}
                    className={`flex flex-col overflow-hidden bg-surface transition-all duration-300 bg-clip-padding ${
                      cinemaMode
                        ? 'rounded-none border-0 shadow-none'
                        : 'rounded-xl border border-border shadow-[0_20px_60px_var(--color-shadow)]'
                    }`}
                  >
                    <Player
                      streamKey={streamKey}
                      canClose={index > 0}
                      onClose={() => removeStream(index)}
                      isChatOpen={isChatOpen}
                      onToggleChat={toggleChat}
                    />
                    <ChatPanel streamKey={streamKey} variant="below" isOpen={isChatOpen} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          {!cinemaMode && (
            <div className="w-full max-w-[800px] mt-2">
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  className={
                    'px-4 py-2 text-sm ' +
                    'rounded-lg font-semibold bg-foreground/10 hover:bg-foreground/15 border border-border text-foreground ' +
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ' +
                    'focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                  }
                  onClick={() => setIsModalOpen((prev) => !prev)}
                >
                  Add stream
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerPage;
