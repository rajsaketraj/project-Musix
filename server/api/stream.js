const { spawn } = require("child_process");

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { videoId } = req.body;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: "Video ID is required",
      });
    }

    console.log(`Getting stream URL for ${videoId}`);

    // Create a promise to handle the yt-dlp process
    const getStreamUrl = () => {
      return new Promise((resolve, reject) => {
        // Use yt-dlp to get direct stream URL
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
            reject(new Error(`yt-dlp failed: ${errorOutput}`));
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
          reject(error);
        });
      });
    };

    const streamUrl = await getStreamUrl();

    console.log("Stream URL obtained successfully");

    res.json({
      success: true,
      streamUrl: streamUrl,
    });
  } catch (error) {
    console.error("Stream error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get stream URL",
      details: error.message,
    });
  }
};
