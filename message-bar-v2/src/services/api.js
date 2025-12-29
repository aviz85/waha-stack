// ===== MESSAGE BAR V2 - API SERVICE =====
// Connects to WAHA (WhatsApp HTTP API)
// Works with WAHA only - no separate backend needed!

// API Configuration
export const CONFIG = {
  WAHA_URL: 'http://localhost:3001',
  API_KEY: 'myapikey',
  SESSION: 'default',
};

// Track state
let demoMode = false;
let lastPollTime = 0;
let seenMessageIds = new Set();

export const isDemoMode = () => demoMode;
export const setDemoMode = (value) => { demoMode = value; };

// ===== WAHA API =====

export async function wahaApi(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Api-Key': CONFIG.API_KEY,
  };
  const options = { method, headers, mode: 'cors' };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${CONFIG.WAHA_URL}${endpoint}`, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Check WAHA session status
export async function getSessionStatus() {
  try {
    const sessions = await wahaApi('/api/sessions?all=true');
    if (sessions.length > 0) {
      const session = sessions.find(s => s.name === CONFIG.SESSION) || sessions[0];
      return session;
    }
    return null;
  } catch (e) {
    console.error('Failed to get session status:', e);
    return null;
  }
}

// Send message via WAHA
export async function sendWhatsAppMessage(phone, message) {
  if (demoMode) return { success: true, demo: true };

  try {
    // Format phone number to chatId
    const cleanPhone = phone.replace(/\D/g, '');
    const chatId = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@c.us`;

    await wahaApi('/api/sendText', 'POST', {
      session: CONFIG.SESSION,
      chatId: chatId,
      text: message,
    });
    return { success: true };
  } catch (e) {
    console.error('Failed to send WhatsApp message:', e);
    return { success: false, error: e.message };
  }
}

// Check if chat is private (not group/status)
function isPrivateChat(chatId) {
  if (!chatId) return false;
  if (chatId.includes('@g.us')) return false; // Group
  if (chatId.includes('@broadcast')) return false; // Broadcast
  if (chatId.includes('status@')) return false; // Status
  if (chatId.includes('@newsletter')) return false; // Channels
  return chatId.includes('@c.us') || chatId.includes('@s.whatsapp.net');
}

// Fetch incoming messages directly from WAHA
export async function fetchIncomingMessages(limit = 10) {
  if (demoMode) return { success: true, messages: [], demo: true };

  try {
    // Get list of chats
    const chats = await wahaApi(`/api/${CONFIG.SESSION}/chats`);

    const newMessages = [];

    // Get recent messages from each private chat
    for (const chat of chats.slice(0, 10)) { // Limit to 10 chats for performance
      if (!isPrivateChat(chat.id)) continue;

      try {
        // Get last few messages from this chat
        const messages = await wahaApi(
          `/api/${CONFIG.SESSION}/chats/${encodeURIComponent(chat.id)}/messages?limit=5&downloadMedia=false`
        );

        for (const msg of messages) {
          // Skip if already seen, from me, or not a text message
          if (seenMessageIds.has(msg.id)) continue;
          if (msg.fromMe) continue;
          if (!msg.body) continue;

          // Check if message is recent (last 5 minutes)
          const msgTime = msg.timestamp * 1000;
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
          if (msgTime < fiveMinutesAgo) continue;

          seenMessageIds.add(msg.id);

          newMessages.push({
            id: msg.id,
            phone: chat.id.split('@')[0],
            chat_id: chat.id,
            message: msg.body,
            sender_name: chat.name || chat.id.split('@')[0],
            timestamp: msg.timestamp,
            is_from_me: msg.fromMe,
          });
        }
      } catch (e) {
        // Skip this chat if we can't get messages
        console.warn(`Failed to get messages for ${chat.id}:`, e.message);
      }
    }

    // Sort by timestamp (newest first) and limit
    newMessages.sort((a, b) => b.timestamp - a.timestamp);

    return { success: true, messages: newMessages.slice(0, limit) };
  } catch (e) {
    console.error('Failed to fetch incoming messages:', e);
    return { success: false, messages: [] };
  }
}

// Log sent message (just console log since no backend)
export async function logMessageToHistory(phone, message, status = 'sent') {
  console.log(`[Message Log] ${status}: ${phone} - ${message.substring(0, 50)}...`);
  return { success: true };
}

// ===== CONNECTION TEST =====

export async function testConnection() {
  let wahaConnected = false;
  let sessionActive = false;

  try {
    const session = await getSessionStatus();
    wahaConnected = true;
    sessionActive = session?.status === 'WORKING';

    console.log('WAHA connection:', {
      connected: wahaConnected,
      session: session?.name,
      status: session?.status,
    });
  } catch (e) {
    console.warn('WAHA not available:', e.message);
  }

  // Demo mode if WAHA not connected OR session not active
  demoMode = !wahaConnected || !sessionActive;

  return {
    wahaConnected,
    sessionActive,
    demoMode,
  };
}

// Reset message tracking (for new game)
export function resetMessageTracking() {
  seenMessageIds.clear();
  lastPollTime = 0;
}
