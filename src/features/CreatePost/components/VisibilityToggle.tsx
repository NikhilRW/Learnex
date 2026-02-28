import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { VisibilityToggleProps } from '../types';

const VisibilityToggle: React.FC<VisibilityToggleProps> = ({
    isPublic,
    onChange,
    styles,
}) => (
    <View style={styles.visibilityContainer}>
        <Text style={styles.visibilityLabel}>Post Visibility</Text>
        <View style={styles.visibilityButtons}>
            <TouchableOpacity
                style={[
                    styles.visibilityButton,
                    isPublic && styles.visibilityButtonActive,
                ]}
                onPress={() => onChange(true)}>
                <Text
                    style={[
                        styles.visibilityText,
                        isPublic && styles.visibilityTextActive,
                    ]}>
                    Public
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                    styles.visibilityButton,
                    !isPublic && styles.visibilityButtonActive,
                ]}
                onPress={() => onChange(false)}>
                <Text
                    style={[
                        styles.visibilityText,
                        !isPublic && styles.visibilityTextActive,
                    ]}>
                    Private
                </Text>
            </TouchableOpacity>
        </View>
    </View>
);

export default VisibilityToggle;
