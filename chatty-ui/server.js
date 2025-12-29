import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3002

// Initialize SQLite database
// In production (Docker), use /app/data volume for persistence
const dbPath = process.env.NODE_ENV === 'production'
  ? join('/app/data', 'chatty.db')
  : join(__dirname, 'chatty.db')
const db = new Database(dbPath)

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    emoji TEXT,
    color TEXT,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS message_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'sent',
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS queue_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    delay_seconds INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS incoming_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT UNIQUE,
    chat_id TEXT NOT NULL,
    phone TEXT NOT NULL,
    sender_name TEXT,
    message TEXT,
    timestamp INTEGER,
    is_from_me INTEGER DEFAULT 0,
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

// Insert default templates if empty
const templateCount = db.prepare('SELECT COUNT(*) as count FROM templates').get()
if (templateCount.count === 0) {
  const insertTemplate = db.prepare('INSERT INTO templates (name, emoji, color, text) VALUES (?, ?, ?, ?)')
  insertTemplate.run('Welcome', '👋', '#00D4AA', 'Hey! 👋 Welcome aboard! We\'re so excited to have you here. Let us know if you need anything!')
  insertTemplate.run('Thank You', '🙏', '#FF6B6B', 'Thank you so much for your support! 🙏 It really means a lot to us. Have an amazing day! ✨')
  insertTemplate.run('Reminder', '⏰', '#FFD93D', 'Quick reminder! ⏰ Don\'t forget about our meeting today. See you soon! 🚀')
  insertTemplate.run('Celebration', '🎉', '#A66CFF', 'Congratulations! 🎉🎊 You did it! So proud of you! Keep shining! ⭐')
}

app.use(cors())
app.use(express.json())

// ============ FAVORITES ============

// Get all favorites
app.get('/api/favorites', (req, res) => {
  try {
    const favorites = db.prepare('SELECT * FROM favorites ORDER BY created_at DESC').all()
    res.json(favorites)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Add favorite
app.post('/api/favorites', (req, res) => {
  try {
    const { phone, name } = req.body
    if (!phone) {
      return res.status(400).json({ error: 'Phone is required' })
    }
    const cleanPhone = phone.replace(/\D/g, '')
    const stmt = db.prepare('INSERT INTO favorites (phone, name) VALUES (?, ?)')
    const result = stmt.run(cleanPhone, name || cleanPhone)
    res.json({ id: result.lastInsertRowid, phone: cleanPhone, name: name || cleanPhone })
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      res.status(409).json({ error: 'Phone already exists in favorites' })
    } else {
      res.status(500).json({ error: err.message })
    }
  }
})

// Delete favorite
app.delete('/api/favorites/:phone', (req, res) => {
  try {
    const { phone } = req.params
    const stmt = db.prepare('DELETE FROM favorites WHERE phone = ?')
    stmt.run(phone)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============ TEMPLATES ============

// Get all templates
app.get('/api/templates', (req, res) => {
  try {
    const templates = db.prepare('SELECT * FROM templates ORDER BY id').all()
    res.json(templates)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Add template
app.post('/api/templates', (req, res) => {
  try {
    const { name, emoji, color, text } = req.body
    if (!name || !text) {
      return res.status(400).json({ error: 'Name and text are required' })
    }
    const stmt = db.prepare('INSERT INTO templates (name, emoji, color, text) VALUES (?, ?, ?, ?)')
    const result = stmt.run(name, emoji || '📝', color || '#00D4AA', text)
    res.json({ id: result.lastInsertRowid, name, emoji, color, text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete template
app.delete('/api/templates/:id', (req, res) => {
  try {
    const { id } = req.params
    const stmt = db.prepare('DELETE FROM templates WHERE id = ?')
    stmt.run(id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============ MESSAGE HISTORY ============

// Get message history
app.get('/api/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100
    const history = db.prepare('SELECT * FROM message_history ORDER BY sent_at DESC LIMIT ?').all(limit)
    res.json(history)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Log message
app.post('/api/history', (req, res) => {
  try {
    const { phone, message, status } = req.body
    const stmt = db.prepare('INSERT INTO message_history (phone, message, status) VALUES (?, ?, ?)')
    const result = stmt.run(phone, message, status || 'sent')
    res.json({ id: result.lastInsertRowid })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============ QUEUE ============

// Get queue
app.get('/api/queue', (req, res) => {
  try {
    const queue = db.prepare('SELECT * FROM queue_jobs ORDER BY id').all()
    res.json(queue)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Add to queue (batch)
app.post('/api/queue', (req, res) => {
  try {
    const { jobs } = req.body // Array of { phone, message, delay_seconds }
    if (!jobs || !Array.isArray(jobs)) {
      return res.status(400).json({ error: 'Jobs array is required' })
    }

    const stmt = db.prepare('INSERT INTO queue_jobs (phone, message, delay_seconds) VALUES (?, ?, ?)')
    const insertMany = db.transaction((jobs) => {
      const results = []
      for (const job of jobs) {
        const result = stmt.run(job.phone.replace(/\D/g, ''), job.message, job.delay_seconds || 0)
        results.push({ id: result.lastInsertRowid, ...job })
      }
      return results
    })

    const results = insertMany(jobs)
    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update queue job status
app.patch('/api/queue/:id', (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const stmt = db.prepare('UPDATE queue_jobs SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?')
    stmt.run(status, id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Clear queue
app.delete('/api/queue', (req, res) => {
  try {
    db.prepare('DELETE FROM queue_jobs').run()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============ INCOMING MESSAGES (Webhook) ============

// Webhook endpoint for WAHA to send messages
app.post('/api/webhook', (req, res) => {
  try {
    const payload = req.body
    console.log('📨 Webhook received:', payload.event)

    // Handle message events (both 'message' and 'message.any')
    if (payload.event === 'message' || payload.event === 'message.any') {
      const msg = payload.payload

      // Skip broadcast messages (status updates, broadcast lists)
      const chatId = msg.chatId || msg.from || ''
      if (chatId.includes('@broadcast') || chatId.includes('status@')) {
        console.log('⏭️ Skipping broadcast message')
        return res.json({ success: true, skipped: 'broadcast' })
      }

      // Extract phone from chat ID (e.g., "972501234567@c.us" -> "972501234567")
      const phone = msg.from?.replace('@c.us', '').replace('@s.whatsapp.net', '') || ''

      const stmt = db.prepare(`
        INSERT OR IGNORE INTO incoming_messages
        (message_id, chat_id, phone, sender_name, message, timestamp, is_from_me)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)

      stmt.run(
        msg.id,
        msg.chatId || msg.from,
        phone,
        msg.senderName || msg._data?.notifyName || phone,
        msg.body || msg.text || '[media]',
        msg.timestamp || Math.floor(Date.now() / 1000),
        msg.fromMe ? 1 : 0
      )

      console.log(`💬 Message from ${phone}: ${(msg.body || '').substring(0, 50)}...`)
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Webhook error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Get incoming messages (excludes broadcasts)
app.get('/api/incoming', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50
    const since = req.query.since // Optional: get messages after this ID

    let query = 'SELECT * FROM incoming_messages WHERE chat_id NOT LIKE ? AND chat_id NOT LIKE ?'
    const params = ['%@broadcast%', '%status@%']

    if (since) {
      query += ' AND id > ?'
      params.push(since)
    }

    query += ' ORDER BY timestamp DESC LIMIT ?'
    params.push(limit)

    const messages = db.prepare(query).all(...params)
    res.json(messages)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get new messages count (for polling)
app.get('/api/incoming/count', (req, res) => {
  try {
    const since = req.query.since || 0
    const count = db.prepare('SELECT COUNT(*) as count FROM incoming_messages WHERE id > ?').get(since)
    res.json(count)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Clear all incoming messages
app.delete('/api/incoming', (req, res) => {
  try {
    db.prepare('DELETE FROM incoming_messages').run()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============ STATS ============

app.get('/api/stats', (req, res) => {
  try {
    const favoriteCount = db.prepare('SELECT COUNT(*) as count FROM favorites').get()
    const templateCount = db.prepare('SELECT COUNT(*) as count FROM templates').get()
    const messageCount = db.prepare('SELECT COUNT(*) as count FROM message_history').get()
    const todayCount = db.prepare(`
      SELECT COUNT(*) as count FROM message_history
      WHERE DATE(sent_at) = DATE('now')
    `).get()

    res.json({
      favorites: favoriteCount.count,
      templates: templateCount.count,
      totalMessages: messageCount.count,
      todayMessages: todayCount.count
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Chatty API running on http://localhost:${PORT}`)
  console.log(`📦 SQLite database: chatty.db`)
})
