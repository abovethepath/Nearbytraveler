import React, { useRef, useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  SafeAreaView, 
  StatusBar, 
  ActivityIndicator,
  BackHandler,
  Platform,
  Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const WEBSITE_URL = 'https://nearbytraveler.org';

// JavaScript to inject for proper viewport and responsive handling
const INJECTED_JAVASCRIPT = `
  (function() {
    // Ensure viewport meta is set correctly for tablets/iPads
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    
    // Add class to indicate we're in a native app wrapper
    document.documentElement.classList.add('native-app-wrapper');
    document.body.classList.add('native-app-wrapper');
    
    // Detect if running on iPad and add class
    const isIPad = /iPad|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
    if (isIPad || window.innerWidth >= 768) {
      document.documentElement.classList.add('tablet-device');
      document.body.classList.add('tablet-device');
    }
    
    // Force layout recalculation on orientation change
    window.addEventListener('orientationchange', function() {
      document.body.style.display = 'none';
      setTimeout(function() {
        document.body.style.display = '';
      }, 10);
    });
    
    true;
  })();
`;

export default function App() {
  const webViewRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    // Handle dimension changes (rotation, multitasking)
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    
    // Handle Android back button
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      });
      
      return () => {
        backHandler.remove();
        subscription?.remove();
      };
    }
    
    return () => subscription?.remove();
  }, [canGoBack]);

  const handleLoadEnd = () => {
    setIsLoading(false);
    SplashScreen.hideAsync();
  };

  const handleNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <WebView
        ref={webViewRef}
        source={{ uri: WEBSITE_URL }}
        style={[styles.webview, { width: dimensions.width, height: dimensions.height }]}
        onLoadEnd={handleLoadEnd}
        onNavigationStateChange={handleNavigationStateChange}
        
        // Inject JavaScript for responsive handling
        injectedJavaScript={INJECTED_JAVASCRIPT}
        
        // Performance optimizations
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        
        // Allow media playback
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        
        // iOS specific
        allowsBackForwardNavigationGestures={true}
        
        // Scaling for iPad
        scalesPageToFit={true}
        contentMode="mobile"
        
        // Geolocation
        geolocationEnabled={true}
        
        // Loading indicator
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F97316" />
          </View>
        )}
        
        // Handle errors gracefully
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
      />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});
