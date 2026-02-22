import {HackathonSummary, HackathonDetails, EventSource} from './hackathon';
import {ViewStyle} from 'react-native';

// ─── EventCard ───────────────────────────────────────────────────────────────

export interface EventCardProps {
  item: HackathonSummary;
  isDark: boolean;
  styles: any;
  onPress: (event: HackathonSummary) => void;
}

// ─── EventLogo ───────────────────────────────────────────────────────────────

export interface EventLogoProps {
  source: EventSource;
  size: number;
  style?: ViewStyle;
  isDark: boolean;
  imageUrl?: string;
}

// ─── EventsHeader ────────────────────────────────────────────────────────────

export interface EventsHeaderProps {
  isDark: boolean;
  loading: boolean;
  styles: any;
  onBackPress: () => void;
  onRefreshPress: () => void;
}

// ─── FilterBar ───────────────────────────────────────────────────────────────

export interface FilterBarProps {
  filterType: string;
  onFilterChange: (filter: string) => void;
  styles: any;
}

// ─── EventContent ────────────────────────────────────────────────────────────

export interface EventContentProps {
  event: HackathonDetails;
}

// ─── EventDetails Header / Footer ────────────────────────────────────────────

export interface EventDetailsHeaderProps {
  isDark: boolean;
  styles: any;
  onBackPress: () => void;
}

export interface EventDetailsFooterProps {
  isDark: boolean;
  styles: any;
  onRegister: () => void;
  onShare: () => void;
}

// ─── EventDetails Sections ───────────────────────────────────────────────────

export interface EventSectionsProps {
  event: HackathonDetails;
  styles: any;
}

// ─── EventDetails States ─────────────────────────────────────────────────────

export interface EventDetailsLoadingProps {
  styles: any;
}

export interface EventDetailsErrorProps {
  error: string;
  styles: any;
  onRetry: () => void;
}

export interface EventDetailsNotFoundProps {
  styles: any;
  onGoBack: () => void;
}

// ─── List (EventsAndHackathons screen) States ────────────────────────────────

export interface ListLoadingProps {
  styles: any;
}

export interface ListErrorProps {
  error: string | null;
  isDark: boolean;
  styles: any;
  onRetry: () => void;
}

export interface ListEmptyProps {
  isDark: boolean;
  styles: any;
  onResetFilters: () => void;
}
