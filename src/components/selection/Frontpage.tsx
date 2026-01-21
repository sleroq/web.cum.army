import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvailableStreams from './AvailableStreams';
import { SITE_NAME } from '../../config/site';

const Frontpage = () => {
  const [streamType, setStreamType] = useState<'Watch' | 'Share'>('Watch');
  const [streamKey, setStreamKey] = useState('');
  const [showObsInstructions, setShowObsInstructions] = useState(false);
  const navigate = useNavigate();

  const onStreamClick = () => {
    if (streamKey === '') {
      return;
    }

    if (streamType === 'Share') {
      navigate(`/publish/${streamKey}`);
    }

    if (streamType === 'Watch') {
      navigate(`/${streamKey}`);
    }
  };

  return (
    <div className="space-y-4 mx-auto max-w-2xl pt-20 md:pt-24">
      <div className="rounded-md bg-surface shadow-md p-8">
        <div className="flex items-center gap-3 mb-2">
          <img
            src="/assets/images/icon.png"
            alt={SITE_NAME}
            width={32}
            height={32}
            className="rounded"
          />
          <h2 className="font-light leading-tight text-4xl mt-0">Welcome to {SITE_NAME}</h2>
        </div>
        <p>{SITE_NAME} lets you stream and watch low-latency video in real time using WebRTC.</p>

        <div className="flex rounded-md shadow-xs justify-center mt-6" role="group">
          <button
            type="button"
            onClick={() => setStreamType('Watch')}
            className={`flex items-center px-4 py-2 text-sm font-medium border border-border rounded-s-lg hover:bg-brand-hover hover:text-white focus:ring-brand/40 focus:text-white ${streamType === 'Watch' ? 'bg-brand text-white' : 'text-foreground'}`}
          >
            <svg
              className={`w-6 h-6 ${streamType === 'Watch' ? 'text-white' : 'text-foreground'}`}
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
                d="M4.5 17H4a1 1 0 0 1-1-1 3 3 0 0 1 3-3h1m0-3.05A2.5 2.5 0 1 1 9 5.5M19.5 17h.5a1 1 0 0 0 1-1 3 3 0 0 0-3-3h-1m0-3.05a2.5 2.5 0 1 0-2-4.45m.5 13.5h-7a1 1 0 0 1-1-1 3 3 0 0 1 3-3h3a3 3 0 0 1 3 3 1 1 0 0 1-1 1Zm-1-9.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
              />
            </svg>
            I want to watch
          </button>
          <button
            type="button"
            onClick={() => setStreamType('Share')}
            className={`flex items-center px-4 py-2 text-sm font-medium border border-border rounded-e-lg hover:bg-brand-hover hover:text-white focus:ring-brand/40 focus:text-white ${streamType === 'Share' ? 'bg-brand text-white' : 'text-foreground'}`}
          >
            <svg
              className={`w-6 h-6 ${streamType === 'Share' ? 'text-white' : 'text-foreground'}`}
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14 6H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1Zm7 11-6-2V9l6-2v10Z"
              />
            </svg>
            I want to stream
          </button>
        </div>

        <div className="flex flex-col my-4 justify-center">
          <label className="block text-sm font-bold mb-2" htmlFor="streamKey">
            Stream Key
          </label>

          <input
            className="mb-2 appearance-none border w-full py-2 px-3 leading-tight focus:outline-hidden focus:shadow-outline bg-input border-border text-foreground rounded-sm shadow-md placeholder-muted"
            id="streamKey"
            placeholder={`Insert the key you of the stream you want to ${streamType === 'Share' ? 'share' : 'join'}`}
            type="text"
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                onStreamClick();
              }
            }}
            value={streamKey}
            onChange={(e) => setStreamKey(e.target.value)}
            autoFocus
          />

          <button
            className={`py-2 px-4 ${streamKey.length === 0 ? 'bg-input text-muted' : 'bg-brand text-white'} font-semibold rounded-lg shadow-md ${streamKey.length === 0 ? 'hover:bg-surface' : 'hover:bg-brand-hover'} focus:outline-hidden focus:ring-2 focus:ring-brand/50`}
            disabled={streamKey.length === 0}
            type="button"
            onClick={onStreamClick}
          >
            {streamType === 'Share' ? 'Start stream' : 'Join stream'}
          </button>
        </div>

        {streamType === 'Share' && (
          <div className="mt-8 border border-border rounded-md bg-input/30 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowObsInstructions(!showObsInstructions)}
              className="w-full flex items-center justify-between p-4 hover:bg-input/50 transition-colors"
            >
              <h3 className="text-lg font-bold">You can stream with OBS as well</h3>
              <svg
                className={`w-6 h-6 transition-transform ${showObsInstructions ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {showObsInstructions && (
              <div className="p-6 pt-0 space-y-4 text-sm border-t border-border/50">
                <br />
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>
                    Open <strong>Settings</strong> in OBS
                  </li>
                  <li>
                    Navigate to the <strong>Stream</strong> tab
                  </li>
                  <li>
                    Select <strong>WHIP</strong> as the Service
                  </li>
                  <li>
                    Set Server to:{' '}
                    <code className="bg-input px-1 rounded">
                      {import.meta.env.VITE_API_PATH}/whip
                    </code>
                  </li>
                  <li>
                    Use your Stream Key as the <strong>Bearer Token</strong>
                  </li>
                </ol>
                <div className="mt-4">
                  <img
                    src="/assets/images/obs-settings.png"
                    alt="OBS WHIP Settings"
                    className="rounded-md border border-border w-full shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <AvailableStreams />
      </div>
    </div>
  );
};

export default Frontpage;
