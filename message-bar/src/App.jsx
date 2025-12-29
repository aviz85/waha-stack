import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

// API Base URL
const API_BASE = 'http://localhost:3002'

// ===== 8-BIT SOUND EFFECTS =====
const AudioContext = window.AudioContext || window.webkitAudioContext
let audioCtx = null

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

const playTone = (frequency, duration, type = 'square', volume = 0.3) => {
  try {
    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch (e) {
    console.log('Audio not available')
  }
}

const SFX = {
  // Customer arrives - short blip
  customerArrive: () => {
    playTone(880, 0.1, 'square', 0.2)
    setTimeout(() => playTone(1100, 0.1, 'square', 0.15), 50)
  },

  // Select template - click
  select: () => {
    playTone(600, 0.05, 'square', 0.2)
  },

  // Serve customer - positive chime
  serve: () => {
    playTone(523, 0.1, 'square', 0.25)
    setTimeout(() => playTone(659, 0.1, 'square', 0.25), 80)
    setTimeout(() => playTone(784, 0.15, 'square', 0.2), 160)
  },

  // Combo - ascending arpeggio
  combo: () => {
    playTone(523, 0.08, 'square', 0.2)
    setTimeout(() => playTone(659, 0.08, 'square', 0.2), 60)
    setTimeout(() => playTone(784, 0.08, 'square', 0.2), 120)
    setTimeout(() => playTone(1047, 0.15, 'sawtooth', 0.25), 180)
  },

  // Customer angry/leaves - negative buzz
  customerLeave: () => {
    playTone(200, 0.15, 'sawtooth', 0.3)
    setTimeout(() => playTone(150, 0.2, 'sawtooth', 0.25), 100)
  },

  // Game start - fanfare
  gameStart: () => {
    playTone(392, 0.15, 'square', 0.25)
    setTimeout(() => playTone(523, 0.15, 'square', 0.25), 150)
    setTimeout(() => playTone(659, 0.15, 'square', 0.25), 300)
    setTimeout(() => playTone(784, 0.3, 'square', 0.3), 450)
  },

  // Game over - descending sad tones
  gameOver: () => {
    playTone(400, 0.2, 'square', 0.3)
    setTimeout(() => playTone(350, 0.2, 'square', 0.25), 200)
    setTimeout(() => playTone(300, 0.3, 'sawtooth', 0.3), 400)
    setTimeout(() => playTone(200, 0.5, 'sawtooth', 0.2), 600)
  },

  // Error - short buzz
  error: () => {
    playTone(150, 0.1, 'square', 0.25)
  }
}

// Game constants
const PATIENCE_DECAY_RATE = 2 // % per second
const BASE_SPAWN_INTERVAL = 8000 // ms between customer spawns
const MIN_SPAWN_INTERVAL = 3000
const MAX_CUSTOMERS = 6
const MAX_LOST = 5 // Game over after 5 lost customers
const COMBO_TIMEOUT = 3000 // ms to maintain combo

// Random customer avatars
const AVATARS = ['👨', '👩', '🧑', '👴', '👵', '🧔', '👱', '👸', '🤵', '👨‍💼', '👩‍💼', '🧑‍💻', '👨‍🎤', '👩‍🎤', '🥷', '🦸', '🧙', '🎅']
const DEMO_NAMES = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Reese', 'Sage', 'Blake', 'Drew', 'Emery', 'Finley']
const DEMO_MESSAGES = [
  'Hey, are you there?',
  'Need help ASAP!',
  'Quick question...',
  'Hello???',
  'Is anyone working?',
  'I have a problem',
  'Can you help me?',
  'Urgent request!',
  'Hi, got a minute?',
  'Need assistance',
  'Where are you?',
  'Please respond',
  'Important matter',
  'Help needed!',
]

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9)

function App() {
  // Game state
  const [gameState, setGameState] = useState('start') // 'start', 'playing', 'gameover'
  const [score, setScore] = useState(0)
  const [served, setServed] = useState(0)
  const [lost, setLost] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)

  // Game data
  const [templates, setTemplates] = useState([])
  const [customers, setCustomers] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [toasts, setToasts] = useState([])
  const [demoMode, setDemoMode] = useState(false)
  const [difficulty, setDifficulty] = useState(1)
  const [muted, setMuted] = useState(false)
  const [bottleCooldowns, setBottleCooldowns] = useState({}) // { templateId: expiresAt }

  // Sound helper that respects mute
  const playSound = useCallback((soundFn) => {
    if (!muted) soundFn()
  }, [muted])

  // Check if bottle is on cooldown
  const isBottleOnCooldown = (templateId) => {
    const expires = bottleCooldowns[templateId]
    return expires && Date.now() < expires
  }

  // Get cooldown percentage filled (for visual) - shows filling up
  const getBottleCooldownPercent = (templateId) => {
    const expires = bottleCooldowns[templateId]
    if (!expires) return 100
    const remaining = expires - Date.now()
    if (remaining <= 0) return 100
    // Invert: starts at 0% (empty), fills to 100% (full/ready)
    return 100 - (remaining / 3000) * 100
  }

  // Refs for intervals
  const gameLoopRef = useRef(null)
  const spawnIntervalRef = useRef(null)
  const comboTimerRef = useRef(null)
  const lastMessageIdRef = useRef(0)

  // Fetch templates from API
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/templates`)
      const data = await res.json()
      setTemplates(data)
    } catch (err) {
      console.error('Failed to fetch templates:', err)
      // Fallback templates for demo mode
      setTemplates([
        { id: 1, name: 'Welcome', emoji: '👋', text: 'Hey! Welcome aboard!' },
        { id: 2, name: 'Thank You', emoji: '🙏', text: 'Thank you so much!' },
        { id: 3, name: 'Reminder', emoji: '⏰', text: 'Quick reminder!' },
        { id: 4, name: 'Celebration', emoji: '🎉', text: 'Congratulations!' },
      ])
      setDemoMode(true)
    }
  }, [])

  // Check if message is from a private chat (not group or status)
  const isPrivateChat = (msg) => {
    const chatId = msg.chat_id || ''
    // Exclude groups (@g.us), status (@broadcast, status@), and other non-private
    if (chatId.includes('@g.us')) return false // Group chat
    if (chatId.includes('@broadcast')) return false // Broadcast/Status
    if (chatId.includes('status@')) return false // Status updates
    if (chatId.includes('@newsletter')) return false // Channels
    // Only include private chats (@c.us or @s.whatsapp.net)
    return chatId.includes('@c.us') || chatId.includes('@s.whatsapp.net') || !chatId.includes('@')
  }

  // Fetch incoming messages (real customers) - PRIVATE ONLY
  const fetchIncomingMessages = useCallback(async () => {
    if (demoMode) return []
    try {
      const res = await fetch(`${API_BASE}/api/incoming?since=${lastMessageIdRef.current}&limit=10`)
      const data = await res.json()
      if (data.length > 0) {
        lastMessageIdRef.current = Math.max(...data.map(m => m.id))
      }
      // Filter: not from me AND private chat only (no groups/status)
      return data.filter(m => !m.is_from_me && isPrivateChat(m))
    } catch (err) {
      console.error('Failed to fetch messages:', err)
      return []
    }
  }, [demoMode])

  // Send message via API
  const sendMessage = useCallback(async (phone, message) => {
    if (demoMode) return true
    try {
      // Log to history
      await fetch(`${API_BASE}/api/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message, status: 'sent' })
      })
      return true
    } catch (err) {
      console.error('Failed to send message:', err)
      return false
    }
  }, [demoMode])

  // Add toast notification
  const addToast = useCallback((type, message, icon) => {
    const id = generateId()
    setToasts(prev => [...prev, { id, type, message, icon }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2000)
  }, [])

  // Spawn a demo customer
  const spawnDemoCustomer = useCallback(() => {
    if (customers.length >= MAX_CUSTOMERS) return

    const customer = {
      id: generateId(),
      name: DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)],
      message: DEMO_MESSAGES[Math.floor(Math.random() * DEMO_MESSAGES.length)],
      phone: `demo_${generateId()}`,
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      patience: 100,
      arrivedAt: Date.now(),
      isDemo: true,
    }

    setCustomers(prev => [...prev, customer])
    playSound(SFX.customerArrive)
  }, [customers.length, playSound])

  // Spawn customer from real message
  const spawnRealCustomer = useCallback((msg) => {
    if (customers.length >= MAX_CUSTOMERS) return
    if (customers.some(c => c.phone === msg.phone)) return // Already exists

    const customer = {
      id: generateId(),
      name: msg.sender_name || msg.phone,
      message: msg.message?.substring(0, 50) || 'New message',
      phone: msg.phone,
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      patience: 100,
      arrivedAt: Date.now(),
      isDemo: false,
      messageId: msg.id,
    }

    setCustomers(prev => [...prev, customer])
    playSound(SFX.customerArrive)
  }, [customers, playSound])

  // Serve a customer
  const serveCustomer = useCallback(async (customerId) => {
    if (!selectedTemplate) {
      addToast('error', 'Select a drink first!', '🍺')
      playSound(SFX.error)
      return
    }

    const customer = customers.find(c => c.id === customerId)
    if (!customer) return

    // Check if bottle is on cooldown
    if (isBottleOnCooldown(selectedTemplate.id)) {
      addToast('error', 'Bottle refilling...', '⏳')
      playSound(SFX.error)
      return
    }

    // Send message
    const success = await sendMessage(customer.phone, selectedTemplate.text)
    if (!success && !demoMode) {
      addToast('error', 'Failed to send!', '❌')
      return
    }

    // Put bottle on cooldown (3 seconds)
    setBottleCooldowns(prev => ({
      ...prev,
      [selectedTemplate.id]: Date.now() + 3000
    }))

    // Calculate score based on patience remaining
    const patienceBonus = Math.floor(customer.patience / 10)
    const comboBonus = combo * 10
    const points = 100 + patienceBonus + comboBonus

    // Update stats
    setScore(prev => prev + points)
    setServed(prev => prev + 1)
    setCombo(prev => {
      const newCombo = prev + 1
      setMaxCombo(max => Math.max(max, newCombo))
      return newCombo
    })

    // Reset combo timer
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current)
    comboTimerRef.current = setTimeout(() => setCombo(0), COMBO_TIMEOUT)

    // Remove customer with animation
    setCustomers(prev => prev.filter(c => c.id !== customerId))

    // Toast and sound
    if (combo >= 2) {
      addToast('combo', `COMBO x${combo + 1}! +${points}`, '🔥')
      playSound(SFX.combo)
    } else {
      addToast('success', `+${points} pts!`, '✅')
      playSound(SFX.serve)
    }

    // Increase difficulty
    if (served > 0 && served % 5 === 0) {
      setDifficulty(prev => Math.min(prev + 0.2, 3))
    }
  }, [selectedTemplate, customers, combo, sendMessage, demoMode, addToast, served])

  // Customer leaves (lost)
  const customerLeaves = useCallback((customerId) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId))
    setLost(prev => prev + 1)
    setCombo(0)
    addToast('error', 'Customer left angry!', '😡')
    playSound(SFX.customerLeave)
  }, [addToast, playSound])

  // Game loop - decay patience
  useEffect(() => {
    if (gameState !== 'playing') return

    gameLoopRef.current = setInterval(() => {
      setCustomers(prev => {
        const updated = prev.map(customer => ({
          ...customer,
          patience: Math.max(0, customer.patience - (PATIENCE_DECAY_RATE * difficulty * 0.1))
        }))

        // Check for customers who ran out of patience
        updated.forEach(customer => {
          if (customer.patience <= 0) {
            customerLeaves(customer.id)
          }
        })

        return updated.filter(c => c.patience > 0)
      })
    }, 100)

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    }
  }, [gameState, difficulty, customerLeaves])

  // Customer spawning
  useEffect(() => {
    if (gameState !== 'playing') return

    const spawnCustomer = async () => {
      // Try to get real messages first
      const messages = await fetchIncomingMessages()
      if (messages.length > 0) {
        messages.forEach(msg => spawnRealCustomer(msg))
      } else if (demoMode || customers.length < 2) {
        // Spawn demo customers if no real messages or in demo mode
        spawnDemoCustomer()
      }
    }

    // Initial spawn
    spawnCustomer()

    // Set up interval
    const interval = Math.max(MIN_SPAWN_INTERVAL, BASE_SPAWN_INTERVAL / difficulty)
    spawnIntervalRef.current = setInterval(spawnCustomer, interval)

    return () => {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current)
    }
  }, [gameState, difficulty, demoMode, fetchIncomingMessages, spawnRealCustomer, spawnDemoCustomer, customers.length])

  // Check game over
  useEffect(() => {
    if (lost >= MAX_LOST && gameState === 'playing') {
      setGameState('gameover')
      playSound(SFX.gameOver)
    }
  }, [lost, gameState, playSound])

  // Cooldown tick (for UI updates)
  useEffect(() => {
    if (gameState !== 'playing') return
    const interval = setInterval(() => {
      setBottleCooldowns(prev => {
        const now = Date.now()
        const updated = { ...prev }
        let changed = false
        for (const id in updated) {
          if (updated[id] < now) {
            delete updated[id]
            changed = true
          }
        }
        return changed ? updated : prev
      })
    }, 100)
    return () => clearInterval(interval)
  }, [gameState])

  // Load templates on mount
  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // Start game
  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setServed(0)
    setLost(0)
    setCombo(0)
    setMaxCombo(0)
    setDifficulty(1)
    setCustomers([])
    setSelectedTemplate(null)
    setBottleCooldowns({})
    lastMessageIdRef.current = 0
    playSound(SFX.gameStart)
  }

  // Get patience level class
  const getPatienceClass = (patience) => {
    if (patience > 70) return 'high'
    if (patience > 40) return 'medium'
    if (patience > 20) return 'low'
    return 'critical'
  }

  // Get mood class
  const getMoodClass = (patience) => {
    if (patience > 60) return 'mood-happy'
    if (patience > 30) return 'mood-waiting'
    return 'mood-angry'
  }

  // Get time badge class
  const getTimeBadgeClass = (arrivedAt) => {
    const seconds = Math.floor((Date.now() - arrivedAt) / 1000)
    if (seconds < 10) return 'fresh'
    if (seconds < 20) return 'waiting'
    return 'urgent'
  }

  // Format time waiting
  const formatTimeWaiting = (arrivedAt) => {
    const seconds = Math.floor((Date.now() - arrivedAt) / 1000)
    return `${seconds}s`
  }

  return (
    <div className="game-container">
      {/* START SCREEN */}
      <AnimatePresence>
        {gameState === 'start' && (
          <motion.div
            className="game-overlay start-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span style={{ fontSize: '64px', display: 'block', marginBottom: '20px' }}>🍺</span>
              <h1>MESSAGE BAR</h1>
            </motion.div>
            <motion.p
              className="subtitle"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Serve customers before they leave!
            </motion.p>
            <motion.div
              className="instructions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p><span>1.</span> Select a message template (drink) from the shelf</p>
              <p><span>2.</span> Click on a customer to serve them</p>
              <p><span>3.</span> Don't let them wait too long or they'll leave angry!</p>
              <p><span>4.</span> Build combos for bonus points!</p>
            </motion.div>
            <motion.button
              className="arcade-button"
              onClick={startGame}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: 'spring' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              START GAME
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GAME OVER SCREEN */}
      <AnimatePresence>
        {gameState === 'gameover' && (
          <motion.div
            className="game-overlay game-over"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.h1
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring' }}
            >
              GAME OVER
            </motion.h1>
            <motion.div
              className="final-stats"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="final-stat">
                <div className="final-stat-value">{score}</div>
                <div className="final-stat-label">Final Score</div>
              </div>
              <div className="final-stat">
                <div className="final-stat-value">{served}</div>
                <div className="final-stat-label">Customers Served</div>
              </div>
              <div className="final-stat">
                <div className="final-stat-value">{maxCombo}x</div>
                <div className="final-stat-label">Max Combo</div>
              </div>
            </motion.div>
            <motion.button
              className="arcade-button"
              onClick={startGame}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              PLAY AGAIN
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GAME HUD */}
      <header className="game-hud">
        <div className="game-logo">
          <span className="logo-icon">🍺</span>
          <h1>MESSAGE BAR</h1>
          <button
            className={`mute-btn ${muted ? 'muted' : ''}`}
            onClick={() => setMuted(!muted)}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
        <div className="stats-container">
          <div className="stat-box score">
            <span className="stat-label">Score</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="stat-box served">
            <span className="stat-label">Served</span>
            <span className="stat-value">{served}</span>
          </div>
          <div className="stat-box lost">
            <span className="stat-label">Lost</span>
            <span className="stat-value">{lost}/{MAX_LOST}</span>
          </div>
          <div className="stat-box combo">
            <span className="stat-label">Combo</span>
            <span className="stat-value">{combo}x</span>
          </div>
        </div>
      </header>

      {/* MAIN GAME AREA */}
      <main className="game-area">
        {/* DRINK SHELF (Templates) */}
        <section className="drink-shelf">
          <div className="shelf-label">Select Your Response</div>
          <div className="drinks-row">
            {templates.map((template) => {
              const onCooldown = isBottleOnCooldown(template.id)
              const cooldownPercent = getBottleCooldownPercent(template.id)
              return (
                <motion.div
                  key={template.id}
                  className={`drink-bottle ${selectedTemplate?.id === template.id ? 'selected' : ''} ${onCooldown ? 'on-cooldown' : ''}`}
                  onClick={() => {
                    setSelectedTemplate(template)
                    playSound(SFX.select)
                  }}
                  whileHover={{ scale: onCooldown ? 1 : 1.05 }}
                  whileTap={{ scale: onCooldown ? 1 : 0.95 }}
                >
                  <div className="tooltip">
                    <div className="tooltip-label">📝 {template.name}</div>
                    <div className="tooltip-text">{template.text}</div>
                  </div>
                  {onCooldown && (
                    <div className="cooldown-overlay">
                      <div className="cooldown-fill" style={{ height: `${cooldownPercent}%` }} />
                      <span className="cooldown-text">⏳</span>
                    </div>
                  )}
                  <span className="drink-emoji">{template.emoji || '📝'}</span>
                  <span className="drink-name">{template.name}</span>
                  <span className="drink-preview">{template.text?.substring(0, 15)}...</span>
                </motion.div>
              )
            })}
            {/* AI Coming Soon */}
            <div className="drink-bottle ai-bottle">
              <span className="drink-emoji">🤖</span>
              <span className="drink-name">AI Reply</span>
              <span className="drink-preview">Coming soon...</span>
            </div>
          </div>
        </section>

        {/* BAR AREA (Customers) */}
        <section className="bar-area">
          {customers.length === 0 ? (
            <div className="empty-customers">
              <span className="icon">🍺</span>
              <p>Waiting for customers...</p>
            </div>
          ) : (
            <div className="customers-row">
              <AnimatePresence>
                {customers.map((customer, index) => (
                  <motion.div
                    key={customer.id}
                    className="customer-slot"
                    initial={{ x: 200, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{
                      y: customer.patience <= 0 ? -100 : 100,
                      opacity: 0,
                      scale: customer.patience <= 0 ? 0.5 : 1.2
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <motion.div
                      className={`customer-card ${customer.patience < 30 ? 'angry' : customer.patience < 60 ? 'waiting' : ''}`}
                      onClick={() => serveCustomer(customer.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="tooltip">
                        <div className="tooltip-label">{customer.avatar} {customer.name}</div>
                        <div className="tooltip-text">{customer.message}</div>
                      </div>
                      <span className={`time-badge ${getTimeBadgeClass(customer.arrivedAt)}`}>
                        {formatTimeWaiting(customer.arrivedAt)}
                      </span>
                      <div className={`customer-avatar ${getMoodClass(customer.patience)}`}>
                        {customer.avatar}
                      </div>
                      <span className="customer-name">{customer.name}</span>
                      <span className="customer-message">"{customer.message.substring(0, 20)}{customer.message.length > 20 ? '...' : ''}"</span>
                      <div className="patience-meter">
                        <motion.div
                          className={`patience-fill ${getPatienceClass(customer.patience)}`}
                          animate={{ width: `${customer.patience}%` }}
                          transition={{ duration: 0.1 }}
                        />
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* BAR COUNTER */}
        <div className="bar-counter" />
      </main>

      {/* TOAST NOTIFICATIONS */}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              className={`toast ${toast.type}`}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
            >
              <span className="toast-icon">{toast.icon}</span>
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* DEMO MODE INDICATOR */}
      {demoMode && gameState === 'playing' && (
        <div className="demo-mode">
          🎮 <span>DEMO MODE</span> - No server connection
        </div>
      )}

      {/* COMBO EFFECT */}
      <AnimatePresence>
        {combo >= 5 && (
          <motion.div
            className="combo-text"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            {combo}x COMBO!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
