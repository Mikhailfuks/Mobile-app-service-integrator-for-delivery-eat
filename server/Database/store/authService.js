import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = '@MegaFood:user';
const TOKEN_KEY = '@MegaFood:token';

export const authService = {
  async login(phone, password) {
    // Имитация API-запроса
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Для демо: любой телефон и пароль "123456"
    if (password === '123456') {
      const user = { id: '1', phone, name: 'Пользователь' };
      const token = 'demo-token-' + Date.now();
      
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      await AsyncStorage.setItem(TOKEN_KEY, token);
      
      return { success: true, user, token };
    }
    
    return { success: false, error: 'Неверный пароль' };
  },

  async register(phone, name, password) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = { id: Date.now().toString(), phone, name };
    const token = 'demo-token-' + Date.now();
    
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    await AsyncStorage.setItem(TOKEN_KEY, token);
    
    return { success: true, user, token };
  },

  async logout() {
    await AsyncStorage.removeItem(USER_KEY);
    await AsyncStorage.removeItem(TOKEN_KEY);
    return { success: true };
  },

  async getCurrentUser() {
    const userStr = await AsyncStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  async isAuthenticated() {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
  },
};