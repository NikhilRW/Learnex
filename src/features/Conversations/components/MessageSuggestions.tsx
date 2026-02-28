import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { styles } from 'conversations/styles/Chat';
import { MessageSuggestionsProps } from '../types';

const MessageSuggestions: React.FC<MessageSuggestionsProps> = ({
    isDark,
    suggestions,
    isFetchingSuggestions,
    onSuggestionClick,
}) => {
    return (
        <View
            style={[
                styles.suggestionsContainer,
                isDark && styles.darkSuggestionsContainer,
            ]}>
            {isFetchingSuggestions ? (
                <View style={styles.suggestionsLoading}>
                    <ActivityIndicator
                        size="small"
                        color={isDark ? '#8ab4f8' : '#2379C2'}
                    />
                    <Text
                        style={[
                            styles.suggestionsLoadingText,
                            isDark && styles.darkSuggestionsLoadingText,
                        ]}>
                        Thinking...
                    </Text>
                </View>
            ) : suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.suggestionButton,
                            isDark && styles.darkSuggestionButton,
                        ]}
                        onPress={() => onSuggestionClick(suggestion)}>
                        <Text
                            style={[
                                styles.suggestionText,
                                isDark && styles.darkSuggestionText,
                            ]}
                            numberOfLines={1}>
                            {suggestion}
                        </Text>
                    </TouchableOpacity>
                ))
            ) : null}
        </View>
    );
};

export default MessageSuggestions;
