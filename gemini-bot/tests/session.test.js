/**
 * Session Manager Unit Tests
 * Tests for chat session management, rate limiting, and session lifecycle
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DB_PATH = join(__dirname, 'test-session.db');

// Session constants
const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour
const MAX_MESSAGES_PER_SESSION = 20;

// TestSessionManager class (mirrors the real SessionManager)
class TestSessionManager {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.initializeDatabase();
    this.activeSessions = new Map();
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
      CREATE TABLE IF NOT EXISTS bot_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  }

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

  startSession(phone) {
    const now = Date.now();
    const result = this.db.prepare(`
      INSERT INTO chat_sessions (phone, started_at) VALUES (?, ?)
    `).run(phone, now);

    this.activeSessions.set(phone, {
      sessionId: result.lastInsertRowid,
      messageCount: 0,
      startTime: now
    });
    return { sessionId: result.lastInsertRowid };
  }

  getSession(phone) {
    const session = this.activeSessions.get(phone);
    if (!session) return null;

    if (Date.now() - session.startTime > SESSION_TIMEOUT_MS) {
      this.endSession(phone, 'timeout');
      return null;
    }
    return session;
  }

  canSendMessage(phone) {
    const session = this.getSession(phone);
    if (!session) return { allowed: false, reason: 'no_session' };

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

  recordMessage(phone, count = 1) {
    const session = this.activeSessions.get(phone);
    if (!session) return;

    session.messageCount += count;
    this.db.prepare(`
      UPDATE chat_sessions SET message_count = ? WHERE id = ?
    `).run(session.messageCount, session.sessionId);
  }

  endSession(phone, reason = 'manual') {
    const session = this.activeSessions.get(phone);
    if (!session) return;

    this.db.prepare(`
      UPDATE chat_sessions SET ended_at = ?, end_reason = ? WHERE id = ?
    `).run(Date.now(), reason, session.sessionId);
    this.activeSessions.delete(phone);
  }

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

  cleanupExpiredSessions() {
    const now = Date.now();
    for (const [phone, session] of this.activeSessions.entries()) {
      if (now - session.startTime > SESSION_TIMEOUT_MS) {
        this.endSession(phone, 'timeout');
      }
    }
  }

  close() {
    this.db.close();
  }
}

describe('Session Manager', () => {
  let manager;

  before(() => {
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    manager = new TestSessionManager(TEST_DB_PATH);
  });

  after(() => {
    manager.close();
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  });

  beforeEach(() => {
    manager.db.exec('DELETE FROM chat_sessions');
    manager.activeSessions.clear();
  });

  describe('Session Creation', () => {
    it('should create a new session', () => {
      const result = manager.startSession('972501234567');
      assert.ok(result.sessionId > 0);
    });

    it('should store session in memory', () => {
      manager.startSession('972501234567');
      const session = manager.getSession('972501234567');
      assert.ok(session !== null);
    });

    it('should initialize message count to 0', () => {
      manager.startSession('972501234567');
      const session = manager.getSession('972501234567');
      assert.strictEqual(session.messageCount, 0);
    });

    it('should store session in database', () => {
      manager.startSession('972501234567');
      const dbSession = manager.db.prepare('SELECT * FROM chat_sessions WHERE phone = ?').get('972501234567');
      assert.ok(dbSession !== null);
    });

    it('should create unique session IDs', () => {
      const s1 = manager.startSession('972501234567');
      manager.endSession('972501234567', 'test');
      manager.db.exec("DELETE FROM chat_sessions WHERE phone = '972501234567'");
      const s2 = manager.startSession('972501234568');
      assert.notStrictEqual(s1.sessionId, s2.sessionId);
    });
  });

  describe('Session Retrieval', () => {
    it('should return null for non-existent session', () => {
      const session = manager.getSession('972500000000');
      assert.strictEqual(session, null);
    });

    it('should return active session', () => {
      manager.startSession('972501234567');
      const session = manager.getSession('972501234567');
      assert.ok(session !== null);
      assert.strictEqual(session.messageCount, 0);
    });

    it('should return session with correct phone number', () => {
      manager.startSession('972501111111');
      manager.startSession('972502222222');

      const s1 = manager.getSession('972501111111');
      const s2 = manager.getSession('972502222222');

      assert.ok(s1 !== null);
      assert.ok(s2 !== null);
      assert.notStrictEqual(s1.sessionId, s2.sessionId);
    });
  });

  describe('Message Recording', () => {
    it('should increment message count by 1', () => {
      manager.startSession('972501234567');
      manager.recordMessage('972501234567');

      const session = manager.getSession('972501234567');
      assert.strictEqual(session.messageCount, 1);
    });

    it('should increment message count by custom amount', () => {
      manager.startSession('972501234567');
      manager.recordMessage('972501234567', 2);

      const session = manager.getSession('972501234567');
      assert.strictEqual(session.messageCount, 2);
    });

    it('should accumulate message counts', () => {
      manager.startSession('972501234567');
      manager.recordMessage('972501234567', 1);
      manager.recordMessage('972501234567', 2);
      manager.recordMessage('972501234567', 1);

      const session = manager.getSession('972501234567');
      assert.strictEqual(session.messageCount, 4);
    });

    it('should update database on message record', () => {
      manager.startSession('972501234567');
      manager.recordMessage('972501234567', 5);

      const dbSession = manager.db.prepare('SELECT message_count FROM chat_sessions WHERE phone = ?').get('972501234567');
      assert.strictEqual(dbSession.message_count, 5);
    });

    it('should not throw on non-existent session', () => {
      assert.doesNotThrow(() => {
        manager.recordMessage('972500000000');
      });
    });
  });

  describe('Session Limits', () => {
    it('should allow sending when under limit', () => {
      manager.startSession('972501234567');
      const result = manager.canSendMessage('972501234567');

      assert.strictEqual(result.allowed, true);
      assert.strictEqual(result.messagesRemaining, MAX_MESSAGES_PER_SESSION);
    });

    it('should calculate remaining messages correctly', () => {
      manager.startSession('972501234567');
      manager.recordMessage('972501234567', 5);

      const result = manager.canSendMessage('972501234567');
      assert.strictEqual(result.messagesRemaining, MAX_MESSAGES_PER_SESSION - 5);
    });

    it('should deny when at message limit', () => {
      manager.startSession('972501234567');
      manager.recordMessage('972501234567', MAX_MESSAGES_PER_SESSION);

      const result = manager.canSendMessage('972501234567');
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.reason, 'max_messages');
    });

    it('should end session when limit reached', () => {
      manager.startSession('972501234567');
      manager.recordMessage('972501234567', MAX_MESSAGES_PER_SESSION);
      manager.canSendMessage('972501234567');

      const session = manager.getSession('972501234567');
      assert.strictEqual(session, null);
    });

    it('should return no_session for non-existent session', () => {
      const result = manager.canSendMessage('972500000000');
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.reason, 'no_session');
    });
  });

  describe('Session Ending', () => {
    it('should remove session from memory', () => {
      manager.startSession('972501234567');
      manager.endSession('972501234567', 'manual');

      const session = manager.getSession('972501234567');
      assert.strictEqual(session, null);
    });

    it('should record end time in database', () => {
      manager.startSession('972501234567');
      manager.endSession('972501234567', 'manual');

      const dbSession = manager.db.prepare('SELECT ended_at FROM chat_sessions WHERE phone = ?').get('972501234567');
      assert.ok(dbSession.ended_at > 0);
    });

    it('should record end reason in database', () => {
      manager.startSession('972501234567');
      manager.endSession('972501234567', 'user_ended');

      const dbSession = manager.db.prepare('SELECT end_reason FROM chat_sessions WHERE phone = ?').get('972501234567');
      assert.strictEqual(dbSession.end_reason, 'user_ended');
    });

    it('should handle different end reasons', () => {
      const reasons = ['manual', 'timeout', 'max_messages', 'user_ended', 'admin'];

      reasons.forEach((reason, index) => {
        const phone = `97250000000${index}`;
        manager.startSession(phone);
        manager.endSession(phone, reason);

        const dbSession = manager.db.prepare('SELECT end_reason FROM chat_sessions WHERE phone = ?').get(phone);
        assert.strictEqual(dbSession.end_reason, reason);
      });
    });

    it('should not throw on non-existent session', () => {
      assert.doesNotThrow(() => {
        manager.endSession('972500000000', 'test');
      });
    });
  });

  describe('Session Status', () => {
    it('should return active status for active session', () => {
      manager.startSession('972501234567');
      const status = manager.getSessionStatus('972501234567');

      assert.strictEqual(status.active, true);
      assert.strictEqual(status.messageCount, 0);
    });

    it('should return remaining messages', () => {
      manager.startSession('972501234567');
      manager.recordMessage('972501234567', 7);
      const status = manager.getSessionStatus('972501234567');

      assert.strictEqual(status.messagesRemaining, MAX_MESSAGES_PER_SESSION - 7);
    });

    it('should return time remaining in seconds', () => {
      manager.startSession('972501234567');
      const status = manager.getSessionStatus('972501234567');

      assert.ok(status.timeRemainingSeconds > 0);
      assert.ok(status.timeRemainingSeconds <= SESSION_TIMEOUT_MS / 1000);
    });

    it('should return inactive status for no session', () => {
      const status = manager.getSessionStatus('972500000000');
      assert.strictEqual(status.active, false);
    });

    it('should return canStartNew for inactive session', () => {
      const status = manager.getSessionStatus('972500000000');
      assert.strictEqual(status.canStartNew, true);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow first session', () => {
      const result = manager.canStartSession('972501234567');
      assert.strictEqual(result.allowed, true);
    });

    it('should deny second session within rate limit', () => {
      manager.startSession('972501234567');
      manager.endSession('972501234567', 'test');

      const result = manager.canStartSession('972501234567');
      assert.strictEqual(result.allowed, false);
      assert.ok(result.waitMinutes > 0);
    });

    it('should return wait time in minutes', () => {
      manager.startSession('972501234567');
      manager.endSession('972501234567', 'test');

      const result = manager.canStartSession('972501234567');
      assert.ok(result.waitMinutes <= 60);
    });

    it('should allow sessions for different phones', () => {
      manager.startSession('972501111111');

      const result = manager.canStartSession('972502222222');
      assert.strictEqual(result.allowed, true);
    });
  });

  describe('Multiple Sessions', () => {
    it('should handle multiple concurrent sessions', () => {
      manager.startSession('972501111111');
      manager.startSession('972502222222');
      manager.startSession('972503333333');

      assert.strictEqual(manager.activeSessions.size, 3);
    });

    it('should track messages independently', () => {
      manager.startSession('972501111111');
      manager.startSession('972502222222');

      manager.recordMessage('972501111111', 5);
      manager.recordMessage('972502222222', 10);

      const s1 = manager.getSession('972501111111');
      const s2 = manager.getSession('972502222222');

      assert.strictEqual(s1.messageCount, 5);
      assert.strictEqual(s2.messageCount, 10);
    });

    it('should end sessions independently', () => {
      manager.startSession('972501111111');
      manager.startSession('972502222222');

      manager.endSession('972501111111', 'test');

      assert.strictEqual(manager.getSession('972501111111'), null);
      assert.ok(manager.getSession('972502222222') !== null);
    });
  });

  describe('Cleanup', () => {
    it('should not throw on cleanup with no sessions', () => {
      assert.doesNotThrow(() => {
        manager.cleanupExpiredSessions();
      });
    });

    it('should keep active sessions', () => {
      manager.startSession('972501234567');
      manager.cleanupExpiredSessions();

      const session = manager.getSession('972501234567');
      assert.ok(session !== null);
    });
  });
});

console.log('\n🧪 Running Session Manager Tests...\n');
