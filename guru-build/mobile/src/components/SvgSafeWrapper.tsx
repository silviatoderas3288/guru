import React from 'react';
import { View } from 'react-native';

interface SvgSafeWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component to prevent SVG layout events from being dispatched to React Native.
 * This solves the "topSvgLayout" unsupported event error.
 */
export const SvgSafeWrapper: React.FC<SvgSafeWrapperProps> = ({ children }) => (
  <View
    style={{ width: 'auto', height: 'auto' }}
    onLayout={undefined}
    pointerEvents="box-none"
  >
    {children}
  </View>
);
