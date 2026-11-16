import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type TabParamList = {
  Home: undefined;
  Events: undefined;
  Gallery: undefined;
  Notices: undefined;
  More: undefined;
};

export type OtpParams =
  | { mode: 'otp'; mobile: string; resendIn: number; devSms?: string | null }
  | { mode: 'mfa'; challengeId: string; mobileHint: string; resendIn: number; mobile: string; devSms?: string | null };

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  // Auth
  Login: undefined;
  Otp: OtpParams;
  // Content
  EventDetail: { id?: string; slug?: string };
  AlbumDetail: { albumId: string };
  MediaViewer: { albumId: string; index: number };
  AnnouncementDetail: { id: string };
  About: undefined;
  Committee: undefined;
  Contacts: undefined;
  // Resident
  Directory: undefined;
  Complaints: undefined;
  ComplaintDetail: { id: string };
  NewComplaint: undefined;
  Polls: undefined;
  PollDetail: { id: string };
  Notifications: undefined;
  Profile: undefined;
  Settings: undefined;
  // Committee / admin
  AdminDashboard: undefined;
  AdminAnnouncements: undefined;
  AnnouncementEditor: { id?: string };
  AdminEvents: undefined;
  EventEditor: { id?: string };
  AdminAlbums: undefined;
  /** Without `albumId` the screen asks which album to upload into. */
  AlbumUpload: { albumId?: string } | undefined;
  AdminComplaints: undefined;
  ThemeStudio: undefined;
  ThemeDetail: { themeId: string };
  ThemeSimulator: undefined;
  DeliveryStatus: undefined;
  AuditLog: undefined;
  // Developer
  ComponentGallery: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
