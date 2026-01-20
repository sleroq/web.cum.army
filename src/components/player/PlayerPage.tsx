import React, { useState } from 'react';
import Player from './Player';
import { useNavigate } from 'react-router-dom';
import ModalTextInput from '../shared/ModalTextInput';

const PlayerPage = () => {
  const [streamKeys, setStreamKeys] = useState<string[]>([window.location.pathname.substring(1)]);
  const [isModalOpen, setIsModelOpen] = useState<boolean>(false);

  const addStream = (streamKey: string) => {
    if (streamKeys.some((key: string) => key.toLowerCase() === streamKey.toLowerCase())) {
      return;
    }
    setStreamKeys((prev) => [...prev, streamKey]);
    setIsModelOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {isModalOpen && (
        <ModalTextInput<string>
          title="Add stream"
          message={'Insert stream key to add to multi stream'}
          isOpen={isModalOpen}
          canCloseOnBackgroundClick={false}
          onClose={() => setIsModelOpen(false)}
          onAccept={(result: string) => addStream(result)}
        />
      )}

      <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-6 md:py-10">
        <div className="flex flex-col items-center gap-6 md:gap-8">
          <div className="w-full max-w-[1200px] flex items-baseline justify-between">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              Player <span className="text-brand">•</span>
            </h1>
            <span className="text-sm text-white/60">
              {streamKeys.length} stream{streamKeys.length === 1 ? '' : 's'}
            </span>
          </div>

          <div
            className={
              `grid w-full grid-cols-1 gap-3 md:gap-4 ` +
              `${streamKeys.length === 1 ? 'max-w-[1200px]' : ''} ` +
              `${streamKeys.length !== 1 ? 'md:grid-cols-2' : ''}`
            }
          >
            {streamKeys.map((streamKey) => (
              <div
                key={`${streamKey}_frame`}
                className="rounded-xl overflow-hidden bg-surface ring-1 ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
              >
                <Player streamKey={streamKey} />
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="w-full max-w-[800px] mt-2">
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                className={
                  'px-4 py-2 text-sm ' +
                  'rounded-lg font-semibold bg-white/10 hover:bg-white/15 border border-white/10 text-white ' +
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ' +
                  'focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                }
                onClick={() => setIsModelOpen((prev) => !prev)}
              >
                Add stream
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerPage;
