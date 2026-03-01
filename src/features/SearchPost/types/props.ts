import React from 'react';
import {ViewToken} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {UserStackParamList} from 'shared/navigation/routes/UserStack';
import {PostType} from 'shared/types/post';

export interface SearchLoadingProps {
  isDark: boolean;
  searchText?: string;
}

export interface SearchEmptyStateProps {
  isDark: boolean;
}

export interface ViewabilityPair {
  viewabilityConfig: {itemVisiblePercentThreshold: number};
  onViewableItemsChanged: (params: {viewableItems: Array<ViewToken>}) => void;
}

export interface UseSearchPostsResult {
  posts: PostType[];
  loading: boolean;
  refreshing: boolean;
  visibleVideoId: string | null;
  onRefresh: () => Promise<void>;
  viewabilityConfigCallbackPairs: React.MutableRefObject<ViewabilityPair[]>;
}

export type SearchScreenRouteProp = RouteProp<UserStackParamList, 'Search'>;
