require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

// Lazy load ytdl-core only when needed
let ytdl = null;
const getYtdl = () => {
  if (!ytdl) {
    ytdl = require("@distube/ytdl-core");
  }
  return ytdl;
};

const app = express();

// Environment variables
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const YT_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YT_API_KEY) {
  console.error("Error: YOUTUBE_API_KEY is not set in environment variables");
  process.exit(1);
}

// Enhanced CORS configuration
app.use(
  cors({
    origin: [FRONTEND_URL, "https://your-frontend-url.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Range",
      "Origin",
      "Accept",
      "Referer",
    ],
    exposedHeaders: ["Content-Length", "Content-Range"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Search YouTube videos
app.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json({ success: false, error: "No query provided" });

    console.log(`Search initiated for: ${query}`);

    const apiUrl =
      `https://www.googleapis.com/youtube/v3/search?` +
      new URLSearchParams({
        part: "snippet",
        maxResults: 5,
        q: query,
        key: YT_API_KEY,
        type: "video",
      });

    const response = await axios.get(apiUrl, {
      validateStatus: () => true,
      timeout: 5000,
    });

    if (response.status !== 200) {
      console.error("YouTube API Error:", {
        status: response.status,
        data: response.data,
      });
      return res.json({ success: false, error: "YouTube API error" });
    }

    const results =
      response.data?.items?.map((item) => ({
        id: {
          videoId: item.id?.videoId || "",
        },
        snippet: {
          title: item.snippet?.title || "Untitled",
          description: item.snippet?.description || "",
          channelTitle: item.snippet?.channelTitle || "",
          thumbnails: {
            medium: {
              url:
                item.snippet?.thumbnails?.medium?.url ||
                item.snippet?.thumbnails?.default?.url ||
                "",
            },
          },
        },
      })) || [];

    console.log(`Found ${results.length} results`);
    return res.json({ success: true, results });
  } catch (error) {
    console.error("Search Error:", error.message);
    return res.json({ success: false, error: "Search failed" });
  }
});

// Stream audio info endpoint
app.post("/stream", async (req, res) => {
  try {
    const { videoId } = req.body;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: "Video ID is required",
      });
    }

    console.log(`Getting stream info for ${videoId}`);

    res.json({
      success: true,
      streamUrl: `/stream-audio/${videoId}`,
      message: "Stream ready (ytdl-core will be loaded on demand)",
    });
  } catch (error) {
    console.error("Stream error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get stream info",
      details: error.message,
    });
  }
});

// Direct audio streaming endpoint
app.get("/stream-audio/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    console.log(`Streaming audio for ${videoId}`);

    const ytdl = getYtdl();
    if (!ytdl.validateURL(videoUrl)) {
      return res.status(400).json({ error: "Invalid YouTube video URL" });
    }

    res.setHeader("Content-Type", "audio/webm; codecs=opus");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Access-Control-Allow-Origin", FRONTEND_URL);
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Length,Content-Range"
    );
    res.setHeader("Cache-Control", "public, max-age=3600");

    const audioStream = ytdl(videoUrl, {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 25,
    });

    audioStream.on("error", (error) => {
      console.error("Audio stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Stream failed" });
      }
    });

    audioStream.on("info", (info, format) => {
      console.log(`Streaming: ${info.videoDetails.title}`);
      console.log(
        `Format: ${format.container}, Quality: ${format.audioBitrate}kbps`
      );
    });

    audioStream.pipe(res);
  } catch (error) {
    console.error("Audio streaming error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Audio streaming failed",
        details: error.message,
      });
    }
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "Server is running",
    timestamp: new Date().toISOString(),
    version: "2.0.0 (@distube/ytdl-core)",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Musix Player API Server",
    version: "2.0.0",
    endpoints: {
      search: "/search?query=<search_term>",
      stream: "POST /stream {videoId}",
      streamAudio: "/stream-audio/<videoId>",
      health: "/health",
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`🎵 Musix Player API Server running on port ${PORT}`);
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
  console.log(`🔑 YouTube API Key: ${YT_API_KEY ? "Configured" : "Missing"}`);
  console.log(
    `📦 Using @distube/ytdl-core for audio streaming (Vercel compatible)`
  );
});
