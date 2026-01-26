import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Modal, ImageBackground, Pressable, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GoogleAuthService, GoogleUser } from '../services/googleAuth';
import { PreferenceDropdown } from '../components/PreferenceDropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePreferencesStore } from '../store/usePreferencesStore';
import schedulingAgentApi, { GenerateScheduleResponse, ScheduledEvent } from '../services/schedulingAgentApi';
import { CalendarApiService, CalendarEvent } from '../services/calendarApi';
import { ListItemApiService, ListItemType } from '../services/listItemApi';
import {
  scheduleSleepNotifications,
  requestNotificationPermissions,
  getScheduledSleepNotifications,
  sendTestNotificationNow
} from '../services/sleepNotificationService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const SettingsIcon = () => (
  <Svg width="19" height="20" viewBox="0 0 19 20" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.54259 1.90589C8.77765 1.88545 9.01579 1.875 9.25659 1.875C9.49739 1.875 9.73553 1.88545 9.97059 1.90589C10.015 1.90974 10.1057 1.95186 10.1415 2.08866L10.5029 3.47028C10.6861 4.17095 11.1893 4.67846 11.7495 4.95591C11.9663 5.06334 12.1755 5.18441 12.3756 5.31804C12.8963 5.66576 13.5881 5.84795 14.287 5.65621L15.6656 5.27794C15.8017 5.24058 15.8837 5.29789 15.9095 5.33448C16.1826 5.7231 16.4223 6.13655 16.6248 6.57067C16.6433 6.6105 16.6525 6.7099 16.5518 6.80933L15.5333 7.81573C15.019 8.32401 14.8305 9.0126 14.8701 9.63647C14.8777 9.75655 14.8816 9.87775 14.8816 10C14.8816 10.1222 14.8777 10.2435 14.8701 10.3635C14.8305 10.9874 15.019 11.676 15.5333 12.1843L16.5518 13.1906C16.6525 13.2901 16.6433 13.3895 16.6248 13.4294C16.4223 13.8635 16.1826 14.2769 15.9095 14.6655C15.8837 14.7021 15.8017 14.7594 15.6656 14.7221L14.287 14.3438C13.5881 14.152 12.8963 14.3342 12.3756 14.682C12.1755 14.8156 11.9663 14.9366 11.7495 15.0441C11.1893 15.3215 10.6861 15.829 10.5029 16.5297L10.1415 17.9114C10.1057 18.0481 10.015 18.0903 9.97059 18.0941C9.73553 18.1145 9.49739 18.125 9.25659 18.125C9.01579 18.125 8.77765 18.1145 8.54259 18.0941C8.49822 18.0903 8.40743 18.0481 8.37165 17.9114L8.01029 16.5296C7.82704 15.829 7.32388 15.3215 6.76374 15.0441C6.54685 14.9366 6.33779 14.8156 6.13768 14.682C5.6169 14.3342 4.9251 14.152 4.2263 14.3438L2.84757 14.7221C2.71143 14.7594 2.62942 14.7021 2.60369 14.6655C2.3306 14.2769 2.09082 13.8635 1.88838 13.4294C1.8698 13.3895 1.86069 13.2901 1.9613 13.1906L2.9799 12.1842C3.4943 11.6759 3.68284 10.9873 3.64314 10.3635C3.63552 10.2434 3.63163 10.1222 3.63163 10C3.63163 9.87778 3.63552 9.75657 3.64314 9.63653C3.68284 9.01266 3.4943 8.32407 2.9799 7.8158L1.9613 6.80933C1.86069 6.70991 1.8698 6.61051 1.88838 6.57069C2.09082 6.13655 2.3306 5.7231 2.6037 5.33448C2.62942 5.29789 2.71143 5.24059 2.84757 5.27794L4.2263 5.65623C4.9251 5.84796 5.6169 5.66577 6.13768 5.31805C6.33779 5.18444 6.54685 5.06336 6.76374 4.95594C7.32387 4.67849 7.82704 4.17097 8.01029 3.47031L8.37165 2.08866C8.40743 1.95186 8.49822 1.90974 8.54259 1.90589ZM9.25659 0C8.96152 0 8.6692 0.0128063 8.3802 0.0379294C7.45173 0.118643 6.76898 0.806303 6.55767 1.61423L6.1963 2.99589C6.17448 3.07936 6.09768 3.19345 5.9315 3.27576C5.64199 3.41916 5.36317 3.58065 5.09649 3.75871C4.94277 3.86135 4.80575 3.87092 4.72243 3.84806L3.34369 3.46976C2.53964 3.24915 1.60443 3.49536 1.0696 4.25644C0.733692 4.73446 0.438462 5.24341 0.18905 5.77828C-0.204659 6.6226 0.0501206 7.55681 0.643442 8.14307L1.66204 9.14954C1.72347 9.21024 1.78364 9.33346 1.77193 9.51749C1.76178 9.67714 1.75663 9.83804 1.75663 10C1.75663 10.162 1.76178 10.3229 1.77193 10.4825C1.78364 10.6665 1.72347 10.7898 1.66204 10.8505L0.643442 11.8569C0.0501193 12.4432 -0.204659 13.3774 0.18905 14.2218C0.43846 14.7566 0.733692 15.2655 1.0696 15.7435C1.60443 16.5046 2.53964 16.7509 3.34369 16.5303L4.72243 16.152C4.80575 16.1291 4.94278 16.1386 5.09649 16.2412C5.36317 16.4194 5.64199 16.5809 5.9315 16.7243C6.09768 16.8065 6.17448 16.9206 6.1963 17.0041L6.55767 18.3857C6.76898 19.1938 7.45173 19.8814 8.3802 19.9621C8.6692 19.9872 8.96152 20 9.25659 20C9.55167 20 9.84398 19.9872 10.133 19.9621C11.0614 19.8814 11.7442 19.1938 11.9555 18.3857L12.3168 17.0041C12.3387 16.9206 12.4155 16.8066 12.5817 16.7243C12.8712 16.5809 13.1501 16.4194 13.4167 16.2412C13.5705 16.1386 13.7075 16.1291 13.7908 16.152L15.1695 16.5303C15.9736 16.7509 16.9087 16.5046 17.4436 15.7436C17.7795 15.2655 18.0747 14.7566 18.3241 14.2218C18.7178 13.3774 18.4631 12.4432 17.8697 11.8569L16.8512 10.8505C16.7897 10.7898 16.7296 10.6666 16.7413 10.4826C16.7515 10.3229 16.7566 10.162 16.7566 10C16.7566 9.83801 16.7515 9.6771 16.7413 9.51742C16.7296 9.3334 16.7897 9.21016 16.8512 9.14948L17.8697 8.14306C18.4631 7.5568 18.7178 6.62259 18.3241 5.77826C18.0747 5.2434 17.7795 4.73445 17.4436 4.25644C16.9087 3.49535 15.9736 3.24915 15.1695 3.46976L13.7908 3.84804C13.7075 3.8709 13.5705 3.86134 13.4167 3.7587C13.1501 3.58062 12.8712 3.41912 12.5817 3.27571C12.4155 3.19341 12.3387 3.07933 12.3168 2.99584L11.9555 1.61423C11.7442 0.8063 11.0614 0.118641 10.133 0.0379282C9.84398 0.0128059 9.55167 0 9.25659 0ZM11.1316 10C11.1316 11.0355 10.2921 11.875 9.25659 11.875C8.22105 11.875 7.38159 11.0355 7.38159 10C7.38159 8.96446 8.22105 8.125 9.25659 8.125C10.2921 8.125 11.1316 8.96446 11.1316 10ZM13.0066 10C13.0066 12.0711 11.3277 13.75 9.25659 13.75C7.18553 13.75 5.50659 12.0711 5.50659 10C5.50659 7.92894 7.18553 6.25 9.25659 6.25C11.3277 6.25 13.0066 7.92894 13.0066 10Z"
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
  labelColor?: string;
}

const TimeRangeDropdown: React.FC<TimeRangeDropdownProps> = ({
  label,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  startOptions = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'],
  endOptions = ['11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'],
  labelColor = '#4D5AEE'
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
        <Text style={[dropdownStyles.label, { color: labelColor }]}>{label}</Text>
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
    backgroundColor: 'rgba(77, 90, 238, 0.70)',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  optionsList: {
    maxHeight: 300,
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
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  optionItemSelected: {
    backgroundColor: 'transparent',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#FFF',
  },
  optionTextSelected: {
    color: '#FF9D00',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
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

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  transparent?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultExpanded = false, transparent = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <View style={[collapsibleStyles.container, transparent && collapsibleStyles.containerTransparent]}>
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <ImageBackground
          source={require('../../assets/box.png')}
          style={collapsibleStyles.headerBox}
          resizeMode="stretch"
          tintColor="#4D5AEE"
        >
          <Text style={collapsibleStyles.title}>{title}</Text>
          <Image
            source={require('../../assets/arrow.png')}
            style={[
              collapsibleStyles.arrow,
              isExpanded && collapsibleStyles.arrowExpanded
            ]}
            resizeMode="contain"
          />
        </ImageBackground>
      </TouchableOpacity>
      {isExpanded && (
        <View style={collapsibleStyles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

const collapsibleStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  containerTransparent: {
    backgroundColor: 'transparent',
  },
  headerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 60,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Margarine',
    color: '#FF9D00',
    flex: 1,
  },
  arrow: {
    width: 20,
    height: 20,
    tintColor: '#FF9D00',
  },
  arrowExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});

// Text Input Preference Component
interface TextInputPreferenceProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  suffix?: string;
  keyboardType?: 'default' | 'numeric';
  labelColor?: string;
}

const TextInputPreference: React.FC<TextInputPreferenceProps> = ({
  label,
  value,
  onChangeText,
  placeholder = '',
  suffix = '',
  keyboardType = 'default',
  labelColor = '#4D5AEE'
}) => {
  return (
    <View style={textInputStyles.container}>
      <View style={textInputStyles.labelContainer}>
        <Text style={[textInputStyles.label, { color: labelColor }]}>{label}</Text>
        <Image
          source={require('../../assets/under_pref.png')}
          style={textInputStyles.underline}
          resizeMode="contain"
        />
      </View>
      <ImageBackground
        source={require('../../assets/box.png')}
        style={textInputStyles.inputBox}
        resizeMode="stretch"
      >
        <TextInput
          style={textInputStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType={keyboardType}
        />
        {suffix ? <Text style={textInputStyles.suffix}>{suffix}</Text> : null}
      </ImageBackground>
    </View>
  );
};

const textInputStyles = StyleSheet.create({
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
  inputBox: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
  },
  suffix: {
    fontSize: 14,
    fontFamily: 'Margarine',
    color: '#999',
    marginLeft: 8,
  },
});

// Time Input with Dropdown + Custom Input Component
interface TimeInputDropdownProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  labelColor?: string;
}

const TimeInputDropdown: React.FC<TimeInputDropdownProps> = ({
  label,
  value,
  onValueChange,
  options,
  labelColor = '#4D5AEE'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const handleSelectOption = (option: string) => {
    if (option === 'Custom') {
      setIsCustom(true);
    } else {
      onValueChange(option);
      setIsOpen(false);
      setIsCustom(false);
    }
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onValueChange(customValue.trim());
    }
    setIsOpen(false);
    setIsCustom(false);
    setCustomValue('');
  };

  const displayValue = value || `Select ${label.toLowerCase()}`;

  return (
    <View style={timeInputStyles.container}>
      <View style={timeInputStyles.labelContainer}>
        <Text style={[timeInputStyles.label, { color: labelColor }]}>{label}</Text>
        <Image
          source={require('../../assets/under_pref.png')}
          style={timeInputStyles.underline}
          resizeMode="contain"
        />
      </View>

      <TouchableOpacity onPress={() => setIsOpen(true)}>
        <ImageBackground
          source={require('../../assets/box.png')}
          style={timeInputStyles.dropdownBox}
          resizeMode="stretch"
        >
          <Text style={timeInputStyles.selectedText} numberOfLines={1}>
            {displayValue}
          </Text>
          <Image
            source={require('../../assets/arrow.png')}
            style={[
              timeInputStyles.arrow,
              isOpen && timeInputStyles.arrowRotated
            ]}
            resizeMode="contain"
          />
        </ImageBackground>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => { setIsOpen(false); setIsCustom(false); }}
      >
        <Pressable
          style={timeInputStyles.modalOverlay}
          onPress={() => { setIsOpen(false); setIsCustom(false); }}
        >
          <Pressable style={timeInputStyles.modalContent}>
            {isCustom ? (
              <View style={timeInputStyles.customInputContainer}>
                <Text style={timeInputStyles.customInputLabel}>Enter custom time (e.g. 7:30 AM)</Text>
                <TextInput
                  style={timeInputStyles.customInput}
                  value={customValue}
                  onChangeText={setCustomValue}
                  placeholder="e.g. 7:30 AM"
                  placeholderTextColor="#999"
                  autoFocus
                />
                <View style={timeInputStyles.customButtonsRow}>
                  <TouchableOpacity
                    style={timeInputStyles.backButton}
                    onPress={() => setIsCustom(false)}
                  >
                    <Text style={timeInputStyles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={timeInputStyles.submitButton}
                    onPress={handleCustomSubmit}
                  >
                    <Text style={timeInputStyles.submitButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <ScrollView style={timeInputStyles.optionsList}>
                  {[...options, 'Custom'].map((option) => {
                    const isSelected = value === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[
                          timeInputStyles.optionItem,
                          isSelected && timeInputStyles.optionItemSelected
                        ]}
                        onPress={() => handleSelectOption(option)}
                      >
                        <Text style={[
                          timeInputStyles.optionText,
                          isSelected && timeInputStyles.optionTextSelected
                        ]}>
                          {option}
                        </Text>
                        {isSelected && (
                          <Text style={timeInputStyles.checkmark}>✓</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity
                  style={timeInputStyles.doneButton}
                  onPress={() => setIsOpen(false)}
                >
                  <Text style={timeInputStyles.doneButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const timeInputStyles = StyleSheet.create({
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
    backgroundColor: 'rgba(77, 90, 238, 0.70)',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  optionItemSelected: {
    backgroundColor: 'transparent',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#FFF',
  },
  optionTextSelected: {
    color: '#FF9D00',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
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
  customInputContainer: {
    padding: 10,
  },
  customInputLabel: {
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#FFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  customInput: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
    marginBottom: 15,
  },
  customButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Margarine',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#FF9D00',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
});

// Duration Input Component (Hours and Minutes)
interface DurationInputProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  labelColor?: string;
}

const DurationInput: React.FC<DurationInputProps> = ({
  label,
  value,
  onValueChange,
  labelColor = '#4D5AEE'
}) => {
  // Parse existing value (format: "Xh Ym" or "X hours Y minutes" or just numbers)
  const parseValue = (val: string) => {
    if (!val) return { hours: '', minutes: '' };

    // Try to parse "Xh Ym" format
    const hMatch = val.match(/(\d+)\s*h/i);
    const mMatch = val.match(/(\d+)\s*m/i);

    if (hMatch || mMatch) {
      return {
        hours: hMatch ? hMatch[1] : '',
        minutes: mMatch ? mMatch[1] : ''
      };
    }

    // If just a number, assume it's minutes
    const numMatch = val.match(/^(\d+)$/);
    if (numMatch) {
      const totalMins = parseInt(numMatch[1]);
      if (totalMins >= 60) {
        return {
          hours: Math.floor(totalMins / 60).toString(),
          minutes: (totalMins % 60).toString()
        };
      }
      return { hours: '', minutes: numMatch[1] };
    }

    return { hours: '', minutes: '' };
  };

  const { hours, minutes } = parseValue(value);
  const [hoursValue, setHoursValue] = useState(hours);
  const [minutesValue, setMinutesValue] = useState(minutes);

  const updateValue = (newHours: string, newMinutes: string) => {
    setHoursValue(newHours);
    setMinutesValue(newMinutes);

    const parts = [];
    if (newHours && newHours !== '0') parts.push(`${newHours}h`);
    if (newMinutes && newMinutes !== '0') parts.push(`${newMinutes}m`);

    onValueChange(parts.join(' ') || '');
  };

  return (
    <View style={durationStyles.container}>
      <View style={durationStyles.labelContainer}>
        <Text style={[durationStyles.label, { color: labelColor }]}>{label}</Text>
        <Image
          source={require('../../assets/under_pref.png')}
          style={durationStyles.underline}
          resizeMode="contain"
        />
      </View>
      <View style={durationStyles.inputRow}>
        <ImageBackground
          source={require('../../assets/box.png')}
          style={durationStyles.inputBox}
          resizeMode="stretch"
        >
          <TextInput
            style={durationStyles.input}
            value={hoursValue}
            onChangeText={(text) => updateValue(text.replace(/[^0-9]/g, ''), minutesValue)}
            placeholder="0"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={2}
          />
          <Text style={durationStyles.unitLabel}>hours</Text>
        </ImageBackground>
        <ImageBackground
          source={require('../../assets/box.png')}
          style={durationStyles.inputBox}
          resizeMode="stretch"
        >
          <TextInput
            style={durationStyles.input}
            value={minutesValue}
            onChangeText={(text) => updateValue(hoursValue, text.replace(/[^0-9]/g, ''))}
            placeholder="0"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={2}
          />
          <Text style={durationStyles.unitLabel}>min</Text>
        </ImageBackground>
      </View>
    </View>
  );
};

const durationStyles = StyleSheet.create({
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
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputBox: {
    flex: 1,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
    textAlign: 'center',
  },
  unitLabel: {
    fontSize: 14,
    fontFamily: 'Margarine',
    color: '#999',
    marginLeft: 5,
  },
});

// List Input Preference Component
interface ListInputPreferenceProps {
  label: string;
  items: string[];
  onItemsChange: (items: string[]) => void;
  placeholder?: string;
  labelColor?: string;
}

const ListInputPreference: React.FC<ListInputPreferenceProps> = ({
  label,
  items,
  onItemsChange,
  placeholder = 'Add item...',
  labelColor = '#4D5AEE'
}) => {
  const [newItem, setNewItem] = useState('');

  const handleAddItem = () => {
    if (newItem.trim()) {
      onItemsChange([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onItemsChange(newItems);
  };

  return (
    <View style={listInputStyles.container}>
      <View style={listInputStyles.labelContainer}>
        <Text style={[listInputStyles.label, { color: labelColor }]}>{label}</Text>
        <Image
          source={require('../../assets/under_pref.png')}
          style={listInputStyles.underline}
          resizeMode="contain"
        />
      </View>
      
      {/* List of items */}
      {items.map((item, index) => (
        <View key={index} style={listInputStyles.itemRow}>
          <Text style={listInputStyles.itemText}>{item}</Text>
          <TouchableOpacity onPress={() => handleRemoveItem(index)}>
            <Ionicons name="close-circle" size={24} color="#FF9D00" />
          </TouchableOpacity>
        </View>
      ))}

      {/* Add new item input */}
      <ImageBackground
        source={require('../../assets/box.png')}
        style={listInputStyles.inputBox}
        resizeMode="stretch"
      >
        <TextInput
          style={listInputStyles.input}
          value={newItem}
          onChangeText={setNewItem}
          placeholder={placeholder}
          placeholderTextColor="#999"
          onSubmitEditing={handleAddItem}
        />
        <TouchableOpacity onPress={handleAddItem}>
          <Ionicons name="add-circle" size={28} color="#4D5AEE" />
        </TouchableOpacity>
      </ImageBackground>
    </View>
  );
};

const listInputStyles = StyleSheet.create({
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
    flex: 1,
  },
  inputBox: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
  },
});

export const PageFive: React.FC = () => {
  const { toggleSettingsModal, preferences, updatePreference, fetchPreferences, loading } = usePreferencesStore();
  const [user, setUser] = useState<GoogleUser | null>(null);
  
  // AI Schedule Modal states
  const [showAIScheduleModal, setShowAIScheduleModal] = useState(false);
  const [aiScheduleLoading, setAiScheduleLoading] = useState(false);
  const [isAddingEvents, setIsAddingEvents] = useState(false);
  const [aiScheduleResult, setAiScheduleResult] = useState<GenerateScheduleResponse | null>(null);
  const [weekStartDate, setWeekStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [modificationRequest, setModificationRequest] = useState('');

  useEffect(() => {
    loadUserData();
    fetchPreferences();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUser = await GoogleAuthService.getStoredUser();
      setUser(storedUser);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const handleAISchedule = async (dateObj?: Date, modification?: string) => {
    // If a date is provided, use it. Otherwise use the current state or default.
    const targetDate = dateObj || weekStartDate;

    // Ensure we are using the correct date string format (YYYY-MM-DD)
    const dateString = targetDate.toISOString().split('T')[0];

    setAiScheduleLoading(true);
    setShowAIScheduleModal(true);
    setShowDatePickerModal(false);

    try {
      const result = await schedulingAgentApi.generateSchedule({
        weekStartDate: dateString,
        forceRegenerate: true,
        modificationRequest: modification || modificationRequest || undefined,
      });
      setAiScheduleResult(result);
    } catch (error) {
      console.error('Error generating schedule:', error);
      Alert.alert(
        'Guru Scheduling Error',
        'Failed to generate schedule. Please make sure you have set your preferences in Settings.'
      );
      setShowAIScheduleModal(false);
    } finally {
      setAiScheduleLoading(false);
    }
  };

  // Open the date picker modal first before generating schedule
  const handleOpenDatePicker = () => {
    setShowDatePickerModal(true);
    setModificationRequest('');
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || weekStartDate;
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    setWeekStartDate(currentDate);
    
    // If the user selects a date, we could optionally auto-regenerate or wait for them to click "Regenerate"
    // Let's auto-regenerate for a smoother experience
    if (selectedDate && showAIScheduleModal) {
      handleAISchedule(selectedDate);
    }
  };

  const handleAcceptSchedule = async () => {
    if (!aiScheduleResult?.scheduledEvents) return;

    try {
      setIsAddingEvents(true);
      const events = aiScheduleResult.scheduledEvents;
      let addedCount = 0;
      
      // Fetch existing calendar events for this week to check for duplicates
      const weekEnd = new Date(weekStartDate);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const existingEvents = await CalendarApiService.getCalendarEvents(weekStartDate, weekEnd);

      // Track parent chore goal if needed
      let parentChoreGoalId: string | undefined = undefined;
      const isDistributedChores = preferences.choreDistribution && preferences.choreDistribution[0] === 'Distributed throughout the week';

      for (const event of events) {
        let newItem;
        let calendarEventId: string | undefined = undefined;

        // 1. Handle Calendar Event (Create or Update)
        if (event.start_time && event.end_time) {
          try {
            // Check if this is a meal event and if it already exists
            const isMeal = event.activity_type === 'meal';
            let existingEvent: CalendarEvent | undefined;

            if (isMeal) {
              // Find existing event with same title on the same day
              const eventDate = new Date(event.start_time).toDateString();
              existingEvent = existingEvents.find(e => 
                e.summary === event.title && 
                new Date(e.start_time).toDateString() === eventDate
              );
            }

            if (existingEvent && existingEvent.id) {
              // Update existing event
              await CalendarApiService.updateCalendarEvent(existingEvent.id, {
                start_time: event.start_time,
                end_time: event.end_time,
                description: event.description || existingEvent.description
              });
              calendarEventId = existingEvent.id;
              console.log(`Updated existing meal event: ${event.title}`);
            } else {
              // Create new event
              const calendarEvent = await CalendarApiService.createCalendarEvent({
                summary: event.title,
                description: event.description || 'Generated by Guru Scheduler',
                start_time: event.start_time,
                end_time: event.end_time,
                // Map AI colors or priority to Google Calendar colors if needed
              });
              calendarEventId = calendarEvent.id;
            }
          } catch (calError) {
            console.error('Failed to create/update calendar event for:', event.title, calError);
            // Continue even if calendar sync fails
          }
        }

        // 2. Create ListItem (Goal/Todo) ONLY if it's NOT a meal
        // Meals are calendar-only events per user request
        if (event.activity_type !== 'meal') {
            // Special logic for distributed chores
            if (event.activity_type === 'chore' && isDistributedChores) {
               // Create parent goal if not exists
               if (!parentChoreGoalId) {
                 const parent = await ListItemApiService.createListItem({
                   text: "Weekly Chores",
                   completed: false,
                   item_type: ListItemType.WEEKLY_GOAL
                 });
                 parentChoreGoalId = parent.id;
               }
               
               // Create child TODO item
               newItem = await ListItemApiService.createListItem({
                 text: event.title,
                 completed: false,
                 item_type: ListItemType.TODO,
                 parent_goal_id: parentChoreGoalId,
                 calendar_event_id: calendarEventId // Link to calendar event
               });
            } else {
               // Default logic: Create Weekly Goal
               newItem = await ListItemApiService.createListItem({
                 text: event.title,
                 completed: false,
                 item_type: ListItemType.WEEKLY_GOAL,
                 calendar_event_id: calendarEventId // Link to calendar event
               });
            }
        }
        
        addedCount++;
      }

      setShowAIScheduleModal(false);
      Alert.alert(
        'Success',
        `Schedule updated! ${addedCount} items processed.`
      );
    } catch (error) {
      console.error('Error accepting schedule:', error);
      Alert.alert('Error', 'Failed to save schedule. Please try again.');
    } finally {
      setIsAddingEvents(false);
    }
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

  const handleTestSleepNotifications = async () => {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Please enable notifications in your device settings.');
      return;
    }

    const bedTime = preferences.bedTime[0] || '10:00 PM';
    const wakeTime = preferences.wakeTime[0] || '7:00 AM';

    // If "Now (Test)" is selected, send immediate notification
    if (bedTime === 'Now (Test)') {
      const sent = await sendTestNotificationNow();
      if (sent) {
        Alert.alert(
          'Test Notification Sent',
          'A test bedtime notification will appear in 5 seconds.\n\nMake sure to background the app to see it!',
          [{ text: 'OK' }]
        );
      }
      return;
    }

    const result = await scheduleSleepNotifications(bedTime, wakeTime);

    const scheduled = await getScheduledSleepNotifications();
    console.log('Scheduled notifications:', scheduled);

    // Build detailed debug info
    const debugDetails = scheduled.map((notif, index) => {
      const trigger = notif.trigger as any;
      let triggerInfo = '';

      if (trigger?.type === 'daily') {
        triggerInfo = `Daily at ${trigger.hour}:${String(trigger.minute).padStart(2, '0')}`;
      } else if (trigger?.type === 'weekly') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        triggerInfo = `${days[trigger.weekday]} at ${trigger.hour}:${String(trigger.minute).padStart(2, '0')}`;
      } else {
        triggerInfo = JSON.stringify(trigger);
      }

      return `${index + 1}. ${notif.content.title}\n   ${triggerInfo}`;
    }).join('\n\n');

    if (result.bedtimeScheduled && result.wakeupScheduled) {
      Alert.alert(
        'Notifications Scheduled',
        `Bed Time: ${bedTime}\nWake Time: ${wakeTime}\n\n` +
        `Scheduled ${scheduled.length} notifications:\n\n${debugDetails}`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Error', 'Failed to schedule some notifications. Check console for details.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header with Settings Button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.settingsButtonWrapper} onPress={() => toggleSettingsModal(true)}>
            <LinearGradient
              colors={['#FF9D00', '#4D5AEE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
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

        {/* Collapsible Preferences Sections */}
        <View style={styles.preferencesContainer}>
          {/* Workout Preferences */}
          <CollapsibleSection title="Workout Preferences" transparent={true}>
            <PreferenceDropdown
              label="Workout Type"
              options={[
                'Cardio', 'Strength Training', 'Yoga', 'Pilates', 'HIIT',
                'Running', 'Cycling', 'Swimming', 'CrossFit', 'Dance', 'Martial Arts'
              ]}
              selectedOptions={preferences.workoutTypes}
              onSelectionChange={(selected) => updatePreference('workoutTypes', selected)}
              multiSelect={true}
              labelColor="#4D5AEE"
            />
            <PreferenceDropdown
              label="Duration"
              options={['15-30 min', '30-45 min', '45-60 min', '60+ min']}
              selectedOptions={preferences.workoutDuration}
              onSelectionChange={(selected) => updatePreference('workoutDuration', selected)}
              multiSelect={false}
              labelColor="#4D5AEE"
            />
            <PreferenceDropdown
              label="Frequency"
              options={['1-2 times/week', '3-4 times/week', '5-6 times/week', 'Daily']}
              selectedOptions={preferences.workoutFrequency}
              onSelectionChange={(selected) => updatePreference('workoutFrequency', selected)}
              multiSelect={false}
              labelColor="#4D5AEE"
            />
            <PreferenceDropdown
              label="Preferred Days"
              options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Weekends']}
              selectedOptions={preferences.workoutDays}
              onSelectionChange={(selected) => updatePreference('workoutDays', selected)}
              multiSelect={true}
              labelColor="#4D5AEE"
            />
            <PreferenceDropdown
              label="Time of Day"
              options={['Early Morning', 'Morning', 'Lunch', 'Afternoon', 'Evening', 'Late Night']}
              selectedOptions={preferences.workoutPreferredTime}
              onSelectionChange={(selected) => updatePreference('workoutPreferredTime', selected)}
              multiSelect={false}
              labelColor="#4D5AEE"
            />
          </CollapsibleSection>

          {/* Podcast Preferences */}
          <CollapsibleSection title="Podcast Preferences" transparent={true}>
            <PreferenceDropdown
              label="Favorite Topics"
              options={[
                'Technology', 'Health & Wellness', 'Business', 'Science', 'Sports',
                'Politics', 'Comedy', 'True Crime', 'History', 'Arts & Culture', 'Education', 'News'
              ]}
              selectedOptions={preferences.podcastTopics}
              onSelectionChange={(selected) => updatePreference('podcastTopics', selected)}
              multiSelect={true}
              labelColor="#4D5AEE"
            />
            <PreferenceDropdown
              label="Preferred Length"
              options={['Under 20 min', '20-40 min', '40-60 min', 'Over 60 min']}
              selectedOptions={preferences.podcastLength}
              onSelectionChange={(selected) => updatePreference('podcastLength', selected)}
              multiSelect={false}
              labelColor="#4D5AEE"
            />
            <PreferenceDropdown
              label="Podcast Languages"
              options={['English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Japanese', 'Chinese', 'Korean', 'Hindi', 'Arabic', 'Russian']}
              selectedOptions={preferences.podcastLanguages.map((code: string) => {
                const languageMap: { [key: string]: string } = {
                  'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
                  'pt': 'Portuguese', 'it': 'Italian', 'ja': 'Japanese', 'zh': 'Chinese',
                  'ko': 'Korean', 'hi': 'Hindi', 'ar': 'Arabic', 'ru': 'Russian'
                };
                return languageMap[code] || code;
              })}
              onSelectionChange={(selected) => {
                const codeMap: { [key: string]: string } = {
                  'English': 'en', 'Spanish': 'es', 'French': 'fr', 'German': 'de',
                  'Portuguese': 'pt', 'Italian': 'it', 'Japanese': 'ja', 'Chinese': 'zh',
                  'Korean': 'ko', 'Hindi': 'hi', 'Arabic': 'ar', 'Russian': 'ru'
                };
                const codes = selected.map(lang => codeMap[lang] || lang);
                updatePreference('podcastLanguages', codes.length > 0 ? codes : ['en']);
              }}
              multiSelect={true}
              labelColor="#4D5AEE"
            />
            <PreferenceDropdown
              label="Notifications"
              options={['Enabled', 'Disabled', 'Only favorites']}
              selectedOptions={preferences.notifications}
              onSelectionChange={(selected) => updatePreference('notifications', selected)}
              multiSelect={false}
              labelColor="#4D5AEE"
            />
          </CollapsibleSection>

          {/* Commute Preferences */}
          <CollapsibleSection title="Commute Preferences" transparent={true}>
            <TimeRangeDropdown
              label="Commute Time"
              startTime={preferences.commuteStartTime[0] || ''}
              endTime={preferences.commuteEndTime[0] || ''}
              onStartTimeChange={(time) => updatePreference('commuteStartTime', [time])}
              onEndTimeChange={(time) => updatePreference('commuteEndTime', [time])}
              startOptions={['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '04:00 PM', '05:00 PM', '06:00 PM']}
              endOptions={['07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '05:00 PM', '06:00 PM', '07:00 PM']}
              labelColor="#4D5AEE"
            />
            <PreferenceDropdown
              label="Commute Duration"
              options={['Under 30 min', '30-60 min', '1-1.5 hours', 'Over 1.5 hours']}
              selectedOptions={preferences.commuteDuration}
              onSelectionChange={(selected) => updatePreference('commuteDuration', selected)}
              multiSelect={false}
              labelColor="#4D5AEE"
            />
          </CollapsibleSection>

          {/* Chore Preferences */}
          <CollapsibleSection title="Chore Preferences" transparent={true}>
            <PreferenceDropdown
              label="Preferred Time"
              options={['Weekday Mornings', 'Weekday Evenings', 'Saturday Morning', 'Sunday Morning', 'Weekend Afternoon']}
              selectedOptions={preferences.choreTime}
              onSelectionChange={(selected) => updatePreference('choreTime', selected)}
              multiSelect={false}
              labelColor="#4D5AEE"
            />
            <DurationInput
              label="Duration"
              value={preferences.choreDuration[0] || ''}
              onValueChange={(value) => updatePreference('choreDuration', [value])}
              labelColor="#4D5AEE"
            />
            <PreferenceDropdown
              label="Distribution"
              options={['Distributed throughout the week', 'All in one session']}
              selectedOptions={preferences.choreDistribution}
              onSelectionChange={(selected) => updatePreference('choreDistribution', selected)}
              multiSelect={false}
              labelColor="#4D5AEE"
            />
            <ListInputPreference
              label="Chore List"
              items={preferences.choreList || []}
              onItemsChange={(items) => updatePreference('choreList', items)}
              placeholder="Add chore (e.g. Laundry)"
              labelColor="#4D5AEE"
            />
          </CollapsibleSection>

          {/* Sleep Schedule */}
          <CollapsibleSection title="Sleep Schedule" transparent={true}>
            <PreferenceDropdown
              label="Bed Time"
              options={[/* 'Now (Test)', */ '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM', '12:00 AM', '12:30 AM']}
              selectedOptions={preferences.bedTime}
              onSelectionChange={(selected) => updatePreference('bedTime', selected)}
              multiSelect={false}
              labelColor="#4D5AEE"
            />
            <TimeInputDropdown
              label="Wake Time"
              options={['05:00 AM', '05:30 AM', '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM']}
              value={preferences.wakeTime[0] || ''}
              onValueChange={(value) => updatePreference('wakeTime', [value])}
              labelColor="#4D5AEE"
            />
            <TextInputPreference
              label="Sleep Hours"
              value={preferences.sleepHours[0] || ''}
              onChangeText={(text) => updatePreference('sleepHours', [text])}
              placeholder="e.g. 8"
              suffix="hours"
              keyboardType="numeric"
              labelColor="#4D5AEE"
            />
            {/* Test button - uncomment to enable
            <TouchableOpacity
              style={{
                backgroundColor: '#4D5AEE',
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 10,
                marginTop: 10,
                alignItems: 'center',
              }}
              onPress={handleTestSleepNotifications}
            >
              <Text style={{ color: '#FFF', fontFamily: 'Margarine', fontSize: 14 }}>
                Test Sleep Notifications
              </Text>
            </TouchableOpacity>
            */}
          </CollapsibleSection>

          {/* Focus Time (App Blocking) */}
          <CollapsibleSection title="Focus Time (App Blocking)" transparent={true}>
            <TimeRangeDropdown
              label="Focus Time"
              startTime={preferences.focusTimeStart[0] || ''}
              endTime={preferences.focusTimeEnd[0] || ''}
              onStartTimeChange={(time) => updatePreference('focusTimeStart', [time])}
              onEndTimeChange={(time) => updatePreference('focusTimeEnd', [time])}
              labelColor="#4D5AEE"
            />
            <PreferenceDropdown
              label="Blocked Apps"
              options={['Instagram', 'TikTok', 'YouTube', 'Facebook', 'Twitter/X', 'Snapchat', 'Reddit', 'Netflix', 'News', 'WhatsApp', 'Messenger', 'LinkedIn', 'Pinterest', 'Twitch', 'Discord']}
              selectedOptions={preferences.blockedApps}
              onSelectionChange={(selected) => updatePreference('blockedApps', selected)}
              multiSelect={true}
              labelColor="#4D5AEE"
              allowCustom={true}
              customPlaceholder="Add app name..."
            />
          </CollapsibleSection>

          {/* Meal Preferences */}
          <CollapsibleSection title="Meal Preferences" transparent={true}>
            <TextInputPreference
              label="Meal Duration (minutes)"
              value={preferences.mealDuration[0] || ''}
              onChangeText={(text) => updatePreference('mealDuration', [text])}
              placeholder="e.g. 30"
              suffix="min"
              keyboardType="numeric"
              labelColor="#4D5AEE"
            />
          </CollapsibleSection>
        </View>

        {/* AI Generate Schedule Button */}
        <TouchableOpacity style={styles.aiScheduleButton} onPress={handleOpenDatePicker}>
          <LinearGradient
            colors={['#FF9D00', '#4D5AEE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.aiButtonGradient}
          >
             <Image
              source={require('../../assets/ai.png')}
              style={styles.aiButtonIcon}
              resizeMode="contain"
            />
            <Text style={styles.aiButtonText}>Generate Schedule</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Date Picker Modal - Shows BEFORE generating schedule */}
      <Modal
        visible={showDatePickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePickerModal(false)}
      >
        <View style={styles.datePickerModalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowDatePickerModal(false)}
          />
          <View style={styles.datePickerModalCard}>
            <Text style={styles.datePickerModalTitle}>Schedule Week</Text>
            <Text style={styles.datePickerModalSubtitle}>
              Select the week start date for your schedule
            </Text>
             <TouchableOpacity
                style={styles.scheduleCloseButton}
                onPress={() => setShowDatePickerModal(false)}
              >
                <Text style={styles.scheduleCloseButtonText}>✕</Text>
              </TouchableOpacity>

            {/* Custom Date Picker */}
            <View style={styles.datePickerContainer}>
              <TouchableOpacity
                style={styles.dateArrowButton}
                onPress={() => {
                  const newDate = new Date(weekStartDate);
                  newDate.setDate(newDate.getDate() - 7);
                  setWeekStartDate(newDate);
                }}
              >
                <Ionicons name="chevron-back" size={28} color="#4D5AEE" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateDisplayBox}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateDisplayMonth}>
                  {weekStartDate.toLocaleDateString('en-US', { month: 'short' })}
                </Text>
                <Text style={styles.dateDisplayDay}>
                  {weekStartDate.getDate()}
                </Text>
                <Text style={styles.dateDisplayYear}>
                  {weekStartDate.getFullYear()}
                </Text>
                <Text style={styles.dateDisplayWeekday}>
                  {weekStartDate.toLocaleDateString('en-US', { weekday: 'long' })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateArrowButton}
                onPress={() => {
                  const newDate = new Date(weekStartDate);
                  newDate.setDate(newDate.getDate() + 7);
                  setWeekStartDate(newDate);
                }}
              >
                <Ionicons name="chevron-forward" size={28} color="#4D5AEE" />
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={weekStartDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') {
                    setShowDatePicker(false);
                  }
                  if (selectedDate) {
                    setWeekStartDate(selectedDate);
                  }
                }}
                style={styles.dateTimePicker}
              />
            )}

            {Platform.OS === 'ios' && showDatePicker && (
              <TouchableOpacity
                style={styles.datePickerDoneButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            )}

            {/* Quick Select Buttons */}
            <View style={styles.quickSelectContainer}>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => {
                  const today = new Date();
                  const day = today.getDay();
                  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                  setWeekStartDate(new Date(today.setDate(diff)));
                }}
              >
                <Text style={styles.quickSelectText}>This Week</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => {
                  const today = new Date();
                  const day = today.getDay();
                  const diff = today.getDate() - day + (day === 0 ? 1 : 8);
                  setWeekStartDate(new Date(today.setDate(diff)));
                }}
              >
                <Text style={styles.quickSelectText}>Next Week</Text>
              </TouchableOpacity>
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              style={styles.generateScheduleButton}
              onPress={() => handleAISchedule(weekStartDate)}
            >
              <LinearGradient
                colors={['#FF9D00', '#4D5AEE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.generateButtonGradient}
              >
                <Image
                  source={require('../../assets/ai.png')}
                  style={styles.generateButtonIcon}
                  resizeMode="contain"
                />
                <Text style={styles.generateButtonText}>Generate Schedule</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.datePickerCancelButton}
              onPress={() => setShowDatePickerModal(false)}
            >
              {/* <Text style={styles.datePickerCancelText}>Cancel</Text> */}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AI Schedule Result Modal */}
      <Modal
        visible={showAIScheduleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAIScheduleModal(false)}
      >
        <View style={styles.aiModalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowAIScheduleModal(false)}
          />
          <View style={styles.aiModalCard}>
            <ScrollView
              style={styles.aiScheduleScrollView}
              contentContainerStyle={styles.aiScheduleScrollContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {/* Date Selection Header */}
              <View style={styles.dateSelectionHeader}>
                <Text style={styles.dateLabel}>Week Starting:</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dateValue}>
                    {weekStartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {showDatePicker && (
                <DateTimePicker
                  value={weekStartDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}

              {aiScheduleLoading || isAddingEvents ? (
                <View style={styles.aiLoadingContainer}>
                  <Image
                    source={require('../../assets/ai.png')}
                    style={styles.aiLoadingIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.aiLoadingText}>
                    {isAddingEvents ? 'Adding events to your calendar...' : 'Guru is creating your schedule...'}
                  </Text>
                  <Text style={styles.aiLoadingSubtext}>
                    {isAddingEvents ? 'Creating goals and calendar events' : 'Analyzing your preferences and calendar'}
                  </Text>
                </View>
              ) : aiScheduleResult ? (
                <>
                  <View style={styles.aiScheduleHeader}>
                    <Text style={styles.aiScheduleTitle}>Your Schedule</Text>
                  </View>

                  {aiScheduleResult.warnings?.length ? (
                    <View style={styles.warningsContainer}>
                      {aiScheduleResult.warnings.map((warning, index) => (
                        <Text key={index} style={styles.warningText}>
                          {warning.message}
                        </Text>
                      ))}
                    </View>
                  ) : null}

                  {aiScheduleResult.scheduledEvents?.length ? (
                    Object.entries(
                      aiScheduleResult.scheduledEvents.reduce((acc, event) => {
                        const day = event.day || 'Unscheduled';
                        if (!acc[day]) acc[day] = [];
                        acc[day].push(event);
                        return acc;
                      }, {} as Record<string, ScheduledEvent[]>)
                    )
                    .sort(([dayA], [dayB]) => {
                      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Unscheduled'];
                      return dayOrder.indexOf(dayA) - dayOrder.indexOf(dayB);
                    })
                    .map(([day, events]) => (
                      <View key={day} style={styles.daySection}>
                        <Text style={styles.dayHeader}>{day}</Text>
                        {events.map((event, index) => (
                          <View key={index} style={styles.scheduleEventItem}>
                            <View style={styles.eventDetails}>
                              <Text style={styles.eventTitle}>{event.title}</Text>
                              <Text style={styles.eventTime}>
                                {formatTime(event.start_time)} - {formatTime(event.end_time)}
                              </Text>
                              {event.description ? (
                                <Text style={styles.eventDescription}>{event.description}</Text>
                              ) : null}
                            </View>
                          </View>
                        ))}
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noEventsText}>No events scheduled</Text>
                  )}

                  {/* Modification Request Input */}
                  <View style={styles.modificationContainer}>
                    <Text style={styles.modificationLabel}>
                      Want to modify this schedule? Describe what you'd like changed:
                    </Text>
                    <TextInput
                      style={styles.modificationInput}
                      value={modificationRequest}
                      onChangeText={setModificationRequest}
                      placeholder="e.g., Move workouts to evening, add more focus time on Wednesday..."
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.aiButtonsRow}>
                    <TouchableOpacity
                      style={[styles.aiActionButton, styles.regenerateButton]}
                      onPress={() => handleAISchedule(weekStartDate, modificationRequest)}
                    >
                      <Text style={styles.regenerateButtonText}>
                        {modificationRequest ? 'Apply Changes' : 'Regenerate'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.aiActionButton, styles.acceptButton]}
                      onPress={handleAcceptSchedule}
                    >
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAIScheduleModal(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
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
  scheduleCloseButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4D5AEE',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scheduleCloseButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    alignItems: 'flex-end',
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
  preferencesContainer: {
    width: '100%',
    paddingHorizontal: 4,
    marginTop: 10,
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
  aiScheduleButton: {
    width: 250,
    marginTop: 20,
    borderRadius: 25,
    shadowColor: '#4D5AEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  aiButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 10,
  },
  aiButtonIcon: {
    width: 24,
    height: 24,
  },
  aiButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
  // AI Modal Styles
  aiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  aiModalCard: {
    width: '100%',
    maxWidth: 420,
    height: '80%',
    backgroundColor: '#F7E8FF',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  aiScheduleScrollView: {
    flex: 1,
    width: '100%',
  },
  aiScheduleScrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 28,
  },
  aiLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  aiLoadingIcon: {
    width: 60,
    height: 60,
    marginBottom: 20,
  },
  aiLoadingText: {
    fontSize: 18,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
    textAlign: 'center',
    marginBottom: 8,
  },
  aiLoadingSubtext: {
    fontSize: 14,
    fontFamily: 'Margarine',
    color: '#666',
    textAlign: 'center',
  },
  dateSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    marginBottom: 10,
  },
  dateLabel: {
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#666',
    marginRight: 8,
  },
  dateValue: {
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
    textDecorationLine: 'underline',
  },
  aiScheduleHeader: {
    paddingBottom: 12,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  aiScheduleTitle: {
    fontSize: 22,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
    textAlign: 'center',
  },
  daySection: {
    marginTop: 14,
  },
  dayHeader: {
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#FF9D00',
    marginBottom: 10,
  },
  scheduleEventItem: {
    backgroundColor: 'rgba(77, 90, 238, 0.85)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  eventDetails: {
    gap: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#ffffff', 
  },
  eventTime: {
    fontSize: 13,
    fontFamily: 'Margarine',
    color: '#FF9D00',
    opacity: 0.9,
  },
  eventDescription: {
    fontSize: 13,
    fontFamily: 'Margarine',
    color: '#ffffff',
    marginTop: 4,
  },
  warningsContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,157,0,0.25)',
  },
  warningText: {
    fontSize: 13,
    fontFamily: 'Margarine',
    color: '#A35A00',
    marginBottom: 6,
  },
  noEventsText: {
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  aiButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    marginBottom: 10,
  },
  aiActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regenerateButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(77,90,238,0.35)',
  },
  regenerateButtonText: {
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
  },
  acceptButton: {
    backgroundColor: '#4D5AEE',
  },
  acceptButtonText: {
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#FFF',
  },
  modalCloseButton: {
    marginTop: 6,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  modalCloseText: {
    fontSize: 14,
    fontFamily: 'Margarine',
    color: '#333',
  },
  // Date Picker Modal Styles
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  datePickerModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#F7E8FF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
    alignItems: 'center',
  },
  datePickerModalTitle: {
    fontSize: 24,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
    marginBottom: 8,
    textAlign: 'center',
  },
  datePickerModalSubtitle: {
    fontSize: 14,
    fontFamily: 'Margarine',
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dateArrowButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(77, 90, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateDisplayBox: {
    backgroundColor: 'rgba(77, 90, 238, 0.15)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginHorizontal: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4D5AEE',
  },
  dateDisplayMonth: {
    fontSize: 14,
    fontFamily: 'Margarine',
    color: '#FF9D00',
    textTransform: 'uppercase',
  },
  dateDisplayDay: {
    fontSize: 48,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
    lineHeight: 52,
  },
  dateDisplayYear: {
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
  },
  dateDisplayWeekday: {
    fontSize: 14,
    fontFamily: 'Margarine',
    color: '#666',
    marginTop: 4,
  },
  dateTimePicker: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 10,
  },
  datePickerDoneButton: {
    backgroundColor: '#4D5AEE',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  datePickerDoneText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Margarine',
  },
  quickSelectContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickSelectButton: {
    backgroundColor: 'rgba(255, 157, 0, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF9D00',
  },
  quickSelectText: {
    fontSize: 14,
    fontFamily: 'Margarine',
    color: '#FF9D00',
  },
  generateScheduleButton: {
    width: '100%',
    borderRadius: 25,
    marginBottom: 12,
    shadowColor: '#4D5AEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    gap: 10,
  },
  generateButtonIcon: {
    width: 24,
    height: 24,
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
  datePickerCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  datePickerCancelText: {
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#666',
  },
  // Modification Input Styles
  modificationContainer: {
    width: '100%',
    marginTop: 16,
    marginBottom: 8,
  },
  modificationLabel: {
    fontSize: 14,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
    marginBottom: 8,
  },
  modificationInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    fontFamily: 'Margarine',
    color: '#333',
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(77, 90, 238, 0.3)',
  },
});