import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { styles } from '../styles/SavedPosts';
import { SavedPostsHeaderProps } from '../types';

const SavedPostsHeader: React.FC<SavedPostsHeaderProps> = ({
    isDark,
    onBack,
}) => (
    <View style={[styles.header, isDark ? styles.darkHeader : styles.lightHeader]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={isDark ? 'white' : 'black'} />
        </TouchableOpacity>
        <Text
            style={[
                styles.headerTitle,
                isDark ? styles.darkHeaderTitle : styles.lightHeaderTitle,
            ]}>
            Saved Posts
        </Text>
        <View style={styles.spacer} />
    </View>
);

export default SavedPostsHeader;
