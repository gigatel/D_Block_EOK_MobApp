import {
  Bell,
  CalendarDays,
  Car,
  Droplets,
  Leaf,
  Megaphone,
  MoreHorizontal,
  Palette,
  ShieldCheck,
  Trash2,
  Vote,
  Wrench,
  Volume2,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import type { ComplaintCategory, NotificationCategory } from '@/types/models';

export const COMPLAINT_ICON: Record<ComplaintCategory, LucideIcon> = {
  Security: ShieldCheck,
  Sanitation: Trash2,
  Electricity: Zap,
  Water: Droplets,
  Parking: Car,
  'Park & Greenery': Leaf,
  Noise: Volume2,
  Other: MoreHorizontal,
};

export const NOTIFICATION_ICON: Record<NotificationCategory, LucideIcon> = {
  general: Bell,
  announcements: Megaphone,
  events: CalendarDays,
  complaints: Wrench,
  polls: Vote,
  theme: Palette,
};
