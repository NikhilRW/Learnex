import React from 'react';
import { View, Text } from 'react-native';
import { styles } from 'shared/styles/Home';
import { searchStyles } from '../styles/Search';
import { SearchEmptyStateProps } from '../types';

const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({ isDark }) => (
    <View style={[styles.container, searchStyles.centeredContainer]}>
        <Text
            style={[
                searchStyles.noResultsText,
                isDark
                    ? searchStyles.darkNoResultsText
                    : searchStyles.lightNoResultsText,
            ]}>
            No results found
        </Text>
    </View>
);

export default SearchEmptyState;
