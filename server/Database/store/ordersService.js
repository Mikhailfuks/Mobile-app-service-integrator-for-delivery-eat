import AsyncStorage from '@react-native-async-storage/async-storage';

const ORDERS_KEY = '@MegaFood:orders';

export const ordersService = {
  async getOrders() {
    const ordersStr = await AsyncStorage.getItem(ORDERS_KEY);
    return ordersStr ? JSON.parse(ordersStr) : [];
  },

  async getOrderById(id) {
    const orders = await this.getOrders();
    return orders.find(order => order.id === id);
  },

  async createOrder(orderData) {
    const orders = await this.getOrders();
    const newOrder = {
      ...orderData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    orders.unshift(newOrder);
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return newOrder;
  },

  async updateOrderStatus(id, status) {
    const orders = await this.getOrders();
    const updatedOrders = orders.map(order =>
      order.id === id ? { ...order, status } : order
    );
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
    return { success: true };
  },

  async addRating(id, rating, comment) {
    const orders = await this.getOrders();
    const updatedOrders = orders.map(order =>
      order.id === id ? { ...order, rating, ratingComment: comment } : order
    );
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
    return { success: true };
  },
};