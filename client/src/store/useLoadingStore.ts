import { create } from 'zustand';

interface LoadingStore {
  isLoading: boolean;
  loadingText: string;
  showLoading: (text?: string) => void;
  hideLoading: () => void;
}

export const useLoadingStore = create<LoadingStore>((set) => ({
  isLoading: false,
  loadingText: 'PlayVerse',
  showLoading: (text = 'PlayVerse') => set({ isLoading: true, loadingText: text }),
  hideLoading: () => set({ isLoading: false }),
}));
