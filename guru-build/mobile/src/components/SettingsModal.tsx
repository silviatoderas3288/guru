import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Image, ImageBackground, Pressable, TextInput } from 'react-native';
import { PreferenceDropdown } from './PreferenceDropdown';
import { usePreferencesStore } from '../store/usePreferencesStore';

// Time Range Dropdown Component
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
  endOptions = ['11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'],
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

// Text Input Preference Component
interface TextInputPreferenceProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  suffix?: string;
  keyboardType?: 'default' | 'numeric';
}

const TextInputPreference: React.FC<TextInputPreferenceProps> = ({
  label,
  value,
  onChangeText,
  placeholder = '',
  suffix = '',
  keyboardType = 'default',
}) => {
  return (
    <View style={textInputStyles.container}>
      <View style={textInputStyles.labelContainer}>
        <Text style={textInputStyles.label}>{label}</Text>
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
}

const TimeInputDropdown: React.FC<TimeInputDropdownProps> = ({
  label,
  value,
  onValueChange,
  options,
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
        <Text style={timeInputStyles.label}>{label}</Text>
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
}

const DurationInput: React.FC<DurationInputProps> = ({
  label,
  value,
  onValueChange,
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
        <Text style={durationStyles.label}>{label}</Text>
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
            {/* Focus Time (App Blocking) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Focus Time (App Blocking)</Text>
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

            {/* Meal Preferences */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Meal Preferences</Text>
              <TextInputPreference
                label="Meal Duration (minutes)"
                value={preferences.mealDuration[0] || ''}
                onChangeText={(text) => updatePreference('mealDuration', [text])}
                placeholder="e.g. 30"
                suffix="min"
                keyboardType="numeric"
              />
            </View>

            {/* Sleep Schedule */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sleep Schedule</Text>
              <PreferenceDropdown
                label="Bed Time"
                options={['09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM', '12:00 AM', '12:30 AM']}
                selectedOptions={preferences.bedTime}
                onSelectionChange={(selected) => updatePreference('bedTime', selected)}
                multiSelect={false}
              />
              <TimeInputDropdown
                label="Wake Time"
                options={['05:00 AM', '05:30 AM', '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM']}
                value={preferences.wakeTime[0] || ''}
                onValueChange={(value) => updatePreference('wakeTime', [value])}
              />
              <TextInputPreference
                label="Sleep Hours"
                value={preferences.sleepHours[0] || ''}
                onChangeText={(text) => updatePreference('sleepHours', [text])}
                placeholder="e.g. 8"
                suffix="hours"
                keyboardType="numeric"
              />
            </View>

            {/* Chore Preferences */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chore Preferences</Text>
              <PreferenceDropdown
                label="Preferred Time"
                options={['Weekday Mornings', 'Weekday Evenings', 'Saturday Morning', 'Sunday Morning', 'Weekend Afternoon']}
                selectedOptions={preferences.choreTime}
                onSelectionChange={(selected) => updatePreference('choreTime', selected)}
                multiSelect={false}
              />
              <DurationInput
                label="Duration"
                value={preferences.choreDuration[0] || ''}
                onValueChange={(value) => updatePreference('choreDuration', [value])}
              />
              <PreferenceDropdown
                label="Distribution"
                options={['Distributed throughout the week', 'All in one session']}
                selectedOptions={preferences.choreDistribution}
                onSelectionChange={(selected) => updatePreference('choreDistribution', selected)}
                multiSelect={false}
              />
            </View>

            {/* Commute Preferences */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Commute Preferences</Text>
              <TimeRangeDropdown
                label="Commute Time"
                startTime={preferences.commuteStartTime[0] || ''}
                endTime={preferences.commuteEndTime[0] || ''}
                onStartTimeChange={(time) => updatePreference('commuteStartTime', [time])}
                onEndTimeChange={(time) => updatePreference('commuteEndTime', [time])}
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
