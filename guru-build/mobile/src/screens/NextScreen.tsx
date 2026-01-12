import React from 'react';
import { NavigationContainer } from './NavigationContainer';

interface NextScreenProps {
  onGoBack: () => void;
}

export const NextScreen: React.FC<NextScreenProps> = ({ onGoBack }) => {
  return <NavigationContainer />;
};
