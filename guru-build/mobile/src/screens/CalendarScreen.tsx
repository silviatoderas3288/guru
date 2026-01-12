import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const CalendarScreen: React.FC = () => {
  console.log('=== CalendarScreen: Rendering ===');
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Smart Calendar & Tasks</Text>
          <Text style={styles.description}>
            Automatically allocate time for your tasks based on priority and due dates.
            Tasks sync with your Google Calendar.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features Coming Soon:</Text>
            <Text style={styles.featureItem}>• Add and manage tasks</Text>
            <Text style={styles.featureItem}>• Set priorities and due dates</Text>
            <Text style={styles.featureItem}>• Auto-schedule tasks in calendar</Text>
            <Text style={styles.featureItem}>• Rollover incomplete tasks</Text>
            <Text style={styles.featureItem}>• Protected time blocks</Text>
          </View>
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
    marginBottom: 12,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 24,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  featureItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});
