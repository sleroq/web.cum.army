import React, { useEffect, useRef, useState } from 'react';
import { parseLinkHeader } from '@web3-storage/parse-link-header';
import { ArrowsPointingOutIcon, PlayIcon, Square2StackIcon } from '@heroicons/react/16/solid';
import VolumeComponent from './components/VolumeComponent';
import PlayPauseComponent from './components/PlayPauseComponent';
import QualitySelectorComponent from './components/QualitySelectorComponent';
import CurrentViewersComponent from './components/CurrentViewersComponent';
import { useVideoAutoplay } from '../../hooks/useVideoAutoplay';

interface PlayerProps {
  streamKey: string;
  cinemaMode?: boolean;
}

const Player = (props: PlayerProps) => {
  const apiPath = import.meta.env.VITE_API_PATH;
  const { streamKey } = props;

  const [videoLayers, setVideoLayers] = useState([]);
  const [hasSignal, setHasSignal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [layerEndpoint, setLayerEndpoint] = useState<string>('');
  const [hasPacketLoss, setHasPacketLoss] = useState<boolean>(false);
  const [videoOverlayVisible, setVideoOverlayVisible] = useState<boolean>(false);
  const [connectFailed, setConnectFailed] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const attachedStreamIdRef = useRef<string | null>(null);

  const hasSignalRef = useRef<boolean>(false);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
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

  const setHasSignalHandler = () => {
    setHasSignal(() => true);
  };

  const handleVideoPlayerClick = () => {
    lastClickTimeRef.current = Date.now();

    clickTimeoutRef.current = setTimeout(() => {
      const timeSinceLastClick = Date.now() - lastClickTimeRef.current;
      if (timeSinceLastClick >= clickDelay && timeSinceLastClick - clickDelay < 5000) {
        videoRef.current?.paused
          ? videoRef.current?.play().catch((err) => console.error('VideoError', err))
          : videoRef.current?.pause();
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
    const player = document.getElementById(streamVideoPlayerId);

    player?.addEventListener('mousemove', () => handleOverlayTimer(true));
    player?.addEventListener('mouseenter', () => handleOverlayTimer(true));
    player?.addEventListener('mouseleave', () => handleOverlayTimer(false));
    player?.addEventListener('mouseup', () => handleOverlayTimer(true));

    window.addEventListener('beforeunload', handleWindowBeforeUnload);

    peerConnectionRef.current = new RTCPeerConnection();

    return () => {
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;

      videoRef.current?.removeEventListener('playing', setHasSignalHandler);

      player?.removeEventListener('mouseenter', () => handleOverlayTimer);
      player?.removeEventListener('mouseleave', () => handleOverlayTimer);
      player?.removeEventListener('mousemove', () => handleOverlayTimer);
      player?.removeEventListener('mouseup', () => handleOverlayTimer);

      window.removeEventListener('beforeunload', handleWindowBeforeUnload);

      clearTimeout(videoOverlayVisibleTimeoutRef.current);
    };
  }, [streamVideoPlayerId]);

  useEffect(() => {
    hasSignalRef.current = hasSignal;

    const intervalHandler = () => {
      if (!peerConnectionRef.current) {
        return;
      }

      let receiversHasPacketLoss = false;
      peerConnectionRef.current.getReceivers().forEach((receiver) => {
        if (receiver) {
          receiver.getStats().then((stats) => {
            stats.forEach((report) => {
              if (report.type === 'inbound-rtp') {
                const lossRate = report.packetsLost / (report.packetsLost + report.packetsReceived);
                receiversHasPacketLoss = receiversHasPacketLoss ? true : lossRate > 5;
              }
            });
          });
        }
      });

      setHasPacketLoss(() => receiversHasPacketLoss);
    };

    const interval = setInterval(intervalHandler, hasSignal ? 15_000 : 2_500);

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
      offer['sdp'] = offer['sdp']!.replace('useinbandfec=1', 'useinbandfec=1;stereo=1');

      peerConnectionRef
        .current!.setLocalDescription(offer)
        .catch((err) => console.error('SetLocalDescription', err));

      fetch(`${apiPath}/whep`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${streamKey}`,
          'Content-Type': 'application/sdp',
        },
      })
        .then((r) => {
          setConnectFailed(r.status !== 201);
          if (connectFailed) {
            throw new DOMException('WHEP endpoint did not return 201');
          }

          const parsedLinkHeader = parseLinkHeader(r.headers.get('Link'));

          if (parsedLinkHeader === null || parsedLinkHeader === undefined) {
            throw new DOMException('Missing link header');
          }

          setLayerEndpoint(
            `${window.location.protocol}//${parsedLinkHeader['urn:ietf:params:whep:ext:core:layer'].url}`
          );

          const evtSource = new EventSource(
            `${window.location.protocol}//${parsedLinkHeader['urn:ietf:params:whep:ext:core:server-sent-events'].url}`
          );
          evtSource.onerror = () => evtSource.close();

          evtSource.addEventListener('layers', (event) => {
            const parsed = JSON.parse(event.data);
            setVideoLayers(() =>
              parsed['1']['layers'].map((layer: { encodingId: string }) => layer.encodingId)
            );
          });

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
  }, [apiPath, connectFailed, streamKey, peerConnectionRef]);

  return (
    <div id={streamVideoPlayerId} className="block w-full relative z-0">
      {connectFailed && (
        <p className="bg-red-700 text-white text-lg text-center p-4 rounded-t-lg whitespace-pre-wrap">
          Failed to start Broadcast Box session 👮{' '}
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
					${!hasSignal && 'bg-gray-800'}
					${
            hasSignal &&
            `
						transition-opacity
						duration-500
						hover: ${videoOverlayVisible ? 'opacity-100' : 'opacity-0'}
						${!videoOverlayVisible ? 'cursor-none' : 'cursor-default'}
					`
          }
				`}
      >
        {/*Opaque background*/}
        <div
          className={`absolute w-full bg-gray-950 ${!hasSignal ? 'opacity-40' : 'opacity-0'} h-full bg-red-100`}
        />

        {/*Buttons */}
        <div className="absolute bottom-0 w-full flex z-20">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface/60 backdrop-blur-md text-white w-full flex flex-row items-center gap-3 rounded-b-md px-3 py-2 min-h-12 max-h-12 border-t border-white/10 [&_svg]:cursor-pointer [&_svg]:!size-7"
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

            <div className="w-full"></div>

            {hasSignal && <CurrentViewersComponent streamKey={streamKey} />}
            <QualitySelectorComponent
              layers={videoLayers}
              layerEndpoint={layerEndpoint}
              hasPacketLoss={hasPacketLoss}
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
                'pointer-events-auto bg-surface/60 hover:bg-surface/70 backdrop-blur-md text-white ' +
                'rounded-full w-16 h-16 flex items-center justify-center shadow-lg shadow-black/30 border border-white/10 ' +
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40'
              }
            >
              <PlayIcon className="!size-8" />
            </button>
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
        className="bg-transparent rounded-md w-full h-full relative block"
      />
    </div>
  );
};

export default Player;
