# 🎵 Musix Player

A modern, YouTube-powered music streaming player with real-time audio visualization. Built with React, Node.js, and yt-dlp for seamless music discovery and playback.

## ✨ Features

- **🔍 YouTube Search**: Search for songs using YouTube's Data API v3
- **🎵 Audio Streaming**: Direct streaming with yt-dlp (no file downloads)
- **🎨 Audio Visualizer**: Real-time visualization with waveform and frequency analysis
- **🌙 Dark/Light Theme**: Beautiful theme switching
- **📱 Responsive Design**: Works perfectly on desktop and mobile
- **🎚️ Media Controls**: Full playback controls with seek functionality
- **📜 Queue Management**: Add songs to queue and manage playback order

## 🚀 Tech Stack

### Frontend

- **React 19** with TypeScript
- **Three.js** for visualizations
- **CSS3** with modern features

### Backend

- **Node.js** with Express.js
- **yt-dlp** for YouTube audio extraction
- **YouTube Data API v3** for search

## 🛠️ Quick Start

### Prerequisites

- Node.js (v16+)
- YouTube Data API v3 key
- yt-dlp installed globally

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/musix-player.git
cd musix-player
```

2. **Install yt-dlp**

```bash
pip install yt-dlp
```

3. **Setup Backend**

```bash
cd server
npm install
```

Create `.env` file:

```env
YOUTUBE_API_KEY=your_youtube_api_key_here
PORT=5000
FRONTEND_URL=http://localhost:3000
```

4. **Setup Frontend**

```bash
cd musix-player
npm install
```

Create `.env` file:

```env
REACT_APP_API_URL=http://localhost:5000
```

5. **Run the application**

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd musix-player && npm start
```

Open `http://localhost:3000` in your browser.

## 🎯 Usage

1. Search for songs in the search box
2. Click play on any result to start streaming
3. Use player controls for playback management
4. Toggle the visualizer with the eye icon
5. Switch themes with the theme button

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions for Vercel and other platforms.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This application is for educational purposes only. Please respect YouTube's Terms of Service and copyright laws.

---

Made with ❤️ by Saket
