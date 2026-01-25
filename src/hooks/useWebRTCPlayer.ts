import { useState, useRef, useEffect, useCallback } from 'react';
import { parseLinkHeader } from '@web3-storage/parse-link-header';
import { getRtcConfiguration, waitForIceGatheringComplete } from '../config/webrtc';

interface UseWebRTCPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  streamKey: string;
}

export const useWebRTCPlayer = ({ videoRef, streamKey }: UseWebRTCPlayerProps) => {
  const apiPath = import.meta.env.VITE_API_PATH;
  const [videoLayers, setVideoLayers] = useState<string[]>([]);
  const [hasSignal, setHasSignal] = useState<boolean>(false);
  const [layerEndpoint, setLayerEndpoint] = useState<string>('');
  const [hasPacketLoss, setHasPacketLoss] = useState<boolean>(false);
  const [latency, setLatency] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);
  const [droppedFrames, setDroppedFrames] = useState<number>(0);
  const [connectFailed, setConnectFailed] = useState<boolean>(false);
  const [currentLayer, setCurrentLayer] = useState<string>('disabled');
  const [reconnectTrigger, setReconnectTrigger] = useState<number>(0);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const attachedStreamIdRef = useRef<string | null>(null);
  const hasSignalRef = useRef<boolean>(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const setHasSignalHandler = useCallback(() => {
    setHasSignal(true);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const handleWindowBeforeUnload = () => {
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
    };

    window.addEventListener('beforeunload', handleWindowBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleWindowBeforeUnload);
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, []);

  // Stats interval
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

      setHasPacketLoss(receiversHasPacketLoss);
      setLatency(currentLatency);
      setFps(currentFps);
      setDroppedFrames(currentDropped);
    };

    const interval = setInterval(intervalHandler, hasSignal ? 2_000 : 2_500);

    return () => clearInterval(interval);
  }, [hasSignal]);

  // Connection logic
  useEffect(() => {
    if (peerConnectionRef.current) {
      // Already initialized? Or should we re-init?
      // The original code re-inits on streamKey change because of the dependency array.
      // But here we might need to be careful.
      // For now, let's assume we create a new one if it's null, or if streamKey changes we might need to cleanup first.
      // The cleanup effect above handles unmount, but we need to handle streamKey change.
    }

    // Close existing connection if any
    peerConnectionRef.current?.close();

    peerConnectionRef.current = new RTCPeerConnection(getRtcConfiguration());

    const triggerReconnect = (delay = 3000) => {
      if (reconnectTimeoutRef.current) return;
      setIsReconnecting(true);
      setHasSignal(false);
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        setReconnectTrigger((prev) => prev + 1);
      }, delay);
    };

    peerConnectionRef.current.onconnectionstatechange = () => {
      const state = peerConnectionRef.current?.connectionState;
      if (state === 'failed' || state === 'disconnected') {
        console.error('WebRTC_ConnectionState', state);
        triggerReconnect();
      } else if (state === 'connected') {
        setIsReconnecting(false);
      }
    };

    peerConnectionRef.current.oniceconnectionstatechange = () => {
      const state = peerConnectionRef.current?.iceConnectionState;
      if (!state) {
        return;
      }

      if (state === 'failed' || state === 'disconnected') {
        console.error('WebRTC_ICEConnectionState', state);
        triggerReconnect();
      }
    };

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

    let cancelled = false;

    const videoElement = videoRef.current;

    const connect = async () => {
      try {
        const peerConnection = peerConnectionRef.current;
        if (!peerConnection) {
          return;
        }

        const offer = await peerConnection.createOffer();
        const sdp = offer.sdp?.replace('useinbandfec=1', 'useinbandfec=1;stereo=1');
        const newOffer: RTCSessionDescriptionInit = { ...offer, sdp };

        await peerConnection.setLocalDescription(newOffer);
        await waitForIceGatheringComplete(peerConnection, 2000);

        const offerSdp = peerConnection.localDescription?.sdp;
        if (!offerSdp) {
          throw new DOMException('Missing localDescription SDP');
        }

        const r = await fetch(`${apiPath}/whep`, {
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
            setVideoLayers(
              parsed['1']['layers'].map((layer: { encodingId: string }) => layer.encodingId)
            );
          }
        });

        eventSourceRef.current = evtSource;

        const answer = await r.text();
        await peerConnection.setRemoteDescription({
          sdp: answer,
          type: 'answer',
        });
      } catch (err) {
        console.error('PeerConnectionError', err);
        triggerReconnect(5000);
      }
    };

    void connect();

    return () => {
      cancelled = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      eventSourceRef.current?.close();
      eventSourceRef.current = null;

      if (videoElement) {
        videoElement.removeEventListener('playing', setHasSignalHandler);
      }
    };
  }, [apiPath, streamKey, setHasSignalHandler, videoRef, reconnectTrigger]);

  return {
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
    isReconnecting,
  };
};
