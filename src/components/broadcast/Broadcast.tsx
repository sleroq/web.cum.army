import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import PlayerHeader from '../playerHeader/PlayerHeader';
import { StatusContext } from '../../providers/StatusContext';
import { UsersIcon } from '@heroicons/react/20/solid';
import { SITE_NAME } from '../../config/site';
import { getRtcConfiguration, waitForIceGatheringComplete } from '../../config/webrtc';

const ICE_GATHERING_TIMEOUT = 2000;
const STATS_INTERVAL_CONNECTED = 15_000;
const STATS_INTERVAL_DISCONNECTED = 2_500;

const mediaOptions = {
  audio: true,
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
};

enum ErrorMessageEnum {
  NoMediaDevices,
  NotAllowedError,
  NotFoundError,
}

function getMediaErrorMessage(value: ErrorMessageEnum): string {
  switch (value) {
    case ErrorMessageEnum.NoMediaDevices:
      return `MediaDevices API was not found. Publishing in ${SITE_NAME} requires HTTPS 👮`;
    case ErrorMessageEnum.NotFoundError:
      return `Seems like you don't have camera 😭 Or you just blocked access to it...\nCheck camera settings, browser permissions and system permissions.`;
    case ErrorMessageEnum.NotAllowedError:
      return `You can't publish stream using your camera, because you have blocked access to it 😞`;
    default:
      return 'Could not access your media device';
  }
}

function BrowserBroadcaster() {
  const location = useLocation();
  const navigate = useNavigate();
  const streamKey = location.pathname.split('/').pop();
  const { streamStatus } = useContext(StatusContext);
  const [mediaAccessError, setMediaAccessError] = useState<ErrorMessageEnum | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [useDisplayMedia, setUseDisplayMedia] = useState<'Screen' | 'Webcam' | 'None'>('None');
  const [peerConnectionDisconnected, setPeerConnectionDisconnected] = useState(false);
  const [hasPacketLoss, setHasPacketLoss] = useState<boolean>(false);
  const [hasSignal, setHasSignal] = useState<boolean>(false);
  const [connectFailed, setConnectFailed] = useState<boolean>(false);

  const currentViewersCount = useMemo(() => {
    if (!streamKey || !streamStatus) {
      return 0;
    }
    const sessions = streamStatus.filter((session) => session.streamKey === streamKey);
    return sessions.length !== 0 ? sessions[0].whepSessions.length : 0;
  }, [streamKey, streamStatus]);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasSignalRef = useRef<boolean>(false);
  const badSignalCountRef = useRef<number>(10);

  const apiPath = import.meta.env.VITE_API_PATH;

  const endStream = () => {
    navigate('/');
  };

  useEffect(() => {
    if (useDisplayMedia === 'None') {
      return;
    }

    peerConnectionRef.current = new RTCPeerConnection(getRtcConfiguration());

    let stream: MediaStream | undefined = undefined;
    let cancelled = false;

    if (!navigator.mediaDevices) {
      Promise.resolve().then(() => {
        setMediaAccessError(ErrorMessageEnum.NoMediaDevices);
        setUseDisplayMedia('None');
      });
      return;
    }

    const isScreenShare = useDisplayMedia === 'Screen';
    const mediaPromise = isScreenShare
      ? navigator.mediaDevices.getDisplayMedia(mediaOptions)
      : navigator.mediaDevices.getUserMedia(mediaOptions);

    mediaPromise.then(
      (mediaStream) => {
        if (peerConnectionRef.current?.connectionState === 'closed') {
          mediaStream.getTracks().forEach((mediaStreamTrack) => mediaStreamTrack.stop());

          return;
        }

        stream = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        mediaStream.getTracks().forEach((mediaStreamTrack) => {
          if (mediaStreamTrack.kind === 'audio') {
            peerConnectionRef.current?.addTransceiver(mediaStreamTrack, {
              direction: 'sendonly',
            });
          } else {
            peerConnectionRef.current?.addTransceiver(mediaStreamTrack, {
              direction: 'sendonly',
              sendEncodings: isScreenShare
                ? []
                : [
                    {
                      rid: 'high',
                    },
                    {
                      rid: 'med',
                      scaleResolutionDownBy: 2.0,
                    },
                    {
                      rid: 'low',
                      scaleResolutionDownBy: 4.0,
                    },
                  ],
            });
          }
        });

        peerConnectionRef.current!.oniceconnectionstatechange = () => {
          if (
            peerConnectionRef.current?.iceConnectionState === 'connected' ||
            peerConnectionRef.current?.iceConnectionState === 'completed'
          ) {
            setPublishSuccess(true);
            setMediaAccessError(null);
            setPeerConnectionDisconnected(false);
          } else if (
            peerConnectionRef.current?.iceConnectionState === 'disconnected' ||
            peerConnectionRef.current?.iceConnectionState === 'failed'
          ) {
            setPublishSuccess(false);
            setPeerConnectionDisconnected(true);
          }
        };

        const connect = async () => {
          try {
            const peerConnection = peerConnectionRef.current;
            if (!peerConnection) {
              return;
            }

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            await waitForIceGatheringComplete(peerConnection, ICE_GATHERING_TIMEOUT);

            const offerSdp = peerConnection.localDescription?.sdp;
            if (!offerSdp) {
              throw new DOMException('Missing localDescription SDP');
            }

            const r = await fetch(`${apiPath}/whip`, {
              method: 'POST',
              body: offerSdp,
              headers: {
                Authorization: `Bearer ${streamKey}`,
                'Content-Type': 'application/sdp',
              },
            });

            if (cancelled) {
              return;
            }

            setConnectFailed(r.status !== 201);
            if (r.status !== 201) {
              throw new DOMException('WHIP endpoint did not return 201');
            }

            const answer = await r.text();
            await peerConnection.setRemoteDescription({
              sdp: answer,
              type: 'answer',
            });
          } catch (err) {
            console.error('WHIP Error', err);
          }
        };

        void connect();
      },
      (reason: ErrorMessageEnum) => {
        setMediaAccessError(reason);
        setUseDisplayMedia('None');
      }
    );

    return () => {
      cancelled = true;
      peerConnectionRef.current?.close();
      if (stream) {
        stream.getTracks().forEach((streamTrack: MediaStreamTrack) => streamTrack.stop());
      }
    };
  }, [videoRef, useDisplayMedia, location.pathname, apiPath, connectFailed, streamKey]);

  useEffect(() => {
    hasSignalRef.current = hasSignal;

    const intervalHandler = () => {
      let senderHasPacketLoss = false;
      peerConnectionRef.current?.getSenders().forEach((sender) => {
        if (sender) {
          sender.getStats().then((stats) => {
            stats.forEach((report) => {
              if (report.type === 'outbound-rtp') {
                senderHasPacketLoss = report.totalPacketSendDelay > 10;
              }
              if (report.type === 'candidate-pair') {
                const signalIsValid = report.availableIncomingBitrate !== undefined;
                badSignalCountRef.current = signalIsValid ? 0 : badSignalCountRef.current + 1;

                if (badSignalCountRef.current > 2) {
                  setHasSignal(false);
                } else if (badSignalCountRef.current === 0 && !hasSignalRef.current) {
                  setHasSignal(true);
                }
              }
            });
          });
        }
      });

      setHasPacketLoss(senderHasPacketLoss);
    };

    const interval = setInterval(
      intervalHandler,
      hasSignal ? STATS_INTERVAL_CONNECTED : STATS_INTERVAL_DISCONNECTED
    );

    return () => {
      clearInterval(interval);
    };
  }, [hasSignal]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-6 md:py-10">
      <div className="flex flex-col items-center gap-6 md:gap-8">
        <div className="w-full max-w-[1200px] flex items-baseline justify-between">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
            Broadcasting{' '}
            <code className="font-mono bg-foreground/10 px-1.5 py-0.5 rounded text-brand-hover">
              {streamKey}
            </code>{' '}
            <span className="text-brand">•</span>
          </h1>
        </div>

        {mediaAccessError != null && (
          <PlayerHeader headerType={'Error'}>
            {' '}
            {getMediaErrorMessage(mediaAccessError)}{' '}
          </PlayerHeader>
        )}
        {peerConnectionDisconnected && (
          <PlayerHeader headerType={'Error'}>
            {' '}
            WebRTC has disconnected or failed to connect at all 😭{' '}
          </PlayerHeader>
        )}
        {connectFailed && (
          <PlayerHeader headerType={'Error'}> Failed to start {SITE_NAME} session 👮 </PlayerHeader>
        )}
        {hasPacketLoss && (
          <PlayerHeader headerType={'Warning'}> WebRTC is experiencing packet loss</PlayerHeader>
        )}
        {publishSuccess && (
          <PlayerHeader headerType={'Success'}>
            {' '}
            Live: Currently streaming to{' '}
            <a
              href={window.location.href.replace('publish/', '')}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              {window.location.href.replace('publish/', '')}
            </a>{' '}
          </PlayerHeader>
        )}

        <div className="w-full max-w-[1200px] rounded-xl overflow-hidden bg-surface ring-1 ring-border shadow-[0_20px_60px_var(--color-shadow)]">
          <video ref={videoRef} autoPlay muted controls playsInline className="w-full h-full" />
        </div>

        <div className="w-full max-w-[1200px] flex flex-col gap-4">
          <div className="flex justify-end">
            <div className="flex flex-row items-center gap-1 text-sm text-muted">
              <UsersIcon className="size-4" />
              {currentViewersCount}
            </div>
          </div>

          <div className="flex flex-row gap-2">
            <button
              onClick={() => setUseDisplayMedia('Screen')}
              className="appearance-none border w-full py-2 px-3 leading-tight focus:outline-hidden focus:shadow-outline bg-brand hover:bg-brand-hover border-border text-white rounded-lg shadow-md placeholder-muted font-semibold"
            >
              Publish Screen/Window/Tab
            </button>
            <button
              onClick={() => setUseDisplayMedia('Webcam')}
              className="appearance-none border w-full py-2 px-3 leading-tight focus:outline-hidden focus:shadow-outline bg-brand hover:bg-brand-hover border-border text-white rounded-lg shadow-md placeholder-muted font-semibold"
            >
              Publish Webcam
            </button>
          </div>

          {publishSuccess && (
            <div>
              <button
                onClick={endStream}
                className="appearance-none border w-full py-2 px-3 leading-tight focus:outline-hidden focus:shadow-outline bg-surface hover:bg-input border-border text-foreground rounded-lg shadow-md placeholder-muted font-semibold"
              >
                End stream
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BrowserBroadcaster;
