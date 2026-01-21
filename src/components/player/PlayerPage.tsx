import React, { useState } from 'react';
import Player from './Player';
import ModalTextInput from '../shared/ModalTextInput';
import { useCinemaMode } from '../../providers/CinemaModeContext';

const PlayerPage = () => {
  const { cinemaMode } = useCinemaMode();

  const [streamKeys, setStreamKeys] = useState<string[]>([window.location.pathname.substring(1)]);
  const [isModalOpen, setIsModelOpen] = useState<boolean>(false);

  const addStream = (streamKey: string) => {
    if (streamKeys.some((key: string) => key.toLowerCase() === streamKey.toLowerCase())) {
      return;
    }
    setStreamKeys((prev) => [...prev, streamKey]);
    setIsModelOpen((prev) => !prev);
  };

  const removeStream = (index: number) => {
    setStreamKeys((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-background text-foreground">
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

      <div
        className={`mx-auto transition-all duration-300 ${
          cinemaMode ? 'max-w-full px-0 py-0' : 'max-w-[1400px] px-4 md:px-8 py-6 md:py-10'
        }`}
      >
        <div className="flex flex-col items-center gap-6 md:gap-8">
          {!cinemaMode && (
            <div
              className={`w-full flex items-baseline justify-between transition-all duration-300 ${
                cinemaMode ? 'max-w-full' : 'max-w-[1200px]'
              }`}
            >
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                Welcome to{' '}
                <code className="font-mono bg-foreground/10 px-1.5 py-0.5 rounded text-brand-hover">
                  {streamKeys[0]}
                </code>{' '}
                stream <span className="text-brand">•</span>
              </h1>
              <span className="text-sm text-muted">
                {streamKeys.length} stream{streamKeys.length === 1 ? '' : 's'}
              </span>
            </div>
          )}

          <div
            className={
              `grid w-full grid-cols-1 gap-3 md:gap-4 transition-all duration-300 ` +
              `${streamKeys.length === 1 && !cinemaMode ? 'max-w-[1200px]' : ''} ` +
              `${streamKeys.length === 1 && cinemaMode ? 'max-w-full' : ''} ` +
              `${streamKeys.length !== 1 ? 'md:grid-cols-2' : ''}`
            }
          >
            {streamKeys.map((streamKey, index) => (
              <div
                key={`${streamKey}_frame`}
                className={`rounded-xl overflow-hidden bg-surface ring-1 ring-border shadow-[0_20px_60px_rgba(0,0,0,0.55)] ${
                  cinemaMode ? 'rounded-none ring-0 shadow-none' : ''
                }`}
              >
                <Player
                  streamKey={streamKey}
                  canClose={index > 0}
                  onClose={() => removeStream(index)}
                />
              </div>
            ))}
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
                  onClick={() => setIsModelOpen((prev) => !prev)}
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
