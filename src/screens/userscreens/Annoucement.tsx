import { Text, View, ScrollView, RefreshControl } from 'react-native'
import React, { useState, useCallback } from 'react'
import { styles } from '../../styles/screens/userscreens/Announcement.styles';
import { useTypedSelector } from '../../hooks/useTypedSelector';

const Announcement = () => {
  const [refreshing, setRefreshing] = useState(false);
  const isDark = useTypedSelector((state) => state.user.theme) === "dark";

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);

    // Here you would typically fetch new announcements data
    // For example: fetchAnnouncements()
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#0095f6']}
          tintColor={isDark ? '#ffffff' : '#0095f6'}
          progressBackgroundColor={isDark ? '#2a2a2a' : '#f0f0f0'}
        />
      }
    >
      <Text style={{ color: isDark ? '#ffffff' : '#000000' }}>Announcement</Text>
    </ScrollView>
  )
}

export default Announcement