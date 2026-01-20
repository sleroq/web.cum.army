import React, {useContext, useState} from "react";
import Player from "./Player";
import {useNavigate} from "react-router-dom";
import {CinemaModeContext} from "../../providers/CinemaModeProvider";
import ModalTextInput from "../shared/ModalTextInput";

const PlayerPage = () => {
  const navigate = useNavigate();
  const {cinemaMode, toggleCinemaMode} = useContext(CinemaModeContext);
  const [streamKeys, setStreamKeys] = useState<string[]>([window.location.pathname.substring(1)]);
  const [isModalOpen, setIsModelOpen] = useState<boolean>(false);

  const addStream = (streamKey: string) => {
    if (streamKeys.some((key: string) => key.toLowerCase() === streamKey.toLowerCase())) {
      return;
    }
    setStreamKeys((prev) => [...prev, streamKey]);
    setIsModelOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {isModalOpen && (
        <ModalTextInput<string>
          title="Add stream"
          message={"Insert stream key to add to multi stream"}
          isOpen={isModalOpen}
          canCloseOnBackgroundClick={false}
          onClose={() => setIsModelOpen(false)}
          onAccept={(result: string) => addStream(result)}
        />
      )}

      <div className={cinemaMode ? "w-full" : "mx-auto max-w-[1400px] px-4 md:px-8 py-6 md:py-10"}>
        <div className={`flex flex-col items-center ${cinemaMode ? "gap-3" : "gap-6 md:gap-8"}`}>
          {!cinemaMode && (
            <div className="w-full max-w-[1200px] flex items-baseline justify-between">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                Player <span className="text-[#ec3b73]">•</span>
              </h1>
              <span className="text-sm text-white/60">
                {streamKeys.length} stream{streamKeys.length === 1 ? "" : "s"}
              </span>
            </div>
          )}

          <div
            className={
              `grid w-full grid-cols-1 gap-3 md:gap-4 ` +
              `${streamKeys.length === 1 ? "max-w-[1200px]" : ""} ` +
              `${streamKeys.length !== 1 ? "md:grid-cols-2" : ""}`
            }
          >
            {streamKeys.map((streamKey) => (
              <div
                key={`${streamKey}_frame`}
                className="rounded-xl overflow-hidden bg-[#1e1e1e] ring-1 ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
              >
                <Player
                  streamKey={streamKey}
                  cinemaMode={cinemaMode}
                  onCloseStream={
                    streamKeys.length === 1
                      ? () => navigate('/')
                      : () => setStreamKeys((prev) => prev.filter((key) => key !== streamKey))
                  }
                />
              </div>
            ))}
          </div>

          {/* Controls */}
          <div
            className={
              cinemaMode
                ? "fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
                : "w-full max-w-[800px] mt-2"
            }
          >
            <div
              className={
                cinemaMode
                  ? "flex gap-2 rounded-xl bg-black/60 backdrop-blur px-3 py-2 ring-1 ring-white/10"
                  : "flex flex-col sm:flex-row gap-3"
              }
            >
              <button
                className={
                  `${cinemaMode ? "px-3 py-2 text-sm" : "px-5 py-3"} ` +
                  "rounded-lg font-semibold bg-[#ec3b73] hover:bg-[#ff69a0] text-white shadow " +
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec3b73]/60 " +
                  "focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212]"
                }
                onClick={toggleCinemaMode}
              >
                {cinemaMode ? "Exit cinema" : "Cinema mode"}
              </button>

              <button
                className={
                  `${cinemaMode ? "px-3 py-2 text-sm" : "px-5 py-3"} ` +
                  "rounded-lg font-semibold bg-white/10 hover:bg-white/15 border border-white/10 text-white " +
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec3b73]/40 " +
                  "focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212]"
                }
                onClick={() => setIsModelOpen((prev) => !prev)}
              >
                Add stream
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};

export default PlayerPage;
