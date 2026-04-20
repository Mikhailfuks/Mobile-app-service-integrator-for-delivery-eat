import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RatingScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params || {};
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Ошибка', 'Поставьте оценку');
      return;
    }

    const savedOrders = await AsyncStorage.getItem('orders');
    if (savedOrders) {
      const orders = JSON.parse(savedOrders);
      const updatedOrders = orders.map(o =>
        o.id === orderId ? { ...o, rating: rating, ratingComment: comment } : o
      );
      await AsyncStorage.setItem('orders', JSON.stringify(updatedOrders));
      
      Alert.alert('Спасибо!', 'Ваша оценка сохранена', [
        { text: 'OK', onPress: () => navigation.navigate('Заказы') }
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Спасибо за заказ! 🎉</Text>
        <Text style={styles.subtitle}>Оцените качество доставки</Text>

        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Icon
                name={star <= rating ? 'star' : 'star-outline'}
                size={50}
                color="#ffc107"
                style={styles.star}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.ratingText}>
          {rating === 5 ? 'Отлично!' :
           rating === 4 ? 'Хорошо' :
           rating === 3 ? 'Нормально' :
           rating === 2 ? 'Плохо' :
           rating === 1 ? 'Ужасно' : 'Нажмите на звезду'}
        </Text>

        <TextInput
          style={styles.commentInput}
          placeholder="Оставьте комментарий (необязательно)"
          value={comment}
          onChangeText={setComment}
          multiline
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitRating}>
          <Text style={styles.submitButtonText}>Отправить оценку</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  star: {
    marginHorizontal: 5,
  },
  ratingText: {
    fontSize: 18,
    color: '#e91e63',
    marginBottom: 30,
  },
  commentInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 30,
  },
  submitButton: {
    backgroundColor: '#e91e63',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});