import React, { useCallback, useEffect, useRef, useState, useContext } from 'react';
import { parseLinkHeader } from '@web3-storage/parse-link-header';
import {
  ArrowsPointingOutIcon,
  PauseIcon,
  PlayIcon,
  Square2StackIcon,
  RectangleStackIcon,
} from '@heroicons/react/16/solid';
import VolumeComponent from './components/VolumeComponent';
import PlayPauseComponent from './components/PlayPauseComponent';
import QualitySelectorComponent from './components/QualitySelectorComponent';
import CurrentViewersComponent from './components/CurrentViewersComponent';
import LatencyComponent from './components/LatencyComponent';
import VideoHealthComponent from './components/VideoHealthComponent';
import { useVideoAutoplay } from '../../hooks/useVideoAutoplay';
import { SITE_NAME } from '../../config/site';
import { CinemaModeContext } from '../../providers/CinemaModeProvider';

interface PlayerProps {
  streamKey: string;
}

const Player = (props: PlayerProps) => {
  const cinemaContext = useContext(CinemaModeContext);
  if (!cinemaContext) {
    throw new Error('Player must be used within a CinemaModeProvider');
  }
  const { cinemaMode, toggleCinemaMode } = cinemaContext;

  const apiPath = import.meta.env.VITE_API_PATH;
  const { streamKey } = props;

  const [videoLayers, setVideoLayers] = useState([]);
  const [hasSignal, setHasSignal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [layerEndpoint, setLayerEndpoint] = useState<string>('');
  const [hasPacketLoss, setHasPacketLoss] = useState<boolean>(false);
  const [latency, setLatency] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);
  const [droppedFrames, setDroppedFrames] = useState<number>(0);
  const [videoOverlayVisible, setVideoOverlayVisible] = useState<boolean>(false);
  const [connectFailed, setConnectFailed] = useState<boolean>(false);
  const [activeAction, setActiveAction] = useState<'play' | 'pause' | null>(null);
  const [currentLayer, setCurrentLayer] = useState<string>('disabled');

  const videoRef = useRef<HTMLVideoElement>(null);
  const attachedStreamIdRef = useRef<string | null>(null);

  const actionTimeoutRef = useRef<number | undefined>(undefined);
  const hasSignalRef = useRef<boolean>(false);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const prevStatsRef = useRef<{
    jitterBufferDelay: number;
    jitterBufferEmittedCount: number;
    packetsLost: number;
    packetsReceived: number;
    framesDecoded: number;
    framesDropped: number;
    timestamp: number;
  }>({
    jitterBufferDelay: 0,
    jitterBufferEmittedCount: 0,
    packetsLost: 0,
    packetsReceived: 0,
    framesDecoded: 0,
    framesDropped: 0,
    timestamp: 0,
  });
  const videoOverlayVisibleTimeoutRef = useRef<number | undefined>(undefined);
  const clickDelay = 250;
  const lastClickTimeRef = useRef(0);
  const clickTimeoutRef = useRef<number | undefined>(undefined);
  const streamVideoPlayerId = streamKey + '_videoPlayer';

  // Use the simplified autoplay hook
  const { showPlayButton, handlePlayButtonClick } = useVideoAutoplay(videoRef, {
    preferSound: true,
    maxRetries: 3,
    retryDelays: [0, 500, 1500],
  });

  // Sync muted state with video element
  useEffect(() => {
    const video = videoRef.current;
    if (video && video.muted !== isMuted) {
      video.muted = isMuted;
    }
  }, [isMuted]);

  const resetTimer = (isVisible: boolean) => {
    setVideoOverlayVisible(() => isVisible);

    if (videoOverlayVisibleTimeoutRef) {
      clearTimeout(videoOverlayVisibleTimeoutRef.current);
    }

    videoOverlayVisibleTimeoutRef.current = setTimeout(() => {
      setVideoOverlayVisible(() => false);
    }, 2500);
  };

  const setHasSignalHandler = useCallback(() => {
    setHasSignal(() => true);
  }, []);

  const handleVideoPlayerClick = () => {
    lastClickTimeRef.current = Date.now();

    clickTimeoutRef.current = setTimeout(() => {
      const timeSinceLastClick = Date.now() - lastClickTimeRef.current;
      if (timeSinceLastClick >= clickDelay && timeSinceLastClick - clickDelay < 5000) {
        if (videoRef.current?.paused) {
          videoRef.current.play().catch((err) => console.error('VideoError', err));
        } else {
          videoRef.current?.pause();
        }
      }
    }, clickDelay);
  };
  const handleVideoPlayerDoubleClick = () => {
    clearTimeout(clickTimeoutRef.current);
    lastClickTimeRef.current = 0;
    videoRef.current
      ?.requestFullscreen()
      .catch((err) => console.error('VideoPlayer_RequestFullscreen', err));
  };

  useEffect(() => {
    const handleWindowBeforeUnload = () => {
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
    };

    const handleOverlayTimer = (isVisible: boolean) => resetTimer(isVisible);
    const handleMouseMove = () => handleOverlayTimer(true);
    const handleMouseEnter = () => handleOverlayTimer(true);
    const handleMouseLeave = () => handleOverlayTimer(false);
    const handleMouseUp = () => handleOverlayTimer(true);

    const player = document.getElementById(streamVideoPlayerId);

    player?.addEventListener('mousemove', handleMouseMove);
    player?.addEventListener('mouseenter', handleMouseEnter);
    player?.addEventListener('mouseleave', handleMouseLeave);
    player?.addEventListener('mouseup', handleMouseUp);

    window.addEventListener('beforeunload', handleWindowBeforeUnload);

    peerConnectionRef.current = new RTCPeerConnection();

    const videoEl = videoRef.current;

    const handleVolumeChange = () => {
      if (videoEl) {
        setIsMuted(videoEl.muted);
      }
    };

    const handlePlayPause = (e: Event) => {
      const type = e.type === 'play' ? 'play' : 'pause';
      if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
      setActiveAction(type);
      actionTimeoutRef.current = setTimeout(() => setActiveAction(null), 500);
    };

    if (videoEl) {
      videoEl.addEventListener('volumechange', handleVolumeChange);
      videoEl.addEventListener('play', handlePlayPause);
      videoEl.addEventListener('pause', handlePlayPause);
    }

    return () => {
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;

      if (videoEl) {
        videoEl.removeEventListener('volumechange', handleVolumeChange);
        videoEl.removeEventListener('play', handlePlayPause);
        videoEl.removeEventListener('pause', handlePlayPause);
        videoEl.removeEventListener('playing', setHasSignalHandler);
      }

      player?.removeEventListener('mouseenter', handleMouseEnter);
      player?.removeEventListener('mouseleave', handleMouseLeave);
      player?.removeEventListener('mousemove', handleMouseMove);
      player?.removeEventListener('mouseup', handleMouseUp);

      window.removeEventListener('beforeunload', handleWindowBeforeUnload);

      clearTimeout(videoOverlayVisibleTimeoutRef.current);
    };
  }, [streamVideoPlayerId, setHasSignalHandler]);

  useEffect(() => {
    hasSignalRef.current = hasSignal;

    const intervalHandler = async () => {
      if (!peerConnectionRef.current) {
        return;
      }

      let receiversHasPacketLoss = false;
      let currentLatency = 0;
      let currentFps = 0;
      let currentDropped = 0;

      try {
        const stats = await peerConnectionRef.current.getStats();
        let jitterBufferMs = 0;
        let rttMs = 0;

        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            const dt = (report.timestamp - prevStatsRef.current.timestamp) / 1000;

            const deltaDelay = report.jitterBufferDelay - prevStatsRef.current.jitterBufferDelay;
            const deltaCount =
              report.jitterBufferEmittedCount - prevStatsRef.current.jitterBufferEmittedCount;

            if (deltaCount > 0) {
              jitterBufferMs = (deltaDelay / deltaCount) * 1000;
            }

            const deltaLost = report.packetsLost - prevStatsRef.current.packetsLost;
            const deltaReceived = report.packetsReceived - prevStatsRef.current.packetsReceived;
            const totalPackets = deltaLost + deltaReceived;

            if (totalPackets > 0) {
              const lossRate = deltaLost / totalPackets;
              receiversHasPacketLoss = lossRate > 0.05;
            }

            if (dt > 0) {
              const deltaDecoded = report.framesDecoded - prevStatsRef.current.framesDecoded;
              currentFps = deltaDecoded / dt;
              currentDropped = report.framesDropped - prevStatsRef.current.framesDropped;
            }

            prevStatsRef.current = {
              jitterBufferDelay: report.jitterBufferDelay,
              jitterBufferEmittedCount: report.jitterBufferEmittedCount,
              packetsLost: report.packetsLost,
              packetsReceived: report.packetsReceived,
              framesDecoded: report.framesDecoded,
              framesDropped: report.framesDropped,
              timestamp: report.timestamp,
            };
          }

          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            rttMs = (report.currentRoundTripTime || 0) * 1000;
          }
        });

        currentLatency = jitterBufferMs + rttMs / 2;
      } catch (err) {
        console.error('StatsError', err);
      }

      setHasPacketLoss(() => receiversHasPacketLoss);
      setLatency(() => currentLatency);
      setFps(() => currentFps);
      setDroppedFrames(() => currentDropped);
    };

    const interval = setInterval(intervalHandler, hasSignal ? 2_000 : 2_500);

    return () => clearInterval(interval);
  }, [hasSignal]);

  useEffect(() => {
    if (!peerConnectionRef.current) {
      return;
    }

    peerConnectionRef.current.ontrack = (event: RTCTrackEvent) => {
      const videoEl = videoRef.current;
      if (!videoEl) {
        return;
      }
      const stream = event.streams?.[0];
      if (!stream) {
        return;
      }

      const isNewStream = attachedStreamIdRef.current !== stream.id;
      if (isNewStream) {
        attachedStreamIdRef.current = stream.id;
      }

      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }

      videoEl.removeEventListener('playing', setHasSignalHandler);
      videoEl.addEventListener('playing', setHasSignalHandler);
    };

    peerConnectionRef.current.addTransceiver('audio', { direction: 'recvonly' });
    peerConnectionRef.current.addTransceiver('video', { direction: 'recvonly' });

    peerConnectionRef.current.createOffer().then((offer) => {
      const sdp = offer.sdp?.replace('useinbandfec=1', 'useinbandfec=1;stereo=1');
      const newOffer = { ...offer, sdp };

      peerConnectionRef
        .current!.setLocalDescription(newOffer)
        .catch((err) => console.error('SetLocalDescription', err));

      fetch(`${apiPath}/whep`, {
        method: 'POST',
        body: newOffer.sdp,
        headers: {
          Authorization: `Bearer ${streamKey}`,
          'Content-Type': 'application/sdp',
        },
      })
        .then((r) => {
          setConnectFailed(r.status !== 201);
          if (r.status !== 201) {
            throw new DOMException('WHEP endpoint did not return 201');
          }

          const parsedLinkHeader = parseLinkHeader(r.headers.get('Link'));

          if (parsedLinkHeader === null || parsedLinkHeader === undefined) {
            throw new DOMException('Missing link header');
          }

          const apiProtocol = apiPath.startsWith('http')
            ? new URL(apiPath).protocol
            : window.location.protocol;

          setLayerEndpoint(
            `${apiProtocol}//${parsedLinkHeader['urn:ietf:params:whep:ext:core:layer'].url}`
          );

          const evtSource = new EventSource(
            `${apiProtocol}//${parsedLinkHeader['urn:ietf:params:whep:ext:core:server-sent-events'].url}`
          );
          evtSource.onerror = () => evtSource.close();

          evtSource.addEventListener('layers', (event) => {
            const parsed = JSON.parse(event.data);
            if (parsed?.['1']?.layers) {
              setVideoLayers(() =>
                parsed['1']['layers'].map((layer: { encodingId: string }) => layer.encodingId)
              );
            }
          });
          eventSourceRef.current = evtSource;

          return r.text();
        })
        .then((answer) => {
          peerConnectionRef
            .current!.setRemoteDescription({
              sdp: answer,
              type: 'answer',
            })
            .catch((err) => console.error('RemoteDescription', err));
        })
        .catch((err) => console.error('PeerConnectionError', err));
    });

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [apiPath, streamKey, peerConnectionRef, setHasSignalHandler]);

  return (
    <div id={streamVideoPlayerId} className="block w-full relative z-0">
      {connectFailed && (
        <p className="bg-red-700 text-white text-lg text-center p-4 rounded-t-lg whitespace-pre-wrap">
          Failed to start ${SITE_NAME} session 👮{' '}
        </p>
      )}
      <div
        onClick={handleVideoPlayerClick}
        onDoubleClick={handleVideoPlayerDoubleClick}
        className={`
					absolute
					rounded-md
					w-full
					h-full
					z-10
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

        {/*Buttons */}
        <div className="absolute bottom-0 w-full flex z-20">
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-surface/60 backdrop-blur-md transition-opacity duration-500 ${
              hasSignal && !videoOverlayVisible
                ? 'opacity-0 pointer-events-none'
                : 'opacity-100 pointer-events-auto'
            } text-white w-full flex flex-row items-center gap-3 rounded-b-md px-3 min-h-12 max-h-12 border-t border-white/10 [&_svg]:cursor-pointer [&_svg]:size-7!`}
          >
            <PlayPauseComponent videoRef={videoRef} />

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
            <RectangleStackIcon
              className={cinemaMode ? 'text-brand' : 'text-white'}
              onClick={toggleCinemaMode}
            />
            <Square2StackIcon onClick={() => videoRef.current?.requestPictureInPicture()} />
            <ArrowsPointingOutIcon onClick={() => videoRef.current?.requestFullscreen()} />
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
              className={
                `pointer-events-auto bg-surface/60 hover:bg-surface/70 backdrop-blur-md transition-opacity duration-500 ${
                  hasSignal && !videoOverlayVisible ? 'opacity-0' : 'opacity-100'
                } text-white ` +
                'rounded-full w-16 h-16 flex items-center justify-center shadow-lg shadow-black/30 border border-white/10 ' +
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40'
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
        className="bg-transparent rounded-md w-full aspect-video relative block object-contain"
      />
    </div>
  );
};

export default Player;
