import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
  Image,
  ImageBackground,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { ListItemApiService } from '../services/listItemApi';
import { WorkoutApiService, Workout, WorkoutSection, Exercise } from '../services/workoutApi';
import { usePreferencesStore } from '../store/usePreferencesStore';
import schedulingAgentApi, { WorkoutScheduleResponse, ScheduledWorkout } from '../services/schedulingAgentApi';
import { CalendarApiService, CalendarEvent } from '../services/calendarApi';

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

const CalendarIcon = ({ color = '#FF9D00' }: { color?: string }) => (
  <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <Path
      d="M14.25 3H3.75C2.92157 3 2.25 3.67157 2.25 4.5V15C2.25 15.8284 2.92157 16.5 3.75 16.5H14.25C15.0784 16.5 15.75 15.8284 15.75 15V4.5C15.75 3.67157 15.0784 3 14.25 3Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 1.5V4.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6 1.5V4.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2.25 7.5H15.75"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EditIcon = ({ size = 20, color = '#4D5AEE' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TrashIcon = ({ size = 20, color = '#FF3B30' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6H5H21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface WorkoutScreenProps {
  onNavigateToCalendar?: (workoutData: { title: string; description: string }) => void;
}

export const WorkoutScreen: React.FC<WorkoutScreenProps> = ({ onNavigateToCalendar }) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [weeklyGoalIds, setWeeklyGoalIds] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { toggleSettingsModal } = usePreferencesStore();

  // Modal states
  const [showAddWorkoutModal, setShowAddWorkoutModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [showEditWorkoutModal, setShowEditWorkoutModal] = useState(false);
  const [showEditSectionModal, setShowEditSectionModal] = useState(false);
  const [showEditExerciseModal, setShowEditExerciseModal] = useState(false);
  const [showAIScheduleModal, setShowAIScheduleModal] = useState(false);
  const [aiScheduleLoading, setAiScheduleLoading] = useState(false);
  const [aiScheduleResult, setAiScheduleResult] = useState<WorkoutScheduleResponse | null>(null);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);

  // Date Picker states
  const [weekStartDate, setWeekStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);

  // Edit/Delete mode states
  const [editMode, setEditMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);

  // Form states
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [currentSection, setCurrentSection] = useState<WorkoutSection | null>(null);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseSets, setExerciseSets] = useState('');
  const [exerciseReps, setExerciseReps] = useState('');
  const [exerciseDuration, setExerciseDuration] = useState('');

  // Load workouts from API
  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const fetchedWorkouts = await WorkoutApiService.getWorkouts();
      setWorkouts(fetchedWorkouts);
    } catch (error) {
      console.error('Error loading workouts:', error);
      Alert.alert('Error', 'Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  // Load weekly goals and sync workout completion status
  useEffect(() => {
    const loadWeeklyGoals = async () => {
      try {
        const goals = await ListItemApiService.getWeeklyGoals();
        const goalMap: Record<string, string> = {};
        goals.forEach(goal => {
          goalMap[goal.text] = goal.id;
        });
        setWeeklyGoalIds(goalMap);
      } catch (error) {
        console.error('Error loading weekly goals:', error);
      }
    };

    loadWeeklyGoals();
  }, []);

  const toggleSection = (id: string) => {
    setExpandedSections(prev =>
      prev.includes(id)
        ? prev.filter(sectionId => sectionId !== id)
        : [...prev, id]
    );
  };

  const toggleWorkoutCompletion = async (workout: Workout) => {
    if (!workout.id) return;

    const newCompletedStatus = !workout.completed;

    // Optimistically update UI
    setWorkouts(prev =>
      prev.map(w =>
        w.id === workout.id
          ? { ...w, completed: newCompletedStatus }
          : w
      )
    );

    try {
      await WorkoutApiService.updateWorkout(workout.id, {
        completed: newCompletedStatus,
      });

      // If this workout has a corresponding weekly goal, update it
      const weeklyGoalId = weeklyGoalIds[workout.title];
      if (weeklyGoalId) {
        await ListItemApiService.updateListItem(weeklyGoalId, {
          completed: newCompletedStatus,
        });
      }
    } catch (error) {
      console.error('Error updating workout status:', error);
      Alert.alert('Error', 'Failed to update workout status');
      loadWorkouts(); // Revert changes
    }
  };

  const handleSchedule = () => {
    setShowScheduleModal(true);
  };

  // Open the date picker modal first before generating schedule
  const handleOpenDatePicker = () => {
    setShowScheduleModal(false); // Close the previous modal
    setShowDatePickerModal(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || weekStartDate;
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    setWeekStartDate(currentDate);
    
    // Auto-generate if date selected
    if (selectedDate && showAIScheduleModal) {
      handleAISchedule(selectedDate);
    }
  };

  const handleAISchedule = async (dateObj?: Date) => {
    // If a date is provided, use it. Otherwise use the current state or default.
    const targetDate = dateObj || weekStartDate;
    const dateString = targetDate.toISOString().split('T')[0];

    setAiScheduleLoading(true);
    setShowAIScheduleModal(true);
    setShowDatePickerModal(false);

    try {
      const result = await schedulingAgentApi.scheduleWorkouts({
        weekStartDate: dateString,
        forceReschedule: false,
      });
      setAiScheduleResult(result);
    } catch (error) {
      console.error('Error scheduling workouts:', error);
      Alert.alert(
        'Workout Scheduling Error',
        'Failed to schedule workouts. Please make sure you have set your workout preferences in Settings.'
      );
      setShowAIScheduleModal(false);
    } finally {
      setAiScheduleLoading(false);
    }
  };

  const handleAcceptWorkoutSchedule = async () => {
    if (!aiScheduleResult?.scheduledWorkouts?.length) {
      setShowAIScheduleModal(false);
      return;
    }

    setIsAddingToCalendar(true);

    try {
      let addedCount = 0;
      
      // Fetch existing events for the week to check for duplicates
      const weekStart = new Date(weekStartDate);
      const weekEnd = new Date(weekStartDate);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const existingEvents = await CalendarApiService.getCalendarEvents(weekStart, weekEnd);
      
      // Track titles added in this batch to handle multiple same-name workouts in one generation
      const addedTitles: string[] = [];

      for (const workout of aiScheduleResult.scheduledWorkouts) {
        // Only add to calendar if not already scheduled or if rescheduled
        if (!workout.calendar_event_id || workout.is_rescheduled) {
          try {
            // Check for duplicates (existing in calendar OR added in this batch)
            const baseTitle = workout.title;
            let titleToUse = baseTitle;
            
            // Filter events that match the base title (e.g. "Leg Day", "Leg Day - Day 2")
            const matchingEvents = existingEvents.filter(e => 
              e.summary === baseTitle || e.summary.startsWith(`${baseTitle} - Day `)
            );
            
            const matchingAdded = addedTitles.filter(t => 
              t === baseTitle || t.startsWith(`${baseTitle} - Day `)
            );
            
            const totalMatches = matchingEvents.length + matchingAdded.length;
            
            if (totalMatches > 0) {
              titleToUse = `${baseTitle} - Day ${totalMatches + 1}`;
            }
            
            await CalendarApiService.createCalendarEvent({
              summary: titleToUse,
              description: workout.exercises.join('\n') || workout.description || 'Workout scheduled by AI',
              start_time: workout.start_time,
              end_time: workout.end_time,
            });
            
            addedTitles.push(titleToUse);
            addedCount++;
          } catch (calError) {
            console.error('Failed to create calendar event for:', workout.title, calError);
          }
        }
      }

      setShowAIScheduleModal(false);
      Alert.alert(
        'Success',
        addedCount > 0
          ? `${addedCount} workout(s) added to your calendar!`
          : 'All workouts were already scheduled.'
      );
    } catch (error) {
      console.error('Error adding workouts to calendar:', error);
      Alert.alert('Error', 'Failed to add workouts to calendar.');
    } finally {
      setIsAddingToCalendar(false);
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

  const handleScheduleWorkout = (workout: Workout) => {
    setShowScheduleModal(false);

    const description = workout.sections.flatMap(section =>
      section.exercises.map((exercise) => {
        if (exercise.sets && exercise.reps) {
          return `${exercise.name}: ${exercise.sets} sets × ${exercise.reps} reps`;
        } else if (exercise.duration) {
          return `${exercise.name}: ${exercise.duration}`;
        } else {
          return exercise.name;
        }
      })
    ).join('\n');

    if (onNavigateToCalendar) {
      onNavigateToCalendar({
        title: workout.title,
        description: description,
      });
    }
  };

  const handleQuickAddExercise = async (workout: Workout) => {
    try {
      let targetSection = workout.sections[0];
      
      if (!targetSection) {
        // Create default section if none exists
        const maxOrder = 0;
        const newSection = await WorkoutApiService.createSection(workout.id!, {
          title: 'Main',
          order: maxOrder + 1,
          exercises: [],
        });
        targetSection = newSection;
        // Refresh workouts to ensure state consistency
        await loadWorkouts();
      } else {
        setCurrentSection(targetSection);
      }
      
      // We need to set the current section for the modal
      // If we just created it, we might need to find it in the reloaded data
      // But for UI responsiveness, let's set it directly if possible or rely on the fact that loadWorkouts updates state
      
      // Since loadWorkouts is async, we can't guarantee 'targetSection' is the object in the new 'workouts' state
      // strictly speaking. However, for the ID it should be fine.
      
      // A better approach for the modal is to just store the section ID and Title, 
      // but the current implementation uses the full object.
      
      // Let's find the section in the latest workouts if we reloaded, 
      // or just use the one we have if it existed.
      if (targetSection) {
         setCurrentSection(targetSection);
         setShowAddExerciseModal(true);
      }

    } catch (error) {
      console.error('Error in quick add exercise:', error);
      Alert.alert('Error', 'Failed to prepare for adding exercise');
    }
  };

  // CRUD handlers for workouts
  const handleAddWorkout = async () => {
    if (!workoutTitle.trim()) {
      Alert.alert('Error', 'Please enter a workout title');
      return;
    }

    try {
      await WorkoutApiService.createWorkout({
        title: workoutTitle,
        description: workoutDescription,
        sections: [],
      });
      setShowAddWorkoutModal(false);
      setWorkoutTitle('');
      setWorkoutDescription('');
      loadWorkouts();
    } catch (error) {
      console.error('Error creating workout:', error);
      Alert.alert('Error', 'Failed to create workout');
    }
  };

  const handleEditWorkout = async () => {
    if (!currentWorkout?.id || !workoutTitle.trim()) {
      Alert.alert('Error', 'Please enter a workout title');
      return;
    }

    try {
      await WorkoutApiService.updateWorkout(currentWorkout.id, {
        title: workoutTitle,
        description: workoutDescription,
      });
      setShowEditWorkoutModal(false);
      setCurrentWorkout(null);
      setWorkoutTitle('');
      setWorkoutDescription('');
      loadWorkouts();
    } catch (error) {
      console.error('Error updating workout:', error);
      Alert.alert('Error', 'Failed to update workout');
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await WorkoutApiService.deleteWorkout(workoutId);
              loadWorkouts();
            } catch (error) {
              console.error('Error deleting workout:', error);
              Alert.alert('Error', 'Failed to delete workout');
            }
          },
        },
      ]
    );
  };

  // CRUD handlers for sections
  const handleAddSection = async () => {
    if (!currentWorkout?.id || !sectionTitle.trim()) {
      Alert.alert('Error', 'Please enter a section title');
      return;
    }

    try {
      const maxOrder = Math.max(0, ...currentWorkout.sections.map(s => s.order));
      await WorkoutApiService.createSection(currentWorkout.id, {
        title: sectionTitle,
        order: maxOrder + 1,
        exercises: [],
      });
      setShowAddSectionModal(false);
      setSectionTitle('');
      setCurrentWorkout(null);
      loadWorkouts();
    } catch (error) {
      console.error('Error creating section:', error);
      Alert.alert('Error', 'Failed to create section');
    }
  };

  const handleEditSection = async () => {
    if (!currentSection?.id || !sectionTitle.trim()) {
      Alert.alert('Error', 'Please enter a section title');
      return;
    }

    try {
      await WorkoutApiService.updateSection(currentSection.id, {
        title: sectionTitle,
      });
      setShowEditSectionModal(false);
      setCurrentSection(null);
      setSectionTitle('');
      loadWorkouts();
    } catch (error) {
      console.error('Error updating section:', error);
      Alert.alert('Error', 'Failed to update section');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    Alert.alert(
      'Delete Section',
      'Are you sure you want to delete this section?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await WorkoutApiService.deleteSection(sectionId);
              loadWorkouts();
            } catch (error) {
              console.error('Error deleting section:', error);
              Alert.alert('Error', 'Failed to delete section');
            }
          },
        },
      ]
    );
  };

  // CRUD handlers for exercises
  const handleAddExercise = async () => {
    if (!currentSection?.id || !exerciseName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }

    try {
      const maxOrder = Math.max(0, ...currentSection.exercises.map(e => e.order));
      await WorkoutApiService.createExercise(currentSection.id, {
        name: exerciseName,
        sets: exerciseSets,
        reps: exerciseReps,
        duration: exerciseDuration,
        order: maxOrder + 1,
      });
      setShowAddExerciseModal(false);
      setCurrentSection(null);
      setExerciseName('');
      setExerciseSets('');
      setExerciseReps('');
      setExerciseDuration('');
      loadWorkouts();
    } catch (error) {
      console.error('Error creating exercise:', error);
      Alert.alert('Error', 'Failed to create exercise');
    }
  };

  const handleEditExercise = async () => {
    if (!currentExercise?.id || !exerciseName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }

    try {
      await WorkoutApiService.updateExercise(currentExercise.id, {
        name: exerciseName,
        sets: exerciseSets,
        reps: exerciseReps,
        duration: exerciseDuration,
      });
      setShowEditExerciseModal(false);
      setCurrentExercise(null);
      setExerciseName('');
      setExerciseSets('');
      setExerciseReps('');
      setExerciseDuration('');
      loadWorkouts();
    } catch (error) {
      console.error('Error updating exercise:', error);
      Alert.alert('Error', 'Failed to update exercise');
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to delete this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await WorkoutApiService.deleteExercise(exerciseId);
              loadWorkouts();
            } catch (error) {
              console.error('Error deleting exercise:', error);
              Alert.alert('Error', 'Failed to delete exercise');
            }
          },
        },
      ]
    );
  };

  // Calculate stats
  const completedCount = workouts.filter(w => w.completed).length;
  const totalCount = workouts.length;
  const totalActiveTime = 50; // This would be calculated based on completed workouts
  const totalCalories = 400; // This would be calculated based on completed workouts

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading workouts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content} scrollEnabled={!showAIScheduleModal}>
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

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Workout Plan</Text>
        <Image
          source={require('../../assets/under_pref.png')}
          style={styles.titleUnderline}
          resizeMode="contain"
        />
      </View>

      {/* Stats Section */}
      <ImageBackground
        source={require('../../assets/stats.png')}
        style={styles.statsContainer}
        resizeMode="stretch"
      >
        <Text style={styles.statsTitle}>Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedCount}/{totalCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalActiveTime} min</Text>
            <Text style={styles.statLabel}>Total active time</Text>
          </View>
        </View>
        <View style={styles.caloriesContainer}>
          <Text style={styles.statValue}>{totalCalories}</Text>
          <Text style={styles.statLabel}>Calories</Text>
        </View>
      </ImageBackground>

      {/* Add Workout Button */}
      <TouchableOpacity
        style={styles.addWorkoutButton}
        onPress={() => setShowAddWorkoutModal(true)}
      >
        <Text style={styles.addWorkoutButtonText}>+</Text>
      </TouchableOpacity>

      {/* Edit/Delete Controls for Collapsible Sections (only show when workouts exist) */}
      {workouts.length > 0 && (
        <View style={styles.collapsibleControlsRow}>
          <TouchableOpacity
            style={[
              styles.collapsibleEditButton,
              editMode && styles.collapsibleEditButtonActive
            ]}
            onPress={() => {
              setEditMode(!editMode);
              setDeleteMode(false);
            }}
          >
            <EditIcon size={20} color={editMode ? '#FFF' : '#4D5AEE'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.collapsibleDeleteButton,
              deleteMode && styles.collapsibleDeleteButtonActive
            ]}
            onPress={() => {
              setDeleteMode(!deleteMode);
              setEditMode(false);
            }}
          >
            <TrashIcon size={20} color={deleteMode ? '#FFF' : '#FF3B30'} />
          </TouchableOpacity>
        </View>
      )}

      {/* Workout Sections */}
      {workouts.map((workout) => {
        const isExpanded = expandedSections.includes(workout.id!);
        const isCompleted = workout.completed;

        return (
          <View key={workout.id} style={styles.workoutSection}>
            {/* Workout Header */}
            <TouchableOpacity
              onPress={() => toggleSection(workout.id!)}
              activeOpacity={0.8}
            >
              <ImageBackground
                source={require('../../assets/box.png')}
                style={styles.workoutHeader}
                resizeMode="stretch"
              >
                {/* Checkbox */}
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => toggleWorkoutCompletion(workout)}
                >
                  <ImageBackground
                    source={require('../../assets/to_do.png')}
                    style={styles.checkbox}
                    resizeMode="contain"
                  >
                    {isCompleted && (
                      <Image
                        source={require('../../assets/check.png')}
                        style={styles.checkmark}
                        resizeMode="contain"
                      />
                    )}
                  </ImageBackground>
                </TouchableOpacity>

                {/* Title */}
                <Text style={styles.workoutTitle}>
                  {workout.title}
                </Text>

                {/* Arrow or Edit/Delete Icon based on mode */}
                {editMode ? (
                  <TouchableOpacity
                    onPress={() => {
                      setCurrentWorkout(workout);
                      setWorkoutTitle(workout.title);
                      setWorkoutDescription(workout.description || '');
                      setShowEditWorkoutModal(true);
                      setEditMode(false);
                    }}
                    style={styles.workoutHeaderIcon}
                  >
                    <EditIcon size={20} color="#4D5AEE" />
                  </TouchableOpacity>
                ) : deleteMode ? (
                  <TouchableOpacity
                    onPress={() => {
                      handleDeleteWorkout(workout.id!);
                      setDeleteMode(false);
                    }}
                    style={styles.workoutHeaderIcon}
                  >
                    <TrashIcon size={20} color="#FF3B30" />
                  </TouchableOpacity>
                ) : (
                  <Image
                    source={require('../../assets/arrow.png')}
                    style={[
                      styles.arrow,
                      isExpanded && styles.arrowExpanded,
                    ]}
                    resizeMode="contain"
                  />
                )}
              </ImageBackground>
            </TouchableOpacity>

            {/* Expanded Content */}
            {isExpanded && (
              <View style={styles.expandedContent}>
                {/* Activities Header Row - Title left, Add button right */}
                <View style={styles.activitiesHeaderRow}>
                  <Text style={styles.activitiesHeader}>Activities</Text>
                  <TouchableOpacity
                    onPress={() => handleQuickAddExercise(workout)}
                    style={styles.addExerciseIconButton}
                  >
                    <Text style={styles.addExerciseIconText}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* Exercises - directly without section headers */}
                <View style={styles.exerciseList}>
                  {(() => {
                    const allExercises = workout.sections.flatMap((section) => section.exercises);
                    return allExercises.map((exercise, index) => (
                      <View key={exercise.id} style={[
                        styles.exerciseItem,
                        index < allExercises.length - 1 && styles.exerciseItemWithSeparator
                      ]}>
                        <View style={styles.exerciseContent}>
                          <Text style={styles.exerciseName}>{exercise.name}</Text>
                          <Text style={styles.exerciseDetails}>
                            {exercise.sets && `${exercise.sets} sets`}
                            {exercise.sets && exercise.reps && ' × '}
                            {exercise.reps && `${exercise.reps} reps`}
                            {exercise.duration && exercise.duration}
                          </Text>
                        </View>
                        <View style={styles.exerciseControls}>
                          <TouchableOpacity
                            onPress={() => {
                              setCurrentExercise(exercise);
                              setExerciseName(exercise.name);
                              setExerciseSets(exercise.sets || '');
                              setExerciseReps(exercise.reps || '');
                              setExerciseDuration(exercise.duration || '');
                              setShowEditExerciseModal(true);
                            }}
                            style={styles.editIconButton}
                          >
                            <EditIcon size={18} color="#4D5AEE" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteExercise(exercise.id!)}
                            style={styles.deleteIconButton}
                          >
                            <TrashIcon size={18} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ));
                  })()}
                </View>
              </View>
            )}
          </View>
        );
      })}

      {/* Schedule Button */}
      <TouchableOpacity
        style={styles.scheduleButton}
        onPress={handleSchedule}
      >
        <Text style={styles.scheduleButtonText}>Schedule</Text>
      </TouchableOpacity>
      </ScrollView>

      {/* Schedule Modal */}
      <Modal
        visible={showScheduleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowScheduleModal(false)}
        >
          <Pressable style={styles.modalContent}>
            <TouchableOpacity style={styles.aiButton} onPress={handleOpenDatePicker}>
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

            <Text style={styles.modalTitle}>Schedule Workout</Text>
            <Text style={styles.modalSubtitle}>Select a workout to add to your calendar:</Text>

            <ScrollView style={styles.modalList}>
              {workouts.map((workout) => (
                <TouchableOpacity
                  key={workout.id}
                  style={styles.modalWorkoutItem}
                  onPress={() => handleScheduleWorkout(workout)}
                >
                  <View style={styles.modalWorkoutIconContainer}>
                    <CalendarIcon color="#FF9D00" />
                  </View>
                  <View style={styles.modalWorkoutTextContainer}>
                    <Text style={styles.modalWorkoutText}>{workout.title}</Text>
                    <Text style={styles.modalWorkoutDetails}>
                      {workout.sections.reduce((acc, s) => acc + s.exercises.length, 0)} exercises
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowScheduleModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add/Edit Workout Modals */}
      <Modal
        visible={showAddWorkoutModal || showEditWorkoutModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAddWorkoutModal(false);
          setShowEditWorkoutModal(false);
        }}
      >
        <Pressable style={styles.modalOverlay} onPress={() => {
          setShowAddWorkoutModal(false);
          setShowEditWorkoutModal(false);
        }}>
          <Pressable style={styles.formModalContent}>
            <Text style={styles.formModalTitle}>
              {showAddWorkoutModal ? 'Add Workout' : 'Edit Workout'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Workout Title"
              placeholderTextColor="#999"
              value={workoutTitle}
              onChangeText={setWorkoutTitle}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor="#999"
              value={workoutDescription}
              onChangeText={setWorkoutDescription}
              multiline
              numberOfLines={3}
            />
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.formButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddWorkoutModal(false);
                  setShowEditWorkoutModal(false);
                  setWorkoutTitle('');
                  setWorkoutDescription('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formButton, styles.saveButton]}
                onPress={showAddWorkoutModal ? handleAddWorkout : handleEditWorkout}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add/Edit Section Modals */}
      <Modal
        visible={showAddSectionModal || showEditSectionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAddSectionModal(false);
          setShowEditSectionModal(false);
        }}
      >
        <Pressable style={styles.modalOverlay} onPress={() => {
          setShowAddSectionModal(false);
          setShowEditSectionModal(false);
        }}>
          <Pressable style={styles.formModalContent}>
            <Text style={styles.formModalTitle}>
              {showAddSectionModal ? 'Add Section' : 'Edit Section'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Section Title"
              placeholderTextColor="#999"
              value={sectionTitle}
              onChangeText={setSectionTitle}
            />
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.formButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddSectionModal(false);
                  setShowEditSectionModal(false);
                  setSectionTitle('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formButton, styles.saveButton]}
                onPress={showAddSectionModal ? handleAddSection : handleEditSection}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add/Edit Exercise Modals */}
      <Modal
        visible={showAddExerciseModal || showEditExerciseModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAddExerciseModal(false);
          setShowEditExerciseModal(false);
        }}
      >
        <Pressable style={styles.modalOverlay} onPress={() => {
          setShowAddExerciseModal(false);
          setShowEditExerciseModal(false);
        }}>
          <Pressable style={styles.formModalContent}>
            <Text style={styles.formModalTitle}>
              {showAddExerciseModal ? 'Add Exercise' : 'Edit Exercise'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Exercise Name"
              placeholderTextColor="#999"
              value={exerciseName}
              onChangeText={setExerciseName}
            />
            <TextInput
              style={styles.input}
              placeholder="Sets (optional)"
              placeholderTextColor="#999"
              value={exerciseSets}
              onChangeText={setExerciseSets}
            />
            <TextInput
              style={styles.input}
              placeholder="Reps (optional)"
              placeholderTextColor="#999"
              value={exerciseReps}
              onChangeText={setExerciseReps}
            />
            <TextInput
              style={styles.input}
              placeholder="Duration (optional)"
              placeholderTextColor="#999"
              value={exerciseDuration}
              onChangeText={setExerciseDuration}
            />
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.formButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddExerciseModal(false);
                  setShowEditExerciseModal(false);
                  setExerciseName('');
                  setExerciseSets('');
                  setExerciseReps('');
                  setExerciseDuration('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formButton, styles.saveButton]}
                onPress={showAddExerciseModal ? handleAddExercise : handleEditExercise}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
              <Text style={styles.datePickerCancelText}>Cancel</Text>
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
            onPress={() => !aiScheduleLoading && !isAddingToCalendar && setShowAIScheduleModal(false)}
          />
          <View style={styles.aiModalCard}>
            <ScrollView
              style={styles.aiScheduleScrollView}
              contentContainerStyle={styles.aiScheduleScrollContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {aiScheduleLoading || isAddingToCalendar ? (
                <View style={styles.aiLoadingContainer}>
                  <Image
                    source={require('../../assets/ai.png')}
                    style={styles.aiLoadingIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.aiLoadingText}>
                    {isAddingToCalendar ? 'Adding workouts to calendar...' : 'AI is scheduling your workouts...'}
                  </Text>
                  <Text style={styles.aiLoadingSubtext}>
                    {isAddingToCalendar ? 'Creating calendar events' : 'Checking your calendar and preferences'}
                  </Text>
                </View>
              ) : aiScheduleResult ? (
                <>
                  <View style={styles.aiScheduleHeader}>
                    <Text style={styles.aiScheduleTitle}>Workout Schedule</Text>
                  </View>

                  {/* Summary */}
                  <View style={styles.scheduleSummary}>
                    {aiScheduleResult.alreadyScheduledCount > 0 && (
                      <Text style={styles.summaryText}>
                        ✓ {aiScheduleResult.alreadyScheduledCount} workout(s) already on calendar
                      </Text>
                    )}
                    {aiScheduleResult.newlyScheduledCount > 0 && (
                      <Text style={styles.summaryText}>
                        + {aiScheduleResult.newlyScheduledCount} workout(s) to be scheduled
                      </Text>
                    )}
                    {aiScheduleResult.rescheduledCount > 0 && (
                      <Text style={styles.summaryText}>
                        ↻ {aiScheduleResult.rescheduledCount} workout(s) rescheduled
                      </Text>
                    )}
                  </View>

                  {aiScheduleResult.warnings?.length ? (
                    <View style={styles.warningsContainer}>
                      {aiScheduleResult.warnings.map((warning: { message: string; severity: string }, index: number) => (
                        <Text key={index} style={styles.warningText}>
                          {warning.message}
                        </Text>
                      ))}
                    </View>
                  ) : null}

                  {aiScheduleResult.scheduledWorkouts?.length ? (
                    Object.entries(
                      aiScheduleResult.scheduledWorkouts.reduce((acc: Record<string, ScheduledWorkout[]>, workout: ScheduledWorkout) => {
                        const day = workout.day || 'Unscheduled';
                        if (!acc[day]) acc[day] = [];
                        acc[day].push(workout);
                        return acc;
                      }, {} as Record<string, ScheduledWorkout[]>)
                    )
                    .sort(([dayA], [dayB]) => {
                      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Unscheduled'];
                      return dayOrder.indexOf(dayA) - dayOrder.indexOf(dayB);
                    })
                    .map(([day, dayWorkouts]) => (
                      <View key={day} style={styles.daySection}>
                        <Text style={styles.dayHeader}>{day}</Text>
                        {dayWorkouts.map((workout: ScheduledWorkout, index: number) => (
                          <View key={index} style={[
                            styles.scheduleEventItem,
                            workout.calendar_event_id && !workout.is_rescheduled && styles.alreadyScheduledItem
                          ]}>
                            <View style={styles.eventDetails}>
                              <View style={styles.eventTitleRow}>
                                <Text style={styles.eventTitle}>{workout.title}</Text>
                                {workout.calendar_event_id && !workout.is_rescheduled && (
                                  <Text style={styles.alreadyScheduledBadge}>Already scheduled</Text>
                                )}
                                {workout.is_rescheduled && (
                                  <Text style={styles.rescheduledBadge}>Rescheduled</Text>
                                )}
                              </View>
                              <Text style={styles.eventTime}>
                                {formatTime(workout.start_time)} - {formatTime(workout.end_time)}
                              </Text>
                              {workout.exercises?.length > 0 && (
                                <Text style={styles.eventDescription}>
                                  {workout.exercises.slice(0, 3).join(' • ')}
                                  {workout.exercises.length > 3 && ` +${workout.exercises.length - 3} more`}
                                </Text>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noEventsText}>No workouts to schedule</Text>
                  )}

                  {/* AI Reasoning */}
                  {aiScheduleResult.reasoning && (
                    <View style={styles.reasoningContainer}>
                      <Text style={styles.reasoningTitle}>AI Notes:</Text>
                      <Text style={styles.reasoningText}>{aiScheduleResult.reasoning}</Text>
                    </View>
                  )}

                  <View style={styles.aiScheduleButtons}>
                    <TouchableOpacity
                      style={[styles.aiScheduleButton, styles.regenerateButton]}
                      onPress={() => handleAISchedule()}
                    >
                      <Text style={styles.regenerateButtonText}>Regenerate</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.aiScheduleButton, styles.acceptButton]}
                      onPress={handleAcceptWorkoutSchedule}
                    >
                      <Text style={styles.acceptButtonText}>Add to Calendar</Text>
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


    </>
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
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
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
  titleContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Margarine',
    color: '#FF9D00',
    marginBottom: 4,
  },
  titleUnderline: {
    width: 200,
    height: 15,
    marginTop: 4,
  },
  statsContainer: {
    padding: 24,
    marginBottom: 20,
    minHeight: 180,
    justifyContent: 'center',
  },
  statsTitle: {
    fontSize: 20,
    fontFamily: 'Margarine',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Margarine',
    color: '#666',
    textAlign: 'center',
  },
  caloriesContainer: {
    alignItems: 'center',
  },
  addWorkoutButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF9D00',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#FF9D00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  addWorkoutButtonText: {
    color: '#FFF',
    fontSize: 32,
    fontFamily: 'Margarine',
    marginTop: -4,
  },
  collapsibleControlsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    paddingRight: 16,
  },
  collapsibleEditButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4D5AEE',
  },
  collapsibleEditButtonActive: {
    backgroundColor: '#4D5AEE',
  },
  collapsibleDeleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  collapsibleDeleteButtonActive: {
    backgroundColor: '#FF3B30',
  },
  workoutSection: {
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    width: 20,
    height: 20,
  },
  workoutTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
    marginBottom: 4,
  },
  arrow: {
    width: 20,
    height: 20,
  },
  workoutHeaderIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  editIconButton: {
    padding: 4,
  },
  deleteIconButton: {
    padding: 4,
  },
  editIcon: {
    fontSize: 20,
  },
  deleteIcon: {
    fontSize: 20,
  },
  editIconSmall: {
    fontSize: 16,
  },
  deleteIconSmall: {
    fontSize: 16,
  },
  expandedContent: {
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: -5,
    padding: 16,
  },
  workoutEditBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
  },
  activitiesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activitiesHeader: {
    fontSize: 20,
    fontFamily: 'Margarine',
    color: '#FF9D00',
  },
  separatorLine: {
    height: 1,
    backgroundColor: '#FF9D00',
    marginBottom: 16,
  },
  workoutControls: {
    flexDirection: 'row',
    gap: 8,
  },
  addSectionButton: {
    backgroundColor: '#4D5AEE',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  addSectionButtonText: {
    color: '#FFF',
    fontSize: 24,
    fontFamily: 'Margarine',
    marginTop: -2, // Visual centering
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
  },
  sectionControls: {
    flexDirection: 'row',
    gap: 8,
  },
  addExerciseButton: {
    backgroundColor: '#4D5AEE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  addExerciseButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Margarine',
  },
  addExerciseIconButton: {
    padding: 4,
    marginLeft: 4,
  },
  addExerciseIconText: {
    fontSize: 22,
    color: '#4D5AEE',
    fontFamily: 'Margarine',
    lineHeight: 24,
  },
  exerciseList: {
    gap: 8,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  exerciseItemWithSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: '#FF9D00',
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#333',
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 14,
    fontFamily: 'Margarine',
    color: '#666',
  },
  exerciseControls: {
    flexDirection: 'row',
    gap: 8,
  },
  scheduleButton: {
    backgroundColor: '#4D5AEE',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
    alignItems: 'center',
    alignSelf: 'center',
    width: 150,
    shadowColor: '#4D5AEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  scheduleButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(77, 90, 238, 0.85)',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Margarine',
    color: '#FF9D00',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Margarine',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalList: {
    maxHeight: 300,
  },
  modalWorkoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#FF9D00',
  },
  modalWorkoutIconContainer: {
    marginRight: 12,
  },
  modalWorkoutTextContainer: {
    flex: 1,
  },
  modalWorkoutText: {
    fontSize: 18,
    fontFamily: 'Margarine',
    color: '#FF9D00',
    marginBottom: 4,
  },
  modalWorkoutDetails: {
    fontSize: 14,
    fontFamily: 'Margarine',
    color: '#FFF',
  },
  modalCloseButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
    width: 120,
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
    shadowOffset: { "width": 0, "height": 10 },
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
    width: '100%',
  },
  dateArrowButton: {
    padding: 8,
  },
  dateDisplayBox: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    minWidth: 140,
    shadowColor: '#4D5AEE',
    shadowOffset: { "width": 0, "height": 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(77, 90, 238, 0.2)',
  },
  dateDisplayMonth: {
    fontSize: 14,
    fontFamily: 'Margarine',
    color: '#FF9D00',
    textTransform: 'uppercase',
  },
  dateDisplayDay: {
    fontSize: 32,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
    lineHeight: 38,
  },
  dateDisplayYear: {
    fontSize: 12,
    fontFamily: 'Margarine',
    color: '#999',
  },
  dateDisplayWeekday: {
    fontSize: 14,
    fontFamily: 'Margarine',
    color: '#666',
    marginTop: 2,
  },
  dateTimePicker: {
    width: '100%',
    backgroundColor: 'white',
  },
  datePickerDoneButton: {
    alignSelf: 'flex-end',
    padding: 10,
    marginBottom: 10,
  },
  datePickerDoneText: {
    fontSize: 16,
    color: '#4D5AEE',
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
  quickSelectContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    width: '100%',
    justifyContent: 'center',
  },
  quickSelectButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(77, 90, 238, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(77, 90, 238, 0.3)',
  },
  quickSelectText: {
    color: '#4D5AEE',
    fontSize: 14,
    fontFamily: 'Margarine',
  },
  generateScheduleButton: {
    width: '100%',
    borderRadius: 25,
    shadowColor: '#4D5AEE',
    shadowOffset: { "width": 0, "height": 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 16,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
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
  },
  datePickerCancelText: {
    color: '#FF3B30',
    fontSize: 16,
    fontFamily: 'Margarine',
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
  formModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxHeight: '80%',
  },
  formModalTitle: {
    fontSize: 24,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F7E8FF',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Margarine',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4D5AEE',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  saveButton: {
    backgroundColor: '#4D5AEE',
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
  // AI Schedule Modal Styles
// AI Schedule Modal Styles
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

  // nicer iOS shadow
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
  color: '#ffffff', // deeper blue looks nicer
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
  aiScheduleButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    marginBottom: 10,
  },
  aiScheduleButton: {
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
  // Workout scheduling specific styles
  scheduleSummary: {
  backgroundColor: 'rgba(77, 90, 238, 0.1)',
  borderRadius: 12,
  padding: 12,
  marginBottom: 16,
},

summaryText: {
  fontSize: 14,
  fontFamily: 'Margarine',
  color: '#4D5AEE',
  marginBottom: 4,
},

eventTitleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
},

alreadyScheduledItem: {
  opacity: 0.7,
  backgroundColor: 'rgba(76, 175, 80, 0.1)',
},

alreadyScheduledBadge: {
  fontSize: 10,
  fontFamily: 'Margarine',
  color: '#4CAF50',
  backgroundColor: 'rgba(76, 175, 80, 0.2)',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 8,
},

rescheduledBadge: {
  fontSize: 10,
  fontFamily: 'Margarine',
  color: '#FF9800',
  backgroundColor: 'rgba(255, 152, 0, 0.2)',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 8,
},

reasoningContainer: {
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
  borderRadius: 12,
  padding: 12,
  marginTop: 16,
  marginBottom: 8,
},

reasoningTitle: {
  fontSize: 14,
  fontFamily: 'Margarine',
  color: '#666',
  marginBottom: 4,
},

reasoningText: {
  fontSize: 13,
  fontFamily: 'Margarine',
  color: '#333',
  lineHeight: 18,
},

});
