import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const MediaScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Media Recommendations</Text>
          <Text style={styles.description}>
            Get personalized podcast and audiobook suggestions for commutes, walks, and chores.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features Coming Soon:</Text>
            <Text style={styles.featureItem}>• Podcast recommendations</Text>
            <Text style={styles.featureItem}>• Audiobook suggestions</Text>
            <Text style={styles.featureItem}>• Swipe to like/dislike</Text>
            <Text style={styles.featureItem}>• Custom genre preferences</Text>
            <Text style={styles.featureItem}>• Smart learning from feedback</Text>
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
