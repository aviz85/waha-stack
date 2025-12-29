// ===== SVG ASSET LOADER =====
// Loads SVG assets and converts them to Image objects for canvas rendering

// Import all SVG assets
import welcomeBottle from '../assets/bottles/welcome.svg';
import thankyouBottle from '../assets/bottles/thankyou.svg';
import reminderBottle from '../assets/bottles/reminder.svg';
import celebrationBottle from '../assets/bottles/celebration.svg';
import aiBottle from '../assets/bottles/ai.svg';

import officeWorker from '../assets/customers/office_worker.svg';
import punkGirl from '../assets/customers/punk_girl.svg';
import robot from '../assets/customers/robot.svg';
import businessWoman from '../assets/customers/business_woman.svg';
import oldHacker from '../assets/customers/old_hacker.svg';
import dronePilot from '../assets/customers/drone_pilot.svg';

import background from '../assets/background.svg';

// Asset mappings
const BOTTLE_ASSETS = {
  welcome: welcomeBottle,
  thankyou: thankyouBottle,
  reminder: reminderBottle,
  celebration: celebrationBottle,
  ai: aiBottle,
};

const CUSTOMER_ASSETS = {
  office_worker: officeWorker,
  punk_girl: punkGirl,
  robot: robot,
  business_woman: businessWoman,
  old_hacker: oldHacker,
  drone_pilot: dronePilot,
};

// Load an image from URL
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Load all bottle assets
export const loadBottleAssets = async () => {
  const bottles = {};

  for (const [id, src] of Object.entries(BOTTLE_ASSETS)) {
    try {
      const img = await loadImage(src);
      bottles[id] = {
        image: img,
        frameWidth: 64,
        frameHeight: 96,
        frameCount: 1,
      };
    } catch (err) {
      console.warn(`Failed to load bottle: ${id}`, err);
    }
  }

  return bottles;
};

// Load all customer assets
export const loadCustomerAssets = async () => {
  const customers = {};

  for (const [id, src] of Object.entries(CUSTOMER_ASSETS)) {
    try {
      const img = await loadImage(src);
      // All states use the same image for now (static SVG)
      const states = ['walking_in', 'idle', 'impatient', 'angry', 'happy', 'walking_out', 'storming_off'];

      customers[id] = {};
      states.forEach(state => {
        customers[id][state] = {
          image: img,
          frameWidth: 80,
          frameHeight: 120,
          frameCount: 1,
        };
      });
    } catch (err) {
      console.warn(`Failed to load customer: ${id}`, err);
    }
  }

  return customers;
};

// Load background
export const loadBackground = async (width, height) => {
  try {
    const img = await loadImage(background);

    // Create canvas to draw scaled background
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    return canvas;
  } catch (err) {
    console.warn('Failed to load background', err);
    return null;
  }
};

// Load all assets
export const loadAllAssets = async (width, height) => {
  console.log('Loading SVG assets...');

  const [bottles, customers, bg] = await Promise.all([
    loadBottleAssets(),
    loadCustomerAssets(),
    loadBackground(width, height),
  ]);

  console.log('Assets loaded!');

  return {
    bottles,
    customers,
    effects: {}, // Effects are handled by the Effects.js particle system
    background: bg,
  };
};

export default loadAllAssets;
