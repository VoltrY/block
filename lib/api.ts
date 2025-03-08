// API utility functions for making requests to the backend

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Generic fetch function with authentication
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  // Set headers with authentication
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };
  
  // Make the request
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers
  });
  
  // Handle response
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Something went wrong');
  }
  
  return response.json();
}

// Auth API calls
export const authApi = {
  login: (username: string, password: string) => 
    fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
  
  register: (username: string, email: string, password: string, displayName: string) =>
    fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, displayName })
    }),
  
  getCurrentUser: () => 
    fetchWithAuth('/auth/me'),
  
  logout: () => 
    fetchWithAuth('/auth/logout', { method: 'POST' })
};

// Users API calls
export const usersApi = {
  getAllUsers: () => 
    fetchWithAuth('/users'),
  
  getUserById: (id: string) => 
    fetchWithAuth(`/users/${id}`),
  
  updateUser: (id: string, data: any) => 
    fetchWithAuth(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
};

// Channels API calls
export const channelsApi = {
  getChannels: () => 
    fetchWithAuth('/channels'),
  
  getChannelById: (id: string) => 
    fetchWithAuth(`/channels/${id}`),
  
  createChannel: (data: { name: string, description?: string, type?: 'public' | 'private' }) => 
    fetchWithAuth('/channels', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  updateChannel: (id: string, data: { name?: string, description?: string }) => 
    fetchWithAuth(`/channels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  
  deleteChannel: (id: string) => 
    fetchWithAuth(`/channels/${id}`, { method: 'DELETE' })
};

// Messages API calls
export const messagesApi = {
  getMessages: (params: { channelId?: string, senderId?: string, receiverId?: string, limit?: number, before?: string }) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });
    
    return fetchWithAuth(`/messages?${queryParams.toString()}`);
  },
  
  sendMessage: (data: { content: string, channelId?: string, receiverId?: string, attachments?: string[] }) => 
    fetchWithAuth('/messages', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  deleteMessage: (id: string) => 
    fetchWithAuth(`/messages/${id}`, { method: 'DELETE' }),
  
  markAsRead: (data: { channelId?: string, senderId?: string }) => 
    fetchWithAuth('/messages/read', {
      method: 'POST',
      body: JSON.stringify(data)
    })
}; 