'use client';

import { useState, useEffect, useRef } from 'react';

interface WebSocketMessage {
  type: string;
  message?: string;
  data?: unknown;
  timestamp?: number;
  userId?: string;
  messageId?: string;
  recipientId?: string;
  text?: string;
}

export default function WebSocketTest() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [authToken, setAuthToken] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  const connectWebSocket = () => {
    if (!authToken) {
      alert('Please enter an auth token first');
      return;
    }

    try {
      const ws = new WebSocket('ws://localhost:8080/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        setIsConnected(true);
        
        // Send authentication
        ws.send(JSON.stringify({
          type: 'auth',
          token: authToken
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 Received message:', message);
          
          setMessages(prev => [...prev, {
            ...message,
            timestamp: message.timestamp || Date.now()
          }]);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  const sendMessage = () => {
    if (!wsRef.current || !inputMessage.trim() || !recipientId.trim()) {
      alert('Please fill in all fields and ensure WebSocket is connected');
      return;
    }

    const message = {
      type: 'send_message',
      recipientId: recipientId,
      text: inputMessage.trim()
    };

    wsRef.current.send(JSON.stringify(message));
    setInputMessage('');
  };

  const sendPing = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'auth_success': return 'text-green-600';
      case 'auth_error': return 'text-red-600';
      case 'error': return 'text-red-600';
      case 'instagram_message': return 'text-blue-600';
      case 'message_sent': return 'text-purple-600';
      case 'pong': return 'text-gray-500';
      default: return 'text-gray-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">WebSocket Test Interface</h2>
      
      {/* Connection Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Connection</h3>
        
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Auth Token (JWT):
          </label>
          <input
            type="text"
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            placeholder="Enter your JWT token here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isConnected}
          />
        </div>
        
        <div className="flex gap-2 items-center">
          <button
            onClick={connectWebSocket}
            disabled={isConnected}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Connect
          </button>
          
          <button
            onClick={disconnectWebSocket}
            disabled={!isConnected}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Disconnect
          </button>
          
          <div className={`flex items-center gap-2 ml-4 ${
            isConnected ? 'text-green-600' : 'text-red-600'
          }`}>
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Message Sending */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Send Message</h3>
        
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient ID:
          </label>
          <input
            type="text"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            placeholder="Enter recipient Instagram user ID..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message:
          </label>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={sendMessage}
            disabled={!isConnected}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Send Message
          </button>
          
          <button
            onClick={sendPing}
            disabled={!isConnected}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Send Ping
          </button>
        </div>
      </div>
      
      {/* Messages Display */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Messages ({messages.length})</h3>
          <button
            onClick={clearMessages}
            className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
        
        <div className="h-96 overflow-y-auto border border-gray-300 rounded-md p-4 bg-gray-50">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center">No messages yet...</p>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className="mb-3 p-3 bg-white rounded-md shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className={`font-semibold ${getMessageTypeColor(msg.type)}`}>
                    {msg.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {msg.timestamp && formatTimestamp(msg.timestamp)}
                  </span>
                </div>
                
                {msg.message && (
                  <p className="text-gray-700 mb-1">{msg.message}</p>
                )}
                
                {msg.text && (
                  <p className="text-gray-700 mb-1"><strong>Text:</strong> {msg.text}</p>
                )}
                
                {msg.recipientId && (
                  <p className="text-gray-600 text-sm mb-1"><strong>Recipient:</strong> {msg.recipientId}</p>
                )}
                
                {msg.messageId && (
                  <p className="text-gray-600 text-sm mb-1"><strong>Message ID:</strong> {msg.messageId}</p>
                )}
                
                {msg.data && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                      View Raw Data
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(msg.data, null, 2) as string}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        <p><strong>Instructions:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Enter your JWT token from the login API</li>
          <li>Click &quot;Connect&quot; to establish WebSocket connection</li>
          <li>Use &quot;Send Ping&quot; to test connection health</li>
          <li>Enter recipient ID and message to send Instagram messages</li>
          <li>Real-time Instagram events will appear automatically when received</li>
        </ul>
      </div>
    </div>
  );
}