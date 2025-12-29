// ===== 8-BIT SOUND MANAGER =====
// Matching the original message-bar SFX implementation

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let muted = false;

// Lazy init - creates context on first sound
const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
};

// Core tone player
const playTone = (frequency, duration, type = 'square', volume = 0.3) => {
  if (muted) return;

  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.log('Audio not available');
  }
};

// Sound Manager object
export const soundManager = {
  init() {
    // Just ensure context exists
    getAudioContext();
    return this;
  },

  setMuted(isMuted) {
    muted = isMuted;
  },

  setVolume(vol) {
    // Volume is per-sound in this implementation
  },

  // Customer arrives - short blip
  customerArrive() {
    playTone(880, 0.1, 'square', 0.2);
    setTimeout(() => playTone(1100, 0.1, 'square', 0.15), 50);
  },

  // Select template - click
  select() {
    playTone(600, 0.05, 'square', 0.2);
  },

  // Serve customer - positive chime
  serve() {
    playTone(523, 0.1, 'square', 0.25);
    setTimeout(() => playTone(659, 0.1, 'square', 0.25), 80);
    setTimeout(() => playTone(784, 0.15, 'square', 0.2), 160);
  },

  // Combo - ascending arpeggio
  combo(multiplier = 2) {
    playTone(523, 0.08, 'square', 0.2);
    setTimeout(() => playTone(659, 0.08, 'square', 0.2), 60);
    setTimeout(() => playTone(784, 0.08, 'square', 0.2), 120);
    setTimeout(() => playTone(1047, 0.15, 'sawtooth', 0.25), 180);
  },

  // Customer angry/leaves - negative buzz
  customerLeave() {
    playTone(200, 0.15, 'sawtooth', 0.3);
    setTimeout(() => playTone(150, 0.2, 'sawtooth', 0.25), 100);
  },

  // Game start - fanfare
  gameStart() {
    playTone(392, 0.15, 'square', 0.25);
    setTimeout(() => playTone(523, 0.15, 'square', 0.25), 150);
    setTimeout(() => playTone(659, 0.15, 'square', 0.25), 300);
    setTimeout(() => playTone(784, 0.3, 'square', 0.3), 450);
  },

  // Game over - descending sad tones
  gameOver() {
    playTone(400, 0.2, 'square', 0.3);
    setTimeout(() => playTone(350, 0.2, 'square', 0.25), 200);
    setTimeout(() => playTone(300, 0.3, 'sawtooth', 0.3), 400);
    setTimeout(() => playTone(200, 0.5, 'sawtooth', 0.2), 600);
  },

  // Error - short buzz
  error() {
    playTone(150, 0.1, 'square', 0.25);
  },

  // Bottle cooldown click
  cooldown() {
    playTone(200, 0.05, 'square', 0.2);
    setTimeout(() => playTone(250, 0.05, 'square', 0.15), 60);
  },

  // Bottle ready/refilled
  bottleReady() {
    playTone(440, 0.05, 'square', 0.15);
    setTimeout(() => playTone(660, 0.08, 'square', 0.2), 50);
  },

  // Low patience warning tick
  tick() {
    playTone(100, 0.02, 'square', 0.1);
  },
};

export default soundManager;
