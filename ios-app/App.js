import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Platform, SafeAreaView, StatusBar, BackHandler, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const WEBSITE_URL = 'https://nearbytraveler.org';

export default function App() {
  const webViewRef = useRef(null);
  const [pushToken, setPushToken] = useState('');
  const [location, setLocation] = useState(null);

  useEffect(() => {
    registerForPushNotifications();
    requestLocationPermission();
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, []);

  async function registerForPushNotifications() {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return;
      }
      
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      setPushToken(token.data);
      console.log('Push token:', token.data);
    } catch (error) {
      console.log('Error getting push token:', error);
    }
  }

  async function requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    } catch (error) {
      console.log('Error getting location:', error);
    }
  }

  const injectedJavaScript = `
    (function() {
      window.isNativeApp = true;
      window.nativePushToken = '${pushToken}';
      window.nativeLocation = ${JSON.stringify(location)};
      
      // Inject native capabilities into the web app
      window.NativeApp = {
        getPushToken: function() { return '${pushToken}'; },
        getLocation: function() { return ${JSON.stringify(location)}; },
        requestLocation: function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'requestLocation' }));
        },
        sendNotification: function(title, body) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'notification', title, body }));
        }
      };
      
      true;
    })();
  `;

  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'requestLocation') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
        webViewRef.current?.injectJavaScript(`
          window.nativeLocation = ${JSON.stringify(currentLocation)};
          if (window.onNativeLocationUpdate) {
            window.onNativeLocationUpdate(${JSON.stringify(currentLocation)});
          }
        `);
      }
      
      if (data.type === 'notification') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: data.title,
            body: data.body,
          },
          trigger: null,
        });
      }
    } catch (error) {
      console.log('Error handling message:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <WebView
        ref={webViewRef}
        source={{ uri: WEBSITE_URL }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsBackForwardNavigationGestures={true}
        injectedJavaScript={injectedJavaScript}
        onMessage={handleMessage}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error:', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('HTTP error:', nativeEvent.statusCode);
        }}
        userAgent="NearbyTravelerApp/1.0 (iOS; WebView)"
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        geolocationEnabled={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  webview: {
    flex: 1,
  },
});
