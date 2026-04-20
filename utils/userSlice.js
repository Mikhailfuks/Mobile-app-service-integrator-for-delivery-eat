import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      
      login: (userData) => {
        set({ user: userData, isAuthenticated: true });
      },
      
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      
      updateProfile: (updates) => {
        set({ user: { ...get().user, ...updates } });
      },
      
      getFullName: () => {
        const { user } = get();
        if (!user) return 'Гость';
        return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Пользователь';
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);