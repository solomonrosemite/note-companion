import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
  AccessibilityRole,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { launchCamera } from '@/utils/camera-handler'; // Adjust path as needed
import { useSemanticColor } from '@/hooks/useThemeColor';
import * as Haptics from 'expo-haptics';

interface CameraTabButtonProps {
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: any; // Adjust type as needed based on react-navigation types
  // We don't need onPress from props, as this button has a specific action
  // onPress?: (e: any) => void;
  children: React.ReactNode;
}

const CameraTabButton: React.FC<CameraTabButtonProps> = ({
  accessibilityLabel = 'Take Photo',
  accessibilityRole = 'button',
  accessibilityState,
  children, // children here would typically be the Icon component passed by Tabs.Screen
}) => {
  const primaryColor = useSemanticColor('primary');
  const backgroundColor = useSemanticColor('tabBar');

  const handlePress = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    console.log('Camera button pressed, attempting to launch camera...');
    const imageUri = await launchCamera();
    if (imageUri) {
      console.log('Successfully took photo:', imageUri);
      // TODO: Navigate or handle the image URI
    }
  };

  // Style the button to potentially look different (e.g., centered, larger)
  // For now, we use a simple TouchableOpacity wrapper
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor }]}
      onPress={handlePress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
    >
      {/* We render the children passed by Tabs.Screen, which is the icon */}
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CameraTabButton; 