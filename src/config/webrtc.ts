interface WebRtcEnv {
  VITE_ICE_SERVERS?: string;
}

const DEFAULT_ICE_SERVER_URLS = ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'];

const parseIceServerUrls = (raw: string | undefined): string[] => {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return DEFAULT_ICE_SERVER_URLS;
  }

  const urls = trimmed
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);

  return urls.length > 0 ? urls : DEFAULT_ICE_SERVER_URLS;
};

export const getRtcConfiguration = (): RTCConfiguration => {
  const env = import.meta.env as unknown as WebRtcEnv;
  const urls = parseIceServerUrls(env.VITE_ICE_SERVERS);

  return {
    iceServers: urls.map((url) => ({ urls: url })),
  };
};

export const waitForIceGatheringComplete = async (
  peerConnection: RTCPeerConnection,
  timeoutMs: number
): Promise<void> => {
  if (peerConnection.iceGatheringState === 'complete') {
    return;
  }

  await new Promise<void>((resolve) => {
    let resolved = false;

    const done = () => {
      if (resolved) return;
      resolved = true;
      peerConnection.removeEventListener('icegatheringstatechange', onStateChange);
      resolve();
    };

    const onStateChange = () => {
      if (peerConnection.iceGatheringState === 'complete') {
        done();
      }
    };

    peerConnection.addEventListener('icegatheringstatechange', onStateChange);
    window.setTimeout(done, timeoutMs);
  });
};
