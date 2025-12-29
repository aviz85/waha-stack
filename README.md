# WAHA WhatsApp Automation Stack

A complete WhatsApp automation platform with:
- **WAHA** - WhatsApp HTTP API server
- **Chatty UI** - Modern React dashboard for sending messages
- **Control Panel** - Lightweight HTML panel for WAHA management

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your VPS Server                       │
├─────────────────────────────────────────────────────────┤
│  Port 80    │  Chatty Dashboard (React + nginx)         │
│  Port 8080  │  WAHA Control Panel (Static HTML)         │
│  Port 3001  │  WAHA API (WhatsApp HTTP API)             │
│  Port 3002  │  Chatty Backend (Express + SQLite)        │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Clone and Configure

```bash
# Copy environment template
cp .env.example .env

# Edit .env and set your API key
# Generate a secure key: openssl rand -hex 32
```

### 2. Deploy to VPS

```bash
# Deploy to your server
./deploy.sh YOUR_VPS_IP root
```

### 3. Access Your Services

| Service | URL | Description |
|---------|-----|-------------|
| Chatty Dashboard | `http://YOUR_IP` | Main WhatsApp automation UI |
| Control Panel | `http://YOUR_IP:8080` | WAHA session management |
| WAHA API | `http://YOUR_IP:3001` | REST API for WhatsApp |
| Backend API | `http://YOUR_IP:3002` | Message history & favorites |

## Local Development

```bash
# Start WAHA container
docker run -d --name waha -p 3001:3000 \
  -e WHATSAPP_API_KEY=myapikey \
  devlikeapro/waha

# Start Chatty UI
cd chatty-ui
npm install
npm start
```

## API Authentication

All requests to WAHA require the `X-Api-Key` header:

```bash
curl -H "X-Api-Key: YOUR_API_KEY" http://YOUR_IP:3001/api/sessions
```

## Configuration

### Environment Variables (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `WAHA_API_KEY` | API key for authentication | Required |
| `NODE_ENV` | Environment mode | production |

### Docker Services

| Service | Image | Purpose |
|---------|-------|---------|
| waha | devlikeapro/waha | WhatsApp API engine |
| chatty-backend | Custom build | Express + SQLite backend |
| chatty-frontend | Custom build | React frontend via nginx |
| waha-panel | nginx:alpine | Static control panel |

## Troubleshooting

### QR Code Not Loading
1. Check WAHA logs: `docker logs waha`
2. Restart WAHA: `docker restart waha`
3. Wait 15-30 minutes if rate-limited by WhatsApp

### Session Issues
1. Logout from WhatsApp Web on your phone
2. Remove linked devices
3. Restart the session via Control Panel

### Connection Refused
1. Check if containers are running: `docker ps`
2. Check firewall rules for ports 80, 3001, 3002, 8080
3. View container logs: `docker-compose logs -f`

## Security Notes

- Change the default API key immediately
- Consider using a reverse proxy with SSL (Nginx/Traefik)
- Restrict access to management ports (3002, 8080) if not needed publicly
- Never expose sensitive credentials in git

## License

MIT
