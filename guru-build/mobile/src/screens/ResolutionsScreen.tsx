import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ResolutionsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Resolutions & Bingo</Text>
          <Text style={styles.description}>
            Track your goals with progress bars and gamify achievements with a 5x5 bingo board.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features Coming Soon:</Text>
            <Text style={styles.featureItem}>• New Year resolutions tracker</Text>
            <Text style={styles.featureItem}>• Progress bars and milestones</Text>
            <Text style={styles.featureItem}>• Interactive 5x5 bingo board</Text>
            <Text style={styles.featureItem}>• Automatic bingo detection</Text>
            <Text style={styles.featureItem}>• Confetti animations</Text>
            <Text style={styles.featureItem}>• Year-end recap</Text>
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
