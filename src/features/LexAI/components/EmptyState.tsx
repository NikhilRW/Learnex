import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from 'lex-ai/styles/LexAI.styles';
import { ThemeColors } from '../types/lexAI.types';

interface EmptyStateProps {
    colors: ThemeColors;
    isDarkMode: boolean;
    greeting: string;
    suggestions: string[];
    onSuggestionPress: (suggestion: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    colors,
    isDarkMode,
    greeting,
    suggestions,
    onSuggestionPress,
}) => {
    return (
        <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>{greeting}</Text>
            <View
                style={[
                    styles.suggestionsContainer,
                    isDarkMode
                        ? styles.suggestionsContainerBorderDark
                        : styles.suggestionsContainerBorderLight,
                ]}>
                {suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                        key={`suggestion-${index}`}
                        style={[
                            styles.suggestionChip,
                            isDarkMode
                                ? styles.suggestionChipDark
                                : styles.suggestionChipLight,
                        ]}
                        onPress={() => onSuggestionPress(suggestion)}>
                        <Text style={[styles.suggestionText, { color: colors.primary }]}>
                            {suggestion}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};
