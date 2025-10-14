'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, LogOut, User, MessageCircle, Search } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'contact';
  timestamp: string | Date;
  status?: 'sending' | 'sent' | 'failed';
}

interface Contact {
  id: string;
  username: string;
  fullName?: string;
  profilePicUrl?: string;
  isOnline?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('instagram_session');
    if (!token) {
      router.push('/');
      return;
    }

    // Load initial data
    loadContacts();
  }, [router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up message polling when a contact is selected
  useEffect(() => {
    if (selectedContact) {
      // Load messages immediately
      loadMessages(selectedContact.id);
      setIsPolling(true);

      // Set up polling every 3 seconds
      pollingIntervalRef.current = setInterval(() => {
        loadMessages(selectedContact.id, true);
      }, 3000);
    } else {
      setIsPolling(false);
    }

    // Cleanup function
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsPolling(false);
    };
  }, [selectedContact]);

  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadContacts = async () => {
    try {
      const token = localStorage.getItem('instagram_session');
      const response = await fetch('/api/contacts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
        setError(''); // Clear any previous errors
      } else if (response.status === 401) {
        const data = await response.json();
        setError(data.error || 'Session expired. Please log in again.');
      } else {
        setError('Failed to load contacts. Please try again.');
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
      setError('Network error. Please check your connection.');
    }
  };

  const loadMessages = async (contactId: string, isPolling = false) => {
    try {
      const token = localStorage.getItem('instagram_session');
      const response = await fetch(`/api/messages/${contactId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages || [];

        // If polling, only update if there are new messages
        if (isPolling) {
          setMessages((prevMessages) => {
            if (JSON.stringify(prevMessages) !== JSON.stringify(newMessages)) {
              return newMessages;
            }
            return prevMessages;
          });
        } else {
          setMessages(newMessages);
        }
      } else if (response.status === 401) {
        const data = await response.json();
        setError(data.error || 'Session expired. Please log in again.');
        // Auto-redirect to login after a short delay
        setTimeout(() => {
          localStorage.removeItem('instagram_session');
          router.push('/');
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;

    const messageId = Date.now().toString();
    const messageText = newMessage; // Store the message text before clearing
    const message: Message = {
      id: messageId,
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage('');
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('instagram_session');
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: selectedContact.id,
          message: messageText, // Use the stored message text
        }),
      });

      if (response.ok) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, status: 'sent' } : msg))
        );
      } else if (response.status === 401) {
        const data = await response.json();
        setError(data.error || 'Session expired. Please log in again.');
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, status: 'failed' } : msg))
        );
        // Auto-redirect to login after a short delay
        setTimeout(() => {
          localStorage.removeItem('instagram_session');
          router.push('/');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send message');
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, status: 'failed' } : msg))
        );
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, status: 'failed' } : msg))
      );
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;

    try {
      const token = localStorage.getItem('instagram_session');
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const newContacts = data.users || [];
        setContacts((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const uniqueNew = newContacts.filter((c: Contact) => !existingIds.has(c.id));
          return [...prev, ...uniqueNew];
        });
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('instagram_session');
    router.push('/');
  };

  const selectContact = (contact: Contact) => {
    setSelectedContact(contact);
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-800">Instagram Chat</h1>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <button
              onClick={searchUsers}
              className="absolute right-2 top-1.5 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Search
            </button>
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="p-4 text-center text-red-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 text-red-300" />
              <p className="font-medium">Session Error</p>
              <p className="text-sm mb-3">{error}</p>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Login Again
              </button>
            </div>
          )}
          {!error && filteredContacts.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No contacts found</p>
              <p className="text-sm">Search for users to start chatting</p>
            </div>
          ) : (
            !error &&
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => selectContact(contact)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedContact?.id === contact.id ? 'bg-purple-50 border-purple-200' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className="relative">
                    {contact.profilePicUrl ? (
                      <img
                        src={contact.profilePicUrl}
                        alt={contact.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                    )}
                    {contact.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-gray-900">{contact.username}</p>
                    {contact.fullName && (
                      <p className="text-sm text-gray-500">{contact.fullName}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center">
                {selectedContact.profilePicUrl ? (
                  <img
                    src={selectedContact.profilePicUrl}
                    alt={selectedContact.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                )}
                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    <h2 className="font-semibold text-gray-900">{selectedContact.username}</h2>
                    {isPolling && (
                      <div className="ml-2 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="ml-1 text-xs text-green-600">Live</span>
                      </div>
                    )}
                  </div>
                  {selectedContact.fullName && (
                    <p className="text-sm text-gray-500">{selectedContact.fullName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p>{message.text}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p
                        className={`text-xs ${
                          message.sender === 'user' ? 'text-purple-200' : 'text-gray-500'
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {message.sender === 'user' && message.status && (
                        <span
                          className={`text-xs ml-2 ${
                            message.status === 'sending'
                              ? 'text-purple-300'
                              : message.status === 'sent'
                              ? 'text-purple-200'
                              : 'text-red-300'
                          }`}
                        >
                          {message.status === 'sending'
                            ? '⏳'
                            : message.status === 'sent'
                            ? '✓'
                            : '✗'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              {error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  <p className="mb-2">{error}</p>
                  {error.includes('Session expired') && (
                    <button
                      onClick={() => {
                        localStorage.removeItem('instagram_session');
                        router.push('/');
                      }}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                    >
                      Login Again
                    </button>
                  )}
                </div>
              )}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !newMessage.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a contact from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
