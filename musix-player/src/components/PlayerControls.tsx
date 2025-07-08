import React from "react";
import {
  FaPlay,
  FaPause,
  FaStepBackward,
  FaStepForward,
  FaVolumeUp,
  FaVolumeMute,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import renderIcon from "./Icon";

interface PlayerControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  showVisualization: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onMuteToggle: () => void;
  onVisualizationToggle: () => void;
  onTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  volume: number;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  isMuted,
  showVisualization,
  currentTime,
  duration,
  onPlay,
  onPause,
  onPrevious,
  onNext,
  onMuteToggle,
  onVisualizationToggle,
  onTimeChange,
  onVolumeChange,
  volume,
}) => {
  // Format time from seconds to MM:SS
  const formatTime = (time: number): string => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="player-controls-wrapper">
      {/* Control buttons */}
      <div className="player-controls-enhanced">
        <button
          className="control-button-enhanced secondary"
          onClick={onPrevious}
          title="Previous/Restart"
        >
          {renderIcon(FaStepBackward)}
        </button>

        <button
          className="control-button-enhanced primary play-pause-enhanced"
          onClick={isPlaying ? onPause : onPlay}
          title={isPlaying ? "Pause" : "Play"}
        >
          {renderIcon(isPlaying ? FaPause : FaPlay)}
        </button>

        <button
          className="control-button-enhanced secondary"
          onClick={onNext}
          title="Next"
        >
          {renderIcon(FaStepForward)}
        </button>
      </div>

      {/* Progress bar with enhanced visibility */}
      <div className="progress-container-enhanced">
        <span className="time-display-enhanced">{formatTime(currentTime)}</span>
        <div className="progress-slider-container">
          <input
            type="range"
            className="progress-slider-enhanced"
            value={currentTime}
            min={0}
            max={duration || 0}
            onChange={onTimeChange}
            style={{
              background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${
                (currentTime / (duration || 1)) * 100
              }%, rgba(255,255,255,0.3) ${
                (currentTime / (duration || 1)) * 100
              }%, rgba(255,255,255,0.3) 100%)`,
            }}
          />
          <div className="progress-track-background"></div>
        </div>
        <span className="time-display-enhanced">{formatTime(duration)}</span>
      </div>

      {/* Volume and visualizer controls */}
      <div className="volume-container-enhanced">
        <button
          className="control-button-enhanced secondary"
          onClick={onMuteToggle}
          title="Toggle Mute"
        >
          {renderIcon(isMuted ? FaVolumeMute : FaVolumeUp)}
        </button>

        <div className="volume-slider-container">
          <input
            type="range"
            className="volume-slider-enhanced"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={onVolumeChange}
            style={{
              background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${
                volume * 100
              }%, rgba(255,255,255,0.3) ${
                volume * 100
              }%, rgba(255,255,255,0.3) 100%)`,
            }}
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
        </div>

        <button
          className="control-button-enhanced secondary visualizer-toggle"
          onClick={onVisualizationToggle}
          title={showVisualization ? "Hide Visualizer" : "Show Visualizer"}
        >
          {renderIcon(showVisualization ? FaEyeSlash : FaEye)}
        </button>
      </div>
    </div>
  );
};

export default PlayerControls;
