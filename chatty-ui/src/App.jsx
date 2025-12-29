import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, MessageCircle, Users, Clock, Sparkles,
  CheckCircle, XCircle, Zap, Heart, Star,
  Phone, Image, FileText, Smile, RefreshCw,
  Volume2, Trash2, Copy, Plus, Settings,
  StarOff, Play, Pause, Timer, List,
  MessagesSquare, Search, ChevronRight, User, Pencil,
  Moon, Sun
} from 'lucide-react'
import './App.css'
import { config, setApiKey, getStoredApiKey, getTheme, setTheme } from './config'

const WAHA_URL = config.WAHA_URL
const API_URL = config.API_URL

// Get API key dynamically (from localStorage)
const getApiKey = () => config.API_KEY

// WAHA API Helper (WhatsApp)
async function wahaApi(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json', 'X-Api-Key': getApiKey() }
  const options = { method, headers, mode: 'cors' }
  if (body) options.body = JSON.stringify(body)
  const res = await fetch(`${WAHA_URL}${endpoint}`, options)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Backend API Helper (SQLite)
async function api(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' }
  const options = { method, headers, mode: 'cors' }
  if (body) options.body = JSON.stringify(body)
  const res = await fetch(`${API_URL}${endpoint}`, options)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Mascot Component
function Mascot({ status, size = 80 }) {
  const isConnected = status === 'WORKING'
  return (
    <motion.div
      className="mascot"
      style={{ width: size, height: size }}
      animate={isConnected ? { scale: [1, 1.05, 1] } : { rotate: [0, -5, 5, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="bubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isConnected ? "#00D4AA" : "#FFD93D"} />
            <stop offset="100%" stopColor={isConnected ? "#00A88A" : "#FFA500"} />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.2"/>
          </filter>
        </defs>
        <path
          d="M50 10 C75 10 90 30 90 50 C90 70 75 85 55 85 L40 85 L25 95 L30 80 C15 75 10 60 10 50 C10 30 25 10 50 10"
          fill="url(#bubbleGrad)"
          filter="url(#shadow)"
        />
        <motion.ellipse
          cx="35" cy="45" rx="6" ry="8" fill="white"
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        />
        <motion.ellipse
          cx="60" cy="45" rx="6" ry="8" fill="white"
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        />
        <circle cx="36" cy="46" r="3" fill="#2D3436" />
        <circle cx="61" cy="46" r="3" fill="#2D3436" />
        <motion.path
          d={isConnected ? "M35 60 Q47 72 60 60" : "M35 65 Q47 60 60 65"}
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {isConnected && (
          <motion.text
            x="75" y="25"
            fontSize="15"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ✨
          </motion.text>
        )}
      </svg>
    </motion.div>
  )
}

// Toast Component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      className={`toast toast-${type}`}
    >
      {type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
      <span>{message}</span>
    </motion.div>
  )
}

// Emoji Picker
const EMOJIS = ['😀', '😂', '❤️', '🔥', '👍', '🎉', '✨', '💯', '🙏', '😍', '🤔', '👋', '💪', '🚀', '⭐', '🌟']

function EmojiPicker({ onSelect, onClose }) {
  return (
    <motion.div
      className="emoji-picker"
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 10 }}
    >
      <div className="emoji-grid">
        {EMOJIS.map(emoji => (
          <motion.button
            key={emoji}
            className="emoji-btn"
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { onSelect(emoji); onClose(); }}
          >
            {emoji}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

// Feature Card
function FeatureCard({ icon: Icon, title, color, children, delay = 0 }) {
  return (
    <motion.div
      className="feature-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -5 }}
      style={{ '--accent-color': color }}
    >
      <div className="feature-header">
        <div className="feature-icon" style={{ background: color }}>
          <Icon size={24} color="white" />
        </div>
        <h3>{title}</h3>
      </div>
      <div className="feature-content">
        {children}
      </div>
    </motion.div>
  )
}

// Favorite Card
function FavoriteCard({ favorite, onUse, onEdit, onRemove }) {
  return (
    <motion.div
      className="favorite-card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <div className="favorite-info">
        <span className="favorite-name">{favorite.name || 'Unknown'}</span>
        <span className="favorite-phone">{favorite.phone}</span>
      </div>
      <div className="favorite-actions">
        <motion.button
          className="icon-btn use"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onUse(favorite)}
          title="Send message"
        >
          <Send size={16} />
        </motion.button>
        <motion.button
          className="icon-btn edit"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onEdit(favorite)}
          title="Edit"
        >
          <Pencil size={16} />
        </motion.button>
        <motion.button
          className="icon-btn remove"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onRemove(favorite.phone)}
          title="Remove"
        >
          <Trash2 size={16} />
        </motion.button>
      </div>
    </motion.div>
  )
}

// Queue Item
function QueueItem({ item, index }) {
  const statusColors = {
    pending: '#FFD93D',
    sending: '#6C9FFF',
    sent: '#00D4AA',
    failed: '#FF6B6B'
  }

  return (
    <motion.div
      className="queue-item"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{ '--status-color': statusColors[item.status] }}
    >
      <div className="queue-number">#{index + 1}</div>
      <div className="queue-info">
        <span className="queue-phone">{item.phone}</span>
        <span className={`queue-status ${item.status}`}>
          {item.status === 'pending' && <Clock size={12} />}
          {item.status === 'sending' && <RefreshCw size={12} className="spinning" />}
          {item.status === 'sent' && <CheckCircle size={12} />}
          {item.status === 'failed' && <XCircle size={12} />}
          {item.status}
        </span>
      </div>
      {item.delay && item.status === 'pending' && (
        <span className="queue-delay">~{item.delay}s</span>
      )}
    </motion.div>
  )
}

// Template Card
function TemplateCard({ template, onUse }) {
  return (
    <motion.div
      className="template-card"
      style={{ '--card-color': template.color }}
      whileHover={{ scale: 1.02, rotate: 1 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onUse(template)}
    >
      <div className="template-emoji">{template.emoji}</div>
      <div className="template-info">
        <h4>{template.name}</h4>
        <p>{template.preview}</p>
      </div>
    </motion.div>
  )
}

// Main App
function App() {
  const [session, setSession] = useState(null)
  const [toasts, setToasts] = useState([])
  const [activeTab, setActiveTab] = useState('send')
  const [subTab, setSubTab] = useState({ send: 'quick', contacts: 'favorites' })

  // Quick Send
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [sending, setSending] = useState(false)

  // Favorites
  const [favorites, setFavorites] = useState([])
  const [newFavName, setNewFavName] = useState('')
  const [newFavPhone, setNewFavPhone] = useState('')
  const [editingFavorite, setEditingFavorite] = useState(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')

  // Bulk Send
  const [bulkPhones, setBulkPhones] = useState('')
  const [bulkMessage, setBulkMessage] = useState('')
  const [useQueue, setUseQueue] = useState(true)
  const [minDelay, setMinDelay] = useState(3)
  const [maxDelay, setMaxDelay] = useState(10)
  const [queue, setQueue] = useState([])
  const [queueRunning, setQueueRunning] = useState(false)
  const queueRef = useRef(null)

  // Check Number
  const [checkPhone, setCheckPhone] = useState('')
  const [checkResult, setCheckResult] = useState(null)

  // Reconnecting state
  const [reconnecting, setReconnecting] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [showQr, setShowQr] = useState(false)
  const [qrLoading, setQrLoading] = useState(false)
  const qrTimeoutRef = useRef(null)

  // Settings
  const [showSettings, setShowSettings] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState(getStoredApiKey() || '')
  const [theme, setThemeState] = useState(getTheme())

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setThemeState(newTheme)
    setTheme(newTheme)
  }

  // Conversations
  const [chats, setChats] = useState([])
  const [chatsLoading, setChatsLoading] = useState(false)
  const [selectedChat, setSelectedChat] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  // Templates
  const [templates] = useState([
    { id: 1, name: 'Welcome', emoji: '👋', color: '#00D4AA', preview: 'Hey! Welcome aboard...', text: 'Hey! 👋 Welcome aboard! We\'re so excited to have you here. Let us know if you need anything!' },
    { id: 2, name: 'Thank You', emoji: '🙏', color: '#FF6B6B', preview: 'Thank you so much...', text: 'Thank you so much for your support! 🙏 It really means a lot to us. Have an amazing day! ✨' },
    { id: 3, name: 'Reminder', emoji: '⏰', color: '#FFD93D', preview: 'Quick reminder...', text: 'Quick reminder! ⏰ Don\'t forget about our meeting today. See you soon! 🚀' },
    { id: 4, name: 'Celebration', emoji: '🎉', color: '#A66CFF', preview: 'Congratulations...', text: 'Congratulations! 🎉🎊 You did it! So proud of you! Keep shining! ⭐' },
  ])

  const showToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  // Check if API key is set, show settings if not
  useEffect(() => {
    const apiKey = getStoredApiKey()
    if (!apiKey) {
      setShowSettings(true)
    }
  }, [])

  // Load favorites from SQLite
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const data = await api('/api/favorites')
        setFavorites(data)
      } catch (e) {
        console.error('Failed to load favorites:', e)
      }
    }
    loadFavorites()
  }, [])

  // Fetch session status from WAHA
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessions = await wahaApi('/api/sessions?all=true')
        if (sessions.length > 0) setSession(sessions[0])
      } catch (e) {
        console.error('Failed to fetch session:', e)
      }
    }
    fetchSession()
    const interval = setInterval(fetchSession, 5000)
    return () => clearInterval(interval)
  }, [])

  // Favorites Management
  const addFavorite = async () => {
    if (!newFavPhone) {
      showToast('Please enter a phone number', 'error')
      return
    }
    try {
      const result = await api('/api/favorites', 'POST', {
        phone: newFavPhone,
        name: newFavName || newFavPhone.replace(/\D/g, '')
      })
      setFavorites(prev => [...prev, result])
      setNewFavName('')
      setNewFavPhone('')
      showToast('Added to favorites! ⭐')
    } catch (e) {
      if (e.message.includes('409')) {
        showToast('This number is already in favorites', 'error')
      } else {
        showToast('Failed to add favorite', 'error')
      }
    }
  }

  const removeFavorite = async (phone) => {
    try {
      await api(`/api/favorites/${phone}`, 'DELETE')
      setFavorites(prev => prev.filter(f => f.phone !== phone))
      showToast('Removed from favorites')
    } catch (e) {
      showToast('Failed to remove favorite', 'error')
    }
  }

  const openEditFavorite = (fav) => {
    setEditingFavorite(fav)
    setEditName(fav.name)
    setEditPhone(fav.phone)
  }

  const saveEditFavorite = async () => {
    if (!editName.trim() || !editPhone.trim()) {
      showToast('Name and phone are required', 'error')
      return
    }
    try {
      // Delete old and create new (simple approach)
      await api(`/api/favorites/${editingFavorite.phone}`, 'DELETE')
      const result = await api('/api/favorites', 'POST', {
        phone: editPhone.trim(),
        name: editName.trim()
      })
      setFavorites(prev => prev.map(f =>
        f.phone === editingFavorite.phone ? result : f
      ))
      setEditingFavorite(null)
      showToast('Favorite updated!')
    } catch (e) {
      showToast('Failed to update favorite', 'error')
    }
  }

  const useFavorite = (fav) => {
    setPhone(fav.phone)
    setActiveTab('send')
    showToast(`Selected ${fav.name}`)
  }

  const addCurrentToFavorites = async () => {
    if (!phone) {
      showToast('Enter a phone number first', 'error')
      return
    }
    try {
      const result = await api('/api/favorites', 'POST', {
        phone: phone,
        name: phone.replace(/\D/g, '')
      })
      setFavorites(prev => [...prev, result])
      showToast('Added to favorites! ⭐')
    } catch (e) {
      if (e.message.includes('409')) {
        showToast('Already in favorites!', 'error')
      } else {
        showToast('Failed to add favorite', 'error')
      }
    }
  }

  // Send Message via WAHA
  const sendMessage = async () => {
    if (!phone || !message) {
      showToast('Please enter phone and message', 'error')
      return
    }
    setSending(true)
    try {
      await wahaApi('/api/sendText', 'POST', {
        session: 'default',
        chatId: `${phone.replace(/\D/g, '')}@c.us`,
        text: message
      })
      // Log to history
      await api('/api/history', 'POST', { phone: phone.replace(/\D/g, ''), message, status: 'sent' })
      showToast('Message sent! 🚀')
      setMessage('')
    } catch (e) {
      showToast('Failed to send message', 'error')
    }
    setSending(false)
  }

  // Queue Processing
  const processQueue = useCallback(async () => {
    setQueueRunning(true)

    for (let i = 0; i < queue.length; i++) {
      // Check if stopped
      if (!queueRef.current) break

      const item = queue[i]
      if (item.status !== 'pending') continue

      // Update status to sending
      setQueue(prev => prev.map((q, idx) =>
        idx === i ? { ...q, status: 'sending' } : q
      ))

      try {
        await wahaApi('/api/sendText', 'POST', {
          session: 'default',
          chatId: `${item.phone.replace(/\D/g, '')}@c.us`,
          text: bulkMessage
        })
        // Log to history
        await api('/api/history', 'POST', { phone: item.phone, message: bulkMessage, status: 'sent' })

        setQueue(prev => prev.map((q, idx) =>
          idx === i ? { ...q, status: 'sent' } : q
        ))
      } catch (e) {
        setQueue(prev => prev.map((q, idx) =>
          idx === i ? { ...q, status: 'failed' } : q
        ))
      }

      // Wait for random delay before next message (if not last)
      if (i < queue.length - 1 && queueRef.current) {
        const delay = item.delay * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    setQueueRunning(false)
    queueRef.current = false
    showToast('Queue completed! 🎉')
  }, [queue, bulkMessage])

  // Start Bulk Send with Queue
  const startBulkSend = () => {
    const phones = bulkPhones.split('\n').filter(p => p.trim())
    if (phones.length === 0 || !bulkMessage) {
      showToast('Please enter phones and message', 'error')
      return
    }

    if (useQueue) {
      // Create queue with random delays
      const queueItems = phones.map((phone, idx) => ({
        phone: phone.trim().replace(/\D/g, ''),
        status: 'pending',
        delay: idx === 0 ? 0 : Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay
      }))

      setQueue(queueItems)
      queueRef.current = true
      showToast(`Queue created with ${phones.length} messages! 🚀`)
    } else {
      // Send immediately (old behavior)
      sendBulkImmediate(phones)
    }
  }

  const sendBulkImmediate = async (phones) => {
    setSending(true)
    let success = 0
    for (const p of phones) {
      try {
        await wahaApi('/api/sendText', 'POST', {
          session: 'default',
          chatId: `${p.replace(/\D/g, '')}@c.us`,
          text: bulkMessage
        })
        await api('/api/history', 'POST', { phone: p.replace(/\D/g, ''), message: bulkMessage, status: 'sent' })
        success++
      } catch (e) { /* continue */ }
    }
    showToast(`Sent to ${success}/${phones.length} contacts! 🎉`)
    setSending(false)
  }

  const startQueue = () => {
    queueRef.current = true
    processQueue()
  }

  const pauseQueue = () => {
    queueRef.current = false
    setQueueRunning(false)
    showToast('Queue paused ⏸️')
  }

  const clearQueue = () => {
    queueRef.current = false
    setQueueRunning(false)
    setQueue([])
    showToast('Queue cleared')
  }

  // Load favorites to bulk
  const loadFavoritesToBulk = () => {
    if (favorites.length === 0) {
      showToast('No favorites saved', 'error')
      return
    }
    setBulkPhones(favorites.map(f => f.phone).join('\n'))
    showToast(`Loaded ${favorites.length} favorites!`)
  }

  // Fetch QR Code
  const fetchQrCode = async () => {
    try {
      const response = await fetch(`${WAHA_URL}/api/default/auth/qr`, {
        headers: { 'X-Api-Key': getApiKey() }
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setQrCode(url)
        setQrLoading(false)
        // Clear timeout since we got QR
        if (qrTimeoutRef.current) {
          clearTimeout(qrTimeoutRef.current)
        }
      }
    } catch (e) {
      console.error('Failed to fetch QR:', e)
    }
  }

  // Open QR modal with loading
  const openQrModal = () => {
    setQrCode(null)
    setQrLoading(true)
    setShowQr(true)

    // Set 30 second timeout
    qrTimeoutRef.current = setTimeout(() => {
      if (!qrCode) {
        setShowQr(false)
        setQrLoading(false)
        showToast('QR code timeout. Try again.', 'error')
      }
    }, 30000)

    // Start fetching
    fetchQrCode()
  }

  // Close QR modal
  const closeQrModal = () => {
    setShowQr(false)
    setQrLoading(false)
    if (qrTimeoutRef.current) {
      clearTimeout(qrTimeoutRef.current)
    }
  }

  // Poll for QR when session needs scanning
  useEffect(() => {
    let interval
    if (session?.status === 'SCAN_QR_CODE' && showQr) {
      interval = setInterval(fetchQrCode, 5000)
    } else if (session?.status === 'WORKING') {
      closeQrModal()
      showToast('Connected! 🎉')
    }
    return () => clearInterval(interval)
  }, [session?.status, showQr])

  // Reconnect Session
  const reconnectSession = async () => {
    setReconnecting(true)

    try {
      // First check if session exists (include stopped sessions)
      const sessions = await wahaApi('/api/sessions?all=true')
      const existingSession = sessions.find(s => s.name === 'default')

      if (existingSession) {
        switch (existingSession.status) {
          case 'WORKING':
            showToast('Already connected!', 'success')
            setReconnecting(false)
            return
          case 'SCAN_QR_CODE':
            // Need QR scan, open modal
            openQrModal()
            break
          case 'STARTING':
            // Wait for it to be ready
            showToast('Session starting...', 'success')
            break
          case 'STOPPED':
            // Start the stopped session
            await wahaApi('/api/sessions/default/start', 'POST')
            showToast('Reconnecting...', 'success')
            break
          case 'FAILED':
            // Stop and restart failed session
            await wahaApi('/api/sessions/default/stop', 'POST')
            await wahaApi('/api/sessions/default/start', 'POST')
            showToast('Restarting session...', 'success')
            break
          default:
            // Unknown state, try to restart with PUT
            await wahaApi('/api/sessions', 'PUT', {
              name: 'default',
              start: true
            })
            showToast('Reconnecting...', 'success')
        }
      } else {
        // Create new session with POST, then start it
        await wahaApi('/api/sessions', 'POST', {
          name: 'default',
          start: true,
          config: {
            noweb: { store: { enabled: false } }
          }
        })
        showToast('Creating session...', 'success')
      }
    } catch (e) {
      console.error('Reconnect error:', e)
      showToast('Failed to reconnect. Check WAHA server.', 'error')
    }
    setReconnecting(false)
  }

  // Watch for session status change to SCAN_QR_CODE and open modal
  useEffect(() => {
    if (session?.status === 'SCAN_QR_CODE' && !showQr) {
      openQrModal()
    }
  }, [session?.status])

  // Load Chats from our backend (incoming messages via webhook)
  const loadChats = async () => {
    setChatsLoading(true)
    try {
      // Get incoming messages from our backend
      const data = await api('/api/incoming?limit=50')
      // Group by phone to show as conversations
      const grouped = {}
      for (const msg of data) {
        if (!grouped[msg.phone]) {
          grouped[msg.phone] = {
            id: msg.chat_id,
            name: msg.sender_name || msg.phone,
            lastMessage: { body: msg.message, timestamp: msg.timestamp },
            messages: []
          }
        }
        grouped[msg.phone].messages.push(msg)
      }
      setChats(Object.values(grouped))
    } catch (e) {
      console.error('Failed to load chats:', e)
      // Silently fail - webhook will populate messages as they come
    }
    setChatsLoading(false)
  }

  // Select a chat (messages are already loaded in the chat object)
  const selectChat = (chat) => {
    setSelectedChat(chat)
    // Messages are already in chat.messages from loadChats
    setChatMessages(chat.messages || [])
  }

  // Get chat summary stats
  const getChatSummary = (messages) => {
    if (!messages || messages.length === 0) return null
    const fromMe = messages.filter(m => m.fromMe).length
    const fromThem = messages.length - fromMe
    const firstMsg = messages[messages.length - 1]
    const lastMsg = messages[0]
    return {
      total: messages.length,
      fromMe,
      fromThem,
      timeSpan: firstMsg && lastMsg ? {
        first: new Date(firstMsg.timestamp * 1000),
        last: new Date(lastMsg.timestamp * 1000)
      } : null
    }
  }

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    const now = Date.now()
    const diff = now - timestamp * 1000
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  // Check Contact via WAHA
  const checkContact = async () => {
    if (!checkPhone) {
      showToast('Please enter a phone number', 'error')
      return
    }
    try {
      const result = await wahaApi(`/api/contacts/check-exists?phone=${checkPhone}&session=default`)
      setCheckResult(result)
      showToast(result.numberExists ? 'Number exists! ✅' : 'Number not found ❌', result.numberExists ? 'success' : 'error')
    } catch (e) {
      showToast('Failed to check number', 'error')
    }
  }

  const useTemplate = (template) => {
    setMessage(template.text)
    setActiveTab('send')
    showToast(`Loaded "${template.name}" template! ✨`)
  }

  // Stats
  const queueStats = {
    total: queue.length,
    pending: queue.filter(q => q.status === 'pending').length,
    sent: queue.filter(q => q.status === 'sent').length,
    failed: queue.filter(q => q.status === 'failed').length
  }

  return (
    <div className="app">
      {/* Background Blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQr && session?.status !== 'WORKING' && (
          <motion.div
            className="qr-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeQrModal}
          >
            <motion.div
              className="qr-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>📱 Scan QR Code</h3>
              <p>Open WhatsApp on your phone and scan this code</p>

              {qrLoading && !qrCode ? (
                <div className="qr-loading">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw size={48} />
                  </motion.div>
                  <span>Loading QR code...</span>
                </div>
              ) : qrCode ? (
                <div className="qr-image-container" onClick={fetchQrCode}>
                  <img src={qrCode} alt="WhatsApp QR Code" />
                  <div className="qr-refresh-overlay">
                    <RefreshCw size={48} />
                    <span>Click to refresh</span>
                  </div>
                </div>
              ) : (
                <div className="qr-loading">
                  <span>Waiting for QR code...</span>
                </div>
              )}

              <button className="btn btn-secondary" onClick={closeQrModal}>
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="qr-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              className="qr-modal settings-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>⚙️ Settings</h3>
              <p>Configure your WAHA API connection</p>

              <div className="settings-form">
                <label>
                  <span>API Key</span>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Enter your WAHA API key"
                  />
                </label>

                <div className="theme-toggle">
                  <span>Theme</span>
                  <motion.button
                    className={`theme-switch ${theme}`}
                    onClick={toggleTheme}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      className="theme-switch-handle"
                      animate={{ x: theme === 'dark' ? 28 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                    </motion.div>
                    <span className="theme-label light">Light</span>
                    <span className="theme-label dark">Dark</span>
                  </motion.button>
                </div>
              </div>

              <div className="settings-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setApiKey(apiKeyInput)
                    setShowSettings(false)
                    toast('API key saved! Refreshing...', 'success')
                    // Force page reload to apply new API key
                    setTimeout(() => window.location.reload(), 500)
                  }}
                >
                  Save & Connect
                </button>
                <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Favorite Modal */}
      <AnimatePresence>
        {editingFavorite && (
          <motion.div
            className="qr-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingFavorite(null)}
          >
            <motion.div
              className="qr-modal edit-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3><Pencil size={20} /> Edit Favorite</h3>
              <p>Update contact details</p>

              <div className="edit-form">
                <label>
                  <span>Name</span>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Contact name"
                  />
                </label>
                <label>
                  <span>Phone Number</span>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="972501234567"
                  />
                </label>
              </div>

              <div className="edit-actions">
                <button className="btn btn-primary" onClick={saveEditFavorite}>
                  Save Changes
                </button>
                <button className="btn btn-secondary" onClick={() => setEditingFavorite(null)}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        className="header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-left">
          <Mascot status={session?.status} size={60} />
          <div className="header-title">
            <h1>Chatty</h1>
            <p>WhatsApp Magic ✨</p>
          </div>
        </div>
        <div className="header-right">
          <motion.button
            className="btn btn-icon"
            onClick={() => setShowSettings(true)}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            title="Settings"
          >
            <Settings size={20} />
          </motion.button>
          <motion.div
            className={`status-badge ${session?.status === 'WORKING' ? 'connected' : 'disconnected'}`}
            animate={session?.status === 'WORKING' ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="status-dot" />
            <span>{session?.status === 'WORKING' ? 'Connected' : session?.status || 'Offline'}</span>
          </motion.div>
          {session?.status !== 'WORKING' && (
            <motion.button
              className={`btn btn-reconnect ${reconnecting ? 'reconnecting' : ''}`}
              onClick={reconnectSession}
              disabled={reconnecting}
              whileHover={{ scale: reconnecting ? 1 : 1.05 }}
              whileTap={{ scale: reconnecting ? 1 : 0.95 }}
              initial={{ opacity: 0, x: 20 }}
              animate={reconnecting ? {
                opacity: 1,
                x: 0,
                scale: [1, 1.05, 1],
                boxShadow: [
                  '0 4px 16px rgba(255, 165, 0, 0.3)',
                  '0 4px 24px rgba(255, 165, 0, 0.6)',
                  '0 4px 16px rgba(255, 165, 0, 0.3)'
                ]
              } : { opacity: 1, x: 0 }}
              transition={reconnecting ? {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              } : {}}
            >
              <motion.div
                animate={reconnecting ? { rotate: 360 } : {}}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw size={18} />
              </motion.div>
              {reconnecting ? 'Connecting...' : 'Reconnect'}
            </motion.button>
          )}
          {session?.me && (
            <div className="user-info">
              <span className="user-name">{session.me.pushName}</span>
            </div>
          )}
        </div>
      </motion.header>

      {/* Tab Navigation */}
      <motion.nav
        className="tabs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {[
          { id: 'send', icon: Send, label: 'Send' },
          { id: 'contacts', icon: User, label: 'Contacts' },
          { id: 'chats', icon: MessagesSquare, label: 'Chats' },
          { id: 'templates', icon: Sparkles, label: 'Templates' },
        ].map((tab) => (
          <motion.button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id)
              if (tab.id === 'chats' && chats.length === 0) loadChats()
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <tab.icon size={20} />
            <span>{tab.label}</span>
            {tab.id === 'contacts' && favorites.length > 0 && (
              <span className="tab-badge">{favorites.length}</span>
            )}
            {tab.id === 'chats' && chats.length > 0 && (
              <span className="tab-badge">{chats.length}</span>
            )}
          </motion.button>
        ))}
      </motion.nav>

      {/* Main Content */}
      <main className="main">
        <AnimatePresence mode="wait">
          {/* Send Tab - Quick + Bulk */}
          {activeTab === 'send' && (
            <motion.div
              key="send"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="content-panel"
            >
              {/* Sub-tabs */}
              <div className="sub-tabs">
                <button
                  className={`sub-tab ${subTab.send === 'quick' ? 'active' : ''}`}
                  onClick={() => setSubTab(prev => ({ ...prev, send: 'quick' }))}
                >
                  <Zap size={16} />
                  Quick
                </button>
                <button
                  className={`sub-tab ${subTab.send === 'bulk' ? 'active' : ''}`}
                  onClick={() => setSubTab(prev => ({ ...prev, send: 'bulk' }))}
                >
                  <Users size={16} />
                  Bulk
                </button>
                {queue.length > 0 && (
                  <button
                    className={`sub-tab ${subTab.send === 'queue' ? 'active' : ''}`}
                    onClick={() => setSubTab(prev => ({ ...prev, send: 'queue' }))}
                  >
                    <List size={16} />
                    Queue
                    <span className="sub-badge">{queue.length}</span>
                  </button>
                )}
              </div>

              {/* Quick Send */}
              {subTab.send === 'quick' && (
                <FeatureCard icon={Send} title="Quick Send" color="var(--teal)" delay={0}>
                  <div className="form-group">
                    <label>📱 Phone Number</label>
                    <div className="input-with-action">
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., 972501234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                      <motion.button
                        className="icon-btn-inline"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={addCurrentToFavorites}
                        title="Add to favorites"
                      >
                        <Star size={20} />
                      </motion.button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>💬 Message</label>
                    <div className="message-input-wrapper">
                      <textarea
                        className="input textarea"
                        placeholder="Type your message here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                      <button
                        className="emoji-trigger"
                        onClick={() => setShowEmoji(!showEmoji)}
                      >
                        <Smile size={24} />
                      </button>
                      <AnimatePresence>
                        {showEmoji && (
                          <EmojiPicker
                            onSelect={(emoji) => setMessage(prev => prev + emoji)}
                            onClose={() => setShowEmoji(false)}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <motion.button
                    className="btn btn-primary btn-large"
                    onClick={sendMessage}
                    disabled={sending}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {sending ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <RefreshCw size={20} />
                      </motion.div>
                    ) : (
                      <>
                        <Send size={20} />
                        Send Message
                        <Zap size={18} />
                      </>
                    )}
                  </motion.button>
                </FeatureCard>
              )}

              {/* Bulk Send */}
              {subTab.send === 'bulk' && (
                <FeatureCard icon={Users} title="Bulk Send" color="var(--coral)" delay={0}>
                  <div className="form-group">
                    <div className="label-with-action">
                      <label>📱 Phone Numbers (one per line)</label>
                      <button className="link-btn" onClick={loadFavoritesToBulk}>
                        Load Favorites
                      </button>
                    </div>
                    <textarea
                      className="input textarea"
                      placeholder="972501234567&#10;972509876543&#10;972507654321"
                      value={bulkPhones}
                      onChange={(e) => setBulkPhones(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <div className="form-group">
                    <label>💬 Message to All</label>
                    <textarea
                      className="input textarea"
                      placeholder="Your bulk message..."
                      value={bulkMessage}
                      onChange={(e) => setBulkMessage(e.target.value)}
                    />
                  </div>

                  {/* Queue Options */}
                  <div className="queue-options">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={useQueue}
                        onChange={(e) => setUseQueue(e.target.checked)}
                      />
                      <span className="toggle-switch"></span>
                      <span>Use Queue with Random Delays</span>
                      <Timer size={16} />
                    </label>

                    {useQueue && (
                      <motion.div
                        className="delay-settings"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="delay-inputs">
                          <div className="delay-input">
                            <label>Min delay (sec)</label>
                            <input
                              type="number"
                              min="1"
                              max="60"
                              value={minDelay}
                              onChange={(e) => setMinDelay(parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <span className="delay-separator">to</span>
                          <div className="delay-input">
                            <label>Max delay (sec)</label>
                            <input
                              type="number"
                              min="1"
                              max="120"
                              value={maxDelay}
                              onChange={(e) => setMaxDelay(parseInt(e.target.value) || 10)}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="bulk-stats">
                    <div className="stat">
                      <Users size={18} />
                      <span>{bulkPhones.split('\n').filter(p => p.trim()).length} recipients</span>
                    </div>
                  </div>

                  {queue.length === 0 ? (
                    <motion.button
                      className="btn btn-coral btn-large"
                      onClick={startBulkSend}
                      disabled={sending}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {sending ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <RefreshCw size={20} />
                        </motion.div>
                      ) : (
                        <>
                          <Zap size={20} />
                          {useQueue ? 'Create Queue' : 'Send to All'}
                          <Heart size={18} />
                        </>
                      )}
                    </motion.button>
                  ) : (
                    <div className="queue-controls">
                      {!queueRunning ? (
                        <motion.button
                          className="btn btn-primary"
                          onClick={startQueue}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Play size={20} />
                          Start Queue
                        </motion.button>
                      ) : (
                        <motion.button
                          className="btn btn-yellow"
                          onClick={pauseQueue}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Pause size={20} />
                          Pause
                        </motion.button>
                      )}
                      <motion.button
                        className="btn btn-secondary"
                        onClick={clearQueue}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Trash2 size={20} />
                        Clear
                      </motion.button>
                    </div>
                  )}

                  {/* Queue Display */}
                  {queue.length > 0 && (
                    <motion.div
                      className="queue-section"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="queue-header">
                        <h4><List size={18} /> Queue Progress</h4>
                        <div className="queue-stats">
                          <span className="stat-sent">{queueStats.sent} sent</span>
                          <span className="stat-pending">{queueStats.pending} pending</span>
                          {queueStats.failed > 0 && (
                            <span className="stat-failed">{queueStats.failed} failed</span>
                          )}
                        </div>
                      </div>
                      <div className="queue-progress-bar">
                        <motion.div
                          className="queue-progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${(queueStats.sent / queueStats.total) * 100}%` }}
                        />
                      </div>
                      <div className="queue-list">
                        {queue.map((item, i) => (
                          <QueueItem key={i} item={item} index={i} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </FeatureCard>
              )}

              {/* Queue Manager */}
              {subTab.send === 'queue' && queue.length > 0 && (
                <FeatureCard icon={List} title="Queue Manager" color="var(--purple)" delay={0}>
                  <div className="queue-manager">
                    <div className="queue-overview">
                      <div className="queue-stat-card total">
                        <span className="stat-number">{queueStats.total}</span>
                        <span className="stat-title">Total</span>
                      </div>
                      <div className="queue-stat-card pending">
                        <span className="stat-number">{queueStats.pending}</span>
                        <span className="stat-title">Pending</span>
                      </div>
                      <div className="queue-stat-card sent">
                        <span className="stat-number">{queueStats.sent}</span>
                        <span className="stat-title">Sent</span>
                      </div>
                      <div className="queue-stat-card failed">
                        <span className="stat-number">{queueStats.failed}</span>
                        <span className="stat-title">Failed</span>
                      </div>
                    </div>

                    <div className="queue-progress-bar large">
                      <motion.div
                        className="queue-progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${(queueStats.sent / queueStats.total) * 100}%` }}
                      />
                    </div>

                    <div className="queue-controls-full">
                      {!queueRunning ? (
                        <motion.button
                          className="btn btn-primary btn-large"
                          onClick={startQueue}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Play size={20} />
                          Start Queue
                        </motion.button>
                      ) : (
                        <motion.button
                          className="btn btn-yellow btn-large"
                          onClick={pauseQueue}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Pause size={20} />
                          Pause Queue
                        </motion.button>
                      )}
                      <motion.button
                        className="btn btn-secondary btn-large"
                        onClick={clearQueue}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Trash2 size={20} />
                        Clear All
                      </motion.button>
                    </div>

                    <div className="queue-list-full">
                      {queue.map((item, i) => (
                        <QueueItem key={i} item={item} index={i} />
                      ))}
                    </div>
                  </div>
                </FeatureCard>
              )}
            </motion.div>
          )}

          {/* Contacts Tab - Favorites + Check */}
          {activeTab === 'contacts' && (
            <motion.div
              key="contacts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="content-panel"
            >
              {/* Sub-tabs */}
              <div className="sub-tabs">
                <button
                  className={`sub-tab ${subTab.contacts === 'favorites' ? 'active' : ''}`}
                  onClick={() => setSubTab(prev => ({ ...prev, contacts: 'favorites' }))}
                >
                  <Star size={16} />
                  Favorites
                  {favorites.length > 0 && <span className="sub-badge">{favorites.length}</span>}
                </button>
                <button
                  className={`sub-tab ${subTab.contacts === 'check' ? 'active' : ''}`}
                  onClick={() => setSubTab(prev => ({ ...prev, contacts: 'check' }))}
                >
                  <Search size={16} />
                  Check
                </button>
              </div>

              {/* Favorites */}
              {subTab.contacts === 'favorites' && (
                <FeatureCard icon={Star} title="Favorites" color="var(--yellow)" delay={0}>
                  <div className="add-favorite-form">
                    <input
                      type="text"
                      className="input"
                      placeholder="Name (optional)"
                      value={newFavName}
                      onChange={(e) => setNewFavName(e.target.value)}
                    />
                    <input
                      type="text"
                      className="input"
                      placeholder="Phone number"
                      value={newFavPhone}
                      onChange={(e) => setNewFavPhone(e.target.value)}
                    />
                    <motion.button
                      className="btn btn-yellow"
                      onClick={addFavorite}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Plus size={20} />
                      Add
                    </motion.button>
                  </div>

                  <div className="favorites-list">
                    <AnimatePresence>
                      {favorites.length === 0 ? (
                        <motion.div
                          className="empty-state"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <Star size={48} />
                          <p>No favorites yet</p>
                          <span>Add your frequently contacted numbers here!</span>
                        </motion.div>
                      ) : (
                        favorites.map(fav => (
                          <FavoriteCard
                            key={fav.phone}
                            favorite={fav}
                            onUse={useFavorite}
                            onEdit={openEditFavorite}
                            onRemove={removeFavorite}
                          />
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </FeatureCard>
              )}

              {/* Check Number */}
              {subTab.contacts === 'check' && (
                <FeatureCard icon={Phone} title="Check Number" color="var(--blue)" delay={0}>
                  <div className="form-group">
                    <label>📱 Phone Number to Check</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g., 972501234567"
                      value={checkPhone}
                      onChange={(e) => setCheckPhone(e.target.value)}
                    />
                  </div>
                  <motion.button
                    className="btn btn-blue btn-large"
                    onClick={checkContact}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Phone size={20} />
                    Check if Exists
                    <Sparkles size={18} />
                  </motion.button>

                  <AnimatePresence>
                    {checkResult && (
                      <motion.div
                        className={`check-result ${checkResult.numberExists ? 'exists' : 'not-exists'}`}
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        {checkResult.numberExists ? (
                          <>
                            <CheckCircle size={40} />
                            <h4>Number Exists! 🎉</h4>
                            <p>This number is on WhatsApp</p>
                          </>
                        ) : (
                          <>
                            <XCircle size={40} />
                            <h4>Not Found 😔</h4>
                            <p>This number is not on WhatsApp</p>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </FeatureCard>
              )}
            </motion.div>
          )}

          {/* Chats Tab - Conversation Summaries */}
          {activeTab === 'chats' && (
            <motion.div
              key="chats"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="content-panel chats-panel"
            >
              <div className="chats-layout">
                {/* Chat List */}
                <div className="chat-list-container">
                  <div className="chat-list-header">
                    <h3><MessagesSquare size={20} /> Conversations</h3>
                    <motion.button
                      className="icon-btn refresh"
                      onClick={loadChats}
                      disabled={chatsLoading}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <RefreshCw size={18} className={chatsLoading ? 'spinning' : ''} />
                    </motion.button>
                  </div>

                  <div className="chat-list">
                    {chatsLoading && chats.length === 0 ? (
                      <div className="loading-state">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <RefreshCw size={32} />
                        </motion.div>
                        <p>Loading conversations...</p>
                      </div>
                    ) : chats.length === 0 ? (
                      <div className="empty-state">
                        <MessagesSquare size={48} />
                        <p>No conversations yet</p>
                        <span>Start chatting to see your conversations here!</span>
                      </div>
                    ) : (
                      chats.map((chat, i) => (
                        <motion.div
                          key={chat.id}
                          className={`chat-item ${selectedChat?.id === chat.id ? 'selected' : ''}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => selectChat(chat)}
                          whileHover={{ x: 4 }}
                        >
                          <div className="chat-avatar">
                            {chat.picture ? (
                              <img src={chat.picture} alt="" />
                            ) : (
                              <User size={24} />
                            )}
                          </div>
                          <div className="chat-info">
                            <div className="chat-name">{chat.name || chat.id.split('@')[0]}</div>
                            {chat.lastMessage && (
                              <div className="chat-preview">
                                {chat.lastMessage.fromMe && <span className="you">You: </span>}
                                {chat.lastMessage.body?.substring(0, 40) || '📎 Media'}
                                {chat.lastMessage.body?.length > 40 && '...'}
                              </div>
                            )}
                          </div>
                          <div className="chat-meta">
                            {chat.lastMessage?.timestamp && (
                              <span className="chat-time">
                                {formatRelativeTime(chat.lastMessage.timestamp)}
                              </span>
                            )}
                            <ChevronRight size={16} />
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {/* Chat Detail / Summary */}
                <div className="chat-detail-container">
                  {selectedChat ? (
                    <>
                      <div className="chat-detail-header">
                        <div className="chat-detail-avatar">
                          {selectedChat.picture ? (
                            <img src={selectedChat.picture} alt="" />
                          ) : (
                            <User size={32} />
                          )}
                        </div>
                        <div className="chat-detail-info">
                          <h3>{selectedChat.name || selectedChat.id.split('@')[0]}</h3>
                          <span className="chat-id">{selectedChat.id}</span>
                        </div>
                        <motion.button
                          className="btn btn-primary btn-small"
                          onClick={() => {
                            setPhone(selectedChat.id.split('@')[0])
                            setActiveTab('send')
                            setSubTab(prev => ({ ...prev, send: 'quick' }))
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Send size={16} />
                          Message
                        </motion.button>
                      </div>

                      {messagesLoading ? (
                        <div className="loading-state">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <RefreshCw size={32} />
                          </motion.div>
                          <p>Loading messages...</p>
                        </div>
                      ) : (
                        <>
                          {/* Summary Stats */}
                          {chatMessages.length > 0 && (
                            <div className="chat-summary">
                              <h4>📊 Conversation Summary</h4>
                              <div className="summary-stats">
                                <div className="summary-stat">
                                  <span className="stat-value">{chatMessages.length}</span>
                                  <span className="stat-label">Messages</span>
                                </div>
                                <div className="summary-stat you">
                                  <span className="stat-value">{chatMessages.filter(m => m.fromMe).length}</span>
                                  <span className="stat-label">From You</span>
                                </div>
                                <div className="summary-stat them">
                                  <span className="stat-value">{chatMessages.filter(m => !m.fromMe).length}</span>
                                  <span className="stat-label">From Them</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Recent Messages */}
                          <div className="messages-preview">
                            <h4>💬 Recent Messages</h4>
                            <div className="messages-list">
                              {chatMessages.slice(0, 10).map((msg, i) => (
                                <motion.div
                                  key={msg.id || i}
                                  className={`message-bubble ${msg.is_from_me ? 'from-me' : 'from-them'}`}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                >
                                  <div className="message-content">
                                    {msg.message || '[media]'}
                                  </div>
                                  <div className="message-time">
                                    {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {msg.fromMe && msg.ackName && (
                                      <span className={`ack ${msg.ackName.toLowerCase()}`}>
                                        {msg.ackName === 'READ' ? '✓✓' : msg.ackName === 'DEVICE' ? '✓✓' : '✓'}
                                      </span>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="empty-state">
                      <MessagesSquare size={64} />
                      <h3>Select a conversation</h3>
                      <p>Click on a chat to see the summary and recent messages</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Templates */}
          {activeTab === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="content-panel"
            >
              <FeatureCard icon={Sparkles} title="Message Templates" color="var(--purple)">
                <div className="templates-grid">
                  {templates.map((template, i) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <TemplateCard template={template} onUse={useTemplate} />
                    </motion.div>
                  ))}
                </div>
              </FeatureCard>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Toast Container */}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
