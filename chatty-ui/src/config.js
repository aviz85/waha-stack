// API Configuration for development and production
// In production (Docker), we use relative URLs proxied through nginx
// In development, we use localhost URLs

const isDev = import.meta.env.DEV

// Get API key from localStorage or environment
const getApiKey = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('waha_api_key')
    if (stored) return stored
  }
  return import.meta.env.VITE_WAHA_API_KEY || ''
}

// Save API key to localStorage
export const setApiKey = (key) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('waha_api_key', key)
  }
}

// Get current API key (reactive getter)
export const getStoredApiKey = getApiKey

export const config = {
  // WAHA API URL - proxied through nginx in production
  WAHA_URL: isDev ? 'http://localhost:3001' : '/waha',

  // Backend API URL - proxied through nginx in production
  API_URL: isDev ? 'http://localhost:3002' : '',

  // API Key - loaded from localStorage or environment
  get API_KEY() {
    return getApiKey()
  }
}

export default config
