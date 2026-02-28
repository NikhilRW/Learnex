import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { CaptionInputProps } from '../types';

const CaptionInput: React.FC<CaptionInputProps> = ({
    description,
    isDark,
    showSuggestions,
    suggestions,
    onChangeText,
    onApplySuggestion,
    styles,
}) => (
    <View style={styles.inputContainer}>
        <Text style={styles.label}>Caption *</Text>
        <View>
            <TextInput
                style={styles.contentInput}
                placeholder="Write a caption..."
                placeholderTextColor={isDark ? '#999' : '#999'}
                multiline
                numberOfLines={5}
                value={description}
                onChangeText={onChangeText}
            />
            <Text style={styles.characterCounter}>{description.length}/2200</Text>

            {showSuggestions && (
                <View style={styles.autocompleteContainer}>
                    <ScrollView>
                        {suggestions.map((suggestion, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.suggestionItem}
                                onPress={() => onApplySuggestion(suggestion)}>
                                <Text style={styles.suggestionText}>{suggestion}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    </View>
);

export default CaptionInput;
