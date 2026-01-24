import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Default to localhost, but handle Android emulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  
  return 'http://192.168.1.217:8000';
};

export const API_URL = getBaseUrl();

console.log('API Configured URL:', API_URL);
