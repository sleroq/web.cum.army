import React, { useEffect, useRef, useState } from 'react';
import { parseLinkHeader } from '@web3-storage/parse-link-header';
import { ArrowsPointingOutIcon, PlayIcon, Square2StackIcon } from '@heroicons/react/16/solid';
import VolumeComponent from './components/VolumeComponent';
import PlayPauseComponent from './components/PlayPauseComponent';
import QualitySelectorComponent from './components/QualitySelectorComponent';
import CurrentViewersComponent from './components/CurrentViewersComponent';

interface PlayerProps {
  streamKey: string;
  cinemaMode?: boolean;
}

const Player = (props: PlayerProps) => {
  const apiPath = import.meta.env.VITE_API_PATH;
  const { streamKey } = props;

  const [videoLayers, setVideoLayers] = useState([]);
  const [hasSignal, setHasSignal] = useState<boolean>(false);
  const [hasPacketLoss, setHasPacketLoss] = useState<boolean>(false);
  const [videoOverlayVisible, setVideoOverlayVisible] = useState<boolean>(false);
  const [connectFailed, setConnectFailed] = useState<boolean>(false);
  const [autoplayFailed, setAutoplayFailed] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const attachedStreamIdRef = useRef<string | null>(null);
  const autoplayScheduledRef = useRef<boolean>(false);
  const autoplayScheduleTokenRef = useRef<number>(0);
  const autoplayTimersRef = useRef<number[]>([]);
  const autoplayCleanupRef = useRef<(() => void) | null>(null);
  const layerEndpointRef = useRef<string>('');
  const hasSignalRef = useRef<boolean>(false);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const videoOverlayVisibleTimeoutRef = useRef<number | undefined>(undefined);
  const clickDelay = 250;
  const lastClickTimeRef = useRef(0);
  const clickTimeoutRef = useRef<number | undefined>(undefined);
  const streamVideoPlayerId = streamKey + '_videoPlayer';

  const debugAutoplay = (...args: unknown[]) =>
    console.debug('[PlayerAutoplay]', streamKey, ...args);
  const warnAutoplay = (...args: unknown[]) => console.warn('[PlayerAutoplay]', streamKey, ...args);
  const describeVideoEl = (el: HTMLVideoElement) => ({
    paused: el.paused,
    muted: el.muted,
    volume: el.volume,
    readyState: el.readyState,
    networkState: el.networkState,
    currentTime: el.currentTime,
    hasSrcObject: !!el.srcObject,
  });
  const errInfo = (err: unknown) => {
    if (err instanceof DOMException) {
      return { name: err.name, message: err.message };
    }
    if (err instanceof Error) {
      return { name: err.name, message: err.message };
    }
    return { name: 'unknown', message: String(err) };
  };

  const setHasSignalHandler = (_: Event) => {
    setHasSignal(() => true);
    setAutoplayFailed(() => false);
  };
  const resetTimer = (isVisible: boolean) => {
    setVideoOverlayVisible(() => isVisible);

    if (videoOverlayVisibleTimeoutRef) {
      clearTimeout(videoOverlayVisibleTimeoutRef.current);
    }

    videoOverlayVisibleTimeoutRef.current = setTimeout(() => {
      setVideoOverlayVisible(() => false);
    }, 2500);
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

  const clearAutoplaySchedule = () => {
    debugAutoplay('clearAutoplaySchedule');
    autoplayTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    autoplayTimersRef.current = [];
    autoplayCleanupRef.current?.();
    autoplayCleanupRef.current = null;
  };

  const waitForPlaying = async (timeoutMs: number): Promise<boolean> => {
    const el = videoRef.current;
    if (!el) {
      return false;
    }
    if (!el.paused) {
      return true;
    }

    return await new Promise<boolean>((resolve) => {
      const current = videoRef.current;
      if (!current) {
        resolve(false);
        return;
      }
      let settled = false;
      const done = (value: boolean) => {
        if (settled) {
          return;
        }
        settled = true;
        current.removeEventListener('playing', onPlaying);
        clearTimeout(timerId);
        resolve(value);
      };
      const onPlaying = () => done(true);
      const timerId = window.setTimeout(() => done(!current.paused), timeoutMs);
      current.addEventListener('playing', onPlaying);
    });
  };

  const tryAutoplay = async (preferSound: boolean): Promise<boolean> => {
    const videoEl = videoRef.current;
    if (!videoEl) {
      return false;
    }
    debugAutoplay('tryAutoplay:start', { preferSound, ...describeVideoEl(videoEl) });

    const tryPlay = async (muted: boolean) => {
      videoEl.muted = muted;
      const playPromise = videoEl.play();
      await playPromise;
      const started = await waitForPlaying(500);
      if (!started) {
        throw new Error('play() resolved but video did not start playing');
      }
    };

    try {
      if (preferSound) {
        try {
          debugAutoplay('tryAutoplay:unmuted:attempt', describeVideoEl(videoEl));
          await tryPlay(false);
          debugAutoplay('tryAutoplay:unmuted:success', describeVideoEl(videoEl));
          return true;
        } catch (err) {
          warnAutoplay('tryAutoplay:unmuted:failed', errInfo(err), describeVideoEl(videoEl));
          // fall back to muted autoplay attempt
        }
      }

      debugAutoplay('tryAutoplay:muted:attempt', describeVideoEl(videoEl));
      await tryPlay(true);
      debugAutoplay('tryAutoplay:muted:success', describeVideoEl(videoEl));

      if (!preferSound) {
        return true;
      }

      setTimeout(() => {
        const el = videoRef.current;
        if (!el) {
          return;
        }
        el.muted = false;
        debugAutoplay('tryAutoplay:unmute:attempt', describeVideoEl(el));
        el.play().catch(() => {
          el.muted = true;
          debugAutoplay('tryAutoplay:unmute:rejected', describeVideoEl(el));
        });
      }, 0);

      return true;
    } catch (err) {
      warnAutoplay('tryAutoplay:failed', errInfo(err), describeVideoEl(videoEl));
      return false;
    }
  };

  const scheduleAutoplayAttempts = (preferSound: boolean) => {
    const videoEl = videoRef.current;
    if (!videoEl) {
      return;
    }

    clearAutoplaySchedule();
    setAutoplayFailed(false);
    const scheduleToken = ++autoplayScheduleTokenRef.current;
    debugAutoplay('schedule:start', { scheduleToken, preferSound, ...describeVideoEl(videoEl) });

    const attempt = async (isFinalAttempt: boolean, reason: string) => {
      if (autoplayScheduleTokenRef.current !== scheduleToken) {
        return;
      }
      const el = videoRef.current;
      if (!el || !el.srcObject) {
        debugAutoplay('attempt:skip:no-element-or-srcObject', { scheduleToken, reason });
        return;
      }
      if (!el.paused) {
        debugAutoplay('attempt:skip:already-playing', {
          scheduleToken,
          reason,
          ...describeVideoEl(el),
        });
        setAutoplayFailed(false);
        return;
      }

      debugAutoplay('attempt:start', {
        scheduleToken,
        reason,
        isFinalAttempt,
        ...describeVideoEl(el),
      });
      const ok = await tryAutoplay(preferSound);
      if (autoplayScheduleTokenRef.current !== scheduleToken) {
        return;
      }
      debugAutoplay('attempt:result', { scheduleToken, reason, ok, ...describeVideoEl(el) });
      if (ok) {
        setAutoplayFailed(false);
        return;
      }
      if (isFinalAttempt) {
        debugAutoplay('attempt:final:autoplayFailed=true', {
          scheduleToken,
          reason,
          ...describeVideoEl(el),
        });
        setAutoplayFailed(true);
      }
    };

    const handler = (e: Event) => {
      void attempt(false, e.type);
    };
    videoEl.addEventListener('loadeddata', handler);
    videoEl.addEventListener('canplay', handler);
    autoplayCleanupRef.current = () => {
      videoEl.removeEventListener('loadeddata', handler);
      videoEl.removeEventListener('canplay', handler);
    };

    const delays = [0, 200, 600, 1500];
    delays.forEach((delay, idx) => {
      const timerId = window.setTimeout(() => {
        void attempt(idx === delays.length - 1, `timeout:${delay}`);
      }, delay);
      autoplayTimersRef.current.push(timerId);
    });

    const finalStateTimer = window.setTimeout(() => {
      const el = videoRef.current;
      if (!el || !el.srcObject) {
        return;
      }
      if (autoplayScheduleTokenRef.current !== scheduleToken) {
        return;
      }
      if (el.paused && !hasSignalRef.current) {
        debugAutoplay('deadline:autoplayFailed=true', { scheduleToken, ...describeVideoEl(el) });
        setAutoplayFailed(true);
      }
    }, 2500);
    autoplayTimersRef.current.push(finalStateTimer);
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
      clearAutoplaySchedule();
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
  }, []);

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
      debugAutoplay('ontrack', {
        trackKind: event.track?.kind,
        streamId: stream.id,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
      });

      const isNewStream = attachedStreamIdRef.current !== stream.id;
      if (isNewStream) {
        debugAutoplay('ontrack:new-stream', { streamId: stream.id });
        attachedStreamIdRef.current = stream.id;
        autoplayScheduledRef.current = false;
        setAutoplayFailed(false);
        clearAutoplaySchedule();
      }

      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }

      videoEl.removeEventListener('playing', setHasSignalHandler);
      videoEl.addEventListener('playing', setHasSignalHandler);

      const hasVideo = event.track?.kind === 'video' || stream.getVideoTracks().length > 0;
      if (!autoplayScheduledRef.current && hasVideo) {
        autoplayScheduledRef.current = true;
        debugAutoplay('schedule:trigger', { reason: 'ontrack', hasVideo });
        scheduleAutoplayAttempts(true);
      }
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

          layerEndpointRef.current = `${window.location.protocol}//${parsedLinkHeader['urn:ietf:params:whep:ext:core:layer'].url}`;

          const evtSource = new EventSource(
            `${window.location.protocol}//${parsedLinkHeader['urn:ietf:params:whep:ext:core:server-sent-events'].url}`
          );
          evtSource.onerror = (_) => evtSource.close();

          evtSource.addEventListener('layers', (event) => {
            const parsed = JSON.parse(event.data);
            setVideoLayers(() => parsed['1']['layers'].map((layer: any) => layer.encodingId));
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
  }, [peerConnectionRef]);

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
        {videoRef.current !== null && (
          <div className="absolute bottom-0 w-full flex z-20">
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-surface/60 backdrop-blur-md text-white w-full flex flex-row items-center gap-3 rounded-b-md px-3 py-2 min-h-12 max-h-12 border-t border-white/10 [&_svg]:cursor-pointer [&_svg]:!size-7"
            >
              <PlayPauseComponent videoRef={videoRef} />

              <VolumeComponent
                isMuted={videoRef.current?.muted ?? false}
                onVolumeChanged={(newValue) => (videoRef.current!.volume = newValue)}
                onStateChanged={(newState) => (videoRef.current!.muted = newState)}
              />

              <div className="w-full"></div>

              {hasSignal && <CurrentViewersComponent streamKey={streamKey} />}
              <QualitySelectorComponent
                layers={videoLayers}
                layerEndpoint={layerEndpointRef.current}
                hasPacketLoss={hasPacketLoss}
              />
              <Square2StackIcon onClick={() => videoRef.current?.requestPictureInPicture()} />
              <ArrowsPointingOutIcon onClick={() => videoRef.current?.requestFullscreen()} />
            </div>
          </div>
        )}

        {autoplayFailed && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                debugAutoplay('center-play:click');
                void (async () => {
                  const ok = await tryAutoplay(true);
                  setAutoplayFailed(() => !ok);
                })();
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
