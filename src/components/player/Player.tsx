import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowsPointingOutIcon,
  PauseIcon,
  PlayIcon,
  Square2StackIcon,
  RectangleStackIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/16/solid';
import VolumeComponent from './components/VolumeComponent';
import PlayPauseComponent from './components/PlayPauseComponent';
import QualitySelectorComponent from './components/QualitySelectorComponent';
import CurrentViewersComponent from './components/CurrentViewersComponent';
import LatencyComponent from './components/LatencyComponent';
import VideoHealthComponent from './components/VideoHealthComponent';
import Tooltip from '../shared/Tooltip';
import { useVideoAutoplay } from '../../hooks/useVideoAutoplay';
import { SITE_NAME } from '../../config/site';
import { useCinemaMode } from '../../providers/CinemaModeContext';
import { useSettings } from '../../providers/SettingsContext';
import { useWebRTCPlayer } from '../../hooks/useWebRTCPlayer';
import { useOverlayVisibility } from '../../hooks/useOverlayVisibility';
import { usePlayerInteraction } from '../../hooks/usePlayerInteraction';

interface PlayerProps {
  streamKey: string;
  canClose?: boolean;
  onClose?: () => void;
  isChatOpen?: boolean;
  onToggleChat?: () => void;
}

const Player = (props: PlayerProps) => {
  const { cinemaMode, toggleCinemaMode } = useCinemaMode();
  const { pauseOnClick } = useSettings();

  const { streamKey, canClose, onClose, isChatOpen, onToggleChat } = props;
  const streamVideoPlayerId = streamKey + '_videoPlayer';

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Hooks
  const {
    videoLayers,
    hasSignal,
    layerEndpoint,
    hasPacketLoss,
    latency,
    fps,
    droppedFrames,
    connectFailed,
    currentLayer,
    setCurrentLayer,
  } = useWebRTCPlayer({ videoRef, streamKey });

  const { videoOverlayVisible, registerOverlayContainer } = useOverlayVisibility();

  const { activeAction, handleVideoPlayerClick, handleVideoPlayerDoubleClick } =
    usePlayerInteraction({
      videoRef,
      pauseOnClick,
    });

  const { showPlayButton, handlePlayButtonClick } = useVideoAutoplay(videoRef, {
    preferSound: true,
    maxRetries: 3,
    retryDelays: [0, 500, 1500],
  });

  // Resize observer
  useEffect(() => {
    const updateHeight = () => {
      const player = document.getElementById(streamVideoPlayerId);
      if (player) {
        player.parentElement?.parentElement?.style.setProperty(
          '--player-height',
          `${player.offsetHeight}px`
        );
      }
    };

    const resizeObserver = new ResizeObserver(updateHeight);
    const player = document.getElementById(streamVideoPlayerId);
    if (player) {
      resizeObserver.observe(player);
      updateHeight();
    }

    return () => resizeObserver.disconnect();
  }, [streamVideoPlayerId]);

  // Sync muted state with video element
  useEffect(() => {
    const video = videoRef.current;
    if (video && video.muted !== isMuted) {
      video.muted = isMuted;
    }
  }, [isMuted]);

  // Register overlay container
  useEffect(() => {
    const player = document.getElementById(streamVideoPlayerId);
    const cleanup = registerOverlayContainer(player);
    return cleanup;
  }, [streamVideoPlayerId, registerOverlayContainer]);

  // Volume change listener
  useEffect(() => {
    const videoEl = videoRef.current;
    const handleVolumeChange = () => {
      if (videoEl) {
        setIsMuted(videoEl.muted);
      }
    };

    if (videoEl) {
      videoEl.addEventListener('volumechange', handleVolumeChange);
    }

    return () => {
      if (videoEl) {
        videoEl.removeEventListener('volumechange', handleVolumeChange);
      }
    };
  }, []);

  return (
    <div id={streamVideoPlayerId} className="block w-full relative z-0">
      {connectFailed && (
        <p className={`bg-red-700 text-white text-lg text-center p-4 whitespace-pre-wrap`}>
          Failed to start {SITE_NAME} session 👮{' '}
        </p>
      )}
      <div
        onClick={handleVideoPlayerClick}
        onDoubleClick={handleVideoPlayerDoubleClick}
        className={`
          absolute
          w-full
          h-full
          z-10
          transition-all duration-300
          ${!hasSignal && 'bg-surface'}
          ${
            hasSignal &&
            `
            ${!videoOverlayVisible ? 'cursor-none' : 'cursor-default'}
          `
          }
        `}
      >
        {/*Opaque background*/}
        <div
          className={`absolute w-full bg-background ${!hasSignal ? 'opacity-40' : 'opacity-0'} h-full`}
        />

        {/* Chat Toggle Button */}
        {onToggleChat && (
          <div
            className={`absolute top-3 ${canClose ? 'right-14' : 'right-3'} z-30 transition-opacity duration-500 ${
              hasSignal && !videoOverlayVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleChat();
              }}
              onDoubleClick={(e) => e.stopPropagation()}
              className={`p-2 rounded-full backdrop-blur-md text-foreground border border-foreground/10 shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60 ${
                isChatOpen ? 'bg-brand text-white' : 'bg-surface/60 hover:bg-surface/80'
              }`}
              aria-label="Toggle chat"
            >
              <ChatBubbleLeftRightIcon className="size-5" />
            </button>
          </div>
        )}

        {/* Close Button */}
        {canClose && (
          <div
            className={`absolute top-3 right-3 z-30 transition-opacity duration-500 ${
              hasSignal && !videoOverlayVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose?.();
              }}
              onDoubleClick={(e) => e.stopPropagation()}
              className="p-2 rounded-full bg-surface/60 hover:bg-surface/80 backdrop-blur-md text-foreground border border-foreground/10 shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
              aria-label="Close stream"
            >
              <XMarkIcon className="size-5" />
            </button>
          </div>
        )}

        {/*Buttons */}
        <div className="absolute bottom-0 w-full flex z-20">
          <div
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            className={`bg-surface/60 backdrop-blur-md transition-all duration-500 ${
              hasSignal && !videoOverlayVisible
                ? 'opacity-0 pointer-events-none'
                : 'opacity-100 pointer-events-auto'
            } text-foreground w-full flex flex-row items-center gap-1.5 sm:gap-3 ${!cinemaMode ? 'rounded-b-xl' : ''} px-2 sm:px-3 min-h-10 max-h-10 sm:min-h-12 sm:max-h-12 border-t border-foreground/10 [&_svg]:cursor-pointer [&_svg]:size-6! sm:[&_svg]:size-7!`}
          >
            <PlayPauseComponent videoRef={videoRef} />

            <div className="hidden sm:flex">
              <VolumeComponent
                isMuted={isMuted}
                onVolumeChanged={(newValue) => {
                  if (videoRef.current) videoRef.current.volume = newValue;
                }}
                onStateChanged={(newState) => {
                  setIsMuted(newState);
                  if (videoRef.current) videoRef.current.muted = newState;
                }}
              />
            </div>

            <div className="flex-1"></div>

            {hasSignal && (
              <>
                <VideoHealthComponent fps={fps} dropped={droppedFrames} />
                <LatencyComponent latency={latency} />
                <CurrentViewersComponent streamKey={streamKey} />
              </>
            )}
            {videoLayers.length > 1 && (
              <QualitySelectorComponent
                layers={videoLayers}
                layerEndpoint={layerEndpoint}
                hasPacketLoss={hasPacketLoss}
                currentLayer={currentLayer}
                onLayerSelect={setCurrentLayer}
              />
            )}
            <div className="hidden sm:block">
              <Tooltip text="Cinema Mode">
                <RectangleStackIcon
                  className={cinemaMode ? 'text-brand' : 'text-foreground'}
                  onClick={toggleCinemaMode}
                />
              </Tooltip>
            </div>
            <div className="hidden sm:block">
              <Tooltip text="Picture-in-Picture">
                <Square2StackIcon onClick={() => videoRef.current?.requestPictureInPicture()} />
              </Tooltip>
            </div>
            <Tooltip text="Fullscreen">
              <ArrowsPointingOutIcon onClick={() => videoRef.current?.requestFullscreen()} />
            </Tooltip>
          </div>
        </div>

        {showPlayButton && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePlayButtonClick();
              }}
              onDoubleClick={(e) => e.stopPropagation()}
              className={
                `pointer-events-auto bg-surface/60 hover:bg-surface/70 backdrop-blur-md transition-opacity duration-500 ${
                  hasSignal && !videoOverlayVisible ? 'opacity-0' : 'opacity-100'
                } text-foreground ` +
                'rounded-full w-16 h-16 flex items-center justify-center shadow-lg shadow-black/30 border border-foreground/10 ' +
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40'
              }
            >
              <PlayIcon className="size-8!" />
            </button>
          </div>
        )}

        {activeAction && (
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            <div
              className="bg-black/50 rounded-full p-4 animate-ping"
              style={{ animationIterationCount: 1, animationDuration: '0.5s' }}
            >
              {activeAction === 'play' ? (
                <PlayIcon className="size-8 text-white" />
              ) : (
                <PauseIcon className="size-8 text-white" />
              )}
            </div>
          </div>
        )}

        {videoLayers.length === 0 && !hasSignal && (
          <h2 className="absolute w-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-light leading-tight text-4xl text-center">
            {props.streamKey} is not currently streaming
          </h2>
        )}
        {videoLayers.length > 0 && !hasSignal && (
          <h2 className="absolute animate-pulse w-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-light leading-tight text-4xl text-center">
            Loading video
          </h2>
        )}
      </div>

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`bg-transparent w-full aspect-video relative block object-contain transition-all duration-300`}
      />
    </div>
  );
};

export default Player;
