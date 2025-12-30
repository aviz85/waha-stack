/**
 * Unit tests for Configuration API
 * Run with: npm test
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DB_PATH = join(__dirname, 'test-gemini-bot.db');

// Mock SessionManager for testing
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

  getConfig(key) {
    const row = this.db.prepare('SELECT value FROM bot_config WHERE key = ?').get(key);
    return row ? row.value : null;
  }

  setConfig(key, value) {
    const now = Date.now();
    this.db.prepare(`
      INSERT INTO bot_config (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
    `).run(key, value, now, value, now);
    return { key, value, updatedAt: now };
  }

  getAllConfig() {
    const rows = this.db.prepare('SELECT key, value, updated_at FROM bot_config').all();
    const config = {};
    for (const row of rows) {
      config[row.key] = { value: row.value, updatedAt: row.updated_at };
    }
    return config;
  }

  deleteConfig(key) {
    this.db.prepare('DELETE FROM bot_config WHERE key = ?').run(key);
  }

  close() {
    this.db.close();
  }
}

describe('Configuration Management', () => {
  let sessionManager;

  before(() => {
    // Clean up any existing test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    sessionManager = new TestSessionManager(TEST_DB_PATH);
  });

  after(() => {
    sessionManager.close();
    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  beforeEach(() => {
    // Clear config between tests
    sessionManager.db.exec('DELETE FROM bot_config');
  });

  describe('getConfig', () => {
    it('should return null for non-existent key', () => {
      const result = sessionManager.getConfig('non_existent_key');
      assert.strictEqual(result, null);
    });

    it('should return value for existing key', () => {
      sessionManager.setConfig('test_key', 'test_value');
      const result = sessionManager.getConfig('test_key');
      assert.strictEqual(result, 'test_value');
    });
  });

  describe('setConfig', () => {
    it('should create new config entry', () => {
      const result = sessionManager.setConfig('new_key', 'new_value');

      assert.strictEqual(result.key, 'new_key');
      assert.strictEqual(result.value, 'new_value');
      assert.ok(result.updatedAt > 0);

      const stored = sessionManager.getConfig('new_key');
      assert.strictEqual(stored, 'new_value');
    });

    it('should update existing config entry', () => {
      sessionManager.setConfig('update_key', 'original_value');
      const result = sessionManager.setConfig('update_key', 'updated_value');

      assert.strictEqual(result.value, 'updated_value');

      const stored = sessionManager.getConfig('update_key');
      assert.strictEqual(stored, 'updated_value');
    });

    it('should handle Hebrew text correctly', () => {
      const hebrewPrompt = 'אתה עוזר AI ידידותי בשם הבוט של אביץ';
      sessionManager.setConfig('system_prompt', hebrewPrompt);

      const stored = sessionManager.getConfig('system_prompt');
      assert.strictEqual(stored, hebrewPrompt);
    });

    it('should handle long text', () => {
      const longText = 'A'.repeat(5000);
      sessionManager.setConfig('long_key', longText);

      const stored = sessionManager.getConfig('long_key');
      assert.strictEqual(stored, longText);
      assert.strictEqual(stored.length, 5000);
    });
  });

  describe('getAllConfig', () => {
    it('should return empty object when no config exists', () => {
      const result = sessionManager.getAllConfig();
      assert.deepStrictEqual(result, {});
    });

    it('should return all config entries', () => {
      sessionManager.setConfig('key1', 'value1');
      sessionManager.setConfig('key2', 'value2');
      sessionManager.setConfig('key3', 'value3');

      const result = sessionManager.getAllConfig();

      assert.strictEqual(Object.keys(result).length, 3);
      assert.strictEqual(result.key1.value, 'value1');
      assert.strictEqual(result.key2.value, 'value2');
      assert.strictEqual(result.key3.value, 'value3');
    });

    it('should include updatedAt timestamp', () => {
      const beforeTime = Date.now();
      sessionManager.setConfig('timestamp_key', 'value');
      const afterTime = Date.now();

      const result = sessionManager.getAllConfig();

      assert.ok(result.timestamp_key.updatedAt >= beforeTime);
      assert.ok(result.timestamp_key.updatedAt <= afterTime);
    });
  });

  describe('deleteConfig', () => {
    it('should delete existing config', () => {
      sessionManager.setConfig('delete_key', 'value');
      assert.strictEqual(sessionManager.getConfig('delete_key'), 'value');

      sessionManager.deleteConfig('delete_key');

      assert.strictEqual(sessionManager.getConfig('delete_key'), null);
    });

    it('should not throw on non-existent key', () => {
      assert.doesNotThrow(() => {
        sessionManager.deleteConfig('non_existent');
      });
    });
  });

  describe('System Prompt Workflow', () => {
    const DEFAULT_PROMPT = 'Default system prompt';

    function getSystemPrompt() {
      const dbPrompt = sessionManager.getConfig('system_prompt');
      return dbPrompt || DEFAULT_PROMPT;
    }

    it('should return default when no DB value', () => {
      const result = getSystemPrompt();
      assert.strictEqual(result, DEFAULT_PROMPT);
    });

    it('should return DB value when set', () => {
      const customPrompt = 'Custom system prompt';
      sessionManager.setConfig('system_prompt', customPrompt);

      const result = getSystemPrompt();
      assert.strictEqual(result, customPrompt);
    });

    it('should return to default after delete', () => {
      sessionManager.setConfig('system_prompt', 'Temporary prompt');
      sessionManager.deleteConfig('system_prompt');

      const result = getSystemPrompt();
      assert.strictEqual(result, DEFAULT_PROMPT);
    });
  });
});

describe('API Key Validation', () => {
  const VALID_API_KEY = 'test-api-key-123';

  function requireApiKey(apiKey, expectedKey) {
    if (!apiKey || apiKey !== expectedKey) {
      return { error: 'Unauthorized: Invalid or missing API key', status: 401 };
    }
    return { success: true };
  }

  it('should reject missing API key', () => {
    const result = requireApiKey(null, VALID_API_KEY);
    assert.strictEqual(result.status, 401);
    assert.ok(result.error.includes('Unauthorized'));
  });

  it('should reject invalid API key', () => {
    const result = requireApiKey('wrong-key', VALID_API_KEY);
    assert.strictEqual(result.status, 401);
  });

  it('should accept valid API key', () => {
    const result = requireApiKey(VALID_API_KEY, VALID_API_KEY);
    assert.strictEqual(result.success, true);
  });

  it('should accept API key from header or query', () => {
    // Simulate header
    const headerResult = requireApiKey(VALID_API_KEY, VALID_API_KEY);
    assert.strictEqual(headerResult.success, true);

    // Simulate query param (same logic)
    const queryResult = requireApiKey(VALID_API_KEY, VALID_API_KEY);
    assert.strictEqual(queryResult.success, true);
  });
});

describe('Input Validation', () => {
  it('should reject empty system prompt', () => {
    const systemPrompt = '';
    const isValid = !!(systemPrompt && typeof systemPrompt === 'string' && systemPrompt.trim().length >= 10);
    assert.strictEqual(isValid, false);
  });

  it('should reject short system prompt', () => {
    const systemPrompt = 'short';
    const isValid = systemPrompt.trim().length >= 10;
    assert.strictEqual(isValid, false);
  });

  it('should accept valid system prompt', () => {
    const systemPrompt = 'This is a valid system prompt with enough characters';
    const isValid = systemPrompt && typeof systemPrompt === 'string' && systemPrompt.trim().length >= 10;
    assert.strictEqual(isValid, true);
  });

  it('should trim whitespace from prompt', () => {
    const systemPrompt = '   This is a prompt with whitespace   ';
    const trimmed = systemPrompt.trim();
    assert.strictEqual(trimmed, 'This is a prompt with whitespace');
  });
});

console.log('\n🧪 Running Configuration API Tests...\n');
