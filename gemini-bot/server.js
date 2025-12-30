import express from 'express';
import sessionManager, { SESSION_TIMEOUT_MS, MAX_MESSAGES_PER_SESSION } from './src/sessionManager.js';
import { sendMessage, clearSession, healthCheck } from './src/geminiClient.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3003;
const WAHA_URL = process.env.WAHA_URL || 'http://waha:3000';
const WAHA_API_KEY = process.env.WAHA_API_KEY;
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || 'You are a helpful assistant.';

// Session start keywords (user can type these to start a new session)
const START_KEYWORDS = ['start', 'begin', 'hello', 'hi', 'hey', 'שלום', 'היי'];
const END_KEYWORDS = ['end', 'stop', 'bye', 'quit', 'exit', 'סיום', 'ביי'];

/**
 * Send a WhatsApp message via WAHA API
 */
async function sendWhatsAppMessage(phone, text) {
  try {
    const response = await fetch(`${WAHA_URL}/api/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': WAHA_API_KEY
      },
      body: JSON.stringify({
        session: 'default',
        chatId: `${phone}@c.us`,
        text: text
      })
    });

    if (!response.ok) {
      console.error('Failed to send WhatsApp message:', await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.message);
    return false;
  }
}

/**
 * Format time remaining for user display
 */
function formatTimeRemaining(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

/**
 * Get welcome message when session starts
 */
function getWelcomeMessage() {
  const timeoutMinutes = Math.floor(SESSION_TIMEOUT_MS / 60000);
  return `🤖 *AI Chat Session Started!*

📝 Session limits:
• ${MAX_MESSAGES_PER_SESSION} messages maximum
• ${timeoutMinutes} minute timeout
• 1 session per hour

Type your message to begin chatting.
Send "end" or "stop" to end the session.`;
}

/**
 * Handle incoming webhook from WAHA
 */
app.post('/webhook', async (req, res) => {
  try {
    const { event, payload } = req.body;

    // Only process incoming messages
    if (event !== 'message' && event !== 'message.any') {
      return res.sendStatus(200);
    }

    // Extract message details
    const message = payload;
    const chatId = message.from || message.chatId;

    // Skip group messages (only handle individual chats)
    if (!chatId || chatId.includes('@g.us')) {
      return res.sendStatus(200);
    }

    // Skip messages from self
    if (message.fromMe) {
      return res.sendStatus(200);
    }

    // Extract phone number (remove @c.us suffix)
    const phone = chatId.replace('@c.us', '');

    // Get message text
    const text = message.body || message.text || '';
    if (!text.trim()) {
      return res.sendStatus(200);
    }

    const lowerText = text.toLowerCase().trim();
    console.log(`[${phone}] Received: ${text.substring(0, 50)}...`);

    // Check for end keywords
    if (END_KEYWORDS.includes(lowerText)) {
      const session = sessionManager.getSession(phone);
      if (session) {
        sessionManager.endSession(phone, 'user_ended');
        clearSession(phone);
        await sendWhatsAppMessage(phone, '👋 Session ended. Thank you for chatting!');
      } else {
        await sendWhatsAppMessage(phone, 'No active session to end.');
      }
      return res.sendStatus(200);
    }

    // Check if user has an active session
    let session = sessionManager.getSession(phone);

    // If no session, check if they can start one
    if (!session) {
      const canStart = sessionManager.canStartSession(phone);

      if (!canStart.allowed) {
        await sendWhatsAppMessage(phone,
          `⏳ Rate limit: You can start a new session in ${canStart.waitMinutes} minute(s).`
        );
        return res.sendStatus(200);
      }

      // Check for start keywords or just start automatically
      if (START_KEYWORDS.includes(lowerText)) {
        sessionManager.startSession(phone);
        await sendWhatsAppMessage(phone, getWelcomeMessage());
        return res.sendStatus(200);
      }

      // Auto-start session on any message
      sessionManager.startSession(phone);
      session = sessionManager.getSession(phone);

      // Send welcome message first
      await sendWhatsAppMessage(phone, getWelcomeMessage());
    }

    // Check if session can accept more messages
    const canSend = sessionManager.canSendMessage(phone);

    if (!canSend.allowed) {
      clearSession(phone);

      if (canSend.reason === 'max_messages') {
        await sendWhatsAppMessage(phone,
          `📊 Session ended: Maximum ${MAX_MESSAGES_PER_SESSION} messages reached.\n\nYou can start a new session in 1 hour.`
        );
      } else if (canSend.reason === 'timeout') {
        await sendWhatsAppMessage(phone,
          `⏰ Session ended: Timeout reached.\n\nYou can start a new session in 1 hour.`
        );
      }
      return res.sendStatus(200);
    }

    // Send message to Gemini
    const result = await sendMessage(phone, text, SYSTEM_PROMPT);

    if (result.success) {
      // Record the message
      sessionManager.recordMessage(phone);

      // Add session info footer
      const footer = `\n\n_[${canSend.messagesRemaining - 1} messages left | ${formatTimeRemaining(canSend.timeRemainingMs)} remaining]_`;

      await sendWhatsAppMessage(phone, result.text + footer);
    } else {
      await sendWhatsAppMessage(phone, `❌ Sorry, I couldn't process that. Error: ${result.error}`);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

/**
 * Health check endpoint
 */
app.get('/health', async (req, res) => {
  const geminiHealth = await healthCheck();
  res.json({
    status: 'ok',
    gemini: geminiHealth,
    activeSessions: sessionManager.activeSessions.size
  });
});

/**
 * Get session status for a phone number
 */
app.get('/session/:phone', (req, res) => {
  const status = sessionManager.getSessionStatus(req.params.phone);
  res.json(status);
});

/**
 * Manually end a session
 */
app.delete('/session/:phone', (req, res) => {
  const phone = req.params.phone;
  sessionManager.endSession(phone, 'admin');
  clearSession(phone);
  res.json({ success: true, message: 'Session ended' });
});

// Cleanup expired sessions every minute
setInterval(() => {
  sessionManager.cleanupExpiredSessions();
}, 60000);

// Start server
app.listen(PORT, () => {
  console.log(`🤖 Gemini Bot server running on port ${PORT}`);
  console.log(`📡 Expecting webhooks from WAHA at ${WAHA_URL}`);
  console.log(`⏱️  Session timeout: ${SESSION_TIMEOUT_MS / 60000} minutes`);
  console.log(`📊 Max messages per session: ${MAX_MESSAGES_PER_SESSION}`);
  console.log(`🔒 Rate limit: 1 session per hour`);
});
