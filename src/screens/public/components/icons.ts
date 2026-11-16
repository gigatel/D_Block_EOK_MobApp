import {
  Bell,
  CalendarHeart,
  Dumbbell,
  Flag,
  HeartPulse,
  Megaphone,
  Music,
  PartyPopper,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react-native';
import type { AnnouncementCategory, EventCategory } from '@/types/models';
import type { Tone } from '@/components';

export const EVENT_ICON: Record<EventCategory, LucideIcon> = {
  Festival: Sparkles,
  National: Flag,
  Community: Users,
  Health: HeartPulse,
  Meeting: CalendarHeart,
  Sports: Dumbbell,
  Cultural: Music,
};

export const NOTICE_ICON: Record<AnnouncementCategory, LucideIcon> = {
  Notice: Bell,
  Circular: ScrollText,
  Maintenance: Wrench,
  Security: ShieldCheck,
  Event: PartyPopper,
  General: Megaphone,
};

export const NOTICE_TONE: Record<AnnouncementCategory, Tone> = {
  Notice: 'info',
  Circular: 'primary',
  Maintenance: 'warning',
  Security: 'danger',
  Event: 'accent',
  General: 'neutral',
};
