// API Constants for PackPals Staff Dashboard
// Centralized API configuration using environment variables

/**
 * Main API Base URL from environment variables
 * Falls back to Railway production URL if not set
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://packpal-api.up.railway.app/api';

/**
 * SignalR Hub URL from environment variables  
 * Falls back to Railway production URL if not set
 */
export const SIGNALR_URL = import.meta.env.VITE_SIGNALR_URL || 'https://packpal-api.up.railway.app/signalrhub'; 

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    VALIDATE: '/auth/validate',
  },
  
  // User Management
  USER: {
    GET_ALL: '/user/get-all',
    GET_DETAIL: '/user/get-detail',
    BAN_ACCOUNT: '/user/ban-account',
    REGISTER_KEEPER: '/user/register-keeper-from-request',
  },
  
  // Payout Management
  PAYOUT: {
    GET_REQUESTS: '/payout/requests',
    START_PROCESSING: '/payout/start-processing',
    UPLOAD_PROOF: '/payout/upload-proof',
    COMPLETE_PAYOUT: '/payout/complete-payout',
  },
  
  // Request Management
  REQUEST: {
    GET_ALL: '/request',
    APPROVE: '/request/approve',
    REJECT: '/request/reject',
  },
  
  // Health Check
  HEALTH: '/health',
} as const;

/**
 * Storage Keys for localStorage
 */
export const STORAGE_KEYS = {
  STAFF_TOKEN: import.meta.env.VITE_TOKEN_KEY || 'staff_token',
  STAFF_USER: import.meta.env.VITE_USER_DATA_KEY || 'staff_user',
} as const;

/**
 * API Timeouts (in milliseconds)
 */
export const API_TIMEOUTS = {
  DEFAULT: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  LOGIN: Number(import.meta.env.VITE_LOGIN_TIMEOUT) || 15000,
  UPLOAD: 60000, // 1 minute for file uploads
} as const;

/**
 * Environment check
 */
export const IS_PRODUCTION = import.meta.env.VITE_NODE_ENV === 'production';
export const IS_DEVELOPMENT = import.meta.env.DEV;

/**
 * Helper function to build full API URL
 */
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Helper function to get auth headers
 */
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem(STORAGE_KEYS.STAFF_TOKEN);
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};
