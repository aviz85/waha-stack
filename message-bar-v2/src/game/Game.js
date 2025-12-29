// ===== MAIN GAME ENGINE =====

import { Customer } from './Customer.js';
import { Bottle } from './Bottle.js';
import { EffectsManager } from './Effects.js';
import { soundManager } from './SoundManager.js';
import {
  GAME_CONFIG,
  COLORS,
  BOTTLE_TYPES,
  POSITIONS,
  CUSTOMER_STATES,
} from './constants.js';
import loadAllAssets from '../utils/AssetLoader.js';
import {
  testConnection,
  fetchIncomingMessages,
  sendWhatsAppMessage,
  logMessageToHistory,
  isDemoMode,
  resetMessageTracking,
} from '../services/api.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Set canvas size
    this.width = GAME_CONFIG.WIDTH;
    this.height = GAME_CONFIG.HEIGHT;
    canvas.width = this.width;
    canvas.height = this.height;

    // Game state
    this.state = 'menu'; // 'menu', 'playing', 'paused', 'gameover'
    this.score = 0;
    this.customersServed = 0;
    this.customersLost = 0;
    this.comboCount = 0;
    this.maxCombo = 0;
    this.difficulty = 1;
    this.isReady = false;

    // Timing
    this.lastTime = 0;
    this.lastSpawnTime = 0;
    this.comboTimer = 0;

    // Entities
    this.customers = [];
    this.bottles = [];
    this.customerSlots = new Array(GAME_CONFIG.MAX_CUSTOMERS).fill(null);

    // Selected bottle
    this.selectedBottleIndex = null;

    // Effects
    this.effects = new EffectsManager();

    // Sprites (placeholder for now)
    this.sprites = {
      customers: null,
      bottles: null,
      effects: null,
      background: null,
    };

    // Input state
    this.mouse = { x: 0, y: 0, down: false };
    this.hoveredBottle = null;
    this.hoveredCustomer = null;

    // Sound
    this.muted = false;

    // Demo mode / API connection
    this.demoMode = true; // Start in demo mode until connection verified
    this.lastApiPoll = 0;
    this.apiPollInterval = 3000; // Poll API every 3 seconds
    this.pendingRealMessages = []; // Queue of real messages to spawn

    // Bind methods
    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);

    // Initialize
    this.init();
  }

  async init() {
    try {
      // Create bottles first (fast)
      BOTTLE_TYPES.forEach((type, index) => {
        this.bottles.push(new Bottle(type.id, index));
      });

      // Setup input
      this.canvas.addEventListener('click', this.handleClick);
      this.canvas.addEventListener('mousemove', this.handleMouseMove);

      // Test API connection
      try {
        const connectionStatus = await testConnection();
        this.demoMode = connectionStatus.demoMode;
        console.log('Connection status:', connectionStatus);
        console.log(this.demoMode ? 'Running in DEMO mode' : 'Connected to WAHA API');
      } catch (e) {
        console.warn('API connection failed, running in demo mode');
        this.demoMode = true;
      }

      // Load SVG assets
      const assets = await loadAllAssets(this.width, this.height);
      this.sprites.bottles = assets.bottles;
      this.sprites.customers = assets.customers;
      this.sprites.effects = assets.effects;
      this.sprites.background = assets.background;

      console.log('Assets loaded!');

      // Mark as ready
      this.isReady = true;

      // Start game loop
      this.lastTime = performance.now();
      requestAnimationFrame(this.gameLoop.bind(this));
    } catch (error) {
      console.error('Failed to initialize game:', error);
      this.isReady = true; // Still mark ready so we can see what's wrong
      this.demoMode = true; // Fallback to demo mode
      this.lastTime = performance.now();
      requestAnimationFrame(this.gameLoop.bind(this));
    }
  }

  // Main game loop
  gameLoop(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame(this.gameLoop.bind(this));
  }

  // Update game state
  update(deltaTime) {
    if (this.state !== 'playing') return;

    // Update combo timer
    if (this.comboCount > 0) {
      this.comboTimer -= deltaTime;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    // Poll for real messages (if not in demo mode)
    this.lastApiPoll += deltaTime;
    if (!this.demoMode && this.lastApiPoll >= this.apiPollInterval) {
      this.lastApiPoll = 0;
      this.pollIncomingMessages();
    }

    // Spawn customers (from real messages or demo)
    this.lastSpawnTime += deltaTime;
    const spawnInterval = Math.max(
      GAME_CONFIG.MIN_SPAWN_INTERVAL,
      GAME_CONFIG.BASE_SPAWN_INTERVAL / this.difficulty
    );

    if (this.lastSpawnTime >= spawnInterval) {
      this.lastSpawnTime = 0;
      this.spawnCustomer();
    }

    // Update customers
    this.customers.forEach(customer => {
      const wasAngry = customer.state === CUSTOMER_STATES.ANGRY;
      customer.update(deltaTime, this.difficulty);

      // Check if customer just got angry
      if (!wasAngry && customer.state === CUSTOMER_STATES.ANGRY) {
        this.effects.spawnSteam(customer.x, customer.y - 30);
      }
    });

    // Check for customers who left angry
    this.customers.forEach(customer => {
      if (customer.state === CUSTOMER_STATES.STORMING_OFF && !customer.countedAsLost) {
        customer.countedAsLost = true;
        this.customersLost++;
        this.comboCount = 0;
        soundManager.customerLeave();

        // Check game over
        if (this.customersLost >= GAME_CONFIG.MAX_LOST) {
          this.gameOver();
        }
      }
    });

    // Remove finished customers and free slots
    this.customers = this.customers.filter(customer => {
      if (customer.isRemovable) {
        if (customer.slotIndex !== null) {
          this.customerSlots[customer.slotIndex] = null;
        }
        return false;
      }
      return true;
    });

    // Update bottles
    this.bottles.forEach(bottle => {
      const wasOnCooldown = bottle.isOnCooldown();
      bottle.update(deltaTime);

      // Sound when bottle becomes ready
      if (wasOnCooldown && !bottle.isOnCooldown()) {
        soundManager.bottleReady();
      }
    });

    // Update effects
    this.effects.update(deltaTime);

    // Increase difficulty over time
    if (this.customersServed > 0 && this.customersServed % 10 === 0) {
      this.difficulty = Math.min(3, 1 + this.customersServed / 20);
    }
  }

  // Render the game
  render() {
    const ctx = this.ctx;

    // Clear
    ctx.fillStyle = COLORS.BG_DARK;
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw background
    if (this.sprites.background) {
      ctx.drawImage(this.sprites.background, 0, 0);
    }

    // Draw bottles
    this.bottles.forEach((bottle, index) => {
      bottle.isSelected = index === this.selectedBottleIndex;
      bottle.render(ctx, this.sprites.bottles, this.hoveredBottle === index);
    });

    // Draw customers (sorted by Y for depth)
    const sortedCustomers = [...this.customers].sort((a, b) => a.y - b.y);
    sortedCustomers.forEach(customer => {
      customer.render(ctx, this.sprites.customers);
    });

    // Draw effects
    this.effects.render(ctx);

    // Draw UI overlay
    this.renderUI();

    // Draw game state overlays
    if (this.state === 'menu') {
      this.renderMenu();
    } else if (this.state === 'gameover') {
      this.renderGameOver();
    }
  }

  renderUI() {
    const ctx = this.ctx;

    // HUD Background
    ctx.fillStyle = 'rgba(10,5,20,0.9)';
    ctx.fillRect(0, 0, this.width, 70);
    ctx.strokeStyle = COLORS.NEON_PURPLE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 70);
    ctx.lineTo(this.width, 70);
    ctx.stroke();

    // Logo
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.shadowColor = COLORS.NEON_PINK;
    ctx.shadowBlur = 10;
    ctx.fillText('🍺 MESSAGE BAR', 20, 45);
    ctx.shadowBlur = 0;

    // Stats
    const stats = [
      { label: 'SCORE', value: this.score, color: COLORS.NEON_YELLOW },
      { label: 'SERVED', value: this.customersServed, color: COLORS.NEON_GREEN },
      { label: 'LOST', value: `${this.customersLost}/${GAME_CONFIG.MAX_LOST}`, color: COLORS.DANGER_RED },
      { label: 'COMBO', value: `${this.comboCount}x`, color: COLORS.NEON_CYAN },
    ];

    let statX = this.width - 450;
    stats.forEach(stat => {
      // Box
      ctx.fillStyle = 'rgba(20,10,40,0.8)';
      ctx.strokeStyle = stat.color;
      ctx.lineWidth = 2;
      ctx.fillRect(statX, 12, 95, 46);
      ctx.strokeRect(statX, 12, 95, 46);

      // Label
      ctx.font = '10px monospace';
      ctx.fillStyle = '#888';
      ctx.textAlign = 'center';
      ctx.fillText(stat.label, statX + 47, 28);

      // Value
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = stat.color;
      ctx.fillText(stat.value, statX + 47, 50);

      statX += 110;
    });

    // Mute button
    ctx.font = '24px serif';
    ctx.fillText(this.muted ? '🔇' : '🔊', this.width - 50, 45);
  }

  renderMenu() {
    const ctx = this.ctx;

    // Overlay
    ctx.fillStyle = 'rgba(5,5,10,0.95)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Title
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = COLORS.NEON_PINK;
    ctx.textAlign = 'center';
    ctx.shadowColor = COLORS.NEON_PINK;
    ctx.shadowBlur = 30;
    ctx.fillText('MESSAGE BAR', this.width / 2, 200);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = '24px monospace';
    ctx.fillStyle = COLORS.NEON_CYAN;
    ctx.fillText('Serve customers before they leave!', this.width / 2, 250);

    // Icon
    ctx.font = '80px serif';
    ctx.fillText('🍺', this.width / 2, 350);

    // Instructions
    ctx.font = '16px monospace';
    ctx.fillStyle = '#888';
    const instructions = [
      '1. Select a message template (drink) from the shelf',
      '2. Click on a customer to serve them',
      '3. Don\'t let them wait too long!',
      '4. Build combos for bonus points!',
    ];
    instructions.forEach((line, i) => {
      ctx.fillText(line, this.width / 2, 420 + i * 30);
    });

    // Start button
    this.drawButton(this.width / 2, 580, 'START GAME', COLORS.NEON_PINK);
  }

  renderGameOver() {
    const ctx = this.ctx;

    // Overlay
    ctx.fillStyle = 'rgba(5,5,10,0.95)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Title
    ctx.font = 'bold 56px monospace';
    ctx.fillStyle = COLORS.DANGER_RED;
    ctx.textAlign = 'center';
    ctx.shadowColor = COLORS.DANGER_RED;
    ctx.shadowBlur = 30;
    ctx.fillText('GAME OVER', this.width / 2, 200);
    ctx.shadowBlur = 0;

    // Final stats
    const finalStats = [
      { label: 'Final Score', value: this.score },
      { label: 'Customers Served', value: this.customersServed },
      { label: 'Max Combo', value: `${this.maxCombo}x` },
    ];

    finalStats.forEach((stat, i) => {
      ctx.font = 'bold 32px monospace';
      ctx.fillStyle = COLORS.NEON_YELLOW;
      ctx.fillText(stat.value, this.width / 2, 320 + i * 80);

      ctx.font = '18px monospace';
      ctx.fillStyle = '#888';
      ctx.fillText(stat.label, this.width / 2, 350 + i * 80);
    });

    // Restart button
    this.drawButton(this.width / 2, 580, 'PLAY AGAIN', COLORS.NEON_PINK);
  }

  drawButton(x, y, text, color) {
    const ctx = this.ctx;
    const width = 250;
    const height = 60;

    // Button background
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.fillRect(x - width / 2, y - height / 2, width, height);
    ctx.shadowBlur = 0;

    // Button border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.strokeRect(x - width / 2, y - height / 2, width, height);

    // Button text
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  // Poll for incoming messages from API
  async pollIncomingMessages() {
    if (this.demoMode) return;

    try {
      const result = await fetchIncomingMessages(5);
      if (result.success && result.messages.length > 0) {
        // Add new messages to pending queue
        for (const msg of result.messages) {
          // Check if we already have this customer (by phone)
          const alreadyExists = this.customers.some(c => c.phone === msg.phone) ||
                                this.pendingRealMessages.some(m => m.phone === msg.phone);
          if (!alreadyExists) {
            this.pendingRealMessages.push({
              name: msg.sender_name || msg.phone,
              message: msg.message?.substring(0, 50) || 'New message',
              phone: msg.phone,
              isReal: true,
              messageId: msg.id,
            });
            console.log('New real message queued:', msg.phone);
          }
        }
      }
    } catch (e) {
      console.error('Failed to poll messages:', e);
    }
  }

  // Spawn a new customer
  spawnCustomer() {
    // Find empty slot
    const emptySlotIndex = this.customerSlots.findIndex(slot => slot === null);
    if (emptySlotIndex === -1) return; // No slots available

    let customer;

    // Priority 1: Spawn from real message queue
    if (this.pendingRealMessages.length > 0) {
      const msgData = this.pendingRealMessages.shift();
      customer = new Customer({
        name: msgData.name,
        message: msgData.message,
        phone: msgData.phone,
        isReal: true,
      });
      console.log('Spawning REAL customer:', msgData.phone);
    } else {
      // Priority 2: Spawn demo customer
      customer = new Customer();
    }

    customer.assignSlot(emptySlotIndex);
    this.customerSlots[emptySlotIndex] = customer;
    this.customers.push(customer);

    soundManager.customerArrive();
  }

  // Serve a customer with selected bottle
  async serveCustomer(customer) {
    if (this.selectedBottleIndex === null) {
      soundManager.error();
      return;
    }

    const bottle = this.bottles[this.selectedBottleIndex];

    if (bottle.type.locked) {
      soundManager.error();
      return;
    }

    if (bottle.isOnCooldown()) {
      soundManager.cooldown();
      return;
    }

    if (!customer.serve()) {
      return;
    }

    // Send real message if this is a real customer
    if (customer.isReal && !this.demoMode) {
      try {
        const result = await sendWhatsAppMessage(customer.phone, bottle.type.text);
        if (result.success) {
          await logMessageToHistory(customer.phone, bottle.type.text, 'sent');
          console.log('Real message sent to:', customer.phone);
        } else {
          console.error('Failed to send real message:', result.error);
        }
      } catch (e) {
        console.error('Error sending message:', e);
      }
    }

    // Use the bottle
    bottle.use();

    // Calculate score
    const patienceBonus = Math.floor(customer.getPatiencePercent() * GAME_CONFIG.PATIENCE_BONUS_MULTIPLIER);
    const comboBonus = this.comboCount * GAME_CONFIG.COMBO_BONUS;
    const points = GAME_CONFIG.BASE_SCORE + patienceBonus + comboBonus;

    // Update stats
    this.score += points;
    this.customersServed++;
    this.comboCount++;
    this.maxCombo = Math.max(this.maxCombo, this.comboCount);
    this.comboTimer = GAME_CONFIG.COMBO_TIMEOUT;

    // Effects
    this.effects.spawnSparkles(customer.x, customer.y);
    this.effects.spawnHearts(customer.x, customer.y - 50);
    this.effects.showScore(customer.x, customer.y - 80, points, this.comboCount > 1);

    // Big combo display
    if (this.comboCount >= 5 && this.comboCount % 5 === 0) {
      this.effects.showCombo(this.comboCount);
    }

    // Sound
    if (this.comboCount >= 3) {
      soundManager.combo(this.comboCount);
    } else {
      soundManager.serve();
    }
  }

  // Start the game
  startGame() {
    this.state = 'playing';
    this.score = 0;
    this.customersServed = 0;
    this.customersLost = 0;
    this.comboCount = 0;
    this.maxCombo = 0;
    this.difficulty = 1;
    this.customers = [];
    this.customerSlots = new Array(GAME_CONFIG.MAX_CUSTOMERS).fill(null);
    this.selectedBottleIndex = null;
    this.lastSpawnTime = 0;
    this.lastApiPoll = 0;
    this.pendingRealMessages = [];
    this.effects.clear();

    // Reset message tracking for fresh game
    resetMessageTracking();

    // Reset bottles
    this.bottles.forEach(bottle => {
      bottle.cooldownEnd = 0;
      bottle.state = bottle.type.locked ? 'empty' : 'idle';
      bottle.fillLevel = bottle.type.locked ? 0 : 1;
    });

    soundManager.gameStart();
  }

  // Alias methods for React component
  start() {
    this.startGame();
  }

  restart() {
    this.startGame();
  }

  pause() {
    if (this.state === 'playing') {
      this.state = 'paused';
    }
  }

  resume() {
    if (this.state === 'paused') {
      this.state = 'playing';
    }
  }

  // Game over
  gameOver() {
    this.state = 'gameover';
    soundManager.gameOver();
  }

  // Handle click
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Menu click
    if (this.state === 'menu' || this.state === 'gameover') {
      // Check start button
      if (y >= 550 && y <= 610 && x >= this.width / 2 - 125 && x <= this.width / 2 + 125) {
        this.startGame();
      }
      return;
    }

    // Mute button
    if (y >= 20 && y <= 60 && x >= this.width - 70 && x <= this.width - 30) {
      this.muted = !this.muted;
      soundManager.setMuted(this.muted);
      return;
    }

    // Playing state
    if (this.state !== 'playing') return;

    // Check bottle clicks
    this.bottles.forEach((bottle, index) => {
      if (bottle.containsPoint(x, y)) {
        if (!bottle.type.locked) {
          this.selectedBottleIndex = index;
          soundManager.select();
        }
      }
    });

    // Check customer clicks
    this.customers.forEach(customer => {
      if (customer.containsPoint(x, y) && !customer.isLeaving && !customer.isServed) {
        this.serveCustomer(customer);
      }
    });
  }

  // Handle mouse move
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.mouse.x = (e.clientX - rect.left) * scaleX;
    this.mouse.y = (e.clientY - rect.top) * scaleY;

    // Update hover states
    this.hoveredBottle = null;
    this.bottles.forEach((bottle, index) => {
      if (bottle.containsPoint(this.mouse.x, this.mouse.y)) {
        this.hoveredBottle = index;
      }
    });

    this.hoveredCustomer = null;
    this.customers.forEach((customer, index) => {
      if (customer.containsPoint(this.mouse.x, this.mouse.y)) {
        this.hoveredCustomer = index;
      }
    });

    // Update cursor
    if (this.hoveredBottle !== null || this.hoveredCustomer !== null) {
      this.canvas.style.cursor = 'pointer';
    } else {
      this.canvas.style.cursor = 'default';
    }
  }

  // Cleanup
  destroy() {
    this.canvas.removeEventListener('click', this.handleClick);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
  }
}

export default Game;
