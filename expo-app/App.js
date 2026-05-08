import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './src/services/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import api from './src/services/api';

function PushTokenRegistrar() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      if (!Device.isDevice) return;
      try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        console.log('📱 Expo push token:', token.data);
        await api.registerPushToken(token.data);
      } catch (e) {
        console.log('Push token setup error:', e);
      }
    })();
  }, [user?.id]);

  return null;
}

export default function App() {
  // Defer setNotificationHandler until after React mounts AND native bridges
  // are ready. Top-level calls race with native init on TestFlight cold launch
  // and can throw silently before any UI renders. SDK 54 also replaced the
  // deprecated shouldShowAlert with shouldShowBanner + shouldShowList.
  useEffect(() => {
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    } catch (e) {
      console.warn('Failed to set notification handler:', e);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AuthProvider>
        <PushTokenRegistrar />
        <AppNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
