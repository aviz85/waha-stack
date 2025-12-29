// API Configuration for development and production
// In production (Docker), we use relative URLs proxied through nginx
// In development, we use localhost URLs

const isDev = import.meta.env.DEV

export const config = {
  // WAHA API URL - proxied through nginx in production
  WAHA_URL: isDev ? 'http://localhost:3001' : '/waha',

  // Backend API URL - proxied through nginx in production
  API_URL: isDev ? 'http://localhost:3002' : '',

  // API Key - loaded from environment or default for dev
  API_KEY: import.meta.env.VITE_WAHA_API_KEY || 'myapikey'
}

export default config
