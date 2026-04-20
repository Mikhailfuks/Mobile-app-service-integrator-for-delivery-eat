import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function CategoryItem({ title, isActive, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.activeContainer]}
      onPress={onPress}
    >
      <Text style={[styles.title, isActive && styles.activeTitle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeContainer: {
    backgroundColor: '#e91e63',
  },
  title: {
    fontSize: 14,
    color: '#666',
  },
  activeTitle: {
    color: '#fff',
    fontWeight: 'bold',
  },
});