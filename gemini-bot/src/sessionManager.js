import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.NODE_ENV === 'production'
  ? '/app/data/gemini-bot.db'
  : './gemini-bot.db';

// Session limits
const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour
const MAX_MESSAGES_PER_SESSION = 20;

class SessionManager {
  constructor() {
    this.db = new Database(DB_PATH);
    this.initializeDatabase();
    this.activeSessions = new Map(); // phone -> { chat, history, messageCount, startTime }
  }

  initializeDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        message_count INTEGER DEFAULT 0,
        end_reason TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_phone_started ON chat_sessions(phone, started_at);
    `);
  }

  // Check if user can start a new session (rate limit: 1 per hour)
  canStartSession(phone) {
    const oneHourAgo = Date.now() - RATE_LIMIT_MS;

    const recentSession = this.db.prepare(`
      SELECT * FROM chat_sessions
      WHERE phone = ? AND started_at > ?
      ORDER BY started_at DESC
      LIMIT 1
    `).get(phone, oneHourAgo);

    if (recentSession) {
      const waitTime = Math.ceil((recentSession.started_at + RATE_LIMIT_MS - Date.now()) / 60000);
      return { allowed: false, waitMinutes: waitTime };
    }

    return { allowed: true };
  }

  // Start a new session
  startSession(phone) {
    const now = Date.now();

    // Record in database
    const result = this.db.prepare(`
      INSERT INTO chat_sessions (phone, started_at) VALUES (?, ?)
    `).run(phone, now);

    // Store in memory
    this.activeSessions.set(phone, {
      sessionId: result.lastInsertRowid,
      messageCount: 0,
      startTime: now
    });

    return { sessionId: result.lastInsertRowid };
  }

  // Get active session or null
  getSession(phone) {
    const session = this.activeSessions.get(phone);

    if (!session) return null;

    // Check timeout
    if (Date.now() - session.startTime > SESSION_TIMEOUT_MS) {
      this.endSession(phone, 'timeout');
      return null;
    }

    return session;
  }

  // Check if session can accept more messages
  canSendMessage(phone) {
    const session = this.getSession(phone);

    if (!session) {
      return { allowed: false, reason: 'no_session' };
    }

    if (session.messageCount >= MAX_MESSAGES_PER_SESSION) {
      this.endSession(phone, 'max_messages');
      return { allowed: false, reason: 'max_messages' };
    }

    const timeRemaining = SESSION_TIMEOUT_MS - (Date.now() - session.startTime);
    if (timeRemaining <= 0) {
      this.endSession(phone, 'timeout');
      return { allowed: false, reason: 'timeout' };
    }

    return {
      allowed: true,
      messagesRemaining: MAX_MESSAGES_PER_SESSION - session.messageCount,
      timeRemainingMs: timeRemaining
    };
  }

  // Increment message count
  // count: how many messages to add (voice messages count as 2)
  recordMessage(phone, count = 1) {
    const session = this.activeSessions.get(phone);
    if (!session) return;

    session.messageCount += count;

    // Update database
    this.db.prepare(`
      UPDATE chat_sessions SET message_count = ? WHERE id = ?
    `).run(session.messageCount, session.sessionId);
  }

  // End a session
  endSession(phone, reason = 'manual') {
    const session = this.activeSessions.get(phone);
    if (!session) return;

    this.db.prepare(`
      UPDATE chat_sessions
      SET ended_at = ?, end_reason = ?
      WHERE id = ?
    `).run(Date.now(), reason, session.sessionId);

    this.activeSessions.delete(phone);
  }

  // Get session status
  getSessionStatus(phone) {
    const session = this.getSession(phone);

    if (session) {
      const timeRemaining = Math.ceil((SESSION_TIMEOUT_MS - (Date.now() - session.startTime)) / 1000);
      return {
        active: true,
        messageCount: session.messageCount,
        messagesRemaining: MAX_MESSAGES_PER_SESSION - session.messageCount,
        timeRemainingSeconds: timeRemaining
      };
    }

    const canStart = this.canStartSession(phone);
    return {
      active: false,
      canStartNew: canStart.allowed,
      waitMinutes: canStart.waitMinutes || 0
    };
  }

  // Cleanup expired sessions (call periodically)
  cleanupExpiredSessions() {
    const now = Date.now();

    for (const [phone, session] of this.activeSessions.entries()) {
      if (now - session.startTime > SESSION_TIMEOUT_MS) {
        this.endSession(phone, 'timeout');
      }
    }
  }
}

export default new SessionManager();
export { SESSION_TIMEOUT_MS, RATE_LIMIT_MS, MAX_MESSAGES_PER_SESSION };
