import express from 'express';
import sessionManager, { SESSION_TIMEOUT_MS, MAX_MESSAGES_PER_SESSION } from './src/sessionManager.js';
import { sendMessage, clearSession, healthCheck } from './src/geminiClient.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3003;
const WAHA_URL = process.env.WAHA_URL || 'http://waha:3000';
const WAHA_API_KEY = process.env.WAHA_API_KEY;
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || 'You are a helpful assistant.';

// Session trigger phrase (must be included in message to start session)
const SESSION_TRIGGER = 'הבוט של אביץ';

// End keywords to close session
const END_KEYWORDS = ['end', 'stop', 'bye', 'quit', 'exit', 'סיום', 'ביי', 'יציאה'];

// Typing speed simulation (characters per second, human-like range)
const TYPING_SPEED_MIN = 30;  // slow typer
const TYPING_SPEED_MAX = 60;  // fast typer

// Pause/hesitation probabilities
const TYPING_PAUSE_CHANCE = 0.3;  // 30% chance to pause while typing
const TYPING_PAUSE_MIN = 800;     // min pause duration
const TYPING_PAUSE_MAX = 2500;    // max pause duration

/**
 * Generate random delay in ms (for human-like behavior)
 */
function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if event should happen based on probability (0-1)
 */
function shouldHappen(probability) {
  return Math.random() < probability;
}

/**
 * Calculate typing segments with possible pauses
 * Returns array of {duration, pauseAfter} objects
 */
function calculateTypingSegments(text) {
  const charCount = text.length;
  const typingSpeed = randomDelay(TYPING_SPEED_MIN, TYPING_SPEED_MAX);
  const totalDuration = Math.min((charCount / typingSpeed) * 1000, 20000);

  // For short messages, no segments
  if (totalDuration < 3000) {
    return [{ duration: totalDuration, pauseAfter: 0 }];
  }

  // Split into 2-4 segments for longer messages
  const numSegments = randomDelay(2, Math.min(4, Math.ceil(totalDuration / 3000)));
  const segments = [];
  let remainingDuration = totalDuration;

  for (let i = 0; i < numSegments; i++) {
    const isLast = i === numSegments - 1;
    const segmentDuration = isLast
      ? remainingDuration
      : randomDelay(remainingDuration * 0.2, remainingDuration * 0.5);

    remainingDuration -= segmentDuration;

    // Add pause after segment (except last one)
    const pauseAfter = !isLast && shouldHappen(TYPING_PAUSE_CHANCE)
      ? randomDelay(TYPING_PAUSE_MIN, TYPING_PAUSE_MAX)
      : 0;

    segments.push({ duration: segmentDuration, pauseAfter });
  }

  return segments;
}

/**
 * Mark message as seen (read receipts)
 */
async function markAsSeen(chatId) {
  try {
    const response = await fetch(`${WAHA_URL}/api/sendSeen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': WAHA_API_KEY
      },
      body: JSON.stringify({
        session: 'default',
        chatId: chatId
      })
    });

    if (!response.ok) {
      console.error('Failed to mark as seen:', await response.text());
      return false;
    }
    console.log(`[${chatId}] Marked as seen`);
    return true;
  } catch (error) {
    console.error('Error marking as seen:', error.message);
    return false;
  }
}

/**
 * Start typing indicator
 */
async function startTyping(chatId) {
  try {
    const response = await fetch(`${WAHA_URL}/api/startTyping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': WAHA_API_KEY
      },
      body: JSON.stringify({
        session: 'default',
        chatId: chatId
      })
    });

    if (!response.ok) {
      console.error('Failed to start typing:', await response.text());
      return false;
    }
    console.log(`[${chatId}] Started typing`);
    return true;
  } catch (error) {
    console.error('Error starting typing:', error.message);
    return false;
  }
}

/**
 * Stop typing indicator
 */
async function stopTyping(chatId) {
  try {
    const response = await fetch(`${WAHA_URL}/api/stopTyping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': WAHA_API_KEY
      },
      body: JSON.stringify({
        session: 'default',
        chatId: chatId
      })
    });

    if (!response.ok) {
      console.error('Failed to stop typing:', await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error stopping typing:', error.message);
    return false;
  }
}

/**
 * Send a WhatsApp message via WAHA API with human-like behavior
 */
async function sendWhatsAppMessage(chatId, text) {
  try {
    // 1. Mark message as seen first (with small random delay)
    await sleep(randomDelay(300, 800));
    await markAsSeen(chatId);

    // 2. Random pause before starting to type (reading/thinking time)
    const readingTime = randomDelay(800, 2500);
    console.log(`[${chatId}] Reading for ${Math.round(readingTime / 1000)}s...`);
    await sleep(readingTime);

    // 3. Calculate typing segments with pauses
    const segments = calculateTypingSegments(text);
    const totalTypingTime = segments.reduce((sum, s) => sum + s.duration + s.pauseAfter, 0);
    console.log(`[${chatId}] Typing in ${segments.length} segment(s) for ~${Math.round(totalTypingTime / 1000)}s...`);

    // 4. Execute typing with segments and pauses
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      // Start typing
      await startTyping(chatId);

      // Type for segment duration
      await sleep(segment.duration);

      // If there's a pause after this segment, stop typing and pause
      if (segment.pauseAfter > 0) {
        await stopTyping(chatId);
        console.log(`[${chatId}] Pausing (thinking)...`);
        await sleep(segment.pauseAfter);
      }
    }

    // 5. Stop typing
    await stopTyping(chatId);

    // 6. Random delay before sending (reviewing message, like hovering over send)
    const preSendDelay = randomDelay(300, 1200);
    console.log(`[${chatId}] Reviewing before send (${preSendDelay}ms)...`);
    await sleep(preSendDelay);

    // 7. Send the message
    const response = await fetch(`${WAHA_URL}/api/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': WAHA_API_KEY
      },
      body: JSON.stringify({
        session: 'default',
        chatId: chatId,
        text: text
      })
    });

    if (!response.ok) {
      console.error('Failed to send WhatsApp message:', await response.text());
      return false;
    }
    console.log(`[${chatId}] Message sent`);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.message);
    return false;
  }
}

/**
 * Quick response without full human simulation (for system messages)
 */
async function sendQuickMessage(chatId, text) {
  try {
    await markAsSeen(chatId);
    await sleep(randomDelay(200, 500));

    const response = await fetch(`${WAHA_URL}/api/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': WAHA_API_KEY
      },
      body: JSON.stringify({
        session: 'default',
        chatId: chatId,
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
  return `🤖 *הבוט של אביץ' - AI Chat Session Started!*

📝 Session limits:
• ${MAX_MESSAGES_PER_SESSION} messages maximum
• ${timeoutMinutes} minute timeout
• 1 session per hour

Type your message to begin chatting.
Send "סיום" or "end" to end the session.`;
}

/**
 * Handle incoming webhook from WAHA
 */
app.post('/webhook', async (req, res) => {
  // Respond immediately to webhook (don't block WAHA)
  res.sendStatus(200);

  try {
    const { event, payload } = req.body;

    // Only process incoming messages
    if (event !== 'message' && event !== 'message.any') {
      return;
    }

    // Extract message details
    const message = payload;
    const chatId = message.from || message.chatId;

    // Skip group messages (only handle individual chats)
    if (!chatId || chatId.includes('@g.us')) {
      return;
    }

    // Skip messages from self
    if (message.fromMe) {
      return;
    }

    // Extract phone number (remove @c.us suffix)
    const phone = chatId.replace('@c.us', '');

    // Get message text
    const text = message.body || message.text || '';
    if (!text.trim()) {
      return;
    }

    const lowerText = text.toLowerCase().trim();
    console.log(`[${phone}] Received: ${text.substring(0, 50)}...`);

    // Check for end keywords (only if session is active)
    const existingSession = sessionManager.getSession(phone);
    if (existingSession && END_KEYWORDS.some(kw => lowerText === kw || lowerText.includes(kw))) {
      sessionManager.endSession(phone, 'user_ended');
      clearSession(phone);
      await sendQuickMessage(chatId, '👋 Session ended. Thank you for chatting!\n\nTo start again, send a message with "הבוט של אביץ"');
      return;
    }

    // Check if user has an active session
    let session = sessionManager.getSession(phone);

    // If no session, check if message contains the trigger phrase
    if (!session) {
      // Check if message contains the trigger phrase
      if (!text.includes(SESSION_TRIGGER)) {
        // Silently ignore - don't respond to messages without trigger
        console.log(`[${phone}] Ignored: missing trigger phrase`);
        return;
      }

      // Check rate limit
      const canStart = sessionManager.canStartSession(phone);
      if (!canStart.allowed) {
        await sendQuickMessage(chatId,
          `⏳ Rate limit: You can start a new session in ${canStart.waitMinutes} minute(s).`
        );
        return;
      }

      // Start new session
      sessionManager.startSession(phone);
      session = sessionManager.getSession(phone);
      console.log(`[${phone}] Session started`);

      // Send welcome message
      await sendWhatsAppMessage(chatId, getWelcomeMessage());

      // If the trigger message contains more than just the trigger, process it
      const messageWithoutTrigger = text.replace(SESSION_TRIGGER, '').trim();
      if (!messageWithoutTrigger) {
        // Only trigger phrase, wait for next message
        return;
      }

      // Process the remaining message as first question
      const canSend = sessionManager.canSendMessage(phone);
      if (!canSend.allowed) {
        return;
      }

      // Get response from Gemini
      const result = await sendMessage(phone, messageWithoutTrigger, SYSTEM_PROMPT);

      if (result.success) {
        sessionManager.recordMessage(phone);
        const footer = `\n\n_[${canSend.messagesRemaining - 1} messages left | ${formatTimeRemaining(canSend.timeRemainingMs)} remaining]_`;
        await sendWhatsAppMessage(chatId, result.text + footer);
      } else {
        await sendQuickMessage(chatId, `❌ Sorry, I couldn't process that. Error: ${result.error}`);
      }
      return;
    }

    // Session exists - process message
    const canSend = sessionManager.canSendMessage(phone);

    if (!canSend.allowed) {
      clearSession(phone);

      if (canSend.reason === 'max_messages') {
        await sendQuickMessage(chatId,
          `📊 Session ended: Maximum ${MAX_MESSAGES_PER_SESSION} messages reached.\n\nYou can start a new session in 1 hour by sending "הבוט של אביץ"`
        );
      } else if (canSend.reason === 'timeout') {
        await sendQuickMessage(chatId,
          `⏰ Session ended: Timeout reached.\n\nYou can start a new session in 1 hour by sending "הבוט של אביץ"`
        );
      }
      return;
    }

    // Get response from Gemini
    const result = await sendMessage(phone, text, SYSTEM_PROMPT);

    if (result.success) {
      sessionManager.recordMessage(phone);
      const footer = `\n\n_[${canSend.messagesRemaining - 1} messages left | ${formatTimeRemaining(canSend.timeRemainingMs)} remaining]_`;
      await sendWhatsAppMessage(chatId, result.text + footer);
    } else {
      await sendQuickMessage(chatId, `❌ Sorry, I couldn't process that. Error: ${result.error}`);
    }

  } catch (error) {
    console.error('Webhook error:', error);
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
    activeSessions: sessionManager.activeSessions.size,
    trigger: SESSION_TRIGGER
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
  console.log(`🎯 Session trigger: "${SESSION_TRIGGER}"`);
  console.log(`⏱️  Session timeout: ${SESSION_TIMEOUT_MS / 60000} minutes`);
  console.log(`📊 Max messages per session: ${MAX_MESSAGES_PER_SESSION}`);
  console.log(`🔒 Rate limit: 1 session per hour`);
});
