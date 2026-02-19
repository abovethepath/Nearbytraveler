import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActionSheetIOS,
  Alert,
  useColorScheme,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../services/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import SignupStep1Screen from '../screens/SignupStep1Screen';
import SignupStep2Screen from '../screens/SignupStep2Screen';
import SignupStep3Screen from '../screens/SignupStep3Screen';
import SignupStep3BusinessScreen from '../screens/SignupStep3BusinessScreen';
import { GenericWebViewScreen, BusinessSignupWebViewScreen } from '../screens/WebViewScreens';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_BAR_HEIGHT = 88;
const TAB_BAR_BG = '#FFFFFF';
const TAB_BAR_BORDER = '#F3F4F6';
const TAB_ACTIVE = '#F97316';
const TAB_INACTIVE = '#9CA3AF';
const ICON_SIZE = 22;
const TAB_BAR_BG_DARK = '#1c1c1e';
const TAB_BAR_BORDER_DARK = '#38383a';
const TAB_INACTIVE_DARK = '#8e8e93';

const TabIcon = ({ emoji, focused }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', width: ICON_SIZE, height: ICON_SIZE }}>
    <Text style={{ fontSize: ICON_SIZE }}>{emoji}</Text>
  </View>
);

// WebView stacks: one screen each with session cookie (GenericWebViewScreen uses api.getSessionCookie())
// gestureEnabled: false prevents iOS swipe-back from dispatching GO_BACK when there's no screen to pop (avoids "GO_BACK was not handled")
function WebViewStack({ path, tabLabel }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="WebViewPage" component={GenericWebViewScreen} initialParams={{ path }} />
    </Stack.Navigator>
  );
}

// Placeholder screen for CREATE tab (tab bar shows custom button; this screen is not shown)
function CreatePlaceholderScreen() {
  const dark = useColorScheme() === 'dark';
  return <View style={{ flex: 1, backgroundColor: dark ? TAB_BAR_BG_DARK : TAB_BAR_BG }} />;
}

// City Plans uses /match-in-city (not /city-plans which doesn't exist and falls back to home)
const CREATE_OPTIONS = [
  { label: 'City Plans', path: '/match-in-city' },
  { label: 'Create Event', path: '/create-event' },
  { label: 'Plan Trip', path: '/plan-trip' },
  { label: 'Create Hangout', path: '/quick-meetups?create=1' },
];

function CreateTabButton(props) {
  const navigation = useNavigation();
  const tabNav = navigation.getParent?.();
  const goToCreateWebView = (path) => {
    if (tabNav) {
      tabNav.navigate('Create', { screen: 'CreateWebView', params: { path } });
    } else {
      navigation.navigate('CreateWebView', { path });
    }
  };
  const onPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...CREATE_OPTIONS.map((o) => o.label), 'Cancel'],
          cancelButtonIndex: CREATE_OPTIONS.length,
        },
        (buttonIndex) => {
          if (buttonIndex < CREATE_OPTIONS.length) {
            goToCreateWebView(CREATE_OPTIONS[buttonIndex].path);
          }
        }
      );
    } else {
      Alert.alert(
        'Create',
        undefined,
        [
          ...CREATE_OPTIONS.map((o) => ({
            text: o.label,
            onPress: () => goToCreateWebView(o.path),
          })),
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  return (
    <TouchableOpacity
      style={styles.createButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.createButtonIcon}>+</Text>
    </TouchableOpacity>
  );
}

// Create tab stack: placeholder + WebView. Keeps tab bar visible when viewing Plan Trip, Create Event, etc.
function CreateStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <Stack.Screen name="CreatePlaceholder" component={CreatePlaceholderScreen} />
      <Stack.Screen name="CreateWebView" component={GenericWebViewScreen} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={SignupStep1Screen} />
      <Stack.Screen name="SignupStep2" component={SignupStep2Screen} />
      <Stack.Screen name="SignupStep3" component={SignupStep3Screen} />
      <Stack.Screen name="SignupStep3Business" component={SignupStep3BusinessScreen} />
      <Stack.Screen name="BusinessSignupWebView" component={BusinessSignupWebViewScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const dark = useColorScheme() === 'dark';
  const tabBarStyle = {
    backgroundColor: dark ? TAB_BAR_BG_DARK : TAB_BAR_BG,
    borderTopWidth: 1,
    borderTopColor: dark ? TAB_BAR_BORDER_DARK : TAB_BAR_BORDER,
    paddingBottom: 8,
    paddingTop: 8,
    height: TAB_BAR_HEIGHT,
  };
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: TAB_ACTIVE,
        tabBarInactiveTintColor: dark ? TAB_INACTIVE_DARK : TAB_INACTIVE,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: { width: ICON_SIZE, height: ICON_SIZE },
        // Keep all tab screens mounted so switching tabs doesn't remount WebViews (fixes Home flashing)
        lazy: false,
        unmountOnBlur: false,
      }}
      detachInactiveScreens={false}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      >
        {() => <WebViewStack path="/profile" tabLabel="Home" />}
      </Tab.Screen>
      <Tab.Screen
        name="Explore"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} />,
        }}
      >
        {() => <WebViewStack path="/discover" tabLabel="Explore" />}
      </Tab.Screen>
      <Tab.Screen
        name="Create"
        component={CreateStack}
        options={{
          tabBarLabel: 'CREATE',
          tabBarButton: (props) => (
            <View style={styles.createTabWrapper}>
              <CreateTabButton {...props} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
        }}
      >
        {() => <WebViewStack path="/messages" tabLabel="Messages" />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      >
        {() => <WebViewStack path="/profile" tabLabel="Profile" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const dark = useColorScheme() === 'dark';

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: dark ? TAB_BAR_BG_DARK : TAB_BAR_BG }]}>
        <Text style={{ fontSize: 40 }}>🌍</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <RootStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: TAB_ACTIVE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
    marginTop: -2,
  },
  createTabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
