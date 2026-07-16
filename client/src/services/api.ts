import { useAuthStore } from '../store/useAuthStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data as T;
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
      return request<any>(`/music/search?term=${encodeURIComponent(term)}${countryParam}`, { method: 'GET' });
    }
  }
};
