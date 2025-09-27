import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: string;
}

interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: Event | null;
  sendMessage: (message: any) => void;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    maxReconnectAttempts = 3,
    reconnectInterval = 3000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    // Prevent multiple connection attempts
    if (isConnecting || (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN))) {
      return;
    }

    // Clean up any existing connection
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close();
      // Wait a bit before creating new connection
      setTimeout(() => {
        createConnection();
      }, 100);
      return;
    }

    createConnection();
  }, [url, onMessage, onConnect, onDisconnect, onError, maxReconnectAttempts, reconnectInterval]);

  const createConnection = useCallback(() => {
    setIsConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectCountRef.current = 0; // Reset reconnection counter on successful connection
        
        // Send authentication token if available
        const token = localStorage.getItem('instagram_token');
        if (token) {
          ws.send(JSON.stringify({
            type: 'auth',
            token: token
          }));
        }
        
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
          onMessage?.(event.data);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;
        onDisconnect?.();

        // Attempt to reconnect if not manually closed and not due to auth timeout
        // Don't reconnect on code 1001 (going away) to prevent aggressive reconnection
        if (event.code !== 1000 && event.code !== 1001 && event.code !== 1008 && reconnectCountRef.current < maxReconnectAttempts) {
          reconnectCountRef.current++;
          console.log(`Attempting to reconnect (${reconnectCountRef.current}/${maxReconnectAttempts})...`);
          
          // Exponential backoff: increase delay with each attempt
          const backoffDelay = reconnectInterval * Math.pow(2, reconnectCountRef.current - 1);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, Math.min(backoffDelay, 30000)); // Cap at 30 seconds
        } else if (event.code === 1008) {
          console.log('Authentication timeout - not attempting to reconnect');
        } else if (event.code === 1001) {
          console.log('WebSocket going away - not attempting to reconnect');
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError(event);
        setIsConnecting(false);
        onError?.(event);
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError(err as Event);
      setIsConnecting(false);
    }
  }, [url, onMessage, onConnect, onDisconnect, onError, maxReconnectAttempts, reconnectInterval]);

  // Initial connection effect
  useEffect(() => {
    connect();
  }, [connect]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    reconnectCountRef.current = 0;
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', message);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    sendMessage,
    connect,
    disconnect,
  };
}