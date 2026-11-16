import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  DefaultTheme,
  NavigationContainer,
  type LinkingOptions,
  type Theme as NavTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { env } from '@/config/env';
import { useSession } from '@/store/session';
import { useTheme } from '@/theme';
// Public
import { HomeScreen } from '@/screens/public/HomeScreen';
import { EventsScreen } from '@/screens/public/EventsScreen';
import { EventDetailScreen } from '@/screens/public/EventDetailScreen';
import { GalleryScreen } from '@/screens/public/GalleryScreen';
import { AlbumDetailScreen } from '@/screens/public/AlbumDetailScreen';
import { MediaViewerScreen } from '@/screens/public/MediaViewerScreen';
import { NoticesScreen } from '@/screens/public/NoticesScreen';
import { AnnouncementDetailScreen } from '@/screens/public/AnnouncementDetailScreen';
import { AboutScreen } from '@/screens/public/AboutScreen';
import { CommitteeScreen } from '@/screens/public/CommitteeScreen';
import { ContactsScreen } from '@/screens/public/ContactsScreen';
// Auth
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { OtpScreen } from '@/screens/auth/OtpScreen';
// Resident
import { MoreScreen } from '@/screens/resident/MoreScreen';
import { DirectoryScreen } from '@/screens/resident/DirectoryScreen';
import { ComplaintsScreen } from '@/screens/resident/ComplaintsScreen';
import { ComplaintDetailScreen } from '@/screens/resident/ComplaintDetailScreen';
import { NewComplaintScreen } from '@/screens/resident/NewComplaintScreen';
import { PollsScreen } from '@/screens/resident/PollsScreen';
import { PollDetailScreen } from '@/screens/resident/PollDetailScreen';
import { NotificationsScreen } from '@/screens/resident/NotificationsScreen';
import { ProfileScreen } from '@/screens/resident/ProfileScreen';
import { SettingsScreen } from '@/screens/resident/SettingsScreen';
// Admin
import { AdminDashboardScreen } from '@/screens/admin/AdminDashboardScreen';
import { AdminAnnouncementsScreen } from '@/screens/admin/AdminAnnouncementsScreen';
import { AnnouncementEditorScreen } from '@/screens/admin/AnnouncementEditorScreen';
import { AdminEventsScreen } from '@/screens/admin/AdminEventsScreen';
import { EventEditorScreen } from '@/screens/admin/EventEditorScreen';
import { AdminAlbumsScreen } from '@/screens/admin/AdminAlbumsScreen';
import { AlbumUploadScreen } from '@/screens/admin/AlbumUploadScreen';
import { AdminComplaintsScreen } from '@/screens/admin/AdminComplaintsScreen';
import { ThemeStudioScreen } from '@/screens/admin/ThemeStudioScreen';
import { ThemeDetailScreen } from '@/screens/admin/ThemeDetailScreen';
import { ThemeSimulatorScreen } from '@/screens/admin/ThemeSimulatorScreen';
import { DeliveryStatusScreen } from '@/screens/admin/DeliveryStatusScreen';
import { AuditLogScreen } from '@/screens/admin/AuditLogScreen';
// Dev
import { ComponentGalleryScreen } from '@/screens/dev/ComponentGalleryScreen';
import { TabBar } from './TabBar';
import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const renderTabBar = (props: BottomTabBarProps) => <TabBar {...props} />;

function Tabs() {
  return (
    <Tab.Navigator tabBar={renderTabBar} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Gallery" component={GalleryScreen} />
      <Tab.Screen name="Notices" component={NoticesScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

/** Deep links: dblockeok://events/diwali-milan or https://dblockeok.com/events/diwali-milan */
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['dblockeok://', 'https://dblockeok.com'],
  config: {
    screens: {
      Tabs: {
        screens: {
          Home: '',
          Events: 'events',
          Gallery: 'gallery',
          Notices: 'announcements',
          More: 'more',
        },
      },
      EventDetail: 'events/:slug',
      AnnouncementDetail: 'announcements/:id',
      ComplaintDetail: 'complaints/:id',
      Complaints: 'complaints',
      PollDetail: 'polls/:id',
      Polls: 'polls',
      AlbumDetail: 'gallery/:albumId',
      Notifications: 'notifications',
      Login: 'login',
    },
  },
};

/** Shown while the stored session is checked on launch — no screen is reachable yet. */
function Splash() {
  const theme = useTheme();
  return (
    <View
      style={[styles.splash, { backgroundColor: theme.colors.background }]}
      accessibilityLabel="Checking your sign-in"
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

/**
 * Strict authentication: signed-out users can only reach Login/Otp. Every
 * other screen is registered only after sign-in, so neither navigation calls
 * nor deep links can open them. Sign-out or an expired session (401) switches
 * straight back to Login.
 */
export function RootNavigator() {
  const theme = useTheme();
  const status = useSession(s => s.status);
  const navTheme = useMemo<NavTheme>(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.danger,
      },
    }),
    [theme],
  );

  if (status === 'restoring') {
    return <Splash />;
  }

  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        {status !== 'signedIn' ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ animationTypeForReplace: 'pop' }}
            />
            <Stack.Screen name="Otp" component={OtpScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Tabs" component={Tabs} />
            <Stack.Group
              screenOptions={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            >
              <Stack.Screen
                name="NewComplaint"
                component={NewComplaintScreen}
              />
              <Stack.Screen
                name="AnnouncementEditor"
                component={AnnouncementEditorScreen}
              />
              <Stack.Screen name="EventEditor" component={EventEditorScreen} />
            </Stack.Group>
            <Stack.Screen
              name="MediaViewer"
              component={MediaViewerScreen}
              options={{ animation: 'fade', presentation: 'fullScreenModal' }}
            />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
            <Stack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
            <Stack.Screen
              name="AnnouncementDetail"
              component={AnnouncementDetailScreen}
            />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="Committee" component={CommitteeScreen} />
            <Stack.Screen name="Contacts" component={ContactsScreen} />
            <Stack.Screen name="Directory" component={DirectoryScreen} />
            <Stack.Screen name="Complaints" component={ComplaintsScreen} />
            <Stack.Screen
              name="ComplaintDetail"
              component={ComplaintDetailScreen}
            />
            <Stack.Screen name="Polls" component={PollsScreen} />
            <Stack.Screen name="PollDetail" component={PollDetailScreen} />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
            />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen
              name="AdminDashboard"
              component={AdminDashboardScreen}
            />
            <Stack.Screen
              name="AdminAnnouncements"
              component={AdminAnnouncementsScreen}
            />
            <Stack.Screen name="AdminEvents" component={AdminEventsScreen} />
            <Stack.Screen name="AdminAlbums" component={AdminAlbumsScreen} />
            <Stack.Screen name="AlbumUpload" component={AlbumUploadScreen} />
            <Stack.Screen
              name="AdminComplaints"
              component={AdminComplaintsScreen}
            />
            <Stack.Screen name="ThemeStudio" component={ThemeStudioScreen} />
            <Stack.Screen name="ThemeDetail" component={ThemeDetailScreen} />
            <Stack.Screen
              name="ThemeSimulator"
              component={ThemeSimulatorScreen}
            />
            <Stack.Screen
              name="DeliveryStatus"
              component={DeliveryStatusScreen}
            />
            <Stack.Screen name="AuditLog" component={AuditLogScreen} />
            {env.SHOW_DEV_TOOLS ? (
              <Stack.Screen
                name="ComponentGallery"
                component={ComponentGalleryScreen}
              />
            ) : null}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
