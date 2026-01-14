import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Image } from 'react-native';
import { PreferenceDropdown } from './PreferenceDropdown';
import { FocusTimeDropdown } from './FocusTimeDropdown';
import { usePreferencesStore } from '../store/usePreferencesStore';

export const SettingsModal: React.FC = () => {
  const { isModalVisible, toggleSettingsModal, preferences, updatePreference } = usePreferencesStore();

  if (!isModalVisible) return null;

  return (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => toggleSettingsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <TouchableOpacity onPress={() => toggleSettingsModal(false)}>
              <Image source={require('../../assets/x.png')} style={styles.closeIcon} resizeMode="contain" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Podcast Preferences */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Podcast Preferences</Text>
              <PreferenceDropdown
                label="Topics"
                options={['Technology', 'Health', 'Business', 'Science', 'Sports', 'News', 'Comedy', 'History']}
                selectedOptions={preferences.podcastTopics}
                onSelectionChange={(val) => updatePreference('podcastTopics', val)}
                multiSelect={true}
              />
              <PreferenceDropdown
                label="Length"
                options={['Under 20 min', '20-40 min', '40-60 min', 'Over 60 min']}
                selectedOptions={preferences.podcastLength}
                onSelectionChange={(val) => updatePreference('podcastLength', val)}
                multiSelect={false}
              />
            </View>

            {/* Workout Preferences */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Workout Preferences</Text>
              <PreferenceDropdown
                label="Type"
                options={['Cardio', 'Strength', 'Yoga', 'HIIT', 'Running']}
                selectedOptions={preferences.workoutTypes}
                onSelectionChange={(val) => updatePreference('workoutTypes', val)}
                multiSelect={true}
              />
              <PreferenceDropdown
                label="Duration"
                options={['15-30 min', '30-45 min', '45-60 min', '60+ min']}
                selectedOptions={preferences.workoutDuration}
                onSelectionChange={(val) => updatePreference('workoutDuration', val)}
                multiSelect={false}
              />
            </View>

            {/* Commute Preferences */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Commute Preferences</Text>
              <FocusTimeDropdown
                startTime={preferences.commuteStartTime[0] || ''}
                endTime={preferences.commuteEndTime[0] || ''}
                onStartTimeChange={(time) => updatePreference('commuteStartTime', [time])}
                onEndTimeChange={(time) => updatePreference('commuteEndTime', [time])}
              />
               <PreferenceDropdown
                label="Method"
                options={['Driving', 'Public Transit', 'Walking', 'Cycling']}
                selectedOptions={preferences.commuteMethod}
                onSelectionChange={(val) => updatePreference('commuteMethod', val)}
                multiSelect={false}
              />
            </View>

            {/* Chore Preferences */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chore Preferences</Text>
              <PreferenceDropdown
                label="Preferred Time"
                options={['Morning', 'Afternoon', 'Evening', 'Weekend']}
                selectedOptions={preferences.choreTime}
                onSelectionChange={(val) => updatePreference('choreTime', val)}
                multiSelect={false}
              />
               <PreferenceDropdown
                label="Duration"
                options={['15 min', '30 min', '1 hour', '2 hours']}
                selectedOptions={preferences.choreDuration}
                onSelectionChange={(val) => updatePreference('choreDuration', val)}
                multiSelect={false}
              />
            </View>
            
            <View style={styles.spacer} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#F7E8FF',
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
  },
  closeIcon: {
    width: 30,
    height: 30,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Margarine',
    color: '#FF9D00',
    marginBottom: 12,
  },
  spacer: {
    height: 40,
  }
});
