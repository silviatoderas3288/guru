import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { usePreferencesStore } from '../store/usePreferencesStore';

interface Entry {
  id: string;
  timestamp: Date;
  notes?: string;
}

interface EntriesProps {
  entries?: Entry[];
  onNavigateToDetail?: (entryId: string, timestamp: Date, notes?: string) => void;
  onAddEntry?: (entry: Entry) => void;
  onBack?: () => void;
}

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

const PlusIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5V19M5 12H19"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const Entries: React.FC<EntriesProps> = ({
  entries: propEntries = [],
  onNavigateToDetail,
  onAddEntry,
  onBack
}) => {
  const { toggleSettingsModal } = usePreferencesStore();

  const formatTimestamp = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;

    return `${year}.${month}.${day} ${displayHours}:${minutes}${ampm}`;
  };

  const handleAddEntry = () => {
    const newEntry: Entry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      notes: '',
    };
    if (onAddEntry) {
      onAddEntry(newEntry);
    }
    if (onNavigateToDetail) {
      onNavigateToDetail(newEntry.id, newEntry.timestamp, newEntry.notes);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonWrapper} onPress={onBack}>
          <Image
            source={require('../../assets/back.png')}
            style={styles.backButton}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsButtonWrapper} onPress={() => toggleSettingsModal(true)}>
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

      <Text style={styles.title}>Entries</Text>

      <View style={styles.entriesContainer}>
        {propEntries.map((entry) => (
          <TouchableOpacity
            key={entry.id}
            style={styles.entryItem}
            onPress={() => onNavigateToDetail?.(entry.id, entry.timestamp, entry.notes)}
          >
            <Text style={styles.entryText}>{formatTimestamp(entry.timestamp)}</Text>
            <ImageBackground
              source={require('../../assets/underline.png')}
              style={styles.underline}
              resizeMode="stretch"
            />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={handleAddEntry}>
          <View style={styles.addButtonCircle}>
            <PlusIcon />
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    marginBottom: 20,
  },
  backButtonWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    borderRadius: 50,
  },
  backButton: {
    width: 40,
    height: 40,
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
    color: '#FF9D00',
    textAlign: 'center',
    fontFamily: 'Margarine',
    fontSize: 40,
    fontWeight: '400',
    marginBottom: 60,
  },
  entriesContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  entryItem: {
    marginBottom: 40,
  },
  underline: {
    width: '100%',
    height: 8,
    marginTop: 2,
  },
  entryText: {
    color: '#FF9D00',
    textAlign: 'left',
    fontFamily: 'Margarine',
    fontSize: 24,
    fontWeight: '400',
  },
  addButton: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4D5AEE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
