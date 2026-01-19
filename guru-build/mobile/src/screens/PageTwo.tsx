import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, RefreshControl, Alert, Image, Animated, PanResponder, Modal, Platform } from 'react-native';
import { CalendarApiService, CalendarEvent } from '../services/calendarApi';
import { GoogleAuthService } from '../services/googleAuth';
import { ListItemApiService, ListItemType, ListItem as ApiListItem } from '../services/listItemApi';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import { usePreferencesStore } from '../store/usePreferencesStore';

interface Task {
  id: string;
  title: string;
  priority: 1 | 2 | 3 | 4 | 5;
  dueDate: string;
  duration: number; // in minutes
  status: 'pending' | 'scheduled' | 'completed';
  calendarEventId?: string;
  startTime?: Date;
  endTime?: Date;
}

interface ListItem {
  id: string;
  text: string;
  completed: boolean;
  calendar_event_id?: string;
}

const PRIORITY_COLORS = {
  1: '#FF3B30', // High - Red
  2: '#FF9500', // Medium-High - Orange
  3: '#FFCC00', // Medium - Yellow
  4: '#34C759', // Low-Medium - Green
  5: '#007AFF', // Low - Blue
};

const PRIORITY_LABELS = {
  1: 'Urgent',
  2: 'High',
  3: 'Medium',
  4: 'Low',
  5: 'Optional',
};

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

const CalendarIcon = ({ color = '#4D5AEE' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ClockIcon = ({ color = '#4D5AEE' }: { color?: string }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 6V12L16 14"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TrashIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
);

const EditIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);

const TrashIconSmall = ({ color = '#999' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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

interface PageTwoProps {
  podcastScheduleData?: PodcastScheduleData | null;
  workoutScheduleData?: WorkoutScheduleData | null;
  onClearPodcastData?: () => void;
  onClearWorkoutData?: () => void;
}

// Swipeable List Item Component
interface SwipeableListItemProps {
  children: React.ReactNode;
  onDelete: () => void;
}

const SwipeableListItem: React.FC<SwipeableListItemProps> = ({ children, onDelete }) => {
  const pan = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes (left swipe)
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow left swipe (negative dx)
        if (gestureState.dx < 0) {
          pan.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -100) {
          // Swipe threshold reached - delete
          Animated.timing(pan, {
            toValue: -300,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onDelete();
          });
        } else {
          // Snap back
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.swipeableContainer}>
      <View style={styles.deleteBackground}>
        <TrashIcon />
      </View>
      <Animated.View
        style={[
          styles.swipeableContent,
          {
            transform: [{ translateX: pan }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

export const PageTwo: React.FC<PageTwoProps> = ({ podcastScheduleData, workoutScheduleData, onClearPodcastData, onClearWorkoutData }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { toggleSettingsModal } = usePreferencesStore();

  // Weekly goals and to-do list state
  const [weeklyGoals, setWeeklyGoals] = useState<ListItem[]>([]);
  const [todoItems, setTodoItems] = useState<ListItem[]>([]);
  const [newWeeklyGoal, setNewWeeklyGoal] = useState('');
  const [newTodoItem, setNewTodoItem] = useState('');
  const [isAddingWeeklyGoal, setIsAddingWeeklyGoal] = useState(false);
  const [isAddingTodoItem, setIsAddingTodoItem] = useState(false);

  // Editing state
  const [editingWeeklyGoalId, setEditingWeeklyGoalId] = useState<string | null>(null);
  const [editingWeeklyGoalText, setEditingWeeklyGoalText] = useState('');
  const [editingTodoItemId, setEditingTodoItemId] = useState<string | null>(null);
  const [editingTodoItemText, setEditingTodoItemText] = useState('');

  // Schedule event popup state
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [selectedGoalForSchedule, setSelectedGoalForSchedule] = useState<ListItem | null>(null);
  const [activeListType, setActiveListType] = useState<'weekly' | 'todo'>('weekly');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventReminder, setEventReminder] = useState('30 minutes before');
  const [eventImportance, setEventImportance] = useState<'High' | 'Medium' | 'Low' | null>(null);
  const [eventDescription, setEventDescription] = useState('');
  const [eventGuests, setEventGuests] = useState('');
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Date/Time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showDeadlineDatePicker, setShowDeadlineDatePicker] = useState(false);
  const [showDeadlineTimePicker, setShowDeadlineTimePicker] = useState(false);
  const [eventDateObj, setEventDateObj] = useState(new Date());
  const [eventStartTimeObj, setEventStartTimeObj] = useState(new Date());
  const [eventEndTimeObj, setEventEndTimeObj] = useState(new Date());
  const [deadlineDateObj, setDeadlineDateObj] = useState(new Date());
  const [deadlineTimeObj, setDeadlineTimeObj] = useState(new Date());

  // Check authentication on mount
  useEffect(() => {
    initializeScreen();
  }, []);

  // Handle podcast scheduling data from PageThree
  useEffect(() => {
    const handlePodcastScheduling = async () => {
      if (podcastScheduleData && isAuthenticated) {
        try {
          // Create a new todo item with the podcast title
          const newItem = await ListItemApiService.createListItem({
            text: podcastScheduleData.title,
            completed: false,
            item_type: ListItemType.TODO,
          });

          const todoItem: ListItem = {
            id: newItem.id,
            text: newItem.text,
            completed: newItem.completed,
            calendar_event_id: newItem.calendar_event_id,
          };

          // Add to todo items
          setTodoItems([...todoItems, todoItem]);

          // Open schedule popup with podcast data
          setSelectedGoalForSchedule(todoItem);
          setActiveListType('todo');
          setEditingEventId(null);

          // Set default times (current time + 1 hour)
          const now = new Date();
          const startTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 hour from start

          // Pre-fill the form with podcast data
          setEventTitle(podcastScheduleData.title);
          setEventDate(now.toISOString().split('T')[0]);
          setEventStartTime(startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', ''));
          setEventEndTime(endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', ''));
          setEventLocation('');
          setEventImportance(null);
          setEventDescription(podcastScheduleData.description || '');
          setEventReminder('30 minutes before');
          setEventGuests('');
          setHasDeadline(false);
          setDeadlineDate('');
          setDeadlineTime('');

          // Set Date objects for pickers
          setEventDateObj(now);
          setEventStartTimeObj(startTime);
          setEventEndTimeObj(endTime);
          setDeadlineDateObj(new Date());
          setDeadlineTimeObj(new Date());

          // Show the schedule popup
          setShowSchedulePopup(true);

          // Clear the podcast data after processing
          if (onClearPodcastData) {
            onClearPodcastData();
          }
        } catch (error) {
          console.error('Error creating podcast todo item:', error);
          Alert.alert('Error', 'Failed to create podcast item. Please try again.');

          // Still clear the data even on error
          if (onClearPodcastData) {
            onClearPodcastData();
          }
        }
      }
    };

    handlePodcastScheduling();
  }, [podcastScheduleData, isAuthenticated]);

  // Handle workout scheduling data from WorkoutScreen
  useEffect(() => {
    const handleWorkoutScheduling = async () => {
      if (workoutScheduleData && isAuthenticated) {
        try {
          // Create a new weekly goal with the workout title
          const newGoal = await ListItemApiService.createListItem({
            text: workoutScheduleData.title,
            completed: false,
            item_type: ListItemType.WEEKLY_GOAL,
          });

          const weeklyGoalItem: ListItem = {
            id: newGoal.id,
            text: newGoal.text,
            completed: newGoal.completed,
            calendar_event_id: newGoal.calendar_event_id,
          };

          // Add to weekly goals
          setWeeklyGoals([...weeklyGoals, weeklyGoalItem]);

          // Open schedule popup with workout data
          setSelectedGoalForSchedule(weeklyGoalItem);
          setActiveListType('weekly');
          setEditingEventId(null);

          // Set default times (current time + 1 hour)
          const now = new Date();
          const startTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 hour from start

          // Pre-fill the form with workout data
          setEventTitle(workoutScheduleData.title);
          setEventDate(now.toISOString().split('T')[0]);
          setEventStartTime(startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', ''));
          setEventEndTime(endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', ''));
          setEventLocation('');
          setEventImportance(null);
          setEventDescription(workoutScheduleData.description || '');
          setEventReminder('30 minutes before');
          setEventGuests('');
          setHasDeadline(false);
          setDeadlineDate('');
          setDeadlineTime('');

          // Set Date objects for pickers
          setEventDateObj(now);
          setEventStartTimeObj(startTime);
          setEventEndTimeObj(endTime);
          setDeadlineDateObj(new Date());
          setDeadlineTimeObj(new Date());

          // Show the schedule popup
          setShowSchedulePopup(true);

          // Clear the workout data after processing
          if (onClearWorkoutData) {
            onClearWorkoutData();
          }
        } catch (error) {
          console.error('Error creating workout goal item:', error);
          Alert.alert('Error', 'Failed to create workout item. Please try again.');

          // Still clear the data even on error
          if (onClearWorkoutData) {
            onClearWorkoutData();
          }
        }
      }
    };

    handleWorkoutScheduling();
  }, [workoutScheduleData, isAuthenticated]);

  const initializeScreen = async () => {
    try {
      const user = await GoogleAuthService.getStoredUser();
      setIsAuthenticated(!!user);

      if (!user) {
        Alert.alert(
          'Google Calendar Not Connected',
          'Please sign in with Google to sync your calendar and tasks.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Load all data
      await Promise.all([
        loadCalendarEvents(),
        loadWeeklyGoals(),
        loadTodoItems(),
      ]);
    } catch (error) {
      console.error('Error initializing screen:', error);
    }
  };

  const loadWeeklyGoals = async () => {
    try {
      const goals = await ListItemApiService.getWeeklyGoals();
      setWeeklyGoals(goals.map(goal => ({
        id: goal.id,
        text: goal.text,
        completed: goal.completed,
        calendar_event_id: goal.calendar_event_id,
      })));
    } catch (error) {
      console.error('Error loading weekly goals:', error);
    }
  };

  const loadTodoItems = async () => {
    try {
      const items = await ListItemApiService.getTodos();
      setTodoItems(items.map(item => ({
        id: item.id,
        text: item.text,
        completed: item.completed,
        calendar_event_id: item.calendar_event_id,
      })));
    } catch (error) {
      console.error('Error loading todo items:', error);
    }
  };

  const checkAuthentication = async () => {
    try {
      const user = await GoogleAuthService.getStoredUser();
      setIsAuthenticated(!!user);

      if (!user) {
        Alert.alert(
          'Google Calendar Not Connected',
          'Please sign in with Google to sync your calendar and tasks.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      setLoading(true);

      // Fetch events for the current month
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const events = await CalendarApiService.getCalendarEvents(startOfMonth, endOfMonth);
      setCalendarEvents(events);

      // Convert calendar events to tasks
      const tasksFromCalendar: Task[] = events
        .filter(event => event.description?.includes('Task:') || event.summary.startsWith('[Task]'))
        .map(event => ({
          id: event.id!,
          title: event.summary.replace('[Task] ', ''),
          priority: 3,
          dueDate: new Date(event.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          duration: Math.round((new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60000),
          status: new Date(event.end_time) < new Date() ? 'completed' : 'scheduled',
          calendarEventId: event.id,
          startTime: new Date(event.start_time),
          endTime: new Date(event.end_time),
        }));

      setTasks(tasksFromCalendar);
    } catch (error) {
      console.error('Error loading calendar events:', error);
      Alert.alert('Error', 'Failed to load calendar events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadCalendarEvents(),
      loadWeeklyGoals(),
      loadTodoItems(),
    ]);
    setRefreshing(false);
  };

  const toggleTaskStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      if (task.status === 'completed') {
        // Uncomplete task - remove from calendar
        if (task.calendarEventId) {
          await CalendarApiService.deleteCalendarEvent(task.calendarEventId);
        }
        setTasks(tasks.map(t =>
          t.id === id ? { ...t, status: 'pending', calendarEventId: undefined } : t
        ));
      } else {
        // Complete task - mark it as done
        setTasks(tasks.map(t =>
          t.id === id ? { ...t, status: 'completed' } : t
        ));
      }
    } catch (error) {
      console.error('Error toggling task status:', error);
      Alert.alert('Error', 'Failed to update task status.');
    }
  };

  const scheduleTaskToCalendar = async (task: Task) => {
    if (!isAuthenticated) {
      Alert.alert('Not Authenticated', 'Please sign in with Google to schedule tasks.');
      return;
    }

    try {
      // Schedule task for next available hour
      const now = new Date();
      const startTime = new Date(now);
      startTime.setHours(startTime.getHours() + 1);
      startTime.setMinutes(0);
      startTime.setSeconds(0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + task.duration);

      const event = await CalendarApiService.createCalendarEvent({
        summary: `[Task] ${task.title}`,
        description: `Task: ${task.title}\nPriority: ${PRIORITY_LABELS[task.priority]}\nDuration: ${task.duration} minutes`,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      });

      // Update task with calendar event ID
      setTasks(tasks.map(t =>
        t.id === task.id
          ? { ...t, status: 'scheduled', calendarEventId: event.id, startTime, endTime }
          : t
      ));

      Alert.alert('Success', `Task scheduled to your calendar at ${startTime.toLocaleTimeString()}`);
    } catch (error) {
      console.error('Error scheduling task:', error);
      Alert.alert('Error', 'Failed to schedule task to calendar.');
    }
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      priority: 3,
      dueDate: 'Today',
      duration: 30,
      status: 'pending',
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');

    // Optionally auto-schedule new tasks
    // await scheduleTaskToCalendar(newTask);
  };

  const renderTask = (task: Task) => (
    <View key={task.id} style={styles.taskCard}>
      <TouchableOpacity
        style={[task.status === 'completed' && styles.taskCompleted]}
        onPress={() => toggleTaskStatus(task.id)}
        activeOpacity={0.7}
      >
        <View style={styles.taskHeader}>
          <View style={styles.taskInfo}>
            <Text style={[styles.taskTitle, task.status === 'completed' && styles.taskTitleCompleted]}>
              {task.title}
            </Text>
            <View style={styles.taskMeta}>
              <Text style={styles.taskDuration}>⏱️ {task.duration}m</Text>
              <Text style={styles.taskDueDate}>📅 {task.dueDate}</Text>
              {task.startTime && (
                <Text style={styles.taskScheduledTime}>
                  🕐 {task.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </Text>
              )}
            </View>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[task.priority] }]}>
            <Text style={styles.priorityText}>{PRIORITY_LABELS[task.priority]}</Text>
          </View>
        </View>
        {task.status === 'completed' && (
          <View style={styles.completedOverlay}>
            <Text style={styles.completedText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>

      {task.status === 'pending' && (
        <TouchableOpacity
          style={styles.scheduleButton}
          onPress={() => scheduleTaskToCalendar(task)}
        >
          <Text style={styles.scheduleButtonText}>📅 Schedule to Calendar</Text>
        </TouchableOpacity>
      )}

      {task.status === 'scheduled' && task.calendarEventId && (
        <View style={styles.scheduledBadge}>
          <Text style={styles.scheduledBadgeText}>✓ Scheduled in Calendar</Text>
        </View>
      )}
    </View>
  );

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const scheduledTasks = tasks.filter(t => t.status === 'scheduled');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  // Get all calendar events that are not tasks
  const nonTaskEvents = calendarEvents.filter(
    event => !event.description?.includes('Task:') && !event.summary.startsWith('[Task]')
  );

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentMonth(newDate);
  };

  // Re-fetch events when month changes
  useEffect(() => {
    if (isAuthenticated) {
      loadCalendarEvents();
    }
  }, [currentMonth]);

  const renderCalendarDay = (date: Date | null, index: number) => {
    if (!date) {
      return <View key={`empty-${index}`} style={styles.calendarDay} />;
    }

    const eventsOnDay = getEventsForDate(date);
    const isToday = date.toDateString() === new Date().toDateString();
    const isSelected = selectedDate?.toDateString() === date.toDateString();

    return (
      <TouchableOpacity
        key={date.toISOString()}
        style={[
          styles.calendarDay,
          isToday && styles.calendarDayToday,
          isSelected && styles.calendarDaySelected,
        ]}
        onPress={() => setSelectedDate(date)}
      >
        <Text style={[
          styles.calendarDayText,
          isToday && styles.calendarDayTextToday,
          isSelected && styles.calendarDayTextSelected,
        ]}>
          {date.getDate()}
        </Text>
        {eventsOnDay.length > 0 && (
          <View style={styles.eventDots}>
            {eventsOnDay.slice(0, 3).map((_, i) => (
              <View key={i} style={styles.eventDot} />
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const deleteCalendarEvent = async (eventId: string) => {
    try {
      await CalendarApiService.deleteCalendarEvent(eventId);

      // Find and DELETE any weekly goals or todo items that reference this event
      const associatedGoal = weeklyGoals.find(goal => goal.calendar_event_id === eventId);
      const associatedTodo = todoItems.find(item => item.calendar_event_id === eventId);

      if (associatedGoal) {
        // Delete the weekly goal from backend and state
        await ListItemApiService.deleteListItem(associatedGoal.id);
        setWeeklyGoals(weeklyGoals.filter(goal => goal.id !== associatedGoal.id));
        console.log(`Deleted weekly goal "${associatedGoal.text}" associated with calendar event`);
      }

      if (associatedTodo) {
        // Delete the todo item from backend and state
        await ListItemApiService.deleteListItem(associatedTodo.id);
        setTodoItems(todoItems.filter(item => item.id !== associatedTodo.id));
        console.log(`Deleted todo item "${associatedTodo.text}" associated with calendar event`);
      }

      // Refresh calendar events
      await loadCalendarEvents();

      const deletedItemName = associatedGoal?.text || associatedTodo?.text;
      if (deletedItemName) {
        Alert.alert('Success', `Calendar event and "${deletedItemName}" deleted`);
      } else {
        Alert.alert('Success', 'Calendar event deleted');
      }
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      Alert.alert('Error', 'Failed to delete calendar event');
    }
  };



  // Weekly goals handlers
  const addWeeklyGoal = async () => {
    if (newWeeklyGoal.trim()) {
      try {
        const newGoal = await ListItemApiService.createListItem({
          text: newWeeklyGoal,
          completed: false,
          item_type: ListItemType.WEEKLY_GOAL,
        });
        setWeeklyGoals([...weeklyGoals, {
          id: newGoal.id,
          text: newGoal.text,
          completed: newGoal.completed,
          calendar_event_id: newGoal.calendar_event_id,
        }]);
        setNewWeeklyGoal('');
        setIsAddingWeeklyGoal(false);
      } catch (error) {
        console.error('Error adding weekly goal:', error);
        Alert.alert('Error', 'Failed to add weekly goal. Please try again.');
      }
    }
  };

  const openSchedulePopup = async (goal: ListItem, type: 'weekly' | 'todo') => {
    setSelectedGoalForSchedule(goal);
    setActiveListType(type);

    // Default to null, will be set if we find an ID
    setEditingEventId(null);

    // If there's an existing calendar event, load its data
    if (goal.calendar_event_id) {
      // Important: Set the editing ID immediately so we update instead of create
      setEditingEventId(goal.calendar_event_id);

      try {
        // Fetch the calendar event to get its details
        const events = await CalendarApiService.getCalendarEvents();
        const existingEvent = events.find(e => e.id === goal.calendar_event_id);

        if (existingEvent) {
          const startDate = new Date(existingEvent.start_time);
          const endDate = new Date(existingEvent.end_time);

          // Prefill with existing event data
          setEventTitle(existingEvent.summary);
          setEventDate(startDate.toISOString().split('T')[0]);
          setEventStartTime(startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', ''));
          setEventEndTime(endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', ''));
          setEventLocation(existingEvent.location || '');
          setEventDescription(existingEvent.description || '');

          // Set Date objects for pickers
          setEventDateObj(startDate);
          setEventStartTimeObj(startDate);
          setEventEndTimeObj(endDate);

          // Parse importance from description or color
          if (existingEvent.color_id === '11') {
            setEventImportance('High');
          } else if (existingEvent.color_id === '6') {
            setEventImportance('Medium');
          } else if (existingEvent.color_id === '10') {
            setEventImportance('Low');
          } else {
            setEventImportance(null);
          }

          // Set hasDeadline based on whether event has an end time
          setHasDeadline(!!existingEvent.end_time);
        }
      } catch (error) {
        console.error('Error loading event details:', error);
        // Set defaults if we can't load the event - use current time + 1 hour
        const now = new Date();
        const startTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 hour from start

        setEventTitle(goal.text);
        setEventDate(now.toISOString().split('T')[0]);
        setEventStartTime(startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', ''));
        setEventEndTime(endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', ''));
        setEventLocation('');
        setEventImportance(null);
        setEventDescription('');
        setHasDeadline(false);
        setDeadlineDate('');
        setDeadlineTime('');

        // Set Date objects for pickers
        setEventDateObj(now);
        setEventStartTimeObj(startTime);
        setEventEndTimeObj(endTime);
        setDeadlineDateObj(new Date());
        setDeadlineTimeObj(new Date());
      }
    } else {
      // Set defaults for NEW event - current time + 1 hour
      const now = new Date();
      const startTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 hour from start

      setEventTitle(goal.text);
      setEventDate(now.toISOString().split('T')[0]);
      setEventStartTime(startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', ''));
      setEventEndTime(endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', ''));
      setEventLocation('');
      setEventImportance(null);
      setEventDescription('');
      setHasDeadline(false);
      setDeadlineDate('');
      setDeadlineTime('');

      // Set Date objects for pickers
      setEventDateObj(now);
      setEventStartTimeObj(startTime);
      setEventEndTimeObj(endTime);
      setDeadlineDateObj(new Date());
      setDeadlineTimeObj(new Date());
    }

    setEventReminder('30 minutes before');
    setEventGuests('');
    setShowSchedulePopup(true);
  };

  const toggleWeeklyGoal = async (id: string) => {
    const goal = weeklyGoals.find(g => g.id === id);
    if (!goal) return;

    // Only toggle completion, don't open schedule popup
    try {
      if (goal.completed) {
        // If unchecking, delete the calendar event and mark as incomplete
        if (goal.calendar_event_id) {
          try {
            await CalendarApiService.deleteCalendarEvent(goal.calendar_event_id);
          } catch (calendarError) {
            // If the calendar event was already deleted, that's fine
            console.log('Calendar event already deleted or not found:', calendarError);
          }
        }

        setWeeklyGoals(weeklyGoals.map(g =>
          g.id === id ? { ...g, completed: false, calendar_event_id: undefined } : g
        ));

        await ListItemApiService.updateListItem(id, {
          completed: false,
          calendar_event_id: undefined,
        });
      } else {
        // If checking, just mark as complete (no calendar event required)
        setWeeklyGoals(weeklyGoals.map(g =>
          g.id === id ? { ...g, completed: true } : g
        ));

        await ListItemApiService.updateListItem(id, {
          completed: true,
        });
      }
    } catch (error) {
      console.error('Error toggling weekly goal:', error);
      setWeeklyGoals(weeklyGoals.map(g =>
        g.id === id ? { ...g, completed: goal.completed } : g
      ));
      Alert.alert('Error', 'Failed to update weekly goal. Please try again.');
    }
  };

  const deleteWeeklyGoal = async (id: string) => {
    try {
      const goal = weeklyGoals.find(g => g.id === id);
      if (goal?.calendar_event_id) {
        try {
          await CalendarApiService.deleteCalendarEvent(goal.calendar_event_id);
        } catch (calendarError) {
          // If the calendar event was already deleted (410/404), that's fine
          // Just log it and continue with deleting the weekly goal
          console.log('Calendar event already deleted or not found:', calendarError);
        }
      }

      // Optimistic delete
      setWeeklyGoals(weeklyGoals.filter(goal => goal.id !== id));
      await ListItemApiService.deleteListItem(id);

      // Refresh calendar events if we deleted one
      if (goal?.calendar_event_id) {
        await loadCalendarEvents();
      }
    } catch (error) {
      console.error('Error deleting weekly goal:', error);
      // Reload on error
      await loadWeeklyGoals();
      Alert.alert('Error', 'Failed to delete weekly goal. Please try again.');
    }
  };

  const deleteAllWeeklyGoals = async () => {
    if (weeklyGoals.length === 0) return;

    Alert.alert(
      'Delete All Weekly Goals',
      'Are you sure you want to delete all weekly goals? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              const goalsToDelete = [...weeklyGoals];
              setWeeklyGoals([]);

              for (const goal of goalsToDelete) {
                if (goal.calendar_event_id) {
                  try {
                    await CalendarApiService.deleteCalendarEvent(goal.calendar_event_id);
                  } catch (calendarError) {
                    console.log('Calendar event already deleted or not found:', calendarError);
                  }
                }
                await ListItemApiService.deleteListItem(goal.id);
              }

              await loadCalendarEvents();
            } catch (error) {
              console.error('Error deleting all weekly goals:', error);
              await loadWeeklyGoals();
              Alert.alert('Error', 'Failed to delete all weekly goals. Please try again.');
            }
          },
        },
      ]
    );
  };

  const startEditingWeeklyGoal = (goal: ListItem) => {
    setEditingWeeklyGoalId(goal.id);
    setEditingWeeklyGoalText(goal.text);
  };

  const saveWeeklyGoal = async () => {
    if (editingWeeklyGoalId && editingWeeklyGoalText.trim()) {
      try {
        const goal = weeklyGoals.find(g => g.id === editingWeeklyGoalId);

        // Update the list item text
        await ListItemApiService.updateListItem(editingWeeklyGoalId, {
          text: editingWeeklyGoalText,
        });

        // If there's an associated calendar event, update its title too
        if (goal?.calendar_event_id) {
          try {
            await CalendarApiService.updateCalendarEvent(goal.calendar_event_id, {
              summary: editingWeeklyGoalText,
            });
          } catch (calendarError) {
            console.error('Error updating calendar event title:', calendarError);
            // Continue even if calendar update fails - at least the goal text is updated
          }
        }

        setWeeklyGoals(weeklyGoals.map(g =>
          g.id === editingWeeklyGoalId ? { ...g, text: editingWeeklyGoalText } : g
        ));
        setEditingWeeklyGoalId(null);
        setEditingWeeklyGoalText('');

        // Refresh calendar events to show the updated title
        if (goal?.calendar_event_id) {
          await loadCalendarEvents();
        }
      } catch (error) {
        console.error('Error updating weekly goal:', error);
        Alert.alert('Error', 'Failed to update weekly goal. Please try again.');
      }
    } else {
      setEditingWeeklyGoalId(null);
    }
  };

  // To-do list handlers
  const addTodoItem = async () => {
    if (newTodoItem.trim()) {
      try {
        const newItem = await ListItemApiService.createListItem({
          text: newTodoItem,
          completed: false,
          item_type: ListItemType.TODO,
        });
        setTodoItems([...todoItems, {
          id: newItem.id,
          text: newItem.text,
          completed: newItem.completed,
          calendar_event_id: newItem.calendar_event_id,
        }]);
        setNewTodoItem('');
        setIsAddingTodoItem(false);
      } catch (error) {
        console.error('Error adding todo item:', error);
        Alert.alert('Error', 'Failed to add to-do item. Please try again.');
      }
    }
  };

  const toggleTodoItem = async (id: string) => {
    const item = todoItems.find(i => i.id === id);
    if (!item) return;

    try {
      if (item.completed) {
        // If unchecking, delete the calendar event and mark as incomplete
        if (item.calendar_event_id) {
          try {
            await CalendarApiService.deleteCalendarEvent(item.calendar_event_id);
          } catch (calendarError) {
            // If the calendar event was already deleted, that's fine
            console.log('Calendar event already deleted or not found:', calendarError);
          }
        }

        setTodoItems(todoItems.map(i =>
          i.id === id ? { ...i, completed: false, calendar_event_id: undefined } : i
        ));

        await ListItemApiService.updateListItem(id, {
          completed: false,
          calendar_event_id: undefined,
        });
      } else {
        // If checking, just mark as complete
        setTodoItems(todoItems.map(i =>
          i.id === id ? { ...i, completed: true } : i
        ));

        await ListItemApiService.updateListItem(id, {
          completed: true,
        });
      }
    } catch (error) {
      console.error('Error toggling todo item:', error);
      // Revert on error
      setTodoItems(todoItems.map(i =>
        i.id === id ? { ...i, completed: item.completed } : i
      ));
      Alert.alert('Error', 'Failed to update to-do item. Please try again.');
    }
  };

  const deleteTodoItem = async (id: string) => {
    try {
      const item = todoItems.find(i => i.id === id);
      if (item?.calendar_event_id) {
        try {
          await CalendarApiService.deleteCalendarEvent(item.calendar_event_id);
        } catch (calendarError) {
          // If the calendar event was already deleted (410/404), that's fine
          // Just log it and continue with deleting the todo item
          console.log('Calendar event already deleted or not found:', calendarError);
        }
      }

      // Optimistic delete
      setTodoItems(todoItems.filter(item => item.id !== id));
      await ListItemApiService.deleteListItem(id);

      // Refresh calendar events if we deleted one
      if (item?.calendar_event_id) {
        await loadCalendarEvents();
      }
    } catch (error) {
      console.error('Error deleting todo item:', error);
      // Reload on error
      await loadTodoItems();
      Alert.alert('Error', 'Failed to delete to-do item. Please try again.');
    }
  };

  const deleteAllTodoItems = async () => {
    if (todoItems.length === 0) return;

    Alert.alert(
      'Delete All To-Do Items',
      'Are you sure you want to delete all to-do items? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              const itemsToDelete = [...todoItems];
              setTodoItems([]);

              for (const item of itemsToDelete) {
                if (item.calendar_event_id) {
                  try {
                    await CalendarApiService.deleteCalendarEvent(item.calendar_event_id);
                  } catch (calendarError) {
                    console.log('Calendar event already deleted or not found:', calendarError);
                  }
                }
                await ListItemApiService.deleteListItem(item.id);
              }

              await loadCalendarEvents();
            } catch (error) {
              console.error('Error deleting all todo items:', error);
              await loadTodoItems();
              Alert.alert('Error', 'Failed to delete all to-do items. Please try again.');
            }
          },
        },
      ]
    );
  };

  const startEditingTodoItem = (item: ListItem) => {
    setEditingTodoItemId(item.id);
    setEditingTodoItemText(item.text);
  };

  const saveTodoItem = async () => {
    if (editingTodoItemId && editingTodoItemText.trim()) {
      try {
        const item = todoItems.find(i => i.id === editingTodoItemId);

        await ListItemApiService.updateListItem(editingTodoItemId, {
          text: editingTodoItemText,
        });

        // If there's an associated calendar event, update its title too
        if (item?.calendar_event_id) {
          try {
            await CalendarApiService.updateCalendarEvent(item.calendar_event_id, {
              summary: editingTodoItemText,
            });
          } catch (calendarError) {
            console.error('Error updating calendar event title:', calendarError);
          }
        }

        setTodoItems(todoItems.map(item =>
          item.id === editingTodoItemId ? { ...item, text: editingTodoItemText } : item
        ));
        setEditingTodoItemId(null);
        setEditingTodoItemText('');
        
        // Refresh calendar events to show the updated title
        if (item?.calendar_event_id) {
          await loadCalendarEvents();
        }
      } catch (error) {
        console.error('Error updating todo item:', error);
        Alert.alert('Error', 'Failed to update to-do item. Please try again.');
      }
    } else {
      setEditingTodoItemId(null);
    }
  };

  // Date/Time picker handlers
  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (date) {
      setEventDateObj(date);
      setEventDate(date.toISOString().split('T')[0]);
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
      }
    }
  };

  const handleStartTimeChange = (event: any, time?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
    if (event.type === 'dismissed') {
      setShowStartTimePicker(false);
      return;
    }
    if (time) {
      setEventStartTimeObj(time);
      setEventStartTime(time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).toLowerCase().replace(' ', ''));
      if (Platform.OS === 'android') {
        setShowStartTimePicker(false);
      }
    }
  };

  const handleEndTimeChange = (event: any, time?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    if (event.type === 'dismissed') {
      setShowEndTimePicker(false);
      return;
    }
    if (time) {
      setEventEndTimeObj(time);
      setEventEndTime(time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).toLowerCase().replace(' ', ''));
      if (Platform.OS === 'android') {
        setShowEndTimePicker(false);
      }
    }
  };

  const handleDeadlineDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDeadlineDatePicker(false);
    }
    if (event.type === 'dismissed') {
      setShowDeadlineDatePicker(false);
      return;
    }
    if (date) {
      setDeadlineDateObj(date);
      setDeadlineDate(date.toISOString().split('T')[0]);
    }
  };

  const handleDeadlineTimeChange = (event: any, time?: Date) => {
    if (Platform.OS === 'android') {
      setShowDeadlineTimePicker(false);
    }
    if (event.type === 'dismissed') {
      setShowDeadlineTimePicker(false);
      return;
    }
    if (time) {
      setDeadlineTimeObj(time);
      setDeadlineTime(time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).toLowerCase().replace(' ', ''));
      if (Platform.OS === 'android') {
        setShowDeadlineTimePicker(false);
      }
    }
  };

  const scheduleEventToCalendar = async () => {
    // Check authentication first
    if (!isAuthenticated) {
      Alert.alert('Error', 'Please sign in with Google Calendar to schedule events.');
      return;
    }

    // When editing an existing event, we don't need selectedGoalForSchedule
    // But when creating a new event from a goal/todo, we do need it
    if (!editingEventId && !selectedGoalForSchedule) {
      Alert.alert('Error', 'Please select a goal or todo item to schedule.');
      return;
    }

    try {
      // Parse date and time strings to create Date objects
      if (!eventDate) {
        Alert.alert('Error', 'Please enter a date');
        return;
      }

      const parseTime = (timeStr: string, dateStr: string) => {
        // Remove whitespace and match 12-hour format with optional space before AM/PM
        const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
        if (!match) return null;

        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[3].toLowerCase();

        if (period === 'pm' && hours !== 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;

        // Create date object from YYYY-MM-DD string
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month is 0-indexed
        date.setHours(hours, minutes, 0, 0);
        return date;
      };

      const startTime = parseTime(eventStartTime, eventDate);
      let endTime = parseTime(eventEndTime, eventDate);

      if (!startTime || !endTime) {
        Alert.alert('Error', 'Please enter valid time format (e.g., 1:30pm)');
        return;
      }

      // If end time is before or equal to start time, assume it's the next day
      if (endTime <= startTime) {
        endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours
        console.log('End time adjusted to next day:', endTime.toISOString());
      }

      console.log('Event times:', {
        eventDate,
        eventStartTime,
        eventEndTime,
        startTimeISO: startTime.toISOString(),
        endTimeISO: endTime.toISOString(),
      });

      // Build description
      // User requested to NOT include Importance/Reminder in the text description
      const fullDescription = eventDescription;

      // Map importance to Google Calendar color IDs
      // Google Calendar color IDs: 11=red, 6=orange, 10=green
      const colorMap: Record<string, string> = {
        'High': '11',    // Red
        'Medium': '6',   // Orange
        'Low': '10',     // Green
      };
      const colorId = eventImportance ? colorMap[eventImportance] : undefined;

      let calendarEventId: string;

      if (editingEventId) {
        // Update existing calendar event
        const updatedEvent = await CalendarApiService.updateCalendarEvent(editingEventId, {
          summary: eventTitle,
          description: fullDescription || undefined,
          location: eventLocation || undefined,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          color_id: colorId,
        });
        calendarEventId = updatedEvent.id!;
      } else {
        // Create new calendar event
        const newEvent = await CalendarApiService.createCalendarEvent({
          summary: eventTitle,
          description: fullDescription || undefined,
          location: eventLocation || undefined,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          color_id: colorId,
        });
        calendarEventId = newEvent.id!;
      }

      // Only update the list item if we have a selectedGoalForSchedule (creating from goal/todo)
      // When editing an existing calendar event directly, there's no associated list item
      if (selectedGoalForSchedule) {
        // Save the calendar event ID to the list item and update text if changed
        const updateData: any = {
          calendar_event_id: calendarEventId,
        };

        // If title changed, update the list item text as well
        if (selectedGoalForSchedule.text !== eventTitle) {
          updateData.text = eventTitle;
        }

        await ListItemApiService.updateListItem(selectedGoalForSchedule.id, updateData);

        // Update local state based on activeListType
        if (activeListType === 'weekly') {
          setWeeklyGoals(weeklyGoals.map(g =>
            g.id === selectedGoalForSchedule.id
              ? { ...g, calendar_event_id: calendarEventId, text: eventTitle }
              : g
          ));
        } else {
          setTodoItems(todoItems.map(i =>
            i.id === selectedGoalForSchedule.id
              ? { ...i, calendar_event_id: calendarEventId, text: eventTitle }
              : i
          ));
        }
      }

      // Close popup
      setShowSchedulePopup(false);
      setSelectedGoalForSchedule(null);
      setEditingEventId(null);

      Alert.alert('Success', editingEventId ? 'Event updated in Google Calendar!' : 'Event scheduled to Google Calendar!');

      // Refresh calendar events
      await loadCalendarEvents();
    } catch (error) {
      console.error('Error scheduling event:', error);
      Alert.alert('Error', 'Failed to schedule event. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Loading your calendar...</Text>
      </View>
    );
  }

  const days = getDaysInMonth(currentMonth);
  const selectedDayEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // Google Calendar Color ID to Hex mapping
  const GOOGLE_CALENDAR_COLORS: Record<string, string> = {
    '11': '#FF3B30', // Red (High)
    '6': '#FF9500',  // Orange (Medium)
    '10': '#34C759', // Green (Low)
    // Add defaults or others if needed
    'default': '#4285F4' // Blue
  };

  const handleEventClick = (event: CalendarEvent) => {
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);

    // Pre-fill the form with event data
    setEventTitle(event.summary || '');
    setEventDate(startDate.toISOString().split('T')[0]);
    setEventStartTime(startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', ''));
    setEventEndTime(endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', ''));
    setEventLocation(event.location || '');
    setEventDescription(event.description || '');
    setEventGuests(event.attendees?.map(a => a.email).join(', ') || '');

    // Set date/time objects for pickers
    setEventDateObj(startDate);
    setEventStartTimeObj(startDate);
    setEventEndTimeObj(endDate);

    // Determine importance based on color_id
    let importance: 'High' | 'Medium' | 'Low' | null = null;
    if (event.color_id === '11') importance = 'High'; // Red
    else if (event.color_id === '5') importance = 'Medium'; // Yellow
    else if (event.color_id === '10') importance = 'Low'; // Green
    setEventImportance(importance);

    // Set editing mode
    setEditingEventId(event.id || null);

    // Determine which list type (weekly or todo) - default to weekly
    setActiveListType('weekly');
    setSelectedGoalForSchedule(null);

    // Open the schedule popup
    setShowSchedulePopup(true);
  };

  const renderCalendarEvent = (event: CalendarEvent) => {
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);
    const isPast = endDate < new Date();

    // Determine color based on color_id
    const eventColor = event.color_id && GOOGLE_CALENDAR_COLORS[event.color_id]
      ? GOOGLE_CALENDAR_COLORS[event.color_id]
      : GOOGLE_CALENDAR_COLORS['default'];

    return (
      <SwipeableListItem key={event.id} onDelete={() => event.id && deleteCalendarEvent(event.id)}>
        <TouchableOpacity
          onPress={() => handleEventClick(event)}
          activeOpacity={0.7}
        >
          <View style={[styles.eventCard, isPast && styles.eventCardPast]}>
            <View style={[styles.eventTimeBar, { backgroundColor: eventColor }]} />
            <View style={styles.eventContent}>
              <Text style={[styles.eventTitle, isPast && styles.eventTitlePast]}>
                {event.summary}
              </Text>
              {event.description && (
                <Text style={styles.eventDescription} numberOfLines={2}>
                  {event.description}
                </Text>
              )}
              {event.location && (
                <Text style={styles.eventLocation}>📍 {event.location}</Text>
              )}
              <View style={styles.eventTimeContainer}>
                <Text style={[styles.eventTime, { color: eventColor }]}>
                  {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  {' - '}
                  {endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </SwipeableListItem>
    );
  };
  
  // Dynamic styles for the popup based on activeListType
  const popupTheme = activeListType === 'weekly' ? {
    containerBg: 'rgba(77, 90, 238, 0.70)', // Blue
    accentColor: '#FF9D00', // Orange
    buttonTextColor: '#FFF', // White
  } : {
    containerBg: 'rgba(255, 157, 0, 0.70)', // Orange
    accentColor: '#4D5AEE', // Blue
    buttonTextColor: '#FFF', // White
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header with Settings Button */}
      <View style={styles.header}>
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

      {/* Weekly List Section */}
      <View style={styles.listSection}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.weeklyListTitle}>Weekly goals</Text>
          {weeklyGoals.length > 0 && (
            <TouchableOpacity
              onPress={deleteAllWeeklyGoals}
              style={styles.deleteAllButton}
              activeOpacity={0.7}
            >
              <TrashIconSmall color="#4D5AEE" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.listItemsContainer}>
          {weeklyGoals.map((goal) => (
            <SwipeableListItem key={goal.id} onDelete={() => deleteWeeklyGoal(goal.id)}>
              <View style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <TouchableOpacity
                    onPress={() => toggleWeeklyGoal(goal.id)}
                    activeOpacity={0.7}
                    disabled={editingWeeklyGoalId === goal.id}
                  >
                    <View>
                        <Image
                            source={require('../../assets/to_do.png')}
                            style={styles.checkbox}
                            resizeMode="contain"
                        />
                        {goal.completed && (
                            <Image
                            source={require('../../assets/check.png')}
                            style={styles.checkmark}
                            resizeMode="contain"
                            />
                        )}
                    </View>
                  </TouchableOpacity>
                  {editingWeeklyGoalId === goal.id ? (
                      <TextInput
                          style={styles.editInput}
                          value={editingWeeklyGoalText}
                          onChangeText={setEditingWeeklyGoalText}
                          autoFocus
                          onSubmitEditing={saveWeeklyGoal}
                          onBlur={saveWeeklyGoal}
                      />
                  ) : (
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => startEditingWeeklyGoal(goal)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.listItemText}>{goal.text}</Text>
                      </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => openSchedulePopup(goal, 'weekly')}
                    activeOpacity={0.7}
                    style={styles.calendarIconButton}
                  >
                    <CalendarIcon color="#4D5AEE" />
                  </TouchableOpacity>
                </View>
              </View>
            </SwipeableListItem>
          ))}

          {isAddingWeeklyGoal ? (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.listInput}
                value={newWeeklyGoal}
                onChangeText={setNewWeeklyGoal}
                placeholder="Enter weekly goal"
                placeholderTextColor="#999"
                autoFocus
                onSubmitEditing={addWeeklyGoal}
                onBlur={() => {
                  if (!newWeeklyGoal.trim()) {
                    setIsAddingWeeklyGoal(false);
                  }
                }}
              />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButtonContainer}
              onPress={() => setIsAddingWeeklyGoal(true)}
            >
              <View style={styles.addButtonCircle}>
                <PlusIcon />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* To Do List Section */}
      <View style={styles.listSection}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.todoListTitle}>To do list</Text>
          {todoItems.length > 0 && (
            <TouchableOpacity
              onPress={deleteAllTodoItems}
              style={styles.deleteAllButton}
              activeOpacity={0.7}
            >
              <TrashIconSmall color="#FF9D00" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.listItemsContainer}>
          {todoItems.map((item) => (
            <SwipeableListItem key={item.id} onDelete={() => deleteTodoItem(item.id)}>
              <View style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <TouchableOpacity
                    onPress={() => toggleTodoItem(item.id)}
                    activeOpacity={0.7}
                    disabled={editingTodoItemId === item.id}
                  >
                    <View>
                      <Image
                        source={require('../../assets/to_do.png')}
                        style={styles.checkbox}
                        resizeMode="contain"
                      />
                      {item.completed && (
                        <Image
                          source={require('../../assets/check.png')}
                          style={styles.checkmark}
                          resizeMode="contain"
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                  {editingTodoItemId === item.id ? (
                    <TextInput
                      style={styles.editInput}
                      value={editingTodoItemText}
                      onChangeText={setEditingTodoItemText}
                      autoFocus
                      onSubmitEditing={saveTodoItem}
                      onBlur={saveTodoItem}
                    />
                  ) : (
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => startEditingTodoItem(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.listItemText}>{item.text}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => openSchedulePopup(item, 'todo')}
                    activeOpacity={0.7}
                    style={styles.calendarIconButton}
                  >
                    <CalendarIcon color="#FF9D00" />
                  </TouchableOpacity>
                </View>
              </View>
            </SwipeableListItem>
          ))}

          {isAddingTodoItem ? (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.listInput}
                value={newTodoItem}
                onChangeText={setNewTodoItem}
                placeholder="Enter to-do item"
                placeholderTextColor="#999"
                autoFocus
                onSubmitEditing={addTodoItem}
                onBlur={() => {
                  if (!newTodoItem.trim()) {
                    setIsAddingTodoItem(false);
                  }
                }}
              />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButtonContainer}
              onPress={() => setIsAddingTodoItem(true)}
            >
              <View style={[styles.addButtonCircle, styles.addButtonOrange]}>
                <PlusIcon />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Calendar Section */}
      <View style={styles.calendarSection}>
        {/* Calendar Title */}
        <View style={styles.calendarTitleContainer}>
          <Image
            source={require('../../assets/calendar_title.png')}
            style={styles.calendarTitleImage}
            resizeMode="contain"
          />
          <Text style={styles.calendarTitle}>Calendar</Text>
        </View>

        {/* Calendar Grid Background */}
        <View style={styles.calendarGridBackground}>
          <Image
            source={require('../../assets/grid_calendar.png')}
            style={styles.gridCalendarImage}
            resizeMode="stretch"
          />
          <View style={styles.calendarContent}>
            {/* Month Navigation */}
            <View style={styles.monthHeader}>
              <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.monthButton}>
                <Text style={styles.monthButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => changeMonth('next')} style={styles.monthButton}>
                <Text style={styles.monthButtonText}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Day of Week Headers */}
            <View style={styles.weekDaysHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <View key={day} style={styles.weekDayCell}>
                  <Text style={styles.weekDayText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {days.map((date, index) => renderCalendarDay(date, index))}
            </View>
          </View>
        </View>

        {/* Selected Day Events - Outside the border */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {selectedDayEvents.length > 0 && (
                <Text style={styles.sectionTitleCount}> ({selectedDayEvents.length})</Text>
              )}
            </Text>
            {selectedDayEvents.length > 0 ? (
              selectedDayEvents.map(renderCalendarEvent)
            ) : (
              <Text style={styles.noEventsText}>No events on this day</Text>
            )}
          </View>
        )}
      </View>

      {/* Schedule Event Popup Modal */}
      <Modal
        visible={showSchedulePopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSchedulePopup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.popupContainer, { backgroundColor: popupTheme.containerBg }]}>
            {/* Close X button in top left corner */}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: popupTheme.accentColor }]}
              onPress={() => setShowSchedulePopup(false)}
            >
              <Text style={[styles.closeButtonText, { color: popupTheme.buttonTextColor }]}>✕</Text>
            </TouchableOpacity>

            {/* AI Button in top right corner */}
            <TouchableOpacity style={styles.aiButton} onPress={scheduleEventToCalendar}>
              <LinearGradient
                colors={['#FF9D00', '#4D5AEE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.aiButtonGradient}
              >
                <Image
                  source={require('../../assets/ai.png')}
                  style={styles.aiIcon}
                  resizeMode="contain"
                />
              </LinearGradient>
            </TouchableOpacity>

            <ScrollView style={styles.popupScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.popupTitle, { color: popupTheme.accentColor }]}>Schedule event</Text>

              <View style={styles.formRow}>
                <Text style={[styles.fieldLabel, { color: popupTheme.accentColor }]}>Title:</Text>
                <TextInput
                  style={[styles.fieldInput, { color: popupTheme.accentColor, borderBottomColor: popupTheme.accentColor }]}
                  value={eventTitle}
                  onChangeText={setEventTitle}
                  placeholder="Clean apartment"
                  placeholderTextColor="rgba(153, 153, 153, 0.5)"
                />
              </View>

              <View style={styles.formRow}>
                <Text style={[styles.fieldLabel, { color: popupTheme.accentColor }]}>Date:</Text>
                <View>
                  <View style={styles.inputWithIconContainer}>
                    <TextInput
                      style={[styles.fieldInputWithIcon, { color: popupTheme.accentColor, borderBottomColor: popupTheme.accentColor }]}
                      value={eventDate}
                      onChangeText={setEventDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="rgba(153, 153, 153, 0.5)"
                    />
                    <TouchableOpacity
                      style={styles.pickerIconButton}
                      onPress={() => setShowDatePicker(!showDatePicker)}
                    >
                      <CalendarIcon color={popupTheme.accentColor} />
                    </TouchableOpacity>
                  </View>
                  {showDatePicker && (
                    <View style={styles.pickerContainerVisible}>
                      <DateTimePicker
                        value={eventDateObj}
                        mode="date"
                        display="spinner"
                        onChange={handleDateChange}
                        textColor="#FFFFFF"
                        themeVariant="dark"
                        style={{ height: 200, width: '100%', backgroundColor: 'transparent', alignSelf: 'center' }}
                      />
                    </View>
                  )}

                </View>
              </View>

              <View style={styles.formRow}>
                <Text style={[styles.fieldLabel, { color: popupTheme.accentColor }]}>Time:</Text>
                <View style={styles.timeInputRow}>
                  <View style={{ flex: 1, minHeight: 40 }}>
                    <View style={styles.timeInputWithIconContainer}>
                      <TextInput
                        style={[styles.timeInputWithIcon, { color: popupTheme.accentColor, borderBottomColor: popupTheme.accentColor }]}
                        value={eventStartTime}
                        onChangeText={setEventStartTime}
                        placeholder="1:30pm"
                        placeholderTextColor="rgba(153, 153, 153, 0.5)"
                      />
                      <TouchableOpacity
                        style={styles.timePickerIconButton}
                        onPress={() => {
                          setShowStartTimePicker(!showStartTimePicker);
                          setShowEndTimePicker(false);
                        }}
                      >
                        <ClockIcon color={popupTheme.accentColor} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={[styles.timeSeparator, { color: popupTheme.accentColor }]}>-</Text>

                  <View style={{ flex: 1, minHeight: 40 }}>
                    <View style={styles.timeInputWithIconContainer}>
                      <TextInput
                        style={[styles.timeInputWithIcon, { color: popupTheme.accentColor, borderBottomColor: popupTheme.accentColor }]}
                        value={eventEndTime}
                        onChangeText={setEventEndTime}
                        placeholder="3:30pm"
                        placeholderTextColor="rgba(153, 153, 153, 0.5)"
                      />
                      <TouchableOpacity
                        style={styles.timePickerIconButton}
                        onPress={() => {
                          setShowEndTimePicker(!showEndTimePicker);
                          setShowStartTimePicker(false);
                        }}
                      >
                        <ClockIcon color={popupTheme.accentColor} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {(showStartTimePicker || showEndTimePicker) && (
                <View style={styles.timePickerContainerCentered}>
                  <DateTimePicker
                    value={showStartTimePicker ? eventStartTimeObj : eventEndTimeObj}
                    mode="time"
                    display="spinner"
                    onChange={showStartTimePicker ? handleStartTimeChange : handleEndTimeChange}
                    textColor="#FFFFFF"
                    themeVariant="dark"
                    style={{ height: 150, width: 120, backgroundColor: 'transparent' }}
                  />
                </View>
              )}

              <View style={styles.formRow}>
                <Text style={[styles.fieldLabel, { color: popupTheme.accentColor }]}>Location:</Text>
                <TextInput
                  style={[styles.fieldInput, { color: popupTheme.accentColor, borderBottomColor: popupTheme.accentColor }]}
                  value={eventLocation}
                  onChangeText={setEventLocation}
                  placeholder=""
                  placeholderTextColor="rgba(153, 153, 153, 0.5)"
                />
              </View>

              <View style={styles.formRow}>
                <Text style={[styles.fieldLabel, { color: popupTheme.accentColor }]}>Reminder:</Text>
                <TextInput
                  style={[styles.fieldInput, { color: popupTheme.accentColor, borderBottomColor: popupTheme.accentColor }]}
                  value={eventReminder}
                  onChangeText={setEventReminder}
                  placeholder="30 minutes before"
                  placeholderTextColor="rgba(153, 153, 153, 0.5)"
                />
              </View>

              <View style={styles.formRow}>
                <Text style={[styles.fieldLabel, { color: popupTheme.accentColor }]}>Deadline:</Text>
                <View style={styles.deadlineToggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.deadlineToggleButton,
                      { backgroundColor: hasDeadline ? popupTheme.accentColor : 'rgba(153, 153, 153, 0.3)' }
                    ]}
                    onPress={() => {
                      const newHasDeadline = !hasDeadline;
                      setHasDeadline(newHasDeadline);
                      if (newHasDeadline && !deadlineDate) {
                        // Set default deadline to tomorrow
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        setDeadlineDateObj(tomorrow);
                        setDeadlineDate(tomorrow.toISOString().split('T')[0]);
                        setDeadlineTimeObj(tomorrow);
                        setDeadlineTime(tomorrow.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', ''));
                      }
                    }}
                  >
                    <Text style={[styles.deadlineToggleText, { color: popupTheme.buttonTextColor }]}>
                      {hasDeadline ? 'Yes' : 'No'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {hasDeadline && (
                <>
                  <View style={styles.formRow}>
                    <Text style={[styles.fieldLabel, { color: popupTheme.accentColor }]}>Deadline Date:</Text>
                    <View>
                      <View style={styles.inputWithIconContainer}>
                        <TextInput
                          style={[styles.fieldInputWithIcon, { color: popupTheme.accentColor, borderBottomColor: popupTheme.accentColor }]}
                          value={deadlineDate}
                          onChangeText={setDeadlineDate}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor="rgba(153, 153, 153, 0.5)"
                        />
                        <TouchableOpacity
                          style={styles.pickerIconButton}
                          onPress={() => setShowDeadlineDatePicker(!showDeadlineDatePicker)}
                        >
                          <CalendarIcon color={popupTheme.accentColor} />
                        </TouchableOpacity>
                      </View>
                      {showDeadlineDatePicker && (
                        <View style={styles.pickerContainerVisible}>
                          <DateTimePicker
                            value={deadlineDateObj}
                            mode="date"
                            display="spinner"
                            onChange={handleDeadlineDateChange}
                            textColor="#FFFFFF"
                            themeVariant="dark"
                            style={{ height: 200, width: '100%', backgroundColor: 'transparent', alignSelf: 'center' }}
                          />
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <Text style={[styles.fieldLabel, { color: popupTheme.accentColor }]}>Deadline Time:</Text>
                    <View style={{ minHeight: 40 }}>
                      <View style={styles.timeInputWithIconContainer}>
                        <TextInput
                          style={[styles.timeInputWithIcon, { color: popupTheme.accentColor, borderBottomColor: popupTheme.accentColor }]}
                          value={deadlineTime}
                          onChangeText={setDeadlineTime}
                          placeholder="11:59pm"
                          placeholderTextColor="rgba(153, 153, 153, 0.5)"
                        />
                        <TouchableOpacity
                          style={styles.timePickerIconButton}
                          onPress={() => setShowDeadlineTimePicker(!showDeadlineTimePicker)}
                        >
                          <ClockIcon color={popupTheme.accentColor} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {showDeadlineTimePicker && (
                    <View style={styles.timePickerContainerCentered}>
                      <DateTimePicker
                        value={deadlineTimeObj}
                        mode="time"
                        display="spinner"
                        onChange={handleDeadlineTimeChange}
                        textColor="#FFFFFF"
                        themeVariant="dark"
                        style={{ height: 150, width: 120, backgroundColor: 'transparent' }}
                      />
                    </View>
                  )}
                </>
              )}

              <View style={styles.formRow}>
                <Text style={[styles.fieldLabel, { color: popupTheme.accentColor }]}>Importance:</Text>
                <View style={styles.importanceButtons}>
                  <TouchableOpacity
                    style={[
                      styles.importanceButton,
                      eventImportance === 'High' && styles.importanceButtonActive,
                      { backgroundColor: eventImportance === 'High' ? '#FF3B30' : 'rgba(153, 153, 153, 0.3)' }
                    ]}
                    onPress={() => setEventImportance('High')}
                  >
                    <Text style={[styles.importanceButtonText, { color: popupTheme.buttonTextColor }]}>High</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.importanceButton,
                      eventImportance === 'Medium' && styles.importanceButtonActive,
                      { backgroundColor: eventImportance === 'Medium' ? '#FF9500' : 'rgba(153, 153, 153, 0.3)' }
                    ]}
                    onPress={() => setEventImportance('Medium')}
                  >
                    <Text style={[styles.importanceButtonText, { color: popupTheme.buttonTextColor }]}>Medium</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.importanceButton,
                      eventImportance === 'Low' && styles.importanceButtonActive,
                      { backgroundColor: eventImportance === 'Low' ? '#34C759' : 'rgba(153, 153, 153, 0.3)' }
                    ]}
                    onPress={() => setEventImportance('Low')}
                  >
                    <Text style={[styles.importanceButtonText, { color: popupTheme.buttonTextColor }]}>Low</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formRow}>
                <Text style={[styles.fieldLabel, { color: popupTheme.accentColor }]}>Description:</Text>
                <TextInput
                  style={[styles.fieldInput, { color: popupTheme.accentColor, borderBottomColor: popupTheme.accentColor }]}
                  value={eventDescription}
                  onChangeText={setEventDescription}
                  placeholder=""
                  placeholderTextColor="rgba(153, 153, 153, 0.5)"
                  multiline
                />
              </View>

              <View style={styles.formRow}>
                <Text style={[styles.fieldLabel, { color: popupTheme.accentColor }]}>Guests:</Text>
                <TextInput
                  style={[styles.fieldInput, { color: popupTheme.accentColor, borderBottomColor: popupTheme.accentColor }]}
                  value={eventGuests}
                  onChangeText={setEventGuests}
                  placeholder=""
                  placeholderTextColor="rgba(153, 153, 153, 0.5)"
                />
              </View>
            </ScrollView>

            {/* Save Button at bottom */}
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: popupTheme.accentColor }]} 
              onPress={scheduleEventToCalendar}
            >
              <Text style={[styles.saveButtonText, { color: popupTheme.buttonTextColor }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7E8FF',
  },
  contentContainer: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 100,
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
  listSection: {
    marginBottom: 30,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 20,
  },
  deleteAllButton: {
    padding: 4,
    marginLeft: 8,
    marginBottom: 4,
  },
  weeklyListTitle: {
    color: '#4D5AEE',
    textAlign: 'center',
    fontFamily: 'Margarine',
    fontSize: 40,
    fontWeight: '400',
  },
  todoListTitle: {
    color: '#FF9D00',
    textAlign: 'center',
    fontFamily: 'Margarine',
    fontSize: 40,
    fontWeight: '400',
  },
  listContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    minHeight: 100,
  },
  listItemsContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  swipeableContainer: {
    marginBottom: 15,
    position: 'relative',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  swipeableContent: {
    backgroundColor: '#F7E8FF',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  checkbox: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  checkmark: {
    width: 30,
    height: 30,
    position: 'absolute',
    left: 6,
    top: 0,
  },
  listItemText: {
    color: '#000',
    fontFamily: 'Margarine',
    fontSize: 20,
    fontWeight: '400',
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listInput: {
    flex: 1,
    color: '#000',
    fontFamily: 'Margarine',
    fontSize: 20,
    fontWeight: '400',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  addButtonContainer: {
    marginTop: 10,
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
  addButtonOrange: {
    backgroundColor: '#FF9D00',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  calendarSection: {
    marginTop: 20,
  },
  calendarTitleContainer: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
    width: '100%',
    paddingHorizontal: 0,
  },
  calendarTitleImage: {
    width: '100%',
    height: 60,
    marginTop: 10,
  },
  calendarTitle: {
    position: 'absolute',
    color: '#4D5AEE',
    fontFamily: 'Margarine',
    fontSize: 40,
    fontWeight: '400',
    top: '50%',
    transform: [{ translateY: -15 }],
  },
  calendarGridBackground: {
    position: 'relative',
    marginHorizontal: 10,
  },
  gridCalendarImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  calendarContent: {
    paddingVertical: 25,
    paddingHorizontal: 17,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  addButton: {
    marginLeft: 12,
    backgroundColor: '#4285F4',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9D00',
    marginBottom: 12,
    fontFamily: 'Margarine',
  },
  sectionTitleCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9D00',
    fontFamily: 'Margarine',
  },
  taskCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  taskCompleted: {
    opacity: 0.6,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskInfo: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  taskDuration: {
    fontSize: 13,
    color: '#666',
  },
  taskDueDate: {
    fontSize: 13,
    color: '#666',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  completedOverlay: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -20,
  },
  completedText: {
    fontSize: 32,
    color: '#34C759',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 20,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scheduleButton: {
    marginTop: 12,
    backgroundColor: '#4285F4',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  scheduleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scheduledBadge: {
    marginTop: 12,
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  scheduledBadgeText: {
    color: '#2E7D32',
    fontSize: 13,
    fontWeight: '600',
  },
  taskScheduledTime: {
    fontSize: 13,
    color: '#4285F4',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.71)',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  eventCardPast: {
    opacity: 0.7,
  },
  eventTimeBar: {
    width: 4,
    backgroundColor: '#4285F4',
  },
  eventContent: {
    flex: 1,
    padding: 16,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Margarine',
  },
  eventTitlePast: {
    color: '#999',
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
    fontFamily: 'Margarine',
  },
  eventLocation: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Margarine',
  },
  eventTimeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  eventTime: {
    fontSize: 13,
    color: '#4285F4',
    fontWeight: '500',
    fontFamily: 'Margarine',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  monthButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthButtonText: {
    fontSize: 32,
    color: '#4D5AEE',
    fontWeight: '300',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Margarine',
  },
  weekDaysHeader: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingVertical: 12,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    fontFamily: 'Margarine',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    borderRadius: 13,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  calendarDay: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    padding: 4,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  calendarDayToday: {
    backgroundColor: '#E3F2FD',
  },
  calendarDaySelected: {
    backgroundColor: '#4285F4',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginTop: 4,
    fontFamily: 'Margarine',
  },
  calendarDayTextToday: {
    color: '#4285F4',
    fontWeight: '700',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  eventDots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4285F4',
  },
  noEventsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
    fontFamily: 'Margarine',
  },
  listItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIconButton: {
    padding: 8,
    marginLeft: 8,
  },
  editInput: {
    flex: 1,
    fontFamily: 'Margarine',
    fontSize: 20,
    color: '#000',
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#4D5AEE',
  },
  // Popup styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  popupContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 25,
    backgroundColor: 'rgba(77, 90, 238, 0.70)',
    padding: 20,
    position: 'relative',
  },
  popupScroll: {
    width: '100%',
  },
  popupTitle: {
    color: '#FF9D00',
    textAlign: 'center',
    fontFamily: 'Margarine',
    fontSize: 24,
    fontWeight: '400',
    marginBottom: 20,
  },
  formRow: {
    marginBottom: 15,
  },
  fieldLabel: {
    color: '#FF9D00',
    fontFamily: 'Margarine',
    fontSize: 20,
    fontWeight: '400',
    marginBottom: 5,
  },
  fieldInput: {
    color: '#FF9D00',
    fontFamily: 'Margarine',
    fontSize: 20,
    fontWeight: '400',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#FF9D00',
    paddingVertical: 5,
    paddingHorizontal: 0,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  timeInput: {
    flex: 1,
    color: '#FF9D00',
    fontFamily: 'Margarine',
    fontSize: 20,
    fontWeight: '400',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#FF9D00',
    paddingVertical: 5,
    paddingHorizontal: 0,
  },
  timeSeparator: {
    color: '#FF9D00',
    fontFamily: 'Margarine',
    fontSize: 20,
    fontWeight: '400',
    marginTop: 8,
  },
  deadlineToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  deadlineToggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: 80,
  },
  deadlineToggleText: {
    color: '#FFF',
    fontFamily: 'Margarine',
    fontSize: 16,
    fontWeight: '400',
  },
  importanceButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 5,
  },
  importanceButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignItems: 'center',
  },
  importanceButtonActive: {
    opacity: 1,
  },
  importanceButtonText: {
    color: '#FFF',
    fontFamily: 'Margarine',
    fontSize: 16,
    fontWeight: '400',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    left: 15,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  aiButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    borderRadius: 50,
  },
  aiButtonGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
  aiIcon: {
    width: 24,
    height: 24,
  },
  saveButton: {
    backgroundColor: '#FF9D00',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFF',
    fontFamily: 'Margarine',
    fontSize: 20,
    fontWeight: '400',
    textAlign: 'center',
  },
  pickerText: {
    fontFamily: 'Margarine',
    fontSize: 20,
    fontWeight: '400',
  },
  inputWithIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    flex: 1,
  },
  fieldInputWithIcon: {
    flex: 1,
    fontFamily: 'Margarine',
    fontSize: 20,
    fontWeight: '400',
    paddingVertical: 8,
    paddingHorizontal: 12,
    paddingRight: 40,
    borderBottomWidth: 1,
  },
  pickerIconButton: {
    position: 'absolute',
    right: 8,
    padding: 4,
    zIndex: 10,
  },
  timeInputWithIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    flex: 1,
  },
  timeInputWithIcon: {
    flex: 1,
    fontFamily: 'Margarine',
    fontSize: 20,
    fontWeight: '400',
    paddingVertical: 8,
    paddingHorizontal: 12,
    paddingRight: 36,
    borderBottomWidth: 1,
  },
  timePickerIconButton: {
    position: 'absolute',
    right: 4,
    padding: 2,
    zIndex: 10,
  },
  pickerContainer: {
    marginTop: 10,
    backgroundColor: 'transparent',
    borderRadius: 15,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  pickerContainerVisible: {
    marginTop: 10,
    backgroundColor: 'transparent',
    borderRadius: 15,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  timePickerContainerCentered: {
    marginTop: 15,
    marginBottom: 10,
    backgroundColor: 'transparent',
    borderRadius: 15,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  doneButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignSelf: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Margarine',
    fontSize: 16,
    fontWeight: '400',
  },
});
