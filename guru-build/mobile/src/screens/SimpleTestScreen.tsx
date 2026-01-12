import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const SimpleTestScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello! This is a simple test screen.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    fontSize: 20,
    color: '#000000',
  },
});
