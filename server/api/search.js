const axios = require("axios");

// YouTube Data API v3 key
const YT_API_KEY = process.env.YOUTUBE_API_KEY;

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "No query provided",
      });
    }

    if (!YT_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "YouTube API key not configured",
      });
    }

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
      timeout: 10000,
    });

    if (response.status !== 200) {
      console.error("YouTube API Error:", response.data);
      return res.status(500).json({
        success: false,
        error: "YouTube API error",
      });
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

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({
      success: false,
      error: "Search failed",
      details: error.message,
    });
  }
};
