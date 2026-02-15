import React, { useContext, useEffect } from 'react';
import { StatusContext } from '../../providers/StatusContext';
import { useNavigate } from 'react-router-dom';

const Statistics = () => {
  const { streamStatus, refreshStatus } = useContext(StatusContext);
  const navigate = useNavigate();

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return (
    <div className="p-6">
      <h2 className="text-4xl font-semibold mb-4">📊 Statistics</h2>

      {!streamStatus ||
        (streamStatus?.length === 0 && (
          <p className="text-center text-muted mt-10 text-3xl">No statistics currently available</p>
        ))}

      <div className="space-y-6">
        {streamStatus?.map((status, i) => (
          <div key={i} className="border border-border rounded-lg p-4 shadow-sm ">
            <div className="text-lg font-medium text-brand m-0 flex flex-row justify-between content-center">
              <div className="px-4 py-2 rounded-lg ">Stream Key: {status.streamKey}</div>
              <button
                onClick={() => navigate(`/${status.streamKey}`)}
                className="bg-brand hover:bg-brand-hover px-4 py-2 rounded-lg text-white"
              >
                Watch stream
              </button>
            </div>

            <div className="mb-4 mt-4">
              <h3 className="text-md font-semibold mb-2">Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="rounded-md p-3 border border-border">
                  <strong>Online:</strong> {status.isOnline ? 'Yes' : 'No'}
                </div>
                <div className="rounded-md p-3 border border-border">
                  <strong>Viewers:</strong> {status.viewers}
                </div>
                <div className="rounded-md p-3 border border-border">
                  <strong>Started:</strong> {new Date(status.streamStart).toLocaleString()}
                </div>
                <div className="rounded-md p-3 border border-border sm:col-span-2 md:col-span-3">
                  <strong>MOTD:</strong> {status.motd}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Statistics;
