import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { styles } from '../styles/LoadingOverlay';
import { LoadingOverlayProps } from '../types';

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isDark }) => {
    return (
        <View style={[StyleSheet.absoluteFill, styles.overlay]}>
            <View style={[styles.card, isDark ? styles.darkCard : styles.lightCard]}>
                <ActivityIndicator size="large" color="#2379C2" />
                <Text style={[styles.text, isDark ? styles.darkText : styles.lightText]}>
                    Loading conversation...
                </Text>
            </View>
        </View>
    );
};

export default LoadingOverlay;

