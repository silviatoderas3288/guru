import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Modal, Pressable, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { GoogleAuthService, GoogleUser } from '../services/googleAuth';
import { PreferenceDropdown } from '../components/PreferenceDropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const SettingsIcon = () => (
  <Svg width="19" height="20" viewBox="0 0 19 20" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.54259 1.90589C8.77765 1.88545 9.01579 1.875 9.25659 1.875C9.49739 1.875 9.73553 1.88545 9.97059 1.90589C10.015 1.90974 10.1057 1.95186 10.1415 2.08866L10.5029 3.47028C10.6861 4.17095 11.1893 4.67846 11.7495 4.95591C11.9663 5.06334 12.1755 5.18441 12.3756 5.31804C12.8963 5.66576 13.5881 5.84795 14.287 5.65621L15.6656 5.27794C15.8017 5.24058 15.8837 5.29789 15.9095 5.33448C16.1826 5.7231 16.4223 6.13655 16.6248 6.57067C16.6433 6.6105 16.6525 6.7099 16.5518 6.80933L15.5333 7.81573C15.019 8.32401 14.8305 9.0126 14.8701 9.63647C14.8777 9.75655 14.8816 9.87775 14.8816 10C14.8816 10.1222 14.8777 10.2435 14.8701 10.3635C14.8305 10.9874 15.019 11.676 15.5333 12.1843L16.5518 13.1906C16.6525 13.2901 16.6433 13.3895 16.6248 13.4294C16.4223 13.8635 16.1826 14.2769 15.9095 14.6655C15.8837 14.7021 15.8017 14.7594 15.6656 14.7221L14.287 14.3438C13.5881 14.152 12.8963 14.3342 12.3756 14.682C12.1755 14.8156 11.9663 14.9366 11.7495 15.0441C11.1893 15.3215 10.6861 15.829 10.5029 16.5297L10.1415 17.9114C10.1057 18.0481 10.015 18.0903 9.97059 18.0941C9.73553 18.1145 9.49739 18.125 9.25659 18.125C9.01579 18.125 8.77765 18.1145 8.54259 18.0941C8.49822 18.0903 8.40743 18.0481 8.37165 17.9114L8.01029 16.5296C7.82704 15.829 7.32388 15.3215 6.76374 15.0441C6.54685 14.9366 6.33779 14.8156 6.13768 14.682C5.6169 14.3342 4.9251 14.152 4.2263 14.3438L2.84757 14.7221C2.71143 14.7594 2.62942 14.7021 2.60369 14.6655C2.3306 14.2769 2.09082 13.8635 1.88838 13.4294C1.8698 13.3895 1.86069 13.2901 1.9613 13.1906L2.9799 12.1842C3.4943 11.6759 3.68284 10.9873 3.64314 10.3635C3.63552 10.2434 3.63163 10.1222 3.63163 10C3.63163 9.87778 3.63552 9.75657 3.64314 9.63653C3.68284 9.01266 3.4943 8.32407 2.9799 7.8158L1.9613 6.80933C1.86069 6.70991 1.8698 6.61051 1.88838 6.57069C2.09082 6.13655 2.3306 5.7231 2.6037 5.33448C2.62942 5.29789 2.71143 5.24059 2.84757 5.27794L4.2263 5.65623C4.9251 5.84796 5.6169 5.66577 6.13768 5.31805C6.33779 5.18444 6.54685 5.06336 6.76374 4.95594C7.32387 4.67849 7.82704 4.17095 8.18841 3.47032L8.54259 1.90589Z"
      fill="white"
    />
  </Svg>
);

interface UserPreferences {
  podcastTopics: string[];
  podcastLength: string[];
  notifications: string[];
  workoutTypes: string[];
  workoutDuration: string[];
  workoutFrequency: string[];
  workoutDays: string[];
  workoutPreferredTime: string[];
  bedTime: string[];
  focusTimeStart: string[];
  focusTimeEnd: string[];
  blockedApps: string[];
  commuteStart: string[];
  commuteEnd: string[];
  commuteDuration: string[];
  choreTime: string[];
  choreDuration: string[];
}

// Reusable Time Range Dropdown Component
interface TimeRangeDropdownProps {
  label: string;
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  startOptions?: string[];
  endOptions?: string[];
}

const TimeRangeDropdown: React.FC<TimeRangeDropdownProps> = ({
  label,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  startOptions = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'],
  endOptions = ['11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM']
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartTime, setTempStartTime] = useState('');
  const [tempEndTime, setTempEndTime] = useState('');

  const handleOpen = () => {
    setTempStartTime(startTime);
    setTempEndTime(endTime);
    setIsOpen(true);
  };

  const handleDone = () => {
    if (tempStartTime) onStartTimeChange(tempStartTime);
    if (tempEndTime) onEndTimeChange(tempEndTime);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempStartTime(startTime);
    setTempEndTime(endTime);
    setIsOpen(false);
  };

  const displayValue = startTime && endTime
    ? `${startTime} - ${endTime}`
    : `Select ${label.toLowerCase()}`;

  return (
    <View style={dropdownStyles.container}>
      <View style={dropdownStyles.labelContainer}>
        <Text style={dropdownStyles.label}>{label}</Text>
        <Image
          source={require('../../assets/under_pref.png')}
          style={dropdownStyles.underline}
          resizeMode="contain"
        />
      </View>

      <TouchableOpacity onPress={handleOpen}>
        <ImageBackground
          source={require('../../assets/box.png')}
          style={dropdownStyles.dropdownBox}
          resizeMode="stretch"
        >
          <Text style={dropdownStyles.selectedText} numberOfLines={1}>
            {displayValue}
          </Text>
          <Image
            source={require('../../assets/arrow.png')}
            style={[
              dropdownStyles.arrow,
              isOpen && dropdownStyles.arrowRotated
            ]}
            resizeMode="contain"
          />
        </ImageBackground>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <Pressable
          style={dropdownStyles.modalOverlay}
          onPress={handleCancel}
        >
          <Pressable style={dropdownStyles.modalContent}>
            <ScrollView style={dropdownStyles.optionsList}>
              <View style={dropdownStyles.twoColumnContainer}>
                <View style={dropdownStyles.column}>
                  <Text style={dropdownStyles.columnHeader}>Start Time</Text>
                  {startOptions.map((time) => {
                    const isSelected = tempStartTime === time;
                    return (
                      <TouchableOpacity
                        key={time}
                        style={[
                          dropdownStyles.optionItem,
                          isSelected && dropdownStyles.optionItemSelected
                        ]}
                        onPress={() => setTempStartTime(time)}
                      >
                        <Text style={[
                          dropdownStyles.optionText,
                          isSelected && dropdownStyles.optionTextSelected
                        ]}>
                          {time}
                        </Text>
                        {isSelected && (
                          <Text style={dropdownStyles.checkmark}>✓</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={dropdownStyles.column}>
                  <Text style={dropdownStyles.columnHeader}>End Time</Text>
                  {endOptions.map((time) => {
                    const isSelected = tempEndTime === time;
                    return (
                      <TouchableOpacity
                        key={time}
                        style={[
                          dropdownStyles.optionItem,
                          isSelected && dropdownStyles.optionItemSelected
                        ]}
                        onPress={() => setTempEndTime(time)}
                      >
                        <Text style={[
                          dropdownStyles.optionText,
                          isSelected && dropdownStyles.optionTextSelected
                        ]}>
                          {time}
                        </Text>
                        {isSelected && (
                          <Text style={dropdownStyles.checkmark}>✓</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={dropdownStyles.doneButton}
              onPress={handleDone}
            >
              <Text style={dropdownStyles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const dropdownStyles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 18,
    fontFamily: 'Margarine',
    color: '#FF9D00',
    marginBottom: 4,
  },
  underline: {
    width: 150,
    height: 15,
  },
  dropdownBox: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  selectedText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
    marginRight: 10,
  },
  arrow: {
    width: 20,
    height: 20,
  },
  arrowRotated: {
    transform: [{ rotate: '180deg' }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(77, 90, 238, 0.95)',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  optionsList: {
    maxHeight: 400,
  },
  twoColumnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    paddingHorizontal: 5,
  },
  columnHeader: {
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#FF9D00',
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  optionItemSelected: {
    backgroundColor: 'rgba(255, 157, 0, 0.1)',
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Margarine',
    color: '#FFF',
  },
  optionTextSelected: {
    color: '#FF9D00',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: '#FF9D00',
    fontWeight: 'bold',
  },
  doneButton: {
    backgroundColor: '#FF9D00',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 15,
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
});

export const PageFive: React.FC = () => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    podcastTopics: [],
    podcastLength: [],
    notifications: [],
    workoutTypes: [],
    workoutDuration: [],
    workoutFrequency: [],
    workoutDays: [],
    workoutPreferredTime: [],
    bedTime: [],
    focusTimeStart: [],
    focusTimeEnd: [],
    blockedApps: [],
    commuteStart: [],
    commuteEnd: [],
    commuteDuration: [],
    choreTime: [],
    choreDuration: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    loadPreferences();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUser = await GoogleAuthService.getStoredUser();
      setUser(storedUser);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const storedUser = await GoogleAuthService.getStoredUser();
      if (!storedUser?.email) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/preferences/${storedUser.email}`);
      if (response.ok) {
        const data = await response.json();
        setPreferences({
          podcastTopics: data.podcast_topics || [],
          podcastLength: data.podcast_length ? [data.podcast_length] : [],
          notifications: data.notifications ? [data.notifications] : [],
          workoutTypes: data.workout_types || [],
          workoutDuration: data.workout_duration ? [data.workout_duration] : [],
          workoutFrequency: data.workout_frequency ? [data.workout_frequency] : [],
          workoutDays: data.workout_days || [],
          workoutPreferredTime: data.workout_preferred_time ? [data.workout_preferred_time] : [],
          bedTime: data.bed_time ? [data.bed_time] : [],
          focusTimeStart: data.focus_time_start ? [data.focus_time_start] : [],
          focusTimeEnd: data.focus_time_end ? [data.focus_time_end] : [],
          blockedApps: data.blocked_apps || [],
          commuteStart: data.commute_start ? [data.commute_start] : [],
          commuteEnd: data.commute_end ? [data.commute_end] : [],
          commuteDuration: data.commute_duration ? [data.commute_duration] : [],
          choreTime: data.chore_time ? [data.chore_time] : [],
          choreDuration: data.chore_duration ? [data.chore_duration] : [],
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (updatedPreferences: UserPreferences) => {
    try {
      const storedUser = await GoogleAuthService.getStoredUser();
      if (!storedUser?.email) {
        Alert.alert('Error', 'Please sign in to save preferences');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: storedUser.email,
          podcast_topics: updatedPreferences.podcastTopics,
          podcast_length: updatedPreferences.podcastLength[0] || null,
          notifications: updatedPreferences.notifications[0] || null,
          workout_types: updatedPreferences.workoutTypes,
          workout_duration: updatedPreferences.workoutDuration[0] || null,
          workout_frequency: updatedPreferences.workoutFrequency[0] || null,
          workout_days: updatedPreferences.workoutDays,
          workout_preferred_time: updatedPreferences.workoutPreferredTime[0] || null,
          bed_time: updatedPreferences.bedTime[0] || null,
          focus_time_start: updatedPreferences.focusTimeStart[0] || null,
          focus_time_end: updatedPreferences.focusTimeEnd[0] || null,
          blocked_apps: updatedPreferences.blockedApps,
          commute_start: updatedPreferences.commuteStart[0] || null,
          commute_end: updatedPreferences.commuteEnd[0] || null,
          commute_duration: updatedPreferences.commuteDuration[0] || null,
          chore_time: updatedPreferences.choreTime[0] || null,
          chore_duration: updatedPreferences.choreDuration[0] || null,
        }),
      });

      if (response.ok) {
        // Optional: show success message or just silent save
        // Alert.alert('Success', 'Preferences saved successfully!');
      } else {
        Alert.alert('Error', 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences');
    }
  };

  const updatePreference = (key: keyof UserPreferences, value: string[]) => {
    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);
    savePreferences(updatedPreferences);
  };

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

  const handleChangeProfilePicture = () => {
    Alert.alert(
      'Change Profile Picture',
      'Profile picture customization coming soon!',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header with Settings Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.settingsButtonWrapper}
            onPress={() => setSettingsVisible(true)}
          >
            <LinearGradient
              colors={['#FF9D00', '#4D5AEE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.settingsButton}
            >
              <SettingsIcon />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <TouchableOpacity onPress={handleChangeProfilePicture}>
              {user?.picture ? (
                <Image
                  source={{ uri: user.picture }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileImagePlaceholderText}>
                    {user?.name?.charAt(0) || '?'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleChangeProfilePicture}
              style={styles.editIconContainer}
            >
              <Ionicons name="pencil" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.username}>{user?.name || 'Guest User'}</Text>
          <Text style={styles.email}>{user?.email || 'No email'}</Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#4D5AEE" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              
              {/* Workout Preferences Section */}
              <View style={styles.preferencesSection}>
                <Text style={styles.sectionHeader}>Workout Preferences</Text>

                <PreferenceDropdown
                  label="Workout Type"
                  options={[
                    'Cardio', 'Strength Training', 'Yoga', 'Pilates', 'HIIT', 
                    'Running', 'Cycling', 'Swimming', 'CrossFit', 'Dance', 'Martial Arts'
                  ]}
                  selectedOptions={preferences.workoutTypes}
                  onSelectionChange={(selected) => updatePreference('workoutTypes', selected)}
                  multiSelect={true}
                />

                <PreferenceDropdown
                  label="Duration"
                  options={['15-30 min', '30-45 min', '45-60 min', '60+ min']}
                  selectedOptions={preferences.workoutDuration}
                  onSelectionChange={(selected) => updatePreference('workoutDuration', selected)}
                  multiSelect={false}
                />

                <PreferenceDropdown
                  label="Frequency"
                  options={['1-2 times/week', '3-4 times/week', '5-6 times/week', 'Daily']}
                  selectedOptions={preferences.workoutFrequency}
                  onSelectionChange={(selected) => updatePreference('workoutFrequency', selected)}
                  multiSelect={false}
                />

                <PreferenceDropdown
                  label="Preferred Days"
                  options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Weekends']}
                  selectedOptions={preferences.workoutDays}
                  onSelectionChange={(selected) => updatePreference('workoutDays', selected)}
                  multiSelect={true}
                />

                <PreferenceDropdown
                  label="Time of Day"
                  options={['Early Morning', 'Morning', 'Lunch', 'Afternoon', 'Evening', 'Late Night']}
                  selectedOptions={preferences.workoutPreferredTime}
                  onSelectionChange={(selected) => updatePreference('workoutPreferredTime', selected)}
                  multiSelect={false}
                />
              </View>

              {/* Podcast Preferences Section */}
              <View style={styles.preferencesSection}>
                <Text style={styles.sectionHeader}>Podcast Preferences</Text>

                <PreferenceDropdown
                  label="Favorite Topics"
                  options={[
                    'Technology', 'Health & Wellness', 'Business', 'Science', 'Sports', 
                    'Politics', 'Comedy', 'True Crime', 'History', 'Arts & Culture', 'Education', 'News'
                  ]}
                  selectedOptions={preferences.podcastTopics}
                  onSelectionChange={(selected) => updatePreference('podcastTopics', selected)}
                  multiSelect={true}
                />

                <PreferenceDropdown
                  label="Preferred Length"
                  options={['Under 20 min', '20-40 min', '40-60 min', 'Over 60 min']}
                  selectedOptions={preferences.podcastLength}
                  onSelectionChange={(selected) => updatePreference('podcastLength', selected)}
                  multiSelect={false}
                />

                <PreferenceDropdown
                  label="Notifications"
                  options={['Enabled', 'Disabled', 'Only favorites']}
                  selectedOptions={preferences.notifications}
                  onSelectionChange={(selected) => updatePreference('notifications', selected)}
                  multiSelect={false}
                />
              </View>

              {/* Commute Preferences Section */}
              <View style={styles.preferencesSection}>
                <Text style={styles.sectionHeader}>Commute Preferences</Text>

                <TimeRangeDropdown
                  label="Commute Time"
                  startTime={preferences.commuteStart[0] || ''}
                  endTime={preferences.commuteEnd[0] || ''}
                  onStartTimeChange={(time) => updatePreference('commuteStart', [time])}
                  onEndTimeChange={(time) => updatePreference('commuteEnd', [time])}
                  startOptions={['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '04:00 PM', '05:00 PM', '06:00 PM']}
                  endOptions={['07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '05:00 PM', '06:00 PM', '07:00 PM']}
                />

                <PreferenceDropdown
                  label="Commute Duration"
                  options={['Under 30 min', '30-60 min', '1-1.5 hours', 'Over 1.5 hours']}
                  selectedOptions={preferences.commuteDuration}
                  onSelectionChange={(selected) => updatePreference('commuteDuration', selected)}
                  multiSelect={false}
                />
              </View>

              {/* Chore Preferences Section */}
              <View style={styles.preferencesSection}>
                <Text style={styles.sectionHeader}>Chore Preferences</Text>

                <PreferenceDropdown
                  label="Preferred Time"
                  options={['Weekday Mornings', 'Weekday Evenings', 'Saturday Morning', 'Sunday Morning', 'Weekend Afternoon']}
                  selectedOptions={preferences.choreTime}
                  onSelectionChange={(selected) => updatePreference('choreTime', selected)}
                  multiSelect={false}
                />

                <PreferenceDropdown
                  label="Duration"
                  options={['15 min', '30 min', '45 min', '1 hour', '2 hours']}
                  selectedOptions={preferences.choreDuration}
                  onSelectionChange={(selected) => updatePreference('choreDuration', selected)}
                  multiSelect={false}
                />
              </View>

              {/* Focus & Schedule Preferences Section */}
              <View style={styles.preferencesSection}>
                <Text style={styles.sectionHeader}>Focus & Schedule</Text>

                <PreferenceDropdown
                  label="Bed Time"
                  options={['09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM', '12:00 AM', '12:30 AM']}
                  selectedOptions={preferences.bedTime}
                  onSelectionChange={(selected) => updatePreference('bedTime', selected)}
                  multiSelect={false}
                />

                <TimeRangeDropdown
                  label="Focus Time"
                  startTime={preferences.focusTimeStart[0] || ''}
                  endTime={preferences.focusTimeEnd[0] || ''}
                  onStartTimeChange={(time) => updatePreference('focusTimeStart', [time])}
                  onEndTimeChange={(time) => updatePreference('focusTimeEnd', [time])}
                />

                <PreferenceDropdown
                  label="Blocked Apps"
                  options={['Instagram', 'TikTok', 'YouTube', 'Facebook', 'Twitter/X', 'Snapchat', 'Reddit', 'Netflix']}
                  selectedOptions={preferences.blockedApps}
                  onSelectionChange={(selected) => updatePreference('blockedApps', selected)}
                  multiSelect={true}
                />
              </View>

              {/* Sign Out Button (Inside Modal) */}
              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>

              <View style={{height: 40}} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7E8FF',
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    alignItems: 'flex-end',
    paddingRight: 16,
    paddingTop: 20,
    marginBottom: 20,
  },
  settingsButtonWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    borderRadius: 50,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
  },
  profileImageContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4D5AEE',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FF9D00',
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF9D00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#4D5AEE',
  },
  profileImagePlaceholderText: {
    fontSize: 48,
    fontFamily: 'Margarine',
    color: '#FFF',
    fontWeight: '700',
  },
  username: {
    fontSize: 28,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
    marginBottom: 8,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#FF9D00',
    textAlign: 'center',
  },
  spacer: {
    height: 100,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F7E8FF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '90%',
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
  },
  closeButton: {
    padding: 5,
  },
  modalScroll: {
    paddingHorizontal: 0,
  },
  preferencesSection: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 90, 238, 0.1)',
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 22,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
    marginBottom: 20,
    textAlign: 'left',
  },
  signOutButton: {
    backgroundColor: '#FF0808',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
    alignItems: 'center',
    alignSelf: 'center',
    width: 150,
    marginTop: 20,
    shadowColor: '#FF0808',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  signOutText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
});