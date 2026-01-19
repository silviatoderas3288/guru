import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ImageBackground, Modal, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { GoogleAuthService } from '../services/googleAuth';
import { PreferenceDropdown } from '../components/PreferenceDropdown';
import { usePreferencesStore } from '../store/usePreferencesStore';

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

export const SettingsScreen: React.FC = () => {
  const { preferences, updatePreference, fetchPreferences } = usePreferencesStore();

  useEffect(() => {
    fetchPreferences();
  }, []);

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
          {/* Header with Settings Button */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.settingsButtonWrapper}>
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

          <Text style={styles.title}>Settings</Text>

          {/* Preferences Sections */}
          <View style={styles.preferencesContainer}>
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
                options={['Instagram', 'TikTok', 'YouTube', 'Facebook', 'Twitter/X', 'Snapchat', 'Reddit', 'Netflix']}
                selectedOptions={preferences.blockedApps}
                onSelectionChange={(selected) => updatePreference('blockedApps', selected)}
                multiSelect={true}
                labelColor="#4D5AEE"
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

            {/* Sleep Schedule */}
            <CollapsibleSection title="Sleep Schedule" transparent={true}>
              <PreferenceDropdown
                label="Bed Time"
                options={['09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM', '12:00 AM', '12:30 AM']}
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
    backgroundColor: '#F7E8FF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 10,
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
  title: {
    fontSize: 28,
    fontFamily: 'Margarine',
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#4D5AEE',
  },
  preferencesContainer: {
    width: '100%',
    paddingHorizontal: 4,
  },
  signOutButton: {
    backgroundColor: '#FF0808',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
    alignItems: 'center',
    alignSelf: 'center',
    width: 150,
    marginTop: 32,
    shadowColor: '#FF0808',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  signOutText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Margarine',
    fontWeight: '600',
  },
});
