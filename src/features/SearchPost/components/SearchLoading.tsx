import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { styles } from 'shared/styles/Home';
import { primaryColor } from 'shared/res/strings/eng';
import { searchStyles } from '../styles/Search';
import { SearchLoadingProps } from '../types';

const SearchLoading: React.FC<SearchLoadingProps> = ({ isDark, searchText }) => (
    <View style={[styles.container, searchStyles.centeredContainer]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text
            style={[
                searchStyles.searchingText,
                isDark ? searchStyles.darkSearchingText : searchStyles.lightSearchingText,
            ]}>
            Searching for "{searchText}"...
        </Text>
    </View>
);

export default SearchLoading;
