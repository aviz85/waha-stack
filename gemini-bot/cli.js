#!/usr/bin/env node
/**
 * Gemini Bot CLI - Configuration Management Tool
 *
 * Usage:
 *   node cli.js get-prompt              # Get current system prompt
 *   node cli.js set-prompt "prompt..."  # Set new system prompt
 *   node cli.js reset-prompt            # Reset to default prompt
 *   node cli.js config                  # Get all configuration
 *
 * Environment variables:
 *   GEMINI_BOT_URL  - Bot API URL (default: http://localhost:3003)
 *   WAHA_API_KEY    - API key for authentication (required)
 */

const API_URL = process.env.GEMINI_BOT_URL || 'http://localhost:3003';
const API_KEY = process.env.WAHA_API_KEY;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  console.error(`${colors.red}❌ Error: ${message}${colors.reset}`);
  process.exit(1);
}

async function apiRequest(method, path, body = null) {
  if (!API_KEY) {
    error('WAHA_API_KEY environment variable is required');
  }

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': API_KEY
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${path}`, options);
    const data = await response.json();

    if (!response.ok) {
      error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (err) {
    error(`Failed to connect to ${API_URL}: ${err.message}`);
  }
}

async function getPrompt() {
  log('\n📝 Current System Prompt\n', 'bright');

  const data = await apiRequest('GET', '/api/config/system-prompt');

  log(`Source: ${data.source}`, 'cyan');
  log('─'.repeat(50));
  console.log(data.systemPrompt);
  log('─'.repeat(50));

  if (data.source === 'database') {
    log(`\nDefault: ${data.default}`, 'yellow');
  }
}

async function setPrompt(prompt) {
  if (!prompt) {
    error('Please provide a system prompt');
  }

  log('\n⚙️  Updating System Prompt...\n', 'bright');

  const data = await apiRequest('PUT', '/api/config/system-prompt', {
    systemPrompt: prompt
  });

  log('✅ System prompt updated successfully!', 'green');
  log(`\nUpdated at: ${data.updatedAt}`, 'cyan');
  log('─'.repeat(50));
  console.log(data.systemPrompt);
  log('─'.repeat(50));
}

async function resetPrompt() {
  log('\n🔄 Resetting System Prompt to Default...\n', 'bright');

  const data = await apiRequest('DELETE', '/api/config/system-prompt');

  log('✅ System prompt reset to default!', 'green');
  log('─'.repeat(50));
  console.log(data.systemPrompt);
  log('─'.repeat(50));
}

async function getConfig() {
  log('\n⚙️  Bot Configuration\n', 'bright');

  const data = await apiRequest('GET', '/api/config');

  log('Effective Configuration:', 'cyan');
  log('─'.repeat(50));
  for (const [key, value] of Object.entries(data.effective)) {
    log(`${key}:`, 'yellow');
    console.log(`  ${value}\n`);
  }

  if (Object.keys(data.config).length > 0) {
    log('\nStored in Database:', 'cyan');
    log('─'.repeat(50));
    for (const [key, info] of Object.entries(data.config)) {
      log(`${key}: (updated: ${new Date(info.updatedAt).toISOString()})`, 'yellow');
      console.log(`  ${info.value}\n`);
    }
  }
}

function showHelp() {
  log('\n🤖 Gemini Bot CLI - Configuration Tool\n', 'bright');
  log('Usage:', 'cyan');
  log('  node cli.js <command> [arguments]\n');
  log('Commands:', 'cyan');
  log('  get-prompt              Get current system prompt');
  log('  set-prompt "<prompt>"   Set new system prompt');
  log('  reset-prompt            Reset to default prompt');
  log('  config                  Get all configuration');
  log('  help                    Show this help message\n');
  log('Environment Variables:', 'cyan');
  log('  GEMINI_BOT_URL    Bot API URL (default: http://localhost:3003)');
  log('  WAHA_API_KEY      API key for authentication (required)\n');
  log('Examples:', 'cyan');
  log('  WAHA_API_KEY=mykey node cli.js get-prompt');
  log('  WAHA_API_KEY=mykey node cli.js set-prompt "אתה עוזר AI מקצועי..."');
  log('  WAHA_API_KEY=mykey node cli.js reset-prompt\n');
}

// Main
const command = process.argv[2];
const arg = process.argv.slice(3).join(' ');

switch (command) {
  case 'get-prompt':
    getPrompt();
    break;
  case 'set-prompt':
    setPrompt(arg);
    break;
  case 'reset-prompt':
    resetPrompt();
    break;
  case 'config':
    getConfig();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    if (command) {
      error(`Unknown command: ${command}`);
    }
    showHelp();
}
