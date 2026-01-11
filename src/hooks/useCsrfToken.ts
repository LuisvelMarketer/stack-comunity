import { useState, useEffect, useCallback } from 'react';

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_TIMESTAMP_KEY = 'csrf_timestamp';
const TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export function useCsrfToken() {
  const [token, setToken] = useState<string | null>(null);

  const refreshToken = useCallback(() => {
    const newToken = generateToken();
    const timestamp = Date.now().toString();
    
    sessionStorage.setItem(CSRF_TOKEN_KEY, newToken);
    sessionStorage.setItem(CSRF_TIMESTAMP_KEY, timestamp);
    setToken(newToken);
    
    return newToken;
  }, []);

  useEffect(() => {
    const existingToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
    const timestamp = sessionStorage.getItem(CSRF_TIMESTAMP_KEY);
    
    // Check if token exists and is not expired
    if (existingToken && timestamp) {
      const tokenAge = Date.now() - parseInt(timestamp, 10);
      if (tokenAge < TOKEN_EXPIRY_MS) {
        setToken(existingToken);
        return;
      }
    }
    
    // Generate new token if missing or expired
    refreshToken();
  }, [refreshToken]);

  const validateToken = useCallback((inputToken: string): boolean => {
    const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
    const timestamp = sessionStorage.getItem(CSRF_TIMESTAMP_KEY);
    
    if (!storedToken || !timestamp) {
      return false;
    }
    
    // Check expiration
    const tokenAge = Date.now() - parseInt(timestamp, 10);
    if (tokenAge >= TOKEN_EXPIRY_MS) {
      return false;
    }
    
    // Constant-time comparison to prevent timing attacks
    if (inputToken.length !== storedToken.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < inputToken.length; i++) {
      result |= inputToken.charCodeAt(i) ^ storedToken.charCodeAt(i);
    }
    
    return result === 0;
  }, []);

  return { token, refreshToken, validateToken };
}

// For use with forms - returns hidden input element data
export function getCsrfInput(): { name: string; value: string } | null {
  const token = sessionStorage.getItem(CSRF_TOKEN_KEY);
  if (!token) return null;
  
  return {
    name: '_csrf',
    value: token,
  };
}
