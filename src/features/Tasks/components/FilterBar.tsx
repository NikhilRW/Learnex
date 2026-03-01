import React from 'react';
import { ScrollView, TouchableOpacity, Text } from 'react-native';
import { styles } from 'tasks/styles/Tasks.styles';
import { FilterBarProps } from '../types';

const FilterBar: React.FC<FilterBarProps> = ({
    filters,
    selectedFilter,
    isDark,
    onSelectFilter,
}) => (
    <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}>
        {filters.map(({ key, label }) => (
            <TouchableOpacity
                key={key}
                style={[
                    styles.filterButton,
                    selectedFilter === key
                        ? styles.activeFilterButton
                        : isDark
                            ? styles.filterButtonDark
                            : styles.filterButtonLight,
                ]}
                onPress={() => onSelectFilter(key)}>
                <Text
                    style={[
                        styles.filterText,
                        selectedFilter === key || isDark
                            ? styles.filterTextActive
                            : styles.filterTextLight,
                    ]}>
                    {label}
                </Text>
            </TouchableOpacity>
        ))}
    </ScrollView>
);

export default React.memo(FilterBar);
