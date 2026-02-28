import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TagsInputProps } from '../types';

const TagsInput: React.FC<TagsInputProps> = ({
    hashtags,
    tagInput,
    isDark,
    onChangeTagInput,
    onAddTag,
    onRemoveTag,
    styles,
}) => (
    <View style={styles.inputContainer}>
        <Text style={styles.label}>Tags</Text>
        <View style={styles.tagInputContainer}>
            <TextInput
                style={styles.tagInput}
                placeholder="Add tags (optional)"
                placeholderTextColor={isDark ? '#999' : '#999'}
                value={tagInput}
                onChangeText={onChangeTagInput}
                onSubmitEditing={onAddTag}
            />
            <TouchableOpacity style={styles.addTagButton} onPress={onAddTag}>
                <Ionicons name="add-circle" size={24} color="#0A84FF" />
            </TouchableOpacity>
        </View>
        <View style={styles.tagsContainer}>
            {hashtags.map((tag, index) => (
                <View key={index} style={styles.tagWrapper}>
                    <Text style={styles.tagTextStyle}>{tag}</Text>
                    <TouchableOpacity onPress={() => onRemoveTag(tag)}>
                        <Ionicons
                            name="close-circle"
                            size={16}
                            color={isDark ? '#e0e0e0' : '#666'}
                        />
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    </View>
);

export default TagsInput;
