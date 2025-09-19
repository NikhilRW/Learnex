import { View } from 'react-native';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { styles } from '../styles/HomeIcon.styles';

const HomeIcon = ({
    focused,
    size,
    color,
}: {
    focused: boolean;
    size: number;
    color: string;
}) => {
    const iconName = focused ? 'home' : 'home-outline';
    return (
        <View
            style={styles.iconContainer}>
            <Ionicons name={iconName} size={size} color={color} />
            {focused && (
                <View
                    style={styles.iconContainer}
                />
            )}
        </View>
    );
};

export default HomeIcon;
