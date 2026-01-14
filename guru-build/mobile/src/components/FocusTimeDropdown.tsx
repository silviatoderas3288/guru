import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, Pressable, ImageBackground } from 'react-native';

interface FocusTimeDropdownProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
}

export const FocusTimeDropdown: React.FC<FocusTimeDropdownProps> = ({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartTime, setTempStartTime] = useState('');
  const [tempEndTime, setTempEndTime] = useState('');

  const startTimeOptions = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];
  const endTimeOptions = ['11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'];

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
    : 'Select focus time';

  return (
    <View style={styles.container}>
      {/* Label with underline */}
      <View style={styles.labelContainer}>
        <Text style={styles.label}>Focus Time</Text>
        <Image
          source={require('../../assets/under_pref.png')}
          style={styles.underline}
          resizeMode="contain"
        />
      </View>

      {/* Dropdown Box */}
      <TouchableOpacity onPress={handleOpen}>
        <ImageBackground
          source={require('../../assets/box.png')}
          style={styles.dropdownBox}
          resizeMode="stretch"
        >
          <Text style={styles.selectedText} numberOfLines={1}>
            {displayValue}
          </Text>
          <Image
            source={require('../../assets/arrow.png')}
            style={[
              styles.arrow,
              isOpen && styles.arrowRotated
            ]}
            resizeMode="contain"
          />
        </ImageBackground>
      </TouchableOpacity>

      {/* Modal with two-column layout for start/end times */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={handleCancel}
        >
          <Pressable style={styles.modalContent}>
            <ScrollView style={styles.optionsList}>
              <View style={styles.twoColumnContainer}>
                {/* Start Time Column */}
                <View style={styles.column}>
                  <Text style={styles.columnHeader}>Start Time</Text>
                  {startTimeOptions.map((time) => {
                    const isSelected = tempStartTime === time;
                    return (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.optionItem,
                          isSelected && styles.optionItemSelected
                        ]}
                        onPress={() => setTempStartTime(time)}
                      >
                        <Text style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected
                        ]}>
                          {time}
                        </Text>
                        {isSelected && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* End Time Column */}
                <View style={styles.column}>
                  <Text style={styles.columnHeader}>End Time</Text>
                  {endTimeOptions.map((time) => {
                    const isSelected = tempEndTime === time;
                    return (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.optionItem,
                          isSelected && styles.optionItemSelected
                        ]}
                        onPress={() => setTempEndTime(time)}
                      >
                        <Text style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected
                        ]}>
                          {time}
                        </Text>
                        {isSelected && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleDone}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
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
    maxHeight: '70%',
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
    backgroundColor: 'transparent',
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
