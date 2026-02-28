import React from 'react';
import { View, Text } from 'react-native';
import { UploadProgressProps } from '../types';

const UploadProgress: React.FC<UploadProgressProps> = ({
    uploadProgress,
    currentUploadIndex,
    totalCount,
    isDark,
    styles,
}) => {
    const progressBarWidthStyle = { width: `${uploadProgress}%` as `${number}%` };

    return (
        <View
            style={[
                styles.progressContainer,
                isDark ? styles.darkProgressContainer : styles.lightProgressContainer,
            ]}>
            <Text style={styles.progressMediaUploadStatus}>
                Uploading media {currentUploadIndex + 1} of {totalCount}...
            </Text>
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, progressBarWidthStyle]} />
            </View>
            <Text style={styles.progressPercentage}>
                {Math.round(uploadProgress)}%
            </Text>
        </View>
    );
};

export default UploadProgress;
