import React, {memo, useCallback, useMemo} from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {styles} from 'home/styles/Home';
import {HomeHeaderProps} from '../types';

type TagChipProps = {
  tag: string;
  isDark: boolean;
  isSelected: boolean;
  onPress: (tag: string) => void;
};

const TagChip = memo(({tag, isDark, isSelected, onPress}: TagChipProps) => {
  const tagButtonStyle = useMemo(
    () => ({
      backgroundColor: isDark ? '#2a2a2a' : '#F0F0F0',
      borderColor: '#0095f6',
      borderWidth: isSelected ? 2 : 0,
    }),
    [isDark, isSelected],
  );

  const tagTextStyle = useMemo(
    () => ({
      color: isSelected ? '#0095f6' : isDark ? 'white' : 'black',
    }),
    [isDark, isSelected],
  );

  const handlePress = useCallback(() => onPress(tag), [onPress, tag]);

  return (
    <TouchableOpacity
      style={[styles.tagButton, tagButtonStyle]}
      onPress={handlePress}>
      <Text style={[styles.tagText, tagTextStyle]}>
        {tag.includes('#') ? tag : `#${tag}`}
      </Text>
    </TouchableOpacity>
  );
});

TagChip.displayName = 'TagChip';

export const HomeHeader = memo(
  ({handleTagPress, isDark, selectedTag, trendingTags}: HomeHeaderProps) => {
    const handleClearFilter = useCallback(() => {
      if (selectedTag) {
        handleTagPress(selectedTag);
      }
    }, [handleTagPress, selectedTag]);

    const filterTextStyle = useMemo(
      () => ({color: isDark ? 'white' : 'black'}),
      [isDark],
    );

    const selectedTagLabel = useMemo(() => {
      if (!selectedTag) return '';
      return selectedTag.includes('#') ? selectedTag : `#${selectedTag}`;
    }, [selectedTag]);

    return (
      <View style={styles.container}>
        {/* TODO: fix the last chip problem not visible fully */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.contentContainerStyle}
          style={styles.tagsContainer}>
          {trendingTags.map(tag => (
            <TagChip
              key={tag}
              tag={tag}
              isDark={isDark}
              isSelected={selectedTag === tag}
              onPress={handleTagPress}
            />
          ))}
        </ScrollView>
        {selectedTag && (
          <View style={styles.filterInfo}>
            <Text style={[styles.filterText, filterTextStyle]}>
              Showing posts tagged with {selectedTagLabel}
            </Text>
            <TouchableOpacity
              onPress={handleClearFilter}
              style={styles.clearFilterButton}>
              <Text style={styles.clearFilterText}>Clear filter</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  },
);

HomeHeader.displayName = 'HomeHeader';
