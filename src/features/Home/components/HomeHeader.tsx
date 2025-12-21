import React, {useMemo} from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {styles} from 'home/styles/Home';

export const HomeHeader = ({
  handleTagPress,
  isDark,
  selectedTag,
  trendingTags,
}: {
  handleTagPress: (tag: string) => void;
  trendingTags: string[];
  selectedTag: string | null;
  isDark: boolean;
}) => {
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
          const trendingTagStyle = {
            borderWidth: selectedTag === tag ? 2 : 0,
            color: selectedTag === tag ? '#0095f6' : isDark ? 'white' : 'black',
          };
          return (
            <TouchableOpacity
              key={tag}
              style={[styles.tagButton, tagButtonStyle,trendingTagStyle]}
              onPress={() => handleTagPress(tag)}>
              <Text style={[styles.tagText,{color:trendingTagStyle.color}]}>
                {tag.includes('#') ? tag : `#${tag}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {selectedTag && (
        <View style={styles.filterInfo}>
          <Text
            style={[styles.filterText, {color: isDark ? 'white' : 'black'}]}>
            Showing posts tagged with{' '}
            {selectedTag.includes('#') ? selectedTag : `#${selectedTag}`}
          </Text>
          <TouchableOpacity
            onPress={() => handleTagPress(selectedTag)}
            style={styles.clearFilterButton}>
            <Text style={{color: '#0095f6'}}>Clear filter</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};
