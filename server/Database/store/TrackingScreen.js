import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TrackingScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params || {};
  
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('Готовится');
  const [timeLeft, setTimeLeft] = useState(30);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadOrder();
    startTimer();
  }, []);

  const loadOrder = async () => {
    const savedOrders = await AsyncStorage.getItem('orders');
    if (savedOrders) {
      const orders = JSON.parse(savedOrders);
      const foundOrder = orders.find(o => o.id === orderId);
      if (foundOrder) {
        setOrder(foundOrder);
        setStatus(foundOrder.status);
      }
    }
  };

  const startTimer = () => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus('Доставлен');
          updateOrderStatus('Доставлен');
          Alert.alert('Заказ доставлен', 'Спасибо, что выбрали нас!');
          return 0;
        }
        if (prev === 20) setStatus('В пути');
        if (prev === 10) setStatus('Рядом с вами');
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  };

  const updateOrderStatus = async (newStatus) => {
    const savedOrders = await AsyncStorage.getItem('orders');
    if (savedOrders) {
      const orders = JSON.parse(savedOrders);
      const updatedOrders = orders.map(o =>
        o.id === orderId ? { ...o, status: newStatus } : o
      );
      await AsyncStorage.setItem('orders', JSON.stringify(updatedOrders));
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const newMsg = {
      id: Date.now().toString(),
      text: newMessage,
      isUser: true,
      time: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
    
    // Автоответ курьера
    setTimeout(() => {
      const autoReply = {
        id: (Date.now() + 1).toString(),
        text: 'Курьер: Спасибо за сообщение! Я уже в пути, скоро буду.',
        isUser: false,
        time: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, autoReply]);
    }, 1000);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'Готовится': return 'restaurant-outline';
      case 'В пути': return 'bicycle-outline';
      case 'Рядом с вами': return 'navigate-circle-outline';
      case 'Доставлен': return 'checkmark-circle-outline';
      default: return 'time-outline';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'Доставлен': return '#4caf50';
      default: return '#ff9800';
    }
  };

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text>Заказ не найден</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>Вернуться</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Информация о заказе */}
      <View style={styles.orderInfo}>
        <Text style={styles.orderNumber}>Заказ #{order.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Icon name={getStatusIcon()} size={16} color="#fff" />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      {/* Таймер */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>Примерное время доставки:</Text>
        <Text style={styles.timerValue}>
          {status === 'Доставлен' ? 'Заказ доставлен!' : `~${timeLeft} минут`}
        </Text>
      </View>

      {/* Прогресс-бар статуса */}
      <View style={styles.progressContainer}>
        <View style={styles.progressSteps}>
          {['Готовится', 'В пути', 'Рядом с вами', 'Доставлен'].map((step, idx) => (
            <View key={step} style={styles.stepContainer}>
              <View style={[
                styles.stepDot,
                (status === step || 
                 (status === 'В пути' && idx <= 1) ||
                 (status === 'Рядом с вами' && idx <= 2) ||
                 status === 'Доставлен') && styles.stepDotActive
              ]} />
              <Text style={styles.stepLabel}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Адрес доставки */}
      <View style={styles.addressContainer}>
        <Icon name="location-outline" size={20} color="#e91e63" />
        <Text style={styles.addressText}>{order.address}</Text>
      </View>

      {/* Чат с курьером */}
      <View style={styles.chatContainer}>
        <Text style={styles.chatTitle}>💬 Чат с курьером</Text>
        <FlatList
          data={messages}
          renderItem={({ item }) => (
            <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.courierBubble]}>
              <Text style={[styles.messageText, item.isUser ? styles.userText : styles.courierText]}>
                {item.text}
              </Text>
              <Text style={styles.messageTime}>{item.time}</Text>
            </View>
          )}
          keyExtractor={item => item.id}
          style={styles.messagesList}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.chatInput}
            placeholder="Сообщение курьеру..."
            value={newMessage}
            onChangeText={setNewMessage}
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Icon name="send-outline" size={24} color="#e91e63" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Кнопка оценки (если доставлен) */}
      {status === 'Доставлен' && !order.rating && (
        <TouchableOpacity 
          style={styles.rateButton}
          onPress={() => {
            navigation.navigate('Оценка', { orderId: order.id });
          }}
        >
          <Text style={styles.rateButtonText}>Оценить заказ</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timerContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  timerLabel: {
    fontSize: 14,
    color: '#666',
  },
  timerValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  progressContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ddd',
    marginBottom: 8,
  },
  stepDotActive: {
    backgroundColor: '#4caf50',
  },
  stepLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    gap: 10,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  messagesList: {
    flex: 1,
    maxHeight: 250,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  userBubble: {
    backgroundColor: '#e91e63',
    alignSelf: 'flex-end',
  },
  courierBubble: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 14,
  },
  userText: {
    color: '#fff',
  },
  courierText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    fontSize: 14,
  },
  sendButton: {
    padding: 8,
  },
  rateButton: {
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  rateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#e91e63',
    marginTop: 10,
  },
});