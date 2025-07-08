require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

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

// Update CORS headers for audio requests
app.use("/audio", (req, res, next) => {
  console.log("Audio file request:", req.path);

  // Set CORS headers for audio requests
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_URL);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Content-Length,Content-Range"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Range, Origin, Accept, Referer"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  next();
});

// Replace static file serving with custom audio handler
app.get("/audio/:id.mp3", (req, res) => {
  const filePath = path.join(__dirname, "downloads", `${req.params.id}.mp3`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Set CORS headers for the response
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_URL);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Content-Length,Content-Range"
  );

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    res.writeHead(206, {
      "Content-Type": "audio/mpeg",
      "Content-Length": end - start + 1,
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
    });

    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Type": "audio/mpeg",
      "Content-Length": fileSize,
    });

    fs.createReadStream(filePath).pipe(res);
  }
});

// Enhanced error handler
app.use("/audio", (err, req, res, next) => {
  if (err.status === 404) {
    console.error("Audio file not found:", {
      requestedPath: req.path,
      files: fs.readdirSync(path.join(__dirname, "downloads")),
    });
    return res.status(404).json({
      error: "Audio file not found",
      existingFiles: fs.readdirSync(path.join(__dirname, "downloads")),
    });
  }
  next(err);
});

// Middleware to ensure JSON responses
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json");

  const originalJson = res.json;
  res.json = function (data) {
    if (typeof data !== "object") {
      data = { message: data };
    }
    originalJson.call(this, data);
  };

  next();
});

// Add cache-control headers middleware
app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// YouTube Data API v3 key is now loaded from environment variables

// Search YouTube videos
app.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json({ success: false, error: "No query provided" });

    // Log the search request
    console.log(`Search initiated for: ${query}`);

    // YouTube API endpoint
    const apiUrl =
      `https://www.googleapis.com/youtube/v3/search?` +
      new URLSearchParams({
        part: "snippet",
        maxResults: 5,
        q: query,
        key: YT_API_KEY,
        type: "video",
      });

    console.log(`API Request: ${apiUrl}`);

    const response = await axios.get(apiUrl, {
      validateStatus: () => true,
      timeout: 5000,
    });

    console.log(`API Response Status: ${response.status}`);

    if (response.status !== 200) {
      console.error("YouTube API Error:", {
        status: response.status,
        data: response.data,
        headers: response.headers,
      });
      return res.json({ success: false, error: "YouTube API error" });
    }

    // Format results to match the VideoResult interface in the frontend
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
    console.error("Search Error:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
      response: error.response?.data,
    });
    return res.json({ success: false, error: "Search failed" });
  }
});

// Check if file exists
app.get("/check", (req, res) => {
  try {
    const videoId = req.query.videoId;
    if (!videoId) {
      return res.json({
        success: false,
        error: "videoId is required",
        timestamp: Date.now(),
      });
    }

    const filePath = path.join(__dirname, "downloads", `${videoId}.mp3`);
    const exists = fs.existsSync(filePath);

    res.json({
      success: true,
      exists,
      filePath: exists ? `/audio/${videoId}.mp3?t=${Date.now()}` : null,
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Check failed",
      timestamp: Date.now(),
    });
  }
});

// Get direct stream URL from yt-dlp (for streaming approach)
app.post("/stream", async (req, res) => {
  try {
    const { videoId } = req.body;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: "Video ID is required",
      });
    }

    console.log(`Getting stream URL for ${videoId}`);

    // Use yt-dlp to get direct stream URL
    const { spawn } = require("child_process");

    const getStreamUrl = () => {
      return new Promise((resolve, reject) => {
        const ytdlp = spawn("yt-dlp", [
          "-f",
          "bestaudio[ext=m4a]/bestaudio/best",
          "--get-url",
          `https://www.youtube.com/watch?v=${videoId}`,
        ]);

        let streamUrl = "";
        let errorOutput = "";

        ytdlp.stdout.on("data", (data) => {
          streamUrl += data.toString();
        });

        ytdlp.stderr.on("data", (data) => {
          errorOutput += data.toString();
        });

        ytdlp.on("close", (code) => {
          if (code !== 0) {
            reject(
              new Error(`yt-dlp failed with code ${code}: ${errorOutput}`)
            );
            return;
          }

          const cleanUrl = streamUrl.trim();
          if (!cleanUrl) {
            reject(new Error("No stream URL found"));
            return;
          }

          resolve(cleanUrl);
        });

        ytdlp.on("error", (error) => {
          reject(new Error(`Failed to spawn yt-dlp: ${error.message}`));
        });

        // Add timeout
        setTimeout(() => {
          ytdlp.kill();
          reject(new Error("yt-dlp timeout"));
        }, 15000); // 15 seconds timeout
      });
    };

    const streamUrl = await getStreamUrl();

    console.log("Stream URL obtained successfully");

    res.json({
      success: true,
      streamUrl: streamUrl,
      message: "Direct stream URL obtained",
    });
  } catch (error) {
    console.error("Stream error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get stream URL",
      details: error.message,
    });
  }
});

// Proxy stream to avoid CORS issues
app.get("/proxy-stream", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "URL parameter required" });
    }

    console.log("Proxying stream request");

    // Set appropriate headers
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Access-Control-Allow-Origin", FRONTEND_URL);
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Length,Content-Range"
    );

    // Handle range requests
    const range = req.headers.range;
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    };

    if (range) {
      headers.Range = range;
    }

    // Stream the audio
    const response = await axios({
      method: "GET",
      url: decodeURIComponent(url),
      headers,
      responseType: "stream",
      timeout: 30000,
    });

    // Copy headers from source
    if (response.headers["content-length"]) {
      res.setHeader("Content-Length", response.headers["content-length"]);
    }
    if (response.headers["content-range"]) {
      res.setHeader("Content-Range", response.headers["content-range"]);
    }
    if (response.headers["content-type"]) {
      res.setHeader("Content-Type", response.headers["content-type"]);
    }

    // Set status code for range requests
    if (range && response.status === 206) {
      res.status(206);
    }

    // Pipe the stream
    response.data.pipe(res);

    response.data.on("error", (error) => {
      console.error("Stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Stream failed" });
      }
    });
  } catch (error) {
    console.error("Proxy stream error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Stream proxy failed",
        details: error.message,
      });
    }
  }
});

// Download audio with comprehensive logging
app.post("/download", async (req, res) => {
  try {
    const { videoId } = req.body;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: "Video ID is required",
      });
    }

    const outputDir = path.join(__dirname, "downloads");
    const outputPath = path.join(outputDir, `${videoId}.mp3`);

    console.log(`Starting download for ${videoId}`);
    console.log(`Target path: ${outputPath}`);

    // Create downloads directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      console.log(`Creating downloads directory: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Skip if file already exists and is valid
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`Existing file found. Size: ${stats.size} bytes`);
      if (stats.size > 10240) {
        return res.json({
          success: true,
          filePath: `/audio/${videoId}.mp3`,
        });
      }
      console.log(`Existing file too small, redownloading...`);
    }

    // Fixed yt-dlp command with proper output template
    const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outputDir}/%(id)s.%(ext)s" "https://www.youtube.com/watch?v=${videoId}"`;
    console.log(`Executing: ${command}`);

    // Add timeout to prevent hanging
    const execWithTimeout = (cmd, timeout = 30000) => {
      return new Promise((resolve, reject) => {
        const child = exec(cmd, (error, stdout, stderr) => {
          if (error) {
            reject({ error, stderr, stdout });
          } else {
            resolve({ stdout, stderr });
          }
        });

        const timer = setTimeout(() => {
          child.kill();
          reject(new Error("Command timeout"));
        }, timeout);

        child.on("exit", () => clearTimeout(timer));
      });
    };

    try {
      const result = await execWithTimeout(command);
      console.log("yt-dlp output:", result.stdout);

      // Verify file was actually created
      if (!fs.existsSync(outputPath)) {
        console.error("Download completed but file not found!");
        // Try to find the file with different extension
        const files = fs
          .readdirSync(outputDir)
          .filter((f) => f.startsWith(videoId));
        if (files.length > 0) {
          console.log("Found files:", files);
          // Rename to .mp3 if needed
          const foundFile = files[0];
          const foundPath = path.join(outputDir, foundFile);
          if (foundFile !== `${videoId}.mp3`) {
            fs.renameSync(foundPath, outputPath);
            console.log(`Renamed ${foundFile} to ${videoId}.mp3`);
          }
        } else {
          return res.status(500).json({
            success: false,
            error: "File not saved",
            details: "No output file found after download",
          });
        }
      }

      const stats = fs.statSync(outputPath);
      console.log(`Download successful. File stats:`, stats);

      res.json({
        success: true,
        filePath: `/audio/${videoId}.mp3`,
        fileSize: stats.size,
      });
    } catch (cmdError) {
      console.error("yt-dlp command failed:", cmdError);
      return res.status(500).json({
        success: false,
        error: "Download failed",
        details: cmdError.stderr || cmdError.message,
      });
    }
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({
      success: false,
      error: "Download failed",
      details: error.message,
    });
  }
});

// Ensure downloads directory exists
const downloadsDir = path.join(__dirname, "downloads");
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Cleanup old files hourly
setInterval(() => {
  const now = Date.now();
  fs.readdirSync(path.join(__dirname, "downloads")).forEach((file) => {
    const filePath = path.join(__dirname, "downloads", file);
    const { birthtimeMs } = fs.statSync(filePath);
    if (now - birthtimeMs > 3600000) {
      fs.unlinkSync(filePath);
    }
  });
}, 3600000);

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
  console.log(`Server running on port ${PORT}`);
});
