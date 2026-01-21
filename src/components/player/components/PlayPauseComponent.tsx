import React, { useSyncExternalStore } from 'react';
import { PauseIcon, PlayIcon } from '@heroicons/react/16/solid';
import Tooltip from '../../shared/Tooltip';

interface PlayPauseComponentProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const PlayPauseComponent = ({ videoRef }: PlayPauseComponentProps) => {
  const isPaused = useSyncExternalStore(
    (callback) => {
      const video = videoRef.current;
      if (!video) return () => {};

      video.addEventListener('playing', callback);
      video.addEventListener('pause', callback);
      video.addEventListener('play', callback);

      return () => {
        video.removeEventListener('playing', callback);
        video.removeEventListener('pause', callback);
        video.removeEventListener('play', callback);
      };
    },
    () => videoRef.current?.paused ?? true
  );

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch((err) => console.error('VideoError', err));
    } else {
      video.pause();
    }
  };

  if (isPaused) {
    return (
      <Tooltip text="Play">
        <PlayIcon
          className="size-12! shrink-0 cursor-pointer text-brand transition-colors hover:text-brand-hover"
          onClick={togglePlay}
        />
      </Tooltip>
    );
  }
  return (
    <Tooltip text="Pause">
      <PauseIcon
        className="size-12! shrink-0 cursor-pointer text-brand transition-colors hover:text-brand-hover"
        onClick={togglePlay}
      />
    </Tooltip>
  );
};

export default PlayPauseComponent;
