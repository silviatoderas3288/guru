import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GoogleUser } from '../services/googleAuth';

interface HomeScreenProps {
  user: GoogleUser;
  onNavigateToNext: () => void;
  onNavigateToEntries: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ user, onNavigateToNext, onNavigateToEntries }) => {
  // Extract first name from full name
  const firstName = user.name.split(' ')[0];

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome {firstName} !</Text>

      <TouchableOpacity style={styles.button} onPress={onNavigateToNext}>
        <Text style={styles.buttonText}>Consult your guru</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  welcomeText: {
    fontSize: 32,
    fontFamily: 'Margarine',
    marginBottom: 60,
    color: '#FF9D00',
  },
  button: {
    backgroundColor: '#4D5AEE',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Margarine',
  },
});
