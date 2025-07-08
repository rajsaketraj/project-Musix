import React from "react";
import { VideoResult } from "../types";
import { FaPlay, FaPlus } from "react-icons/fa";
import renderIcon from "./Icon";

interface SearchResultsProps {
  results: VideoResult[];
  onPlay: (videoId: string, video: VideoResult) => void;
  onAddToQueue: (videoId: string, video: VideoResult) => void;
  nowPlaying?: VideoResult | null;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onPlay,
  onAddToQueue,
  nowPlaying,
}) => {
  if (results.length === 0) {
    return <div className="empty-state">No results found</div>;
  }

  // Function to truncate text with ellipsis
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <div className="search-results">
      {results.map((video) => (
        <div
          key={video.id.videoId}
          className={`video-card ${
            nowPlaying?.id.videoId === video.id.videoId ? "now-playing" : ""
          }`}
        >
          <div className="thumbnail-container">
            <img
              src={video.snippet.thumbnails.medium.url}
              alt={video.snippet.title}
              className="thumbnail"
            />
            {video.duration && (
              <div className="video-duration">{video.duration}</div>
            )}
            <div
              className="play-overlay"
              onClick={() => onPlay(video.id.videoId, video)}
            >
              {renderIcon(FaPlay, { size: 28 })}
            </div>
          </div>
          <div className="video-info">
            <h3 title={video.snippet.title}>
              {truncateText(video.snippet.title, 60)}
            </h3>
            <p className="channel-name">{video.snippet.channelTitle}</p>
          </div>
          <div className="result-buttons">
            <button
              className="play-button"
              onClick={() => onPlay(video.id.videoId, video)}
            >
              {renderIcon(FaPlay, { size: 14 })}
              <span>Play</span>
            </button>
            <button
              className="queue-button"
              onClick={() => onAddToQueue(video.id.videoId, video)}
            >
              {renderIcon(FaPlus, { size: 14 })}
              <span>Queue</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
