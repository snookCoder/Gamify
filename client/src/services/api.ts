import { useAuthStore } from '../store/useAuthStore';
import { useLoadingStore } from '../store/useLoadingStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

let activeRequests = 0;
let loadingTimeout: NodeJS.Timeout | null = null;

function startLoadingTracking() {
  activeRequests++;
  if (activeRequests === 1) {
    loadingTimeout = setTimeout(() => {
      useLoadingStore.getState().showLoading('Loading');
    }, 300);
  }
}

function stopLoadingTracking() {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0) {
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      loadingTimeout = null;
    }
    useLoadingStore.getState().hideLoading();
  }
}

async function request<T>(path: string, options: RequestInit & { skipLoader?: boolean } = {}): Promise<T> {
  const { skipLoader = false, ...fetchOptions } = options;
  const token = useAuthStore.getState().token;

  const headers = new Headers(fetchOptions.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!skipLoader) {
    startLoadingTracking();
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data as T;
  } finally {
    if (!skipLoader) {
      stopLoadingTracking();
    }
  }
}

export const api = {
  auth: {
    register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    getMe: () => request<any>('/auth/me', { method: 'GET' }),
  },
  users: {
    getLeaderboard: () => request<any[]>('/users/leaderboard', { method: 'GET' }),
    getMatchHistory: (userId?: string) => request<any[]>(userId ? `/users/history/${userId}` : '/users/history', { method: 'GET' }),
    updateAvatar: (avatar: string) => request<any>('/users/avatar', { method: 'PUT', body: JSON.stringify({ avatar }) }),
  },
  music: {
    search: (term: string, country?: string) => {
      const countryParam = country ? `&country=${country}` : '';
      return request<any>(`/music/search?term=${encodeURIComponent(term)}${countryParam}`, { method: 'GET', skipLoader: true });
    }
  },
  chats: {
    getConversations: () => request<any[]>('/chats/conversations', { method: 'GET', skipLoader: true }),
    getHistory: (partnerId: string) => request<any[]>(`/chats/history/${partnerId}`, { method: 'GET' }),
    markAsRead: (partnerId: string) => request<any>(`/chats/read/${partnerId}`, { method: 'PUT', skipLoader: true }),
  }
};
