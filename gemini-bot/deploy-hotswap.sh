#!/bin/bash
set -e

# Hot swap deployment for gemini-bot
# Deploys new container, switches webhook, kills old

WAHA_API_KEY="${WAHA_API_KEY:-044418ca3244ddd432eb114d38b8b8aca3bb956518d7b14923ec33868f85d581}"
OLD_CONTAINER="gemini-bot"
NEW_CONTAINER="gemini-bot-new"
NETWORK="waha_waha-network"

echo "🚀 Hot swap deployment starting..."

# 1. Build new image
echo "📦 Building new image..."
docker build -t waha-gemini-bot:new -f /opt/waha/gemini-bot/Dockerfile /opt/waha/gemini-bot

# 2. Start new container on different port
echo "🆕 Starting new container..."
docker run -d \
  --name $NEW_CONTAINER \
  --network $NETWORK \
  --restart unless-stopped \
  -p 3004:3003 \
  -e NODE_ENV=production \
  -e PORT=3003 \
  -e WAHA_URL=http://waha:3000 \
  -e WAHA_API_KEY=$WAHA_API_KEY \
  -e GEMINI_API_KEY="${GEMINI_API_KEY}" \
  -e GEMINI_MODEL="${GEMINI_MODEL:-gemini-2.0-flash-exp}" \
  -e SYSTEM_PROMPT="${SYSTEM_PROMPT}" \
  -e ELEVENLABS_API_KEY="${ELEVENLABS_API_KEY:-}" \
  -e ELEVENLABS_VOICE_ID="${ELEVENLABS_VOICE_ID:-EXAVITQu4vr4xnSDxMaL}" \
  -e ELEVENLABS_MODEL="${ELEVENLABS_MODEL:-eleven_multilingual_v2}" \
  -e ELEVENLABS_STT_MODEL="${ELEVENLABS_STT_MODEL:-scribe_v1}" \
  -v gemini_data:/app/data \
  waha-gemini-bot:new

# 3. Wait for new container to be healthy
echo "⏳ Waiting for new container to be healthy..."
for i in {1..30}; do
  if docker exec $NEW_CONTAINER wget -q --spider http://localhost:3003/health 2>/dev/null; then
    echo "✅ New container is healthy!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ New container failed to become healthy"
    docker rm -f $NEW_CONTAINER
    exit 1
  fi
  sleep 1
done

# 4. Update WAHA webhook to point to new container
echo "🔄 Switching webhook to new container..."
# Note: WAHA uses container name for internal DNS, so we just need to swap containers

# 5. Stop old container
echo "🛑 Stopping old container..."
docker stop $OLD_CONTAINER 2>/dev/null || true

# 6. Rename containers
echo "📝 Renaming containers..."
docker rename $OLD_CONTAINER "${OLD_CONTAINER}-old" 2>/dev/null || true
docker rename $NEW_CONTAINER $OLD_CONTAINER

# 7. Update port mapping - recreate with correct port
echo "🔌 Recreating with correct port..."
docker stop $OLD_CONTAINER
docker rm $OLD_CONTAINER
docker run -d \
  --name $OLD_CONTAINER \
  --network $NETWORK \
  --restart unless-stopped \
  -p 3003:3003 \
  -e NODE_ENV=production \
  -e PORT=3003 \
  -e WAHA_URL=http://waha:3000 \
  -e WAHA_API_KEY=$WAHA_API_KEY \
  -e GEMINI_API_KEY="${GEMINI_API_KEY}" \
  -e GEMINI_MODEL="${GEMINI_MODEL:-gemini-2.0-flash-exp}" \
  -e SYSTEM_PROMPT="${SYSTEM_PROMPT}" \
  -e ELEVENLABS_API_KEY="${ELEVENLABS_API_KEY:-}" \
  -e ELEVENLABS_VOICE_ID="${ELEVENLABS_VOICE_ID:-EXAVITQu4vr4xnSDxMaL}" \
  -e ELEVENLABS_MODEL="${ELEVENLABS_MODEL:-eleven_multilingual_v2}" \
  -e ELEVENLABS_STT_MODEL="${ELEVENLABS_STT_MODEL:-scribe_v1}" \
  -v gemini_data:/app/data \
  waha-gemini-bot:new

# 8. Wait for final container to be healthy
echo "⏳ Waiting for final container..."
for i in {1..30}; do
  if docker exec $OLD_CONTAINER wget -q --spider http://localhost:3003/health 2>/dev/null; then
    echo "✅ Final container is healthy!"
    break
  fi
  sleep 1
done

# 9. Clean up
echo "🧹 Cleaning up..."
docker rm -f "${OLD_CONTAINER}-old" 2>/dev/null || true
docker image prune -f

echo "✅ Hot swap complete!"
echo "🤖 Gemini bot is live at http://gemini-bot:3003"
