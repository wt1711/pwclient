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

// Helper function to check if Instagram token exists
function hasInstagramToken(): boolean {
  const token = localStorage.getItem('instagram_token');
  return !!token;
}

// Helper function to clear Instagram token and user data
function clearInstagramToken(): void {
  localStorage.removeItem('instagram_token');
  localStorage.removeItem('instagram_user');
  localStorage.removeItem('instagram_user_id');

  // Dispatch custom event to notify other components
  window.dispatchEvent(new CustomEvent('instagram-token-changed'));
  console.log('🔑 Instagram token cleared due to authentication error');
}

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('instagram_token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
}

// Helper function to handle API responses with 401 error handling
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      clearInstagramToken();
      const errorData = await response.json().catch(() => ({ error: 'Authentication failed' }));
      throw new Error(errorData.error || 'Authentication failed. Please log in again.');
    }

    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch Instagram contacts/threads (DM list)
 */
export async function fetchInstagramContacts(): Promise<InstagramContact[]> {
  // Check if token exists before making API call
  if (!hasInstagramToken()) {
    throw new Error('Instagram token not found. Please log in first.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/contacts`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await handleApiResponse<{ contacts: any[] }>(response);

    // Transform contacts to InstagramContact format
    const contacts: InstagramContact[] = (data.contacts || []).map((contact) => ({
      id: contact.id,
      username: contact.username,
      fullName: contact.fullName,
      profilePicUrl: contact.profilePicUrl,
      isVerified: false,
      lastMessageTime: contact.lastMessageTime,
      unreadCount: 0,
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
  // Check if token exists before making API call
  if (!hasInstagramToken()) {
    throw new Error('Instagram token not found. Please log in first.');
  }

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
    const messages: InstagramMessage[] = (data.messages || []).map((msg) => ({
      id: msg.id || Date.now().toString(),
      contactId: msg.contactId || contactId,
      userId: msg.userId || 'unknown',
      text: msg.text || '',
      timestamp: msg.timestamp || new Date().toISOString(),
      messageType: msg.messageType || 'text',
      mediaUrl: msg.mediaUrl,
      isFromMe: msg.isFromMe || false,
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
  // Check if token exists before making API call
  if (!hasInstagramToken()) {
    throw new Error('Instagram token not found. Please log in first.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/messages/send`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        recipientId: contactId,
        message: text,
      }),
    });

    const data = await handleApiResponse<{ message: any }>(response);

    // Transform backend message format to frontend format
    const message: InstagramMessage = {
      id: data.message.id || Date.now().toString(),
      contactId: contactId,
      userId: data.message.senderId || localStorage.getItem('instagram_user_id') || 'unknown',
      text: data.message.text || text,
      timestamp: data.message.timestamp
        ? new Date(data.message.timestamp).toISOString()
        : new Date().toISOString(),
      messageType: 'text' as const,
      isFromMe: true,
    };

    return message;
  } catch (error) {
    console.error(`Failed to send message to contact ${contactId}:`, error);
    throw error;
  }
}

/**
 * Send an image to an Instagram thread
 */
export async function sendInstagramImage(
  contactId: string,
  imageFile: File,
  caption?: string
): Promise<InstagramMessage> {
  // Check if token exists before making API call
  if (!hasInstagramToken()) {
    throw new Error('Instagram token not found. Please log in first.');
  }

  console.log('🚀 sendInstagramImage called with:', {
    contactId,
    fileName: imageFile.name,
    caption,
  });

  try {
    const formData = new FormData();
    formData.append('recipientId', contactId);
    formData.append('image', imageFile);
    if (caption) {
      formData.append('caption', caption);
    }

    const token = localStorage.getItem('instagram_token');
    console.log('🔑 Instagram token exists:', !!token);

    const apiUrl = `${API_BASE_URL}/messages/send-image`;
    console.log('📡 Making API call to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: formData,
    });

    console.log('📥 API response status:', response.status);

    const data = await handleApiResponse<{ message: any }>(response);
    console.log('📦 API response data:', data);

    // Transform backend message format to frontend format
    const message: InstagramMessage = {
      id: data.message.id || Date.now().toString(),
      contactId: contactId,
      userId: data.message.senderId || localStorage.getItem('instagram_user_id') || 'unknown',
      text: caption || '',
      timestamp: data.message.timestamp
        ? new Date(data.message.timestamp).toISOString()
        : new Date().toISOString(),
      messageType: 'media' as const,
      mediaUrl: data.message.mediaUrl,
      isFromMe: true,
    };

    console.log('✅ sendInstagramImage returning message:', message);
    return message;
  } catch (error) {
    console.error(`❌ Failed to send image to contact ${contactId}:`, error);
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
  // Check if token exists before making API call
  if (!hasInstagramToken()) {
    throw new Error('Instagram token not found. Please log in first.');
  }

  try {
    // TODO: Implement this endpoint in the backend
    // For now, return a mock profile based on stored user data
    const userDataStr = localStorage.getItem('instagram_user');
    let userData = null;

    if (userDataStr) {
      try {
        userData = JSON.parse(userDataStr);
      } catch (parseError) {
        console.error('Failed to parse stored user data:', parseError);
      }
    }

    const userId = userData?.id || localStorage.getItem('instagram_user_id') || 'unknown';
    const username = userData?.username || localStorage.getItem('instagram_username') || 'user';
    const fullName = userData?.fullName || userData?.username || username;
    const profilePicUrl = userData?.profilePicUrl || '';

    return {
      id: userId,
      username: username,
      fullName: fullName,
      profilePicUrl: profilePicUrl,
      isVerified: false,
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

    // If we get a 401, clear the token and return false
    if (response.status === 401) {
      clearInstagramToken();
      return false;
    }

    return response.ok;
  } catch (error) {
    console.error('Failed to check Instagram connection:', error);
    return false;
  }
}

/**
 * Fetch DM info for a specific contact
 */
export async function fetchInstagramDMInfo(contactId: string): Promise<InstagramContact> {
  // Check if token exists before making API call
  if (!hasInstagramToken()) {
    throw new Error('Instagram token not found. Please log in first.');
  }

  try {
    console.log('Making API call to:', `${API_BASE_URL}/dm-info/${contactId}`);
    const response = await fetch(`${API_BASE_URL}/dm-info/${contactId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('API response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Raw API response data:', data);

    // Handle different response formats
    let contactData = data;
    if (data.success && data.dmInfo) {
      contactData = data.dmInfo;
    } else if (data.data) {
      contactData = data.data;
    }

    console.log('Processed contact data:', contactData);

    // Transform to InstagramContact format
    const contact: InstagramContact = {
      id: contactData.id || contactId,
      username: contactData.username || `user_${contactId}`,
      fullName:
        contactData.fullName ||
        contactData.full_name ||
        contactData.username ||
        `User ${contactId}`,
      profilePicUrl:
        contactData.profilePicUrl || contactData.profile_pic_url || contactData.avatar_url,
      isVerified: contactData.isVerified || contactData.is_verified || false,
      lastMessageTime: contactData.lastMessageTime || contactData.last_message_time,
      unreadCount: contactData.unreadCount || contactData.unread_count || 0,
    };

    console.log('Final transformed contact:', contact);
    return contact;
  } catch (error) {
    console.error(`Failed to fetch DM info for contact ${contactId}:`, error);
    throw error;
  }
}
