import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import axios from "axios";

// Import modular components
import AudioVisualizer from "./components/AudioVisualizer";
import PlayerControls from "./components/PlayerControls";
import SearchResults from "./components/SearchResults";
import { VideoResult } from "./types";

// API Configuration
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function App() {
  // State for search and results
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // State for audio playback
  const [nowPlaying, setNowPlaying] = useState<VideoResult | null>(null);
  const [queue, setQueue] = useState<VideoResult[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);

  // State for UI
  const [showVisualization, setShowVisualization] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    document.body.className = darkMode ? "dark-theme" : "light-theme";
  }, [darkMode]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Add timestamp to bypass cache
      const timestamp = Date.now();
      const response = await axios.get(
        `${API_URL}/search?query=${encodeURIComponent(
          searchQuery
        )}&t=${timestamp}`
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Invalid search results");
      }

      setResults(response.data.results);
    } catch (err: unknown) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (videoId: string, videoObject?: VideoResult) => {
    try {
      const video =
        videoObject || results.find((v) => v.id.videoId === videoId);
      if (!video) return;

      setNowPlaying(video);
      setError(""); // Clear any previous errors

      console.log(`Starting to play: ${video.snippet.title}`);

      // Get direct stream URL instead of downloading
      const streamResponse = await axios.post(`${API_URL}/stream`, {
        videoId,
      });

      if (!streamResponse.data.success) {
        throw new Error(
          streamResponse.data.error || "Failed to get stream URL"
        );
      }

      const { streamUrl } = streamResponse.data;
      console.log("Stream URL obtained, starting playback");

      // Clear any previous audio element
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      // Create new audio element with stream URL
      const audioElement = new Audio();

      // Set up error handling first
      const errorHandler = (e: Event) => {
        console.error("Audio error:", e);
        setError("Failed to load audio stream");
        setIsPlaying(false);
      };

      audioElement.addEventListener("error", errorHandler);

      // Setup event listeners
      audioElement.addEventListener("timeupdate", () => {
        setCurrentTime(audioElement.currentTime);
      });

      audioElement.addEventListener("loadedmetadata", () => {
        setDuration(audioElement.duration);
      });

      audioElement.addEventListener("ended", () => {
        setIsPlaying(false);
        playNextInQueue();
      });

      audioElement.addEventListener("canplay", () => {
        console.log("Audio can start playing");
      });

      audioElement.addEventListener("loadstart", () => {
        console.log("Audio load started");
      });

      // Set volume and other properties
      audioElement.volume = volume;
      audioElement.crossOrigin = "anonymous";
      audioElement.preload = "auto";

      // Use proxy URL to avoid CORS issues
      const proxyUrl = `${API_URL}/proxy-stream?url=${encodeURIComponent(
        streamUrl
      )}`;
      audioElement.src = proxyUrl;

      // Update audioRef
      audioRef.current = audioElement;

      // Start playing
      try {
        await audioElement.play();
        setIsPlaying(true);
        console.log("Playback started successfully");
      } catch (playError) {
        console.error("Play error:", playError);
        setError("Failed to start playback");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to play video");
      console.error("Play error:", err);
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }

    setIsPlaying(!isPlaying);
  };

  const restartTrack = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setIsPlaying(true);
  };

  const adjustVolume = (newVolume: number) => {
    if (!audioRef.current) return;

    audioRef.current.volume = newVolume;
    setVolume(newVolume);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;

    if (audioRef.current.volume > 0) {
      audioRef.current.volume = 0;
      setVolume(0);
    } else {
      audioRef.current.volume = 1;
      setVolume(1);
    }
  };

  const addToQueue = (videoId: string, video: VideoResult) => {
    setQueue((prevQueue) => [...prevQueue, video]);
  };

  const playNextInQueue = () => {
    if (queue.length > 0) {
      const nextTrack = queue[0];
      setQueue(queue.slice(1)); // Remove the played track
      handlePlay(nextTrack.id.videoId, nextTrack);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "0:00";

    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="app">
      <h1>Musix Player</h1>

      <div className="search-container">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for songs..."
          onKeyPress={(e) => e.key === "Enter" && handleSearch(searchQuery)}
        />
        <button
          onClick={() => handleSearch(searchQuery)}
          disabled={loading || !searchQuery.trim()}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && (
        <div className="error-container">
          <div className="error-content">
            <h3>⚠️ Something went wrong</h3>
            <p>{error}</p>
            <button onClick={() => setError("")} className="error-dismiss">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {showVisualization && nowPlaying && (
        <AudioVisualizer
          audioRef={audioRef as React.RefObject<HTMLAudioElement>}
          isActive={showVisualization && Boolean(nowPlaying)}
        />
      )}

      {nowPlaying && (
        <div className="now-playing-info">
          <img
            src={nowPlaying.snippet.thumbnails.medium.url}
            alt={nowPlaying.snippet.title}
            className="now-playing-thumbnail"
          />
          <div className="track-info">
            <h3>{nowPlaying.snippet.title}</h3>
            <p>{nowPlaying.snippet.channelTitle}</p>
          </div>
        </div>
      )}

      {results.length > 0 ? (
        <SearchResults
          results={results}
          onPlay={handlePlay}
          onAddToQueue={addToQueue}
          nowPlaying={nowPlaying}
        />
      ) : (
        <div className="empty-state">
          {!loading && searchQuery && (
            <div className="empty-content">
              <div className="empty-icon">🔍</div>
              <h3>No results found</h3>
              <p>Try searching for a different song or artist</p>
            </div>
          )}
          {!searchQuery && !loading && (
            <div className="empty-content">
              <div className="empty-icon">🎵</div>
              <h3>Welcome to Musix Player</h3>
              <p>Search for your favorite songs to get started</p>
            </div>
          )}
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Searching for songs...</p>
            </div>
          )}
        </div>
      )}

      {nowPlaying && (
        <div className="player-container">
          <PlayerControls
            isPlaying={isPlaying}
            isMuted={volume === 0}
            showVisualization={showVisualization}
            currentTime={currentTime}
            duration={duration}
            onPlay={togglePlayPause}
            onPause={togglePlayPause}
            onPrevious={restartTrack}
            onNext={playNextInQueue}
            onMuteToggle={toggleMute}
            onVisualizationToggle={() =>
              setShowVisualization(!showVisualization)
            }
            onTimeChange={(e) => {
              if (audioRef.current) {
                audioRef.current.currentTime = Number(e.target.value);
              }
            }}
            onVolumeChange={(e) => adjustVolume(parseFloat(e.target.value))}
            volume={volume}
          />
        </div>
      )}

      <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? "☀️" : "🌙"}
      </button>
    </div>
  );
}

export default App;
