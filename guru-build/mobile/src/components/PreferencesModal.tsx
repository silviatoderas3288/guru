import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PreferencesApiService, UserPreferences } from '../services/preferencesApi';

interface PreferencesModalProps {
  visible: boolean;
  onClose: () => void;
  userEmail: string;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  visible,
  onClose,
  userEmail,
}) => {
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [loading, setLoading] = useState(false);

  // Workout preferences
  const [workoutPreferredTime, setWorkoutPreferredTime] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutDays, setWorkoutDays] = useState<string[]>([]);

  // Podcast preferences
  const [podcastTopics, setPodcastTopics] = useState('');
  const [podcastLength, setPodcastLength] = useState('');

  // Commute and chore preferences
  const [commuteStart, setCommuteStart] = useState('');
  const [commuteEnd, setCommuteEnd] = useState('');
  const [commuteDuration, setCommuteDuration] = useState('');
  const [choreTime, setChoreTime] = useState('');
  const [choreDuration, setChoreDuration] = useState('');

  const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Weekends'];

  useEffect(() => {
    if (visible && userEmail) {
      loadPreferences();
    }
  }, [visible, userEmail]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await PreferencesApiService.getPreferences(userEmail);
      setPreferences(prefs);

      // Populate form fields
      setWorkoutPreferredTime(prefs.workout_preferred_time || '');
      setWorkoutDuration(prefs.workout_duration || '');
      setWorkoutDays(prefs.workout_days || []);
      setPodcastTopics(prefs.podcast_topics?.join(', ') || '');
      setPodcastLength(prefs.podcast_length || '');
      setCommuteStart(prefs.commute_start || '');
      setCommuteEnd(prefs.commute_end || '');
      setCommuteDuration(prefs.commute_duration || '');
      setChoreTime(prefs.chore_time || '');
      setChoreDuration(prefs.chore_duration || '');
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const prefsToSave: UserPreferences = {
        workout_preferred_time: workoutPreferredTime || undefined,
        workout_duration: workoutDuration || undefined,
        workout_days: workoutDays.length > 0 ? workoutDays : undefined,
        podcast_topics: podcastTopics ? podcastTopics.split(',').map(t => t.trim()).filter(t => t) : undefined,
        podcast_length: podcastLength || undefined,
        commute_start: commuteStart || undefined,
        commute_end: commuteEnd || undefined,
        commute_duration: commuteDuration || undefined,
        chore_time: choreTime || undefined,
        chore_duration: choreDuration || undefined,
      };

      await PreferencesApiService.savePreferences({
        email: userEmail,
        ...prefsToSave,
      });

      Alert.alert('Success', 'Preferences saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    setWorkoutDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Preferences</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Workout Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout Preferences</Text>

            <Text style={styles.label}>Preferred Time of Day</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 7:00 AM or Morning"
              placeholderTextColor="#999"
              value={workoutPreferredTime}
              onChangeText={setWorkoutPreferredTime}
            />

            <Text style={styles.label}>Workout Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 45"
              placeholderTextColor="#999"
              value={workoutDuration}
              onChangeText={setWorkoutDuration}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Preferred Days</Text>
            <View style={styles.daysContainer}>
              {dayOptions.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    workoutDays.includes(day) && styles.dayButtonActive,
                  ]}
                  onPress={() => toggleDay(day)}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      workoutDays.includes(day) && styles.dayButtonTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Podcast Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Podcast Preferences</Text>

            <Text style={styles.label}>Topics of Interest</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Technology, Health, Business"
              placeholderTextColor="#999"
              value={podcastTopics}
              onChangeText={setPodcastTopics}
              multiline
            />

            <Text style={styles.label}>Preferred Length</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Short (< 20 min), Medium, Long"
              placeholderTextColor="#999"
              value={podcastLength}
              onChangeText={setPodcastLength}
            />
          </View>

          {/* Commute Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Commute Preferences</Text>

            <Text style={styles.label}>Commute Start Time</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 8:00 AM"
              placeholderTextColor="#999"
              value={commuteStart}
              onChangeText={setCommuteStart}
            />

            <Text style={styles.label}>Commute End Time</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 6:00 PM"
              placeholderTextColor="#999"
              value={commuteEnd}
              onChangeText={setCommuteEnd}
            />

            <Text style={styles.label}>Commute Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 30"
              placeholderTextColor="#999"
              value={commuteDuration}
              onChangeText={setCommuteDuration}
              keyboardType="numeric"
            />
          </View>

          {/* Chore Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chore Preferences</Text>

            <Text style={styles.label}>Preferred Chore Time</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 10:00 AM or Afternoon"
              placeholderTextColor="#999"
              value={choreTime}
              onChangeText={setChoreTime}
            />

            <Text style={styles.label}>Typical Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 60"
              placeholderTextColor="#999"
              value={choreDuration}
              onChangeText={setChoreDuration}
              keyboardType="numeric"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Margarine',
    color: '#FF9D00',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Margarine',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F7E8FF',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Margarine',
    borderWidth: 1,
    borderColor: '#4D5AEE',
    color: '#333',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dayButtonActive: {
    backgroundColor: '#4D5AEE',
    borderColor: '#4D5AEE',
  },
  dayButtonText: {
    fontSize: 14,
    fontFamily: 'Margarine',
    color: '#666',
  },
  dayButtonTextActive: {
    color: '#FFF',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  saveButton: {
    backgroundColor: '#4D5AEE',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
});
