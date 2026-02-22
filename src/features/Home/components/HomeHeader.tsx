import React, { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from 'home/styles/Home';
import { HomeHeaderProps } from '../types';

export const HomeHeader = ({
  handleTagPress,
  isDark,
  selectedTag,
  trendingTags,
}: HomeHeaderProps) => {
  const tagButtonStyle = useMemo(() => {
    return {
      backgroundColor: isDark ? '#2a2a2a' : '#F0F0F0',
      borderColor: '#0095f6',
    };
  }, [isDark]);

  return (
    <>
      {/* Stories */}
      {/* <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.storiesContainer}
                >
                  {stories.map(story => (
                    <View key={story.id} style={styles.storyItem}>
                      <Image source={story.image} style={styles.storyImage} />
                    </View>
                  ))}
                </ScrollView> */}
      {/* Tags */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tagsContainer}>
        {trendingTags.map(tag => {
          const isSelected = selectedTag === tag;
          const tagBorderStyle = { borderWidth: isSelected ? 2 : 0 };
          const tagTextColorStyle = {
            color: isSelected ? '#0095f6' : isDark ? 'white' : 'black',
          };
          return (
            <TouchableOpacity
              key={tag}
              style={[styles.tagButton, tagButtonStyle, tagBorderStyle]}
              onPress={() => handleTagPress(tag)}>
              <Text style={[styles.tagText, tagTextColorStyle]}>
                {tag.includes('#') ? tag : `#${tag}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {selectedTag && (
        <View style={styles.filterInfo}>
          {(() => {
            const filterTextColorStyle = { color: isDark ? 'white' : 'black' };
            return (
              <>
                <Text style={[styles.filterText, filterTextColorStyle]}>
                  Showing posts tagged with{' '}
                  {selectedTag.includes('#') ? selectedTag : `#${selectedTag}`}
                </Text>
                <TouchableOpacity
                  onPress={() => handleTagPress(selectedTag)}
                  style={styles.clearFilterButton}>
                  <Text style={styles.clearFilterText}>Clear filter</Text>
                </TouchableOpacity>
              </>
            );
          })()}
        </View>
      )}
    </>
  );
};
