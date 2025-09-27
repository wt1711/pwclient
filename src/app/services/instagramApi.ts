import { AsyncStatus } from '../hooks/useAsyncCallback';

export interface InstagramContact {
  id: string;
  username: string;
  fullName: string;
  profilePicUrl?: string;
  isVerified?: boolean;
  lastMessageTime?: string;
  unreadCount?: number;
}

export interface InstagramMessage {
  id: string;
  contactId: string;
  userId: string;
  text?: string;
  timestamp: string;
  messageType: 'text' | 'media' | 'like' | 'story_share' | 'voice_media';
  mediaUrl?: string;
  isFromMe: boolean;
}

// InstagramThread interface removed - using InstagramContact only

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('instagram_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

// Helper function to handle API responses
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch Instagram contacts/threads (DM list)
 */
export async function fetchInstagramContacts(): Promise<InstagramContact[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/contacts`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await handleApiResponse<{ contacts: any[] }>(response);
    
    // Transform contacts to InstagramContact format
    const contacts: InstagramContact[] = (data.contacts || []).map(contact => ({
      id: contact.id,
      username: contact.username,
      fullName: contact.fullName,
      profilePicUrl: contact.profilePicUrl,
      isVerified: false,
      lastMessageTime: contact.lastMessageTime,
      unreadCount: 0
    }));
    
    return contacts;
  } catch (error) {
    console.error('Failed to fetch Instagram contacts:', error);
    throw error;
  }
}

/**
 * Fetch messages for a specific Instagram thread
 */
export async function fetchInstagramMessages(
  contactId: string,
  cursor?: string,
  limit: number = 20
): Promise<{ messages: InstagramMessage[]; nextCursor?: string }> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(cursor && { cursor }),
    });

    const response = await fetch(`${API_BASE_URL}/messages/${contactId}?${params}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await handleApiResponse<{
      messages: any[];
      nextCursor?: string;
    }>(response);

    // Transform backend message format to frontend format
    const messages: InstagramMessage[] = (data.messages || []).map(msg => ({
      id: msg.id || Date.now().toString(),
      contactId: contactId,
      userId: msg.sender === 'user' ? localStorage.getItem('instagram_user_id') || 'unknown' : contactId,
      text: msg.text || '',
      timestamp: msg.timestamp || new Date().toISOString(),
      messageType: 'text' as const,
      isFromMe: msg.sender === 'user'
    }));

    return {
      messages,
      nextCursor: data.nextCursor,
    };
  } catch (error) {
    console.error(`Failed to fetch messages for contact ${contactId}:`, error);
    throw error;
  }
}

/**
 * Send a message to an Instagram thread
 */
export async function sendInstagramMessage(
  contactId: string,
  text: string
): Promise<InstagramMessage> {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/send`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        recipientId: contactId,
        message: text 
      }),
    });

    const data = await handleApiResponse<{ message: any }>(response);
    
    // Transform backend message format to frontend format
    const message: InstagramMessage = {
      id: data.message.id || Date.now().toString(),
      contactId: contactId,
      userId: data.message.senderId || localStorage.getItem('instagram_user_id') || 'unknown',
      text: data.message.text || text,
      timestamp: data.message.timestamp ? new Date(data.message.timestamp).toISOString() : new Date().toISOString(),
      messageType: 'text' as const,
      isFromMe: true
    };
    
    return message;
  } catch (error) {
    console.error(`Failed to send message to contact ${contactId}:`, error);
    throw error;
  }
}

/**
 * Mark Instagram contact as read
 * Note: This functionality is not yet implemented in the backend
 */
export async function markInstagramContactAsRead(contactId: string): Promise<void> {
  try {
    // TODO: Implement this endpoint in the backend
    console.log(`Marking contact ${contactId} as read (not implemented)`);
    return Promise.resolve();
  } catch (error) {
    console.error(`Failed to mark contact ${contactId} as read:`, error);
    throw error;
  }
}

/**
 * Get Instagram user profile
 * Note: This functionality is not yet implemented in the backend
 */
export async function getInstagramProfile(): Promise<InstagramContact> {
  try {
    // TODO: Implement this endpoint in the backend
    // For now, return a mock profile based on stored user data
    const userId = localStorage.getItem('instagram_user_id') || 'unknown';
    const username = localStorage.getItem('instagram_username') || 'user';
    
    return {
      id: userId,
      username: username,
      fullName: username,
      profilePicUrl: '',
      isVerified: false
    };
  } catch (error) {
    console.error('Failed to fetch Instagram profile:', error);
    throw error;
  }
}

/**
 * Check Instagram connection status
 */
export async function checkInstagramConnection(): Promise<boolean> {
  try {
    // Check if we have a valid token in localStorage
    const token = localStorage.getItem('instagram_token');
    if (!token) {
      return false;
    }
    
    // Try to fetch contacts to verify the connection
    const response = await fetch(`${API_BASE_URL}/contacts`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to check Instagram connection:', error);
    return false;
  }
}