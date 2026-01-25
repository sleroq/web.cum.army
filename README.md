# Broadcast Box Player (Fork)

This is a fork of the web player for [broadcast-box](https://github.com/glimesh/broadcast-box). It is designed to be a more modern, consistent, and feature-rich alternative to the original player.

## Features unique to this fork

- **Integrated Chat**: Real-time chat system using Server-Sent Events (SSE) with message history and customizable display names.
- **WebRTC Reconnection**: Automatically attempts to reconnect the video stream if the connection is lost or interrupted.
- **Performance Indicators**: Real-time display of FPS, latency, and dropped frames directly in the player.
- **Theme Support**: Multiple built-in themes and supports custom configuration. Automatically follows you device's theme.
- **Improved Player UI**: A cleaner, modern interface built with Tailwind CSS v4.
- **Consistent Design**: Unified UI components across the entire application.
- **Stream Auto-play**: Streams attempt to play automatically by default, with smart retry logic and muted fallback if needed.
- **Modern Tech Stack**: Updated to React 19, Vite 7, and Tailwind CSS v4. Includes React Compiler for better performance and strict linting/formatting rules.
- **Configurable STUN (ICE) Servers**: Configure ICE servers via env for better NAT traversal and improved Firefox/mobile playback reliability.

## General Features

- **WebRTC (WHEP) Playback**: Low-latency streaming using the WHEP protocol.
- **Quality Selection**: Support for multiple video layers/qualities when provided by the broadcast-box server.
- **Picture-in-Picture**: Watch streams in a floating window while browsing other tabs.
- **Fullscreen Support**: Native fullscreen mode for an immersive viewing experience.
- **Volume Control**: Granular volume adjustment and one-click mute.
- **Viewer Count**: Real-time indicator of how many people are watching the stream.
- **Responsive Design**: Works across desktops, tablets, and mobile devices.

## Development

### Prerequisites

- Node.js (v20 or newer recommended)
- npm

### Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and configure your `VITE_API_PATH`.
4. Start the development server:
   ```bash
   npm start
   ```

### Building for Production

To create a production build in the `build/` directory:

```bash
npm run build
```

### Code Quality

- **Linting**: `npm run lint` (Strict ESLint rules including React Compiler checks)
- **Formatting**: `npm run format` (Prettier)

## License

This project is licensed under the same terms as the original broadcast-box project.
