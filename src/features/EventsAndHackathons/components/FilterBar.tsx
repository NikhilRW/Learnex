import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FilterBarProps } from '../types';

/**
 * FilterBar component - renders filter buttons for event types
 */
const FilterBar: React.FC<FilterBarProps> = ({ filterType, onFilterChange, styles }) => {
    return (
        <View style={styles.filterContainer}>
            <TouchableOpacity
                style={[
                    styles.filterButton,
                    filterType === 'all' && styles.filterButtonActive,
                ]}
                onPress={() => onFilterChange('all')}
            >
                <Text
                    style={[
                        styles.filterText,
                        filterType === 'all' && styles.filterTextActive,
                    ]}
                >
                    All Types
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.filterButton,
                    filterType === 'online' && styles.onlineFilterButtonActive,
                ]}
                onPress={() => onFilterChange('online')}
            >
                <Text
                    style={[
                        styles.filterText,
                        filterType === 'online' && styles.onlineFilterTextActive,
                    ]}
                >
                    Online
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.filterButton,
                    filterType === 'in-person' && styles.inPersonFilterButtonActive,
                ]}
                onPress={() => onFilterChange('in-person')}
            >
                <Text
                    style={[
                        styles.filterText,
                        filterType === 'in-person' && styles.inPersonFilterTextActive,
                    ]}
                >
                    In-Person
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default FilterBar;
