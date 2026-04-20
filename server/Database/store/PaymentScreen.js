import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useCartStore } from '../store/cartSlice';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PaymentScreen() {
  const { items, totalAmount, clearCart } = useCartStore();
  const navigation = useNavigation();
  
  const [address, setAddress] = useState('');
  const [entrance, setEntrance] = useState('');
  const [floor, setFloor] = useState('');
  const [apartment, setApartment] = useState('');
  const [comment, setComment] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [deliverySpeed, setDeliverySpeed] = useState('normal');
  const [paymentMethod, setPaymentMethod] = useState('card');

  useEffect(() => {
    loadSavedAddress();
  }, []);

  const loadSavedAddress = async () => {
    const savedAddress = await AsyncStorage.getItem('userProfile');
    if (savedAddress) {
      const profile = JSON.parse(savedAddress);
      if (profile.address) setAddress(profile.address);
    }
  };

  const getDeliveryTime = () => {
    switch (deliverySpeed) {
      case 'fast': return '45 минут';
      case 'superfast': return '30 минут';
      default: return '60 минут';
    }
  };

  const getDeliveryPrice = () => {
    switch (deliverySpeed) {
      case 'fast': return totalAmount * 0.15;
      case 'superfast': return totalAmount * 0.3;
      default: return 0;
    }
  };

  const handleSubmitOrder = async () => {
    if (!address.trim()) {
      Alert.alert('Ошибка', 'Укажите адрес доставки');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Ошибка', 'Корзина пуста');
      return;
    }

    const deliveryPrice = getDeliveryPrice();
    const finalAmount = totalAmount + deliveryPrice + tipAmount;

    const order = {
      id: Date.now().toString(),
      date: new Date().toLocaleString(),
      items: items,
      subtotal: totalAmount,
      deliveryPrice: deliveryPrice,
      tip: tipAmount,
      total: finalAmount,
      address: `${address}, подъезд ${entrance || 'не указан'}, этаж ${floor || 'не указан'}, кв. ${apartment || 'не указана'}`,
      comment: comment,
      deliverySpeed: deliverySpeed,
      paymentMethod: paymentMethod,
      status: 'Готовится',
      rating: null,
    };

    // Сохраняем заказ
    const savedOrders = await AsyncStorage.getItem('orders');
    const orders = savedOrders ? JSON.parse(savedOrders) : [];
    orders.unshift(order);
    await AsyncStorage.setItem('orders', JSON.stringify(orders));

    // Очищаем корзину
    clearCart();

    Alert.alert('Успешно!', `Заказ #${order.id} оформлен`, [
      { text: 'OK', onPress: () => navigation.navigate('Отслеживание', { orderId: order.id }) }
    ]);
  };

  const tipOptions = [0, 50, 100, 200];

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Icon name="cart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Корзина пуста</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Вернуться в каталог</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Адрес доставки */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Адрес доставки</Text>
          <TextInput
            style={styles.input}
            placeholder="Улица, дом"
            value={address}
            onChangeText={setAddress}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Подъезд"
              value={entrance}
              onChangeText={setEntrance}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Этаж"
              value={floor}
              onChangeText={setFloor}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Квартира"
              value={apartment}
              onChangeText={setApartment}
              keyboardType="numeric"
            />
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Комментарий к заказу (домофон, код и т.д.)"
            value={comment}
            onChangeText={setComment}
            multiline
          />
        </View>

        {/* Скорость доставки */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏱️ Скорость доставки</Text>
          <TouchableOpacity
            style={[styles.speedOption, deliverySpeed === 'normal' && styles.speedOptionActive]}
            onPress={() => setDeliverySpeed('normal')}
          >
            <Text style={styles.speedTitle}>Обычная</Text>
            <Text style={styles.speedTime}>60 минут</Text>
            <Text style={styles.speedPrice}>+0 ₽</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.speedOption, deliverySpeed === 'fast' && styles.speedOptionActive]}
            onPress={() => setDeliverySpeed('fast')}
          >
            <Text style={styles.speedTitle}>Ускоренная</Text>
            <Text style={styles.speedTime}>45 минут</Text>
            <Text style={styles.speedPrice}>+15% (₽ {Math.round(totalAmount * 0.15)})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.speedOption, deliverySpeed === 'superfast' && styles.speedOptionActive]}
            onPress={() => setDeliverySpeed('superfast')}
          >
            <Text style={styles.speedTitle}>Очень срочная</Text>
            <Text style={styles.speedTime}>30 минут</Text>
            <Text style={styles.speedPrice}>+30% (₽ {Math.round(totalAmount * 0.3)})</Text>
          </TouchableOpacity>
        </View>

        {/* Чаевые */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Чаевые курьеру</Text>
          <View style={styles.tipContainer}>
            {tipOptions.map(tip => (
              <TouchableOpacity
                key={tip}
                style={[styles.tipButton, tipAmount === tip && styles.tipButtonActive]}
                onPress={() => setTipAmount(tip)}
              >
                <Text style={[styles.tipText, tipAmount === tip && styles.tipTextActive]}>
                  {tip === 0 ? 'Без чаевых' : `${tip} ₽`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Способ оплаты */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Способ оплаты</Text>
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('card')}
          >
            <Icon name="card-outline" size={24} color={paymentMethod === 'card' ? '#e91e63' : '#666'} />
            <Text style={[styles.paymentText, paymentMethod === 'card' && styles.paymentTextActive]}>
              Картой онлайн
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('cash')}
          >
            <Icon name="cash-outline" size={24} color={paymentMethod === 'cash' ? '#e91e63' : '#666'} />
            <Text style={[styles.paymentText, paymentMethod === 'cash' && styles.paymentTextActive]}>
              Наличными курьеру
            </Text>
          </TouchableOpacity>
        </View>

        {/* Итог */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Итого к оплате</Text>
          <View style={styles.summaryRow}>
            <Text>Товары:</Text>
            <Text>₽ {totalAmount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Доставка:</Text>
            <Text>+ ₽ {Math.round(getDeliveryPrice())}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Чаевые:</Text>
            <Text>+ ₽ {tipAmount}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalText}>Всего:</Text>
            <Text style={styles.totalAmount}>₽ {totalAmount + Math.round(getDeliveryPrice()) + tipAmount}</Text>
          </View>
        </View>

        {/* Кнопка оформления */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitOrder}>
          <Text style={styles.submitButtonText}>Оформить заказ</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  speedOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speedOptionActive: {
    borderColor: '#e91e63',
    backgroundColor: '#fce4ec',
  },
  speedTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  speedTime: {
    fontSize: 14,
    color: '#666',
  },
  speedPrice: {
    fontSize: 14,
    color: '#e91e63',
  },
  tipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    marginBottom: 8,
  },
  tipButtonActive: {
    backgroundColor: '#e91e63',
    borderColor: '#e91e63',
  },
  tipText: {
    fontSize: 14,
    color: '#666',
  },
  tipTextActive: {
    color: '#fff',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  paymentOptionActive: {
    borderColor: '#e91e63',
    backgroundColor: '#fce4ec',
  },
  paymentText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#666',
  },
  paymentTextActive: {
    color: '#e91e63',
  },
  summary: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  submitButton: {
    backgroundColor: '#e91e63',
    margin: 15,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 20,
  },
  backButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#e91e63',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});