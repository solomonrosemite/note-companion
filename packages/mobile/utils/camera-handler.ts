import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';
import { handleFileProcess, UploadStatus, SharedFile } from '@/utils/file-handler'; // Import necessary types/functions

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

// Update launchCamera to handle the full upload process
export const launchCameraAndUpload = async (
  getToken: () => Promise<string | null>,
  setStatus: (status: UploadStatus) => void
): Promise<void> => { // Return void as status is handled via callback
  const hasCameraPermission = await requestCameraPermissions();
  if (!hasCameraPermission) return;

  // Media library permission might be implicitly needed by handleFileProcess or saving steps
  // Let's request it proactively, especially for Android
  await requestMediaLibraryPermissions();

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log('Image taken, proceeding to upload:', result.assets[0].uri);
      
      // Get token before processing
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required for upload.");
      }

      // Prepare file object conforming to SharedFile
      const fileToUpload: SharedFile = {
        uri: result.assets[0].uri,
        name: result.assets[0].fileName || `photo-${Date.now()}.jpg`, // Generate a name if missing
        mimeType: result.assets[0].mimeType || 'image/jpeg', // Default to jpeg if missing
      };

      // Call handleFileProcess directly from here
      setStatus('idle'); // Reset status before starting
      const uploadResult = await handleFileProcess(fileToUpload, token, setStatus);
      
      // Status is already set by the callback within handleFileProcess
      console.log('Upload process finished with status:', uploadResult.status);
      if(uploadResult.status === 'error') {
         Alert.alert('Upload Failed', uploadResult.error || 'Could not process the photo.');
      }

    } else {
      console.log('Camera Canceled');
      // Optionally set status back to idle if needed, though usually no status change is expected on cancel
      // setStatus('idle');
    }
  } catch (error) {
    console.error('Error launching camera or uploading:', error);
    setStatus('error'); // Set status to error
    Alert.alert('Error', error instanceof Error ? error.message : 'Could not process the photo.');
  }
}; 