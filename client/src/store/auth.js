import { create } from 'zustand';
import api from '../api/client';

const TOKEN_KEY = 'connstellation_token';

export const useAuth = create((set, get) => ({
  user: null,
  loading: true,
  error: null,

  /** Called once on app boot: restores a session from the stored token. */
  async bootstrap() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return set({ loading: false });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, loading: false });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({ user: null, loading: false });
    }
  },

  async login(email, password) {
    set({ error: null });
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    set({ user: data.user });
    return data.user;
  },

  async register(name, email, password) {
    set({ error: null });
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    set({ user: data.user });
    return data.user;
  },

  async updateProfile(patch) {
    const { data } = await api.patch('/users/me', patch);
    set({ user: data.user });
    return data.user;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null });
  },

  isAuthed: () => Boolean(get().user),
}));
