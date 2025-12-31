# CLAUDE.md - AI Assistant Guide for WAHA Stack

## Project Overview

**WAHA Stack** is a WhatsApp automation platform that combines:
- **WAHA** - WhatsApp HTTP API server (external Docker image)
- **Chatty UI** - React dashboard for message automation with Express/SQLite backend
- **Gemini Bot** - AI chatbot using Google Gemini 2.0 with session management
- **Message Bar** (v1/v2) - Retro arcade-style games for interactive WhatsApp engagement
- **Control Panel** - Lightweight HTML interface for WAHA session management

All components run in Docker containers with shared networking.

**Default Language: Hebrew (עברית)** - All user-facing messages and bot responses default to Hebrew.

---

## Directory Structure

```
waha-stack/
├── chatty-ui/                  # Main automation dashboard
│   ├── src/
│   │   ├── App.jsx            # Main React component (~1900 lines)
│   │   ├── App.css            # Component styling
│   │   ├── config.js          # API URL configuration
│   │   └── main.jsx           # React entry point
│   ├── server.js              # Express backend (~370 lines)
│   ├── Dockerfile             # Backend container
│   ├── Dockerfile.frontend    # Frontend build container
│   ├── nginx.conf             # Production nginx config
│   ├── vite.config.js         # Vite configuration
│   └── package.json           # Dependencies
│
├── message-bar/               # Simple message bar game (v1)
│   ├── src/App.jsx           # Game component (~780 lines)
│   └── GRAPHICS_SPEC.md      # Art style guide
│
├── message-bar-v2/            # Advanced canvas-based game (v2)
│   ├── src/
│   │   ├── App.jsx           # Game wrapper
│   │   ├── game/             # Game engine
│   │   │   ├── Game.js       # Main game class
│   │   │   ├── Customer.js   # Customer entity
│   │   │   ├── Bottle.js     # Template bottles
│   │   │   ├── Effects.js    # Visual effects
│   │   │   ├── SoundManager.js # 8-bit audio
│   │   │   └── constants.js  # Game config
│   │   └── services/api.js   # WAHA API integration
│   └── package.json
│
├── gemini-bot/                # AI chatbot service (Hebrew default)
│   ├── server.js             # Express server + webhook handler
│   ├── src/
│   │   ├── geminiClient.js   # Gemini Interactions API client
│   │   ├── sessionManager.js # Session/rate limit management
│   │   └── elevenLabsClient.js # ElevenLabs TTS/STT for voice messages
│   ├── Dockerfile            # Container configuration
│   └── package.json          # Dependencies
│
├── docker-compose.yml         # Multi-container orchestration
├── deploy.sh                  # VPS deployment script
├── index.html                 # Control panel HTML
├── panel-nginx.conf           # Control panel nginx config
├── .env.example               # Environment template
└── .github/workflows/deploy.yml # CI/CD pipeline
```

---

## Technology Stack

### Frontend
- **React 19** with hooks (useState, useEffect, useRef, useCallback)
- **Vite 7.2** - Build tool with HMR
- **Framer Motion 12** - Animations
- **Lucide React** - Icons
- **date-fns** - Date formatting

### Backend
- **Express 5** - Web framework
- **better-sqlite3 12** - Embedded SQL database
- **CORS** middleware

### Infrastructure
- **Docker & Docker Compose** - Container orchestration
- **Nginx** - Reverse proxy and static file serving
- **Node 22 Alpine** - Runtime image
- **GitHub Actions** - CI/CD

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         VPS Server                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐   ┌─────────────────────────────────┐  │
│  │  Port 80        │   │  Port 8080                       │  │
│  │  Nginx Frontend │   │  Nginx Control Panel             │  │
│  │  (React SPA)    │   │  (Static HTML)                   │  │
│  └────────┬────────┘   └─────────────┬───────────────────┘  │
│           │                          │                        │
│  ┌────────┴──────────────────────────┴───────────────────┐   │
│  │              Docker Network (waha-network)             │   │
│  │                                                        │   │
│  │  ┌────────────────────┐    ┌────────────────────────┐ │   │
│  │  │ chatty-backend     │    │ waha                   │ │   │
│  │  │ Express + SQLite   │◄──►│ WhatsApp HTTP API      │ │   │
│  │  │ Port 3002          │    │ Port 3001 (→3000)      │ │   │
│  │  └────────────────────┘    └────────────────────────┘ │   │
│  └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow
1. **Send message**: Frontend → Express backend → WAHA API → WhatsApp
2. **Receive message**: WhatsApp → WAHA webhook → Backend stores in SQLite → Frontend polls
3. **Session status**: Frontend polls WAHA → Displays connection state

---

## Development Commands

### Chatty UI (Main Dashboard)
```bash
cd chatty-ui
npm install            # Install dependencies
npm run dev            # Start frontend only (Vite on :5173)
npm run server         # Start backend only (Express on :3002)
npm start              # Run both concurrently
npm run build          # Production build
npm run lint           # ESLint check
```

### Message Bar Games
```bash
cd message-bar         # or message-bar-v2
npm install
npm run dev            # Vite dev server
npm run build          # Production build
```

### Docker (Full Stack)
```bash
# Start everything
docker-compose up -d --build

# View logs
docker-compose logs -f

# Restart specific service
docker restart chatty-backend

# Stop everything
docker-compose down

# Rebuild without cache
docker-compose build --no-cache
```

### Deployment
```bash
./deploy.sh YOUR_VPS_IP root   # Deploy to VPS via SSH
```

---

## API Endpoints

### Backend API (Port 3002)

**Favorites**
- `GET /api/favorites` - List all favorites
- `POST /api/favorites` - Add {phone, name}
- `DELETE /api/favorites/:phone` - Remove by phone

**Templates**
- `GET /api/templates` - List all templates
- `POST /api/templates` - Create {name, emoji, color, text}
- `DELETE /api/templates/:id` - Remove by ID

**Message History**
- `GET /api/history?limit=100` - Fetch sent messages
- `POST /api/history` - Log sent message

**Queue (Bulk Send)**
- `GET /api/queue` - List pending jobs
- `POST /api/queue` - Add batch jobs
- `PATCH /api/queue/:id` - Update job status
- `DELETE /api/queue` - Clear all

**Incoming Messages**
- `POST /api/webhook` - WAHA webhook receiver
- `GET /api/incoming?since=0&limit=10` - Fetch received messages
- `GET /api/incoming/count` - Count unread
- `DELETE /api/incoming` - Clear history

**Stats**
- `GET /api/stats` - Dashboard statistics

### WAHA API (Port 3001)

All requests require `X-Api-Key` header.

- `GET /api/sessions` - List sessions
- `PUT /api/sessions` - Create/restart session
- `POST /api/sessions/{id}/start` - Start session
- `POST /api/sessions/{id}/stop` - Stop session
- `POST /api/sendText` - Send message
- `GET /api/default/auth/qr` - Get QR code

### Gemini Bot API (Port 3003)

**Webhook**
- `POST /webhook` - WAHA webhook receiver (processes user messages, not groups)

**Session Management**
- `GET /health` - Health check + Gemini/ElevenLabs status
- `GET /session/:phone` - Get session status for a phone number
- `DELETE /session/:phone` - Manually end a session

**Session Limits:**
- 10 minute timeout per session
- Maximum 20 messages per session
- 1 session per user per hour (rate limit)
- Voice messages count as 2 messages for rate limiting

**Trigger Phrase:** "הבוט של אביץ" - Must be included in message to start session

**Voice Features (ElevenLabs):**
- Text-to-Speech: 10% chance for text replies, 70% for voice replies
- Speech-to-Text: Transcribes incoming voice messages
- Human-like behavior: typing indicators, recording indicators, random delays

**Configuration API (requires X-Api-Key header):**
- `GET /api/config` - Get all configuration
- `GET /api/config/system-prompt` - Get current system prompt
- `PUT /api/config/system-prompt` - Update system prompt `{systemPrompt: "..."}`
- `DELETE /api/config/system-prompt` - Reset to default prompt

**CLI Tool:**
```bash
cd gemini-bot
WAHA_API_KEY=your_key node cli.js get-prompt      # Get current prompt
WAHA_API_KEY=your_key node cli.js set-prompt "..." # Set new prompt
WAHA_API_KEY=your_key node cli.js reset-prompt    # Reset to default
WAHA_API_KEY=your_key node cli.js config          # Get all config
```

---

## Database Schema (SQLite)

### Chatty UI Database
Location: `/app/data/chatty.db` (Docker) or `./chatty.db` (dev)

```sql
favorites (id, phone UNIQUE, name, created_at)
templates (id, name, emoji, color, text, created_at)
message_history (id, phone, message, status, sent_at)
queue_jobs (id, phone, message, delay_seconds, status, created_at, processed_at)
incoming_messages (id, message_id UNIQUE, chat_id, phone, sender_name, message, timestamp, is_from_me, received_at)
```

### Gemini Bot Database
Location: `/app/data/gemini-bot.db` (Docker) or `./gemini-bot.db` (dev)

```sql
chat_sessions (id, phone, started_at, ended_at, message_count, end_reason)
bot_config (key PRIMARY KEY, value, updated_at)
```

---

## Environment Configuration

**.env file** (required at project root):
```bash
WAHA_API_KEY=your_secure_api_key   # Generate: openssl rand -hex 32
NODE_ENV=production

# Gemini Bot (required for AI chatbot)
GEMINI_API_KEY=your_gemini_api_key  # Get from: https://aistudio.google.com/apikey
GEMINI_MODEL=gemini-2.5-flash
# Default language is Hebrew
GEMINI_SYSTEM_PROMPT="אתה עוזר AI ידידותי בשם 'הבוט של אביץ'. ענה בעברית בצורה תמציתית וידידותית."

# ElevenLabs Voice (optional - for voice messages)
ELEVENLABS_API_KEY=your_elevenlabs_key  # Get from: https://elevenlabs.io/
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL  # Sarah (multilingual)
ELEVENLABS_MODEL=eleven_multilingual_v2   # TTS model
ELEVENLABS_STT_MODEL=scribe_v1            # STT model
```

### Runtime URLs
| Environment | WAHA URL | Backend URL |
|-------------|----------|-------------|
| Development | `http://localhost:3001` | `http://localhost:3002` |
| Production (Docker) | `http://waha:3000` | Internal network |
| Frontend (Docker) | `/waha` (nginx proxy) | `/api` (nginx proxy) |

---

## Code Conventions

### React (Chatty UI)
- Single large App.jsx component (~1900 lines) with hooks-based state
- localStorage for API key and settings persistence
- Polling for status updates (no WebSocket)
- Dark mode toggle using CSS classes

### Game Engine (Message Bar v2)
- Canvas-based rendering (60 FPS game loop)
- Entity classes: Game, Customer, Bottle, Effects
- SoundManager for Web Audio API synthesis
- Demo mode works without WAHA connection

### Backend (Express)
- RESTful API design
- SQLite with better-sqlite3 (synchronous queries)
- Webhook endpoint for WAHA events
- CORS enabled for local development

### CSS
- Component-scoped CSS files (App.css)
- Dark mode via `.dark` class on container
- Responsive design with CSS variables

---

## Common Tasks for AI Assistants

### Adding a New API Endpoint
1. Add route handler in `chatty-ui/server.js`
2. Create SQLite table if needed (check `initializeDatabase()`)
3. Add frontend API call in `chatty-ui/src/App.jsx`

### Modifying the UI
1. Edit `chatty-ui/src/App.jsx` (main component)
2. Update styles in `chatty-ui/src/App.css`
3. Test with `npm run dev` in chatty-ui directory

### Updating Game Logic (Message Bar v2)
1. Game loop: `message-bar-v2/src/game/Game.js`
2. Game constants: `message-bar-v2/src/game/constants.js`
3. Entity classes in `message-bar-v2/src/game/`

### Docker Changes
1. Modify `docker-compose.yml` for service configuration
2. Update Dockerfiles for build changes
3. Rebuild with `docker-compose up -d --build`

### Environment Setup for Testing
```bash
# Start WAHA only
docker run -d --name waha -p 3001:3000 \
  -e WHATSAPP_API_KEY=testkey \
  devlikeapro/waha

# Run frontend + backend locally
cd chatty-ui && npm start
```

---

## File References

| Purpose | File Path |
|---------|-----------|
| Main dashboard | `chatty-ui/src/App.jsx` |
| Backend API | `chatty-ui/server.js` |
| API config | `chatty-ui/src/config.js` |
| Gemini Bot server | `gemini-bot/server.js` |
| Gemini API client | `gemini-bot/src/geminiClient.js` |
| Session manager | `gemini-bot/src/sessionManager.js` |
| ElevenLabs TTS/STT | `gemini-bot/src/elevenLabsClient.js` |
| Bot config CLI | `gemini-bot/cli.js` |
| Game engine | `message-bar-v2/src/game/Game.js` |
| Game constants | `message-bar-v2/src/game/constants.js` |
| Docker setup | `docker-compose.yml` |
| Deploy script | `deploy.sh` |
| CI/CD | `.github/workflows/deploy.yml` |
| Control panel | `index.html` |

---

## Port Summary

| Port | Service | Purpose |
|------|---------|---------|
| 80 | chatty-frontend | React dashboard (nginx) |
| 3001 | waha | WhatsApp HTTP API |
| 3002 | chatty-backend | Express + SQLite API |
| 3003 | gemini-bot | AI chatbot service |
| 8080 | waha-panel | Control panel (nginx) |
| 5173 | vite dev | Local development only |

---

## Security Notes

- API key stored in `.env` (never commit)
- All WAHA requests require `X-Api-Key` header
- No user authentication system (single-user deployment)
- SQLite database in Docker volume
- Consider SSL termination with reverse proxy for production
