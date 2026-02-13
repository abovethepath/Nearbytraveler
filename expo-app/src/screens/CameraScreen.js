import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';

export default function CameraScreen({ navigation }) {
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert('Permission Required', 'We need camera and photo library permissions to update your profile picture.');
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
      console.error('Camera error:', error);
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  };

  const uploadPhoto = async () => {
    if (!image) {
      Alert.alert('No Image', 'Please take or select a photo first');
      return;
    }

    setUploading(true);
    try {
      // In a real app, you'd upload to your backend here
      // For now, we'll just update the profile with the local URI
      await api.updateProfile(user.id, { profileImage: image });
      
      Alert.alert('Success', 'Profile photo updated!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Update Profile Photo</Text>
        <Text style={styles.subtitle}>Take a new photo or choose from your library</Text>
      </View>

      <View style={styles.previewContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderText}>No photo selected</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={takePhoto} activeOpacity={0.8}>
          <Text style={styles.buttonIcon}>📸</Text>
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={pickImage} activeOpacity={0.8}>
          <Text style={styles.buttonIcon}>🖼️</Text>
          <Text style={styles.buttonText}>Choose from Library</Text>
        </TouchableOpacity>
      </View>

      {image && (
        <TouchableOpacity 
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]} 
          onPress={uploadPhoto}
          disabled={uploading}
          activeOpacity={0.8}
        >
          {uploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.uploadButtonText}>Upload Photo</Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  preview: { width: 300, height: 300, borderRadius: 150, backgroundColor: '#E5E7EB' },
  placeholder: { width: 300, height: 300, borderRadius: 150, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#D1D5DB', borderStyle: 'dashed' },
  placeholderIcon: { fontSize: 64, marginBottom: 12 },
  placeholderText: { fontSize: 16, color: '#9CA3AF' },
  buttonContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  button: { flex: 1, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  buttonIcon: { fontSize: 32, marginBottom: 8 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  uploadButton: { marginHorizontal: 20, backgroundColor: '#F97316', padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
  uploadButtonDisabled: { opacity: 0.6 },
  uploadButtonText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  cancelButton: { marginHorizontal: 20, padding: 18, alignItems: 'center', marginBottom: 20 },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
});