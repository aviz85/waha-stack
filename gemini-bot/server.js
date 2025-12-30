import express from 'express';
import sessionManager, { SESSION_TIMEOUT_MS, MAX_MESSAGES_PER_SESSION } from './src/sessionManager.js';
import { sendMessage, clearSession, healthCheck } from './src/geminiClient.js';
import * as elevenLabs from './src/elevenLabsClient.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3003;
const WAHA_URL = process.env.WAHA_URL || 'http://waha:3000';
const WAHA_API_KEY = process.env.WAHA_API_KEY;
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || 'You are a helpful assistant.';

// Recording indicator settings
const RECORDING_DURATION_MIN = 2000;  // min recording indicator duration
const RECORDING_DURATION_MAX = 5000;  // max recording indicator duration

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
 * Start recording indicator (for voice messages)
 */
async function startRecording(chatId) {
  try {
    const response = await fetch(`${WAHA_URL}/api/default/presence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': WAHA_API_KEY
      },
      body: JSON.stringify({
        chatId: chatId,
        presence: 'recording'
      })
    });

    if (!response.ok) {
      console.error('Failed to start recording:', await response.text());
      return false;
    }
    console.log(`[${chatId}] Started recording indicator`);
    return true;
  } catch (error) {
    console.error('Error starting recording:', error.message);
    return false;
  }
}

/**
 * Send a voice message via WAHA API
 */
async function sendVoiceMessage(chatId, audioBase64, mimetype = 'audio/mpeg') {
  try {
    const response = await fetch(`${WAHA_URL}/api/sendVoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': WAHA_API_KEY
      },
      body: JSON.stringify({
        session: 'default',
        chatId: chatId,
        file: {
          mimetype: mimetype,
          filename: 'voice.mp3',
          data: audioBase64
        }
      })
    });

    if (!response.ok) {
      console.error('Failed to send voice message:', await response.text());
      return false;
    }
    console.log(`[${chatId}] Voice message sent`);
    return true;
  } catch (error) {
    console.error('Error sending voice message:', error.message);
    return false;
  }
}

/**
 * Download media from WAHA
 */
async function downloadMedia(messageId) {
  try {
    const response = await fetch(`${WAHA_URL}/api/default/messages/${messageId}/download`, {
      method: 'GET',
      headers: {
        'X-Api-Key': WAHA_API_KEY
      }
    });

    if (!response.ok) {
      console.error('Failed to download media:', await response.text());
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error downloading media:', error.message);
    return null;
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
 * Send a voice message with human-like recording behavior
 */
async function sendWhatsAppVoiceMessage(chatId, text) {
  try {
    // 1. Mark message as seen
    await sleep(randomDelay(300, 800));
    await markAsSeen(chatId);

    // 2. Thinking time before recording
    const thinkingTime = randomDelay(800, 2000);
    console.log(`[${chatId}] Thinking before recording (${thinkingTime}ms)...`);
    await sleep(thinkingTime);

    // 3. Generate audio with ElevenLabs
    console.log(`[${chatId}] Generating voice with ElevenLabs...`);
    const audio = await elevenLabs.generateSpeech(text);

    if (!audio) {
      console.log(`[${chatId}] Voice generation failed, falling back to text`);
      return sendWhatsAppMessage(chatId, text);
    }

    // 4. Show recording indicator
    await startRecording(chatId);

    // 5. Wait based on audio size (simulate recording time)
    const recordingTime = randomDelay(RECORDING_DURATION_MIN, RECORDING_DURATION_MAX);
    console.log(`[${chatId}] Recording for ${recordingTime}ms...`);
    await sleep(recordingTime);

    // 6. Stop presence indicator
    await stopTyping(chatId);

    // 7. Small delay before sending
    await sleep(randomDelay(200, 500));

    // 8. Send voice message
    return sendVoiceMessage(chatId, audio.base64, audio.mimetype);

  } catch (error) {
    console.error('Error sending voice message:', error.message);
    // Fallback to text
    return sendWhatsAppMessage(chatId, text);
  }
}

// Voice response chances
const VOICE_REPLY_CHANCE_NORMAL = 0.10;  // 10% for text messages
const VOICE_REPLY_CHANCE_TO_VOICE = 0.70; // 70% when replying to voice

/**
 * Send response - randomly chooses voice or text
 * @param {string} chatId - Chat ID to send to
 * @param {string} text - Text to send
 * @param {boolean} replyingToVoice - Whether we're replying to a voice message
 */
async function sendResponse(chatId, text, replyingToVoice = false) {
  // Determine voice chance based on context
  const voiceChance = replyingToVoice ? VOICE_REPLY_CHANCE_TO_VOICE : VOICE_REPLY_CHANCE_NORMAL;

  // Check if ElevenLabs is enabled and random chance
  if (elevenLabs.isEnabled() && Math.random() < voiceChance) {
    console.log(`[${chatId}] Sending as voice message (${replyingToVoice ? 'replying to voice' : 'random'})`);
    return sendWhatsAppVoiceMessage(chatId, text);
  }

  // Send as text
  return sendWhatsAppMessage(chatId, text);
}

/**
 * Transcribe voice message to text
 */
async function transcribeVoiceMessage(message) {
  if (!elevenLabs.isEnabled()) {
    return null;
  }

  try {
    // Get media URL from message
    const mediaUrl = message.media?.url || message.mediaUrl;
    const mimetype = message.media?.mimetype || message.mimetype || 'audio/ogg';

    if (!mediaUrl) {
      // Try to download via message ID
      const mediaData = await downloadMedia(message.id);
      if (mediaData?.data) {
        return elevenLabs.transcribeAudio(mediaData.data, mimetype);
      }
      return null;
    }

    // Download audio from URL
    const audioBuffer = await elevenLabs.downloadAudio(mediaUrl);
    if (!audioBuffer) {
      return null;
    }

    // Transcribe
    return elevenLabs.transcribeAudio(audioBuffer, mimetype);

  } catch (error) {
    console.error('Transcription error:', error.message);
    return null;
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

    // Check message type - handle voice messages
    const messageType = message.type || message.messageType || 'text';
    const isVoiceMessage = messageType === 'ptt' || messageType === 'audio';

    // Get message text (or transcribe voice)
    let text = message.body || message.text || '';

    if (isVoiceMessage) {
      console.log(`[${phone}] Received voice message, transcribing...`);
      const transcription = await transcribeVoiceMessage(message);
      if (transcription) {
        text = transcription;
        console.log(`[${phone}] Transcribed: ${text.substring(0, 50)}...`);
      } else {
        console.log(`[${phone}] Could not transcribe voice message`);
        // If we can't transcribe and there's an active session, let user know
        const session = sessionManager.getSession(phone);
        if (session) {
          await sendQuickMessage(chatId, "🎤 I received your voice message but couldn't transcribe it. Please try sending text instead.");
        }
        return;
      }
    }

    if (!text.trim()) {
      return;
    }

    const lowerText = text.toLowerCase().trim();
    console.log(`[${phone}] ${isVoiceMessage ? '🎤 ' : ''}Received: ${text.substring(0, 50)}...`);

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
        // Voice messages count as 2 for rate limiting
        const messageCount = isVoiceMessage ? 2 : 1;
        sessionManager.recordMessage(phone, messageCount);
        const remaining = canSend.messagesRemaining - messageCount;
        const footer = `\n\n_[${remaining} messages left | ${formatTimeRemaining(canSend.timeRemainingMs)} remaining]_`;
        // Use sendResponse which may send voice randomly (higher chance if replying to voice)
        await sendResponse(chatId, result.text + footer, isVoiceMessage);
      } else {
        await sendQuickMessage(chatId, `❌ Sorry, I couldn't process that. Error: ${result.error}`);
      }
      return;
    }

    // Session exists - process message
    const canSend = sessionManager.canSendMessage(phone);

    // Voice messages count as 2 for rate limiting
    const messageCount = isVoiceMessage ? 2 : 1;

    if (!canSend.allowed || canSend.messagesRemaining < messageCount) {
      clearSession(phone);

      if (canSend.reason === 'max_messages' || canSend.messagesRemaining < messageCount) {
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
      sessionManager.recordMessage(phone, messageCount);
      const remaining = canSend.messagesRemaining - messageCount;
      const footer = `\n\n_[${remaining} messages left | ${formatTimeRemaining(canSend.timeRemainingMs)} remaining]_`;
      // Use sendResponse which may send voice randomly (higher chance if replying to voice)
      await sendResponse(chatId, result.text + footer, isVoiceMessage);
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
  const elevenLabsHealth = await elevenLabs.healthCheck();
  res.json({
    status: 'ok',
    gemini: geminiHealth,
    elevenLabs: elevenLabsHealth,
    voiceChances: {
      normal: VOICE_REPLY_CHANCE_NORMAL,
      replyToVoice: VOICE_REPLY_CHANCE_TO_VOICE
    },
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
