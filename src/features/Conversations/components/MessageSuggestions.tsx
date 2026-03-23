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
    const suggestionStyles = styles as any;

    return (
        <View
            style={[
                suggestionStyles.suggestionsContainer,
                isDark && suggestionStyles.darkSuggestionsContainer,
            ]}>
            {isFetchingSuggestions ? (
                <View style={suggestionStyles.suggestionsLoading}>
                    <ActivityIndicator
                        size="small"
                        color={isDark ? '#8ab4f8' : '#2379C2'}
                    />
                    <Text
                        style={[
                            suggestionStyles.suggestionsLoadingText,
                            isDark && suggestionStyles.darkSuggestionsLoadingText,
                        ]}>
                        Thinking...
                    </Text>
                </View>
            ) : suggestions.length > 0 ? (
                suggestions.map(suggestion => (
                    <TouchableOpacity
                        key={suggestion}
                        style={[
                            suggestionStyles.suggestionButton,
                            isDark && suggestionStyles.darkSuggestionButton,
                        ]}
                        onPress={() => onSuggestionClick(suggestion)}>
                        <Text
                            style={[
                                suggestionStyles.suggestionText,
                                isDark && suggestionStyles.darkSuggestionText,
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
