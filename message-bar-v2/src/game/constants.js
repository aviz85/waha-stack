// ===== MESSAGE BAR V2 - GAME CONSTANTS =====

export const GAME_CONFIG = {
  WIDTH: 1280,
  HEIGHT: 720,
  FPS: 60,

  // Gameplay
  MAX_CUSTOMERS: 6,
  MAX_LOST: 5,
  BASE_SPAWN_INTERVAL: 6000,
  MIN_SPAWN_INTERVAL: 2500,
  PATIENCE_DECAY_RATE: 1.5, // % per second
  BOTTLE_COOLDOWN: 3000, // ms
  COMBO_TIMEOUT: 3000, // ms

  // Scoring
  BASE_SCORE: 100,
  PATIENCE_BONUS_MULTIPLIER: 1,
  COMBO_BONUS: 25,
};

export const COLORS = {
  NEON_PINK: '#FF2D95',
  NEON_CYAN: '#00FFFF',
  NEON_GREEN: '#39FF14',
  NEON_ORANGE: '#FF6B35',
  NEON_PURPLE: '#BF40FF',
  NEON_YELLOW: '#FFFF00',
  DANGER_RED: '#FF0040',

  BG_DARK: '#0A0A15',
  BG_DARKER: '#050508',
  BG_PURPLE: '#1A0A2E',

  BAR_WOOD: '#2D1810',
  BAR_WOOD_LIGHT: '#4A2C1C',
  BAR_METAL: '#3A3A4A',
};

export const LAYERS = {
  BACKGROUND: 0,
  BAR_BACK: 1,
  CUSTOMERS: 2,
  BAR_FRONT: 3,
  BOTTLES: 4,
  EFFECTS: 5,
  UI: 6,
};

// Customer types with their properties
export const CUSTOMER_TYPES = [
  {
    id: 'office_worker',
    name: 'Office Worker',
    color: '#4A90D9',
    patience: 100,
    walkSpeed: 2,
  },
  {
    id: 'punk_girl',
    name: 'Punk Girl',
    color: '#FF2D95',
    patience: 80, // Less patient
    walkSpeed: 2.5,
  },
  {
    id: 'robot',
    name: 'Service Bot',
    color: '#00FFFF',
    patience: 120, // More patient
    walkSpeed: 1.8,
  },
  {
    id: 'business_woman',
    name: 'Business Woman',
    color: '#BF40FF',
    patience: 70, // Very impatient
    walkSpeed: 3,
  },
  {
    id: 'old_hacker',
    name: 'Old Hacker',
    color: '#39FF14',
    patience: 110,
    walkSpeed: 1.5,
  },
  {
    id: 'drone_pilot',
    name: 'Drone Pilot',
    color: '#FF6B35',
    patience: 60, // Super impatient
    walkSpeed: 3.5,
  },
];

// Bottle/Template types
export const BOTTLE_TYPES = [
  {
    id: 'welcome',
    name: 'Welcome',
    emoji: '👋',
    color: '#39FF14',
    text: 'Hey! Welcome aboard! We\'re excited to have you here!',
  },
  {
    id: 'thankyou',
    name: 'Thank You',
    emoji: '🙏',
    color: '#FF2D95',
    text: 'Thank you so much for your support! It means a lot!',
  },
  {
    id: 'reminder',
    name: 'Reminder',
    emoji: '⏰',
    color: '#FF6B35',
    text: 'Quick reminder! Don\'t forget about our meeting today!',
  },
  {
    id: 'celebration',
    name: 'Celebration',
    emoji: '🎉',
    color: '#BF40FF',
    text: 'Congratulations! You did it! So proud of you!',
  },
  {
    id: 'ai',
    name: 'AI Reply',
    emoji: '🤖',
    color: '#00FFFF',
    text: 'AI Generated Response',
    locked: true,
  },
];

// Animation states for customers
export const CUSTOMER_STATES = {
  WALKING_IN: 'walking_in',
  IDLE: 'idle',
  IMPATIENT: 'impatient',
  ANGRY: 'angry',
  HAPPY: 'happy',
  WALKING_OUT: 'walking_out',
  STORMING_OFF: 'storming_off',
};

// Animation states for bottles
export const BOTTLE_STATES = {
  IDLE: 'idle',
  POURING: 'pouring',
  EMPTY: 'empty',
  REFILLING: 'refilling',
};

// Positions
export const POSITIONS = {
  BAR_Y: 480, // Y position of bar counter
  CUSTOMER_SPAWN_X: 1350, // Off screen right
  CUSTOMER_EXIT_X: -150, // Off screen left
  CUSTOMER_SLOTS: [200, 350, 500, 650, 800, 950], // X positions at bar
  BOTTLE_SHELF_Y: 120,
  BOTTLE_SPACING: 140,
  BOTTLE_START_X: 240,
};

// Demo messages for testing
export const DEMO_MESSAGES = [
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
];

export const DEMO_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey',
  'Riley', 'Quinn', 'Avery', 'Reese', 'Sage',
  'Blake', 'Drew', 'Emery', 'Finley', 'Charlie',
];
