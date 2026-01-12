import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  Pressable
} from 'react-native';

interface PreferenceDropdownProps {
  label: string;
  options: string[];
  selectedOptions: string[];
  onSelectionChange: (selected: string[]) => void;
  multiSelect?: boolean;
}

export const PreferenceDropdown: React.FC<PreferenceDropdownProps> = ({
  label,
  options,
  selectedOptions,
  onSelectionChange,
  multiSelect = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelections, setTempSelections] = useState<string[]>([]);

  const handleOpen = () => {
    setTempSelections([...selectedOptions]);
    setIsOpen(true);
  };

  const toggleOption = (option: string) => {
    if (multiSelect) {
      if (tempSelections.includes(option)) {
        setTempSelections(tempSelections.filter(item => item !== option));
      } else {
        setTempSelections([...tempSelections, option]);
      }
    } else {
      setTempSelections([option]);
    }
  };

  const handleDone = () => {
    onSelectionChange(tempSelections);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempSelections([...selectedOptions]);
    setIsOpen(false);
  };

  const displayValue = selectedOptions.length > 0
    ? selectedOptions.join(', ')
    : 'Select options';

  return (
    <View style={styles.container}>
      {/* Label with underline */}
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
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

      {/* Dropdown Modal */}
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
              {options.map((option, index) => {
                const isSelected = tempSelections.includes(option);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionItem,
                      isSelected && styles.optionItemSelected
                    ]}
                    onPress={() => toggleOption(option)}
                  >
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected
                    ]}>
                      {option}
                    </Text>
                    {isSelected && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
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
});
