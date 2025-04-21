import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
// TODO: Uncomment to re-enable share intent functionality
// import { useShareIntent } from "expo-share-intent";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ProcessingStatus } from "@/components/processing-status";
import { 
  SharedFile, 
  UploadStatus, 
  UploadResult, 
  handleFileProcess 
} from "@/utils/file-handler";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useSemanticColor } from "@/hooks/useThemeColor";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UsageStatus } from "@/components/usage-status";

export default function HomeScreen() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [uploadResults, setUploadResults] = useState<(UploadResult | null)[]>([]);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const params = useLocalSearchParams<{ sharedFile?: string }>();
  // TODO: Uncomment to re-enable share intent functionality
  // const { shareIntent } = useShareIntent();
  const primaryColor = useSemanticColor('primary');
  const insets = useSafeAreaInsets();

  // TODO: Uncomment this useEffect block to re-enable share intent functionality
  /*
  useEffect(() => {
    // Handle shared content
    const handleSharedContent = async () => {
      if (shareIntent) {
        try {
          if (shareIntent.files && shareIntent.files.length > 0) {
            // Handle shared files
            const file = shareIntent.files[0];
            
            // Improved mime type detection for images
            let mimeType = file.mimeType;
            const fileExt = file.path.split('.').pop()?.toLowerCase();
            
            // Fix missing or incorrect mime types from device
            if (fileExt && (!mimeType || !mimeType.startsWith('image/'))) {
              if (['jpg', 'jpeg'].includes(fileExt)) {
                mimeType = 'image/jpeg';
              } else if (fileExt === 'png') {
                mimeType = 'image/png';
              } else if (fileExt === 'heic') {
                mimeType = 'image/heic';
              } else if (fileExt === 'webp') {
                mimeType = 'image/webp';
              } else if (fileExt === 'gif') {
                mimeType = 'image/gif';
              } else if (fileExt === 'pdf') {
                mimeType = 'application/pdf';
              }
            }
            
            console.log(`ShareIntent: Processing file with path=${file.path}, mimeType=${mimeType}, fileName=${file.fileName}`);
            
            await uploadFiles([{
              uri: file.path,
              mimeType: mimeType,
              name: file.fileName,
            }]);
          } else if (shareIntent.text) {
            // Handle shared text (could save as markdown or process differently)
            const textFile = {
              uri: `${FileSystem.cacheDirectory}shared-text-${Date.now()}.md`,
              mimeType: 'text/markdown',
              name: 'shared-text.md',
              text: shareIntent.text
            };
            
            await uploadFiles([textFile]);
          }
        } catch (error) {
          console.error('Error handling shared content:', error);
          setUploadResults([{
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to process shared content'
          }]);
          setStatus('error');
        }
      }
    };

    handleSharedContent();
  }, [shareIntent]);
  */

  useEffect(() => {
    // Handle shared file if present
    const handleSharedFile = async () => {
      if (params.sharedFile) {
        try {
          const fileData = JSON.parse(params.sharedFile);
          await uploadFiles([fileData]);
        } catch (error) {
          console.error('Error handling shared file:', error);
          setUploadResults([{
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to process shared file'
          }]);
          setStatus('error');
        }
      }
    };

    handleSharedFile();
  }, [params.sharedFile]);

  const uploadFiles = async (files: SharedFile[]) => {
    try {
      // Reset state
      setStatus("uploading");
      setUploadResults([]);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const results: (UploadResult | null)[] = [];
      let overallStatus: UploadStatus = "completed";

      for (const file of files) {
        const result = await handleFileProcess(
          file,
          token,
          (newStatus) => setStatus(newStatus)
        );
        results.push(result);
        if (result.status === "error") {
          overallStatus = "error";
        }
      }

      setUploadResults(results);
      setStatus(overallStatus);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadResults([{
        status: "error",
        error: error instanceof Error ? error.message : "Upload failed",
      }]);
      setStatus("error");
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        multiple: true,
      });

      if (result.canceled) return;
      if (result.assets && result.assets.length > 0) {
        await uploadFiles(result.assets);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      setUploadResults([{
        status: "error",
        error: error instanceof Error ? error.message : "Failed to pick document"
      }]);
      setStatus("error");
    }
  };

  const pickPhotos = async () => {
    try {
      const { status: permissionStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionStatus !== "granted") {
        setUploadResults([{
          status: "error",
          error: "Gallery permission denied",
        }]);
        setStatus("error");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (result.canceled) return;

      if (result.assets && result.assets.length > 0) {
        await uploadFiles(result.assets);
      }
    } catch (error) {
      console.error("Error picking photos:", error);
      setUploadResults([{
        status: "error",
        error: error instanceof Error ? error.message : "Failed to pick photos"
      }]);
      setStatus("error");
    }
  };

  const takePhoto = async () => {
    try {
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== "granted") {
        setUploadResults([{
          status: "error",
          error: "Camera permission denied"
        }]);
        setStatus("error");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (result.canceled) return;
      if (result.assets && result.assets.length > 0) {
        await uploadFiles(result.assets);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      setUploadResults([{
        status: "error",
        error: error instanceof Error ? error.message : "Failed to take photo"
      }]);
      setStatus("error");
    }
  };

  const handleRetry = () => {
    setStatus("idle");
    setUploadResults([]);
  };

  const renderHeader = () => (
    <ThemedView variant="elevated" style={[styles.header, { paddingTop: Math.max(20, insets.top) }]}>
      <View style={styles.titleContainer}>
        <MaterialIcons name="home" size={28} color={primaryColor} style={styles.icon} />
        <ThemedText type="heading" style={styles.headerTitle}>Home</ThemedText>
      </View>
      <ThemedText colorName="textSecondary" type="label" style={styles.headerSubtitle}>
        Extract text from your documents and images
      </ThemedText>
    </ThemedView>
  );

  const renderExplanation = () => (
    <View style={styles.explanationCard}>
      <MaterialIcons name="auto-awesome" size={24} color={primaryColor} />
      <Text style={styles.explanationTitle}>
        Get OCR from any image or pdf
      </Text>
      <Text style={styles.explanationText}>
        Upload any image or pdf and get the text extracted. You can also use
        the share sheet to upload from other apps.
      </Text>
    </View>
  );

  const renderUsageStatus = () => (
    <View style={styles.usageStatusContainer}>
      <UsageStatus compact={true} />
    </View>
  );

  const renderUploadButtons = () => (
    <View style={styles.uploadButtons}>
      <View style={styles.uploadButtonRow}>
        <TouchableOpacity
          style={[
            styles.uploadButtonWrapper,
            (status !== "idle" && status !== "completed" && status !== "error") && styles.uploadButtonDisabled,
          ]}
          onPress={pickDocument}
          disabled={status !== "idle" && status !== "completed" && status !== "error"}
        >
          <View style={styles.uploadButtonGradient}></View>
          <View style={styles.uploadButtonContent}>
            <MaterialIcons name="file-upload" size={32} color={primaryColor} />
            <Text style={styles.uploadButtonText}>Upload Files</Text>
            <Text style={styles.uploadButtonSubtext}>PDFs or Images</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.uploadButtonWrapper,
            (status !== "idle" && status !== "completed" && status !== "error") && styles.uploadButtonDisabled,
          ]}
          onPress={pickPhotos}
          disabled={status !== "idle" && status !== "completed" && status !== "error"}
        >
          <View style={styles.uploadButtonGradient}></View>
          <View style={styles.uploadButtonContent}>
            <MaterialIcons name="photo-library" size={32} color={primaryColor} />
            <Text style={styles.uploadButtonText}>Photo Library</Text>
            <Text style={styles.uploadButtonSubtext}>Choose Photos</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.uploadButtonRow}>
        <TouchableOpacity
          style={[
            styles.uploadButtonWrapper,
            (status !== "idle" && status !== "completed" && status !== "error") && styles.uploadButtonDisabled,
          ]}
          onPress={takePhoto}
          disabled={status !== "idle" && status !== "completed" && status !== "error"}
        >
          <View style={styles.uploadButtonGradient}></View>
          <View style={styles.uploadButtonContent}>
            <MaterialIcons name="camera-alt" size={32} color={primaryColor} />
            <Text style={styles.uploadButtonText}>Take Photo</Text>
            <Text style={styles.uploadButtonSubtext}>Document or Note</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.uploadButtonWrapper} />
      </View>
    </View>
  );

  const renderHelpLink = () => (
    <TouchableOpacity
      style={styles.helpLink}
      onPress={() => router.push('/help')}
    >
      <MaterialIcons name="help-outline" size={18} color="#007AFF" />
      <Text style={styles.helpLinkText}>Need help with sharing?</Text>
    </TouchableOpacity>
  );

  const renderProcessingStatus = () => {
    const lastResult = uploadResults[uploadResults.length - 1];
    const displayStatus = status;
    const displayResult = lastResult?.text !== undefined ? lastResult.text : lastResult?.error;
    const displayFileUrl = lastResult?.fileUrl;
    const displayMimeType = lastResult?.mimeType;
    const displayFileName = uploadResults.length > 1 ? `${uploadResults.length} files` : lastResult?.fileName;

    return (
      <ProcessingStatus
        status={displayStatus}
        result={displayResult}
        fileUrl={displayFileUrl}
        mimeType={displayMimeType}
        fileName={displayFileName}
        onRetry={handleRetry}
        showDetails={true}
      />
    );
  };

  return (
    <ThemedView style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.scrollView}>
        <View style={styles.mainSection}>
          {renderExplanation()}
          {renderUsageStatus()}
          {renderUploadButtons()}
          
          {renderProcessingStatus()}

          {renderHelpLink()}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderRadius: 0,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        marginBottom: 0,
      },
      android: {
        elevation: 2,
        marginBottom: 4,
      },
    }),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  headerTitle: {
    fontWeight: '700',
  },
  headerSubtitle: {
    marginBottom: 8,
  },
  mainSection: {
    padding: 20,
  },
  explanationCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e1e1e1",
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 12,
    color: "#1a1a1a",
  },
  explanationText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  uploadButtons: {
    flexDirection: "column",
    marginBottom: 24,
  },
  uploadButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  uploadButtonWrapper: {
    width: "48%",
    minHeight: 140,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  uploadButtonGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 16,
  },
  uploadButtonContent: {
    flex: 1,
    position: 'relative',
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: 'transparent',
    margin: 2,
    borderRadius: 14,
    height: '100%',
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
  },
  uploadButtonSubtext: {
    marginTop: 4,
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    padding: 12,
  },
  helpLinkText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 6,
    fontWeight: '500',
  },
  usageStatusContainer: {
    marginBottom: 16,
  },
});
