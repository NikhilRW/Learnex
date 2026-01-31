import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { TabSelectorProps } from '../types/props';
import { styles } from '../styles/Room';

/**
 * Component for switching between Create and Join tabs
 */
export const TabSelector: React.FC<TabSelectorProps> = ({
    activeTab,
    onTabChange,
    isDark,
    isSmallScreen,
}) => {
    return (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[
                    styles.tab,
                    activeTab === 'create' && styles.activeTab,
                    isDark && styles.darkTab,
                    activeTab === 'create' && isDark && styles.darkActiveTab,
                ]}
                onPress={() => onTabChange('create')}>
                <Text
                    style={[
                        styles.tabText,
                        activeTab === 'create' && styles.activeTabText,
                        isDark && styles.darkTabText,
                        activeTab === 'create' && isDark && styles.darkActiveTabText,
                        isSmallScreen && styles.smallTabText,
                    ]}>
                    Create
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                    styles.tab,
                    activeTab === 'join' && styles.activeTab,
                    isDark && styles.darkTab,
                    activeTab === 'join' && isDark && styles.darkActiveTab,
                ]}
                onPress={() => onTabChange('join')}>
                <Text
                    style={[
                        styles.tabText,
                        activeTab === 'join' && styles.activeTabText,
                        isDark && styles.darkTabText,
                        activeTab === 'join' && isDark && styles.darkActiveTabText,
                        isSmallScreen && styles.smallTabText,
                    ]}>
                    Join
                </Text>
            </TouchableOpacity>
        </View>
    );
};
