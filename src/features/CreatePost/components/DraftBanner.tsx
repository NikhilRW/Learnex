import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { DraftBannerProps } from '../types';

const DraftBanner: React.FC<DraftBannerProps> = ({
    onRestore,
    onDiscard,
    styles,
}) => (
    <View style={styles.draftBanner}>
        <Text style={styles.draftBannerText}>
            You have an unfinished post draft.
        </Text>
        <View style={styles.draftBannerButtons}>
            <TouchableOpacity style={styles.draftButton} onPress={onRestore}>
                <Text style={styles.draftButtonText}>Restore</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.draftButton} onPress={onDiscard}>
                <Text style={styles.draftButtonText}>Discard</Text>
            </TouchableOpacity>
        </View>
    </View>
);

export default DraftBanner;
