import React, { useSyncExternalStore } from 'react';
import { PauseIcon, PlayIcon } from '@heroicons/react/16/solid';

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
    return <PlayIcon onClick={togglePlay} />;
  }
  return <PauseIcon onClick={togglePlay} />;
};

export default PlayPauseComponent;
