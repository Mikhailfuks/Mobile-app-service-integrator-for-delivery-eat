import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function Toast({ message, type = 'success', duration = 2000, onHide }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(duration),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      onHide?.();
    });
  }, []);

  if (!visible) return null;

  const backgroundColor = type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#333';

  return (
    <Animated.View style={[styles.container, { backgroundColor, opacity: fadeAnim }]}>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 1000,
  },
  message: {
    color: '#fff',
    fontSize: 14,
  },
});