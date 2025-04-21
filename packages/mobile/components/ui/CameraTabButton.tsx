import React, { useState } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
  AccessibilityRole,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { launchCameraAndUpload } from '@/utils/camera-handler';
import { useSemanticColor } from '@/hooks/useThemeColor';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@clerk/clerk-expo';
import { UploadStatus } from '@/utils/file-handler';

interface CameraTabButtonProps {
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: any;
  children: React.ReactNode;
}

const CameraTabButton: React.FC<CameraTabButtonProps> = ({
  accessibilityLabel = 'Take Photo',
  accessibilityRole = 'button',
  accessibilityState,
  children,
}) => {
  const primaryColor = useSemanticColor('primary');
  const backgroundColor = useSemanticColor('tabBar');
  const { getToken } = useAuth();
  const [status, setStatus] = useState<UploadStatus>('idle');

  const handlePress = async () => {
    if (status !== 'idle' && status !== 'completed' && status !== 'error') {
      console.log('Upload already in progress...');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    console.log('Camera button pressed, attempting to launch camera and upload...');
    
    await launchCameraAndUpload(getToken, setStatus);
  };

  const isUploading = status === 'uploading' || status === 'processing';

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor }]}
      onPress={handlePress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ ...accessibilityState, busy: isUploading }}
      disabled={isUploading}
    >
      {isUploading ? (
        <ActivityIndicator size="small" color={primaryColor} />
      ) : (
        children
      )}
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