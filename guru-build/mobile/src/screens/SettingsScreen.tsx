import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoogleAuthService } from '../services/googleAuth';

export const SettingsScreen: React.FC = () => {
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await GoogleAuthService.signOut();
              Alert.alert(
                'Signed Out Successfully',
                'Please close and reopen the app to sign in again.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Settings</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time Preferences</Text>
            <Text style={styles.comingSoon}>Wake time, unwind time, sleep time</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scheduling Options</Text>
            <Text style={styles.comingSoon}>
              Buffer time, morning/evening preference, weekend overflow
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Blocked Apps</Text>
            <Text style={styles.comingSoon}>
              Configure apps to block during unwind time
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout Preferences</Text>
            <Text style={styles.comingSoon}>
              Types, frequency, preferred times
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Media Preferences</Text>
            <Text style={styles.comingSoon}>
              Podcast genres, book genres, duration preferences
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Journal Settings</Text>
            <Text style={styles.comingSoon}>
              Weekly reflection day and time, prompts
            </Text>
          </View>

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  comingSoon: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
