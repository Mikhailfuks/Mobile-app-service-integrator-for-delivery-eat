import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Главное хранилище (объединяет все слайсы)
export const useAppStore = create(
  persist(
    (set, get) => ({
      // Корзина
      cart: { items: [], totalAmount: 0 },
      
      setCart: (cart) => set({ cart }),
      
      addToCart: (product) => {
        const { cart } = get();
        const existingItem = cart.items.find(item => item.id === product.id);
        let newItems;
        
        if (existingItem) {
          newItems = cart.items.map(item =>
            item.id === product.id
              ? { ...item, cartQuantity: item.cartQuantity + (product.cartQuantity || 1) }
              : item
          );
        } else {
          newItems = [...cart.items, { ...product, cartQuantity: product.cartQuantity || 1 }];
        }
        
        const totalAmount = newItems.reduce(
          (sum, item) => sum + item.price * item.cartQuantity, 0
        );
        
        set({ cart: { items: newItems, totalAmount } });
      },
      
      removeFromCart: (id) => {
        const { cart } = get();
        const newItems = cart.items.filter(item => item.id !== id);
        const totalAmount = newItems.reduce(
          (sum, item) => sum + item.price * item.cartQuantity, 0
        );
        set({ cart: { items: newItems, totalAmount } });
      },
      
      clearCart: () => {
        set({ cart: { items: [], totalAmount: 0 } });
      },
      
      // Пользователь
      user: null,
      
      setUser: (user) => set({ user }),
      
      // Настройки
      settings: {
        theme: 'light',
        notifications: true,
      },
      
      setTheme: (theme) => set({ settings: { ...get().settings, theme } }),
      
      toggleNotifications: () => set({
        settings: { ...get().settings, notifications: !get().settings.notifications }
      }),
    }),
    {
      name: 'megafood-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);