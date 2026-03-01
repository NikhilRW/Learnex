import { LegendList } from '@legendapp/list';
import React from 'react';
import { View, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useTypedSelector } from 'hooks/redux/useTypedSelector';
import Post from 'home/components/Post';
import { SafeAreaView } from 'react-native-safe-area-context';
import { primaryColor } from 'shared/res/strings/eng';
import { UserStackParamList } from 'shared/navigation/routes/UserStack';
import { styles } from '../styles/SavedPosts';
import { useSavedPosts } from '../hooks/useSavedPosts';
import SavedPostsHeader from '../components/SavedPostsHeader';
import SavedPostsEmptyState from '../components/SavedPostsEmptyState';

const ItemSeparator = () => <View style={styles.separator} />;

/**
 * SavedPosts screen displays all posts that the user has saved.
 * Shows a nice empty state when no saved posts exist.
 */
const SavedPosts: React.FC = () => {
  const isDark = useTypedSelector(state => state.user.theme) === 'dark';
  const navigation = useNavigation<DrawerNavigationProp<UserStackParamList>>();
  const { savedPosts, loading, refreshing, onRefresh } = useSavedPosts();

  return (
    <SafeAreaView
      style={[
        styles.container,
        isDark ? styles.darkContainer : styles.lightContainer,
      ]}>
      <SavedPostsHeader isDark={isDark} onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      ) : (
        <LegendList
          data={savedPosts}
          keyExtractor={item => item.id}
          ItemSeparatorComponent={ItemSeparator}
          renderItem={({ item }) => <Post post={item} isVisible={true} />}
          contentContainerStyle={
            savedPosts.length === 0
              ? styles.contentContainerEmpty
              : styles.contentContainer
          }
          ListEmptyComponent={
            <SavedPostsEmptyState
              isDark={isDark}
              onExplore={() => navigation.navigate('Home')}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[primaryColor]}
              tintColor={isDark ? 'white' : primaryColor}
            />
          }
          estimatedItemSize={500}
        />
      )}
    </SafeAreaView>
  );
};

export default SavedPosts;