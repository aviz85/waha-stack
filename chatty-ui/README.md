# Chatty UI - WhatsApp Automation Dashboard

A fun, Waze-inspired WhatsApp automation dashboard built with React + Vite, powered by WAHA (WhatsApp HTTP API).

## Prerequisites

- Node.js 18+
- Docker
- npm or yarn

## Quick Start

### 1. Start WAHA (WhatsApp API)

```bash
docker run -d --name waha \
  -p 3001:3000 \
  -e WHATSAPP_API_KEY=myapikey \
  -e WHATSAPP_DEFAULT_ENGINE=NOWEB \
  devlikeapro/waha
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the App

```bash
npm start
```

This runs both:
- **Backend** (Express + SQLite) on `http://localhost:3002`
- **Frontend** (Vite + React) on `http://localhost:5173`

### 4. Connect WhatsApp

1. Open `http://localhost:5173`
2. Click **Reconnect** in the header
3. Scan the QR code with WhatsApp on your phone
4. Wait for "WORKING" status

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start both frontend and backend |
| `npm run dev` | Start frontend only |
| `npm run server` | Start backend only |
| `npm run build` | Build for production |

## Features

- **Quick Send** - Send messages to any phone number
- **Bulk Send** - Queue messages to multiple recipients
- **Templates** - Save and reuse message templates
- **Favorites** - Quick access to frequent contacts
- **Contact Checker** - Verify WhatsApp numbers
- **Chats** - View recent conversations (requires store)
- **Queue Manager** - Monitor bulk send progress

## API Endpoints

### WAHA (port 3001)
- `GET /api/sessions` - List sessions
- `PUT /api/sessions` - Create/restart session
- `GET /api/default/auth/qr` - Get QR code
- `POST /api/sendText` - Send message

### Backend (port 3002)
- `GET/POST /api/favorites` - Manage favorites
- `GET/POST /api/templates` - Manage templates
- `GET/POST /api/history` - Message history
- `GET/POST /api/queue` - Message queue
- `GET /api/stats` - Dashboard stats

## Configuration

Edit `src/App.jsx` to change:

```javascript
const WAHA_URL = 'http://localhost:3001'
const API_URL = 'http://localhost:3002'
const API_KEY = 'myapikey'
```

## Troubleshooting

### QR Code not scanning
- Wait 15-30 minutes (WhatsApp rate limit)
- Remove old linked devices from WhatsApp settings
- Restart WAHA: `docker restart waha`

### Session errors
- Stop and recreate: `docker stop waha && docker rm waha` then start again
- Check logs: `docker logs waha`

### 422 "Session already exists"
- The app now handles this automatically with PUT requests
- If issues persist, restart WAHA container

## Tech Stack

- **Frontend**: React 19, Vite, Framer Motion, Lucide Icons
- **Backend**: Express 5, better-sqlite3
- **WhatsApp**: WAHA (devlikeapro/waha)
