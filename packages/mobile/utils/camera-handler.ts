import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';

// Function to request camera permissions
const requestCameraPermissions = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Camera access is required to take photos. Please enable it in settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }
  return true;
};

// Function to request media library permissions (optional, needed for saving)
const requestMediaLibraryPermissions = async (): Promise<boolean> => {
  // On iOS, camera roll permissions are implicitly granted when camera permissions are granted
  // On Android, we need to explicitly ask if we want to save to gallery
  if (Platform.OS === 'android') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Media Library access is needed to save photos. Please enable it in settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
  }
  return true;
};

// Function to launch the camera
export const launchCamera = async (): Promise<string | null> => {
  const hasCameraPermission = await requestCameraPermissions();
  if (!hasCameraPermission) return null;

  // Optionally request media library permission if you plan to save automatically
  // const hasMediaLibraryPermission = await requestMediaLibraryPermissions();
  // if (!hasMediaLibraryPermission) return null; 

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Or true if you want editing
      aspect: [4, 3], // Optional aspect ratio
      quality: 0.8, // Image quality (0 to 1)
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log('Image taken:', result.assets[0].uri);
      // TODO: Handle the taken image URI (e.g., save it, process it)
      return result.assets[0].uri;
    } else {
      console.log('Camera Canceled');
      return null;
    }
  } catch (error) {
    console.error('Error launching camera:', error);
    Alert.alert('Error', 'Could not open camera.');
    return null;
  }
}; 