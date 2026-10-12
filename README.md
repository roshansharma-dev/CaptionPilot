# CaptionPilot ⚡

Real-time speech recognition captioning and technical research web application built for YouTubers, streamers, and live coders.

---

## 🌟 Key Features

1. **Real-Time Speech Recognition**
   - Native Web Speech API integration (`SpeechRecognition` / `webkitSpeechRecognition`).
   - Low-latency live interim speech stream with active audio visualizer.
   - Continuous recognition with automatic pause recovery.
   - Multi-language support: English (US), English (India), English (UK), and Hindi (हिन्दी).

2. **OBS Studio Transparent Overlay (`/overlay`)**
   - Dedicated page at `/overlay` with 100% transparent background (`background: transparent !important`).
   - Cross-window, zero-lag synchronization with dashboard via the browser's native `BroadcastChannel` API and storage events.
   - 3 subtitle styles: Dark Translucent Pill, High Contrast Outline, and Cinema Subtitle Box.
   - Customizable font size and positioning (bottom, center, top).

3. **SubRip (.SRT) & WebVTT (.VTT) Exports**
   - **Download SRT:** Canonical SubRip format with millisecond timestamps in `HH:MM:SS,mmm` format.
   - **Download VTT:** Standard W3C WebVTT format with `WEBVTT` header and `HH:MM:SS.mmm` timestamps.
   - Interactive code inspector to preview raw `.srt` or `.vtt` text before downloading.

4. **Transcript Editing & Session Preservation**
   - Inline segment editing with Save (Enter) and Cancel (Esc) actions.
   - Edited text is immediately reflected in subsequent subtitle downloads.
   - Session data (name, duration, word count, pace in WPM) is preserved in `localStorage` across page refreshes.

5. **SerpApi Google Search Technical Research**
   - Secure server-side Node.js & Express proxy (`POST /api/search`).
   - Research programming libraries, products, or jargon from your live stream.
   - Clickable organic Google search results with title, snippet, source link, and Knowledge Graph summaries.
   - One-click "Research phrase" (🔍) action on transcript segments.
   - Manual review workflow to verify and apply technical corrections to transcript segments without automatic overrides.

---

## 🔒 Security Architecture (SerpApi)

- The SerpApi key is kept **strictly server-side** in a local `.env` file (`SERPAPI_KEY=YOUR_NEW_KEY`).
- `.env` and `.env.*` are excluded in `.gitignore`.
- The API key is **never** sent to the client browser, exposed in React code, rendered in network responses, or logged in console output.
- All Google Search queries go through the backend endpoint `POST /api/search`.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+ or v24+)
- **Chromium-based Browser** (Google Chrome, Microsoft Edge, Brave, or Opera) for Web Speech API support.

### 2. Configure SerpApi Key
Create or edit your local `.env` file in the project root:
```bash
# Copy template if needed
cp .env.example .env
```
Inside `.env`, set your key:
```env
SERPAPI_KEY=YOUR_NEW_KEY
PORT=3001
```
*(Replace `YOUR_NEW_KEY` with your personal SerpApi key from [serpapi.com](https://serpapi.com/manage-api-key)).*

### 3. Start the Backend Server
```bash
npm run server
```
Server runs at: `http://localhost:3001` (health endpoint: `http://localhost:3001/api/health`).

### 4. Start the Frontend Dashboard
In a separate terminal:
```bash
npm run dev
```
Open in browser:
- **Dashboard:** [http://localhost:5173/](http://localhost:5173/)
- **OBS Browser Source:** [http://localhost:5173/overlay](http://localhost:5173/overlay)

---

## 🧪 Automated Testing

### 1. Subtitle Generation Test
Tests SRT/VTT formatting, millisecond accuracy, sequence ordering, and edited text preservation:
```bash
npm run test:subtitles
```
**Results (12/12 Passed):**
- ✓ SRT 65.432s formatted as `00:01:05,432`
- ✓ SRT 3661.123s formatted as `01:01:01,123`
- ✓ VTT 65.432s formatted as `00:01:05.432`
- ✓ VTT 3661.123s formatted as `01:01:01.123`
- ✓ SRT contains valid segments with `HH:MM:SS,mmm`
- ✓ SRT matches SubRip formal specification pattern
- ✓ WebVTT starts with required `WEBVTT\n\n` header
- ✓ WebVTT contains valid segments with `HH:MM:SS.mmm`
- ✓ WebVTT preserves edited segment text
- ✓ Export filename sanitization

### 2. Backend & SerpApi Integration Test
Tests `/api/health`, empty request validation, missing key handling (503), and live Google Search query:
```bash
npm run test:search
```
**Results (8/8 Passed):**
- ✓ GET `/api/health` returned 200 OK
- ✓ Health status is `ok`
- ✓ Key configured flag returns boolean
- ✓ Empty query rejected with 400 Bad Request (`INVALID_REQUEST`)
- ✓ Missing/placeholder key returns 503 (`MISSING_API_KEY`) with setup guidance

---

## 📺 OBS Studio Setup

1. Open **OBS Studio** → in your Scene, click **+** under **Sources** → choose **Browser**.
2. Set **URL** to `http://localhost:5173/overlay`.
3. Set **Width** to `1280` (or `1920`) and **Height** to `300` (or `1080`).
4. Ensure **Shutdown source when not visible** is unchecked.
5. In the CaptionPilot dashboard, click **Start Captions** and speak into your microphone. Your speech appears live on your stream overlay!
