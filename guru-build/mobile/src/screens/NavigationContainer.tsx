import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { PageOne } from './PageOne';
import { PageTwo } from './PageTwo';
import { PageThree } from './PageThree';
import { WorkoutScreen } from './WorkoutScreen';
import { PageFive } from './PageFive';
import { Entries } from './Entries';
import { EntryDetail } from './EntryDetail';
import { journalApi } from '../services/journalApi';
import { SettingsModal } from '../components/SettingsModal';

const ICON_COLOR = '#4D5AEE';
const ACTIVE_COLOR = '#FF9D00';
const INACTIVE_COLOR = '#4D5AEE';

type Page = 'one' | 'two' | 'three' | 'four' | 'five' | 'entries' | 'entryDetail';

interface EntryDetailParams {
  entryId: string;
  timestamp: Date;
  notes?: string;
}

// Custom Tab Bar Icons
const JournalIcon = ({ color = ICON_COLOR }: { color?: string }) => (
  <Svg width="24" height="24" viewBox="0 0 32 32" fill="none">
    <Path
      d="M16 10.5997V31M16 10.5997C16 7.23938 16 5.5599 16.545 4.27641C17.0243 3.14742 17.7887 2.22922 18.7295 1.65397C19.7991 1 21.1994 1 23.9997 1H28.333C29.2664 1 29.7335 1 30.09 1.21799C30.4036 1.40974 30.6579 1.71548 30.8177 2.09181C30.9994 2.51964 31 3.08012 31 4.20024V21.8005C31 22.9206 30.9994 23.4799 30.8177 23.9077C30.6579 24.284 30.4041 24.5908 30.0905 24.7825C29.7344 25.0003 29.2683 25.0003 28.3367 25.0003H23.6156C22.0502 25.0003 21.2661 25.0003 20.5557 25.2592C19.9267 25.4884 19.3428 25.8637 18.835 26.3646C18.2614 26.9303 17.8267 27.7118 16.9584 29.2748L16 31M16 10.5997C16 7.23938 15.9997 5.5599 15.4548 4.27641C14.9754 3.14742 14.2104 2.22922 13.2696 1.65397C12.2001 1 10.7996 1 7.99935 1H3.66602C2.73259 1 2.26635 1 1.90983 1.21799C1.59623 1.40974 1.34144 1.71548 1.18166 2.09181C1 2.51964 1 3.08012 1 4.20024V21.8005C1 22.9206 1 23.4799 1.18166 23.9077C1.34144 24.284 1.59623 24.5908 1.90983 24.7825C2.266 25.0003 2.73168 25.0003 3.66328 25.0003H8.38455C9.9499 25.0003 10.7324 25.0003 11.4428 25.2592C12.0718 25.4884 12.6585 25.8637 13.1663 26.3646C13.7376 26.928 14.1695 27.7055 15.0308 29.2558L16 31"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CalendarIcon = ({ color = ICON_COLOR }: { color?: string }) => (
  <Svg width="24" height="24" viewBox="0 0 30 30" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.03571 0C8.92331 0 9.64286 0.6296 9.64286 1.40625V3.75H20.3571V1.40625C20.3571 0.6296 21.0767 0 21.9643 0C22.8519 0 23.5714 0.6296 23.5714 1.40625V3.75H26.25C28.3211 3.75 30 5.21907 30 7.03125V26.7188C30 28.5309 28.3211 30 26.25 30H3.75C1.67893 30 0 28.5309 0 26.7188V7.03125C0 5.21906 1.67893 3.75 3.75 3.75H6.42857V1.40625C6.42857 0.6296 7.14811 0 8.03571 0ZM26.25 6.5625C26.5459 6.5625 26.7857 6.77237 26.7857 7.03125V11.25H3.21429V7.03125C3.21429 6.77237 3.45413 6.5625 3.75 6.5625H26.25ZM3.21429 14.0625V26.7188C3.21429 26.9776 3.45413 27.1875 3.75 27.1875H26.25C26.5459 27.1875 26.7857 26.9776 26.7857 26.7188V14.0625H3.21429Z"
      fill={color}
    />
  </Svg>
);

const HeadphonesIcon = ({ color = ICON_COLOR }: { color?: string }) => (
  <Svg width="24" height="24" viewBox="0 0 30 30" fill="none">
    <Path
      d="M30 15.1601C30 14.976 30 14.7999 29.9916 14.6158C29.9078 12.1505 29.2372 9.82924 28.114 7.79616C25.549 3.14568 20.6454 0 15.0042 0C9.36294 0 4.45096 3.14568 1.886 7.79616C0.762783 9.83725 0.0922127 12.1505 0.00839041 14.6158C8.18596e-06 14.7999 0 14.976 0 15.1601V22.7001C0 26.0059 2.43922 28.7593 5.6999 29.4237C6.05196 29.7679 6.58845 30 7.19197 30C7.79549 30 8.33195 29.7759 8.684 29.4237L8.70915 29.3997V16.0005H8.70076C8.35708 15.6403 7.80386 15.4002 7.18358 15.4002C6.56329 15.4002 6.01007 15.6403 5.66639 16.0005H5.658C4.53479 16.2247 3.51216 16.7129 2.65718 17.3773C2.59012 17.4333 2.04526 17.8975 1.87761 18.0896V15.024C1.87761 14.8079 2.06202 14.6238 2.29672 14.6238H2.3135H2.48113C2.75775 7.88421 8.2565 2.50534 14.9874 2.50534C21.7184 2.50534 27.2087 7.88421 27.4853 14.6238H27.6781C27.9128 14.6238 28.0972 14.8079 28.0972 15.024V18.0896C27.9296 17.8975 27.7368 17.7134 27.5356 17.5614C27.5356 17.5614 27.3847 17.4333 27.3177 17.3773C26.4627 16.7129 25.4401 16.2327 24.3168 16.0005C23.9648 15.6403 23.4116 15.4002 22.7913 15.4002C22.171 15.4002 21.6345 15.6243 21.2741 15.9925V29.4157C21.2741 29.4157 21.2825 29.4237 21.2909 29.4237C21.6429 29.7679 22.1877 30 22.7829 30C23.378 30 23.9229 29.7759 24.2749 29.4237C27.5356 28.7593 29.9749 26.0059 29.9749 22.7001C29.9749 22.1718 29.9078 21.6515 29.7904 21.1553C29.9078 21.6515 29.9749 22.1638 29.9749 22.7001V15.1601H30Z"
      fill={color}
    />
  </Svg>
);

const ActivityIcon = ({ color = ICON_COLOR }: { color?: string }) => (
  <Svg width="24" height="24" viewBox="0 0 30 30" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.252 2.68029e-06C11.6311 0.00103178 11.9725 0.29828 12.1169 0.753142L19.9942 25.5711L23.1939 15.3531C23.3375 14.8945 23.681 14.5946 24.0625 14.5946H29.0625C29.5803 14.5946 30 15.1391 30 15.8108C30 16.4825 29.5803 17.027 29.0625 17.027H24.6935L20.8686 29.2415C20.7253 29.6991 20.3829 29.9988 20.0022 30C19.6215 30.0012 19.2781 29.7035 19.1331 29.2469L11.2449 4.39433L7.42788 16.2786C7.28232 16.7318 6.94097 17.027 6.5625 17.027H0.9375C0.419733 17.027 0 16.4825 0 15.8108C0 15.1391 0.419733 14.5946 0.9375 14.5946H5.9375L10.3846 0.748441C10.5305 0.294367 10.8728 -0.00102642 11.252 2.68029e-06Z"
      fill={color}
    />
  </Svg>
);

const UserIcon = ({ color = ICON_COLOR }: { color?: string }) => (
  <Svg width="24" height="24" viewBox="0 0 30 30" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15 3C11.02 3 7.79352 5.68629 7.79352 9C7.79352 12.3137 11.02 15 15 15C18.98 15 22.2065 12.3137 22.2065 9C22.2065 5.68629 18.98 3 15 3ZM21.5597 16.1541C24.1432 14.5095 25.8097 11.9168 25.8097 9C25.8097 4.02944 20.97 0 15 0C9.02995 0 4.19028 4.02944 4.19028 9C4.19028 11.9168 5.8568 14.5095 8.44032 16.1541C6.62884 16.8212 4.96228 17.7654 3.53456 18.9541C2.43209 19.872 1.50468 20.9085 0.770391 22.0277C-0.584639 24.0929 -0.0320352 26.1986 1.49396 27.6876C2.96301 29.121 5.31633 30 7.79352 30H22.2065C24.6837 30 27.037 29.121 28.506 27.6876C30.032 26.1986 30.5846 24.0929 29.2296 22.0277C28.4953 20.9085 27.5679 19.872 26.4654 18.9541C25.0377 17.7654 23.3712 16.8212 21.5597 16.1541ZM15 18C11.6553 18 8.44752 19.1062 6.08243 21.0754C5.22486 21.7894 4.50364 22.5955 3.93257 23.4659C3.37953 24.3088 3.55793 25.0797 4.23497 25.7403C4.96894 26.4564 6.29067 27 7.79352 27H22.2065C23.7093 27 25.0311 26.4564 25.765 25.7403C26.4421 25.0797 26.6205 24.3088 26.0674 23.4659C25.4964 22.5955 24.7751 21.7894 23.9176 21.0754C21.5525 19.1062 18.3447 18 15 18Z"
      fill={color}
    />
  </Svg>
);

interface PodcastScheduleData {
  title: string;
  link?: string;
  description?: string;
}

interface WorkoutScheduleData {
  title: string;
  description: string;
}

export const NavigationContainer: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('one');
  const [entryDetailParams, setEntryDetailParams] = useState<EntryDetailParams | null>(null);
  const [entries, setEntries] = useState<Array<{ id: string; timestamp: Date; notes?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [podcastScheduleData, setPodcastScheduleData] = useState<PodcastScheduleData | null>(null);
  const [workoutScheduleData, setWorkoutScheduleData] = useState<WorkoutScheduleData | null>(null);

  // Load entries from the API on mount
  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const fetchedEntries = await journalApi.getEntries();
      setEntries(fetchedEntries.map(entry => ({
        id: entry.id?.toString() || Date.now().toString(),
        timestamp: entry.timestamp,
        notes: entry.notes || '',
      })));
    } catch (error) {
      console.error('Error loading entries:', error);
      // If API fails, use local data as fallback
      setEntries([
        { id: '1', timestamp: new Date('2025-01-01 14:35:00'), notes: '' },
        { id: '2', timestamp: new Date('2025-01-02 13:35:00'), notes: '' },
        { id: '3', timestamp: new Date('2025-01-05 17:40:00'), notes: '' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToDetail = (entryId: string, timestamp: Date, notes?: string) => {
    setEntryDetailParams({ entryId, timestamp, notes });
    setActivePage('entryDetail');
  };

  const handleSaveEntry = async (entryId: string, notes: string) => {
    try {
      // Update the API
      await journalApi.updateEntry(parseInt(entryId), { notes });

      // Update local state
      setEntries(prevEntries =>
        prevEntries.map(entry =>
          entry.id === entryId ? { ...entry, notes } : entry
        )
      );
    } catch (error) {
      console.error('Error saving entry:', error);
      // Still update local state even if API fails
      setEntries(prevEntries =>
        prevEntries.map(entry =>
          entry.id === entryId ? { ...entry, notes } : entry
        )
      );
    }
  };

  const handleBackFromDetail = () => {
    setActivePage('entries');
  };

  const handleBackFromEntries = () => {
    setActivePage('one');
  };

  const handleAddEntry = async (newEntry: { id: string; timestamp: Date; notes?: string }) => {
    try {
      // Create entry in the API
      const createdEntry = await journalApi.createEntry({
        timestamp: newEntry.timestamp,
        notes: newEntry.notes || '',
      });

      // Update local state with the created entry
      const entry = {
        id: createdEntry.id?.toString() || newEntry.id,
        timestamp: createdEntry.timestamp,
        notes: createdEntry.notes || '',
      };
      setEntries(prev => [entry, ...prev]);
    } catch (error) {
      console.error('Error creating entry:', error);
      // Fall back to local state if API fails
      setEntries(prev => [newEntry, ...prev]);
    }
  };

  const handleNavigateToCalendarWithPodcast = (podcastData: PodcastScheduleData) => {
    setPodcastScheduleData(podcastData);
    setActivePage('two');
  };

  const handleNavigateToCalendarWithWorkout = (workoutData: WorkoutScheduleData) => {
    setWorkoutScheduleData(workoutData);
    setActivePage('two');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'one':
        return <PageOne onNavigateToEntries={() => setActivePage('entries')} />;
      case 'two':
        return <PageTwo podcastScheduleData={podcastScheduleData} workoutScheduleData={workoutScheduleData} onClearPodcastData={() => setPodcastScheduleData(null)} onClearWorkoutData={() => setWorkoutScheduleData(null)} />;
      case 'three':
        return <PageThree onNavigateToCalendar={handleNavigateToCalendarWithPodcast} />;
      case 'four':
        return <WorkoutScreen onNavigateToCalendar={handleNavigateToCalendarWithWorkout} />;
      case 'five':
        return <PageFive />;
      case 'entries':
        return (
          <Entries
            entries={entries}
            onNavigateToDetail={handleNavigateToDetail}
            onAddEntry={handleAddEntry}
            onBack={handleBackFromEntries}
          />
        );
      case 'entryDetail':
        return entryDetailParams ? (
          <EntryDetail
            entryId={entryDetailParams.entryId}
            timestamp={entryDetailParams.timestamp}
            notes={entryDetailParams.notes}
            onSave={handleSaveEntry}
            onBack={handleBackFromDetail}
          />
        ) : null;
    }
  };

  const icons = {
    one: JournalIcon,
    two: CalendarIcon,
    three: HeadphonesIcon,
    four: ActivityIcon,
    five: UserIcon,
  };

  const labels = {
    one: 'Bingo',
    two: 'Calendar',
    three: 'Media',
    four: 'Fitness',
    five: 'Settings',
  };

  const NavButton = ({ page }: { page: Page }) => {
    const Icon = icons[page];
    const isActive = activePage === page;
    const color = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;

    return (
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => setActivePage(page)}
        activeOpacity={0.7}
      >
        <Icon color={color} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderPage()}</View>

      <View style={styles.navbar}>
        <NavButton page="one" />
        <NavButton page="two" />
        <NavButton page="three" />
        <NavButton page="four" />
        <NavButton page="five" />
      </View>

      {/* Global Settings Modal - can be triggered from any page */}
      <SettingsModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  navbar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 62,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderRadius: 24,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  navText: {
    fontSize: 10,
    marginTop: 2,
  },
});
