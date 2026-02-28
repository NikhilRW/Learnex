import React from 'react';
import { View, Image, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CLOUDINARY_CONFIG } from '../constants';
import { MediaGridProps } from '../types';
import UploadProgress from './UploadProgress';

const MediaGrid: React.FC<MediaGridProps> = ({
    formData,
    isDark,
    loading,
    pickerError,
    uploadProgress,
    currentUploadIndex,
    canAddMoreMedia,
    hasStoragePermission,
    onRemoveMedia,
    onPickMedia,
    onRequestPermissions,
    styles,
}) => (
    <View style={styles.inputContainer}>
        <View style={styles.labelContainer}>
            <Text style={styles.label}>Photos & Videos *</Text>
            <Text style={styles.mediaCounter}>
                {formData.mediaItems.length}/{CLOUDINARY_CONFIG.maxTotalMedia}
                {formData.mediaItems.filter(m => m.isVideo).length > 0 &&
                    ` (${formData.mediaItems.filter(m => m.isVideo).length}/${CLOUDINARY_CONFIG.maxVideos} videos)`}
            </Text>
        </View>

        <View style={styles.mediaGrid}>
            {formData.mediaItems.map((item, index) => (
                <View key={index} style={styles.mediaItem}>
                    {item.isVideo ? (
                        <View style={styles.videoPlaceholder}>
                            <Ionicons
                                name="videocam"
                                size={30}
                                color={isDark ? '#e0e0e0' : '#666'}
                            />
                            <Text style={styles.videoPlaceholderText}>Video</Text>
                        </View>
                    ) : (
                        <Image source={{ uri: item.uri }} style={styles.mediaThumbnail} />
                    )}
                    <TouchableOpacity
                        style={styles.removeMediaButton}
                        onPress={() => onRemoveMedia(index)}>
                        <Ionicons name="close-circle" size={22} color="#ff3b30" />
                    </TouchableOpacity>
                </View>
            ))}

            {canAddMoreMedia() && (
                <TouchableOpacity
                    testID="add-media-button"
                    style={styles.addMediaButton}
                    onPress={hasStoragePermission ? onPickMedia : onRequestPermissions}
                    disabled={loading}>
                    <Ionicons name="add" size={40} color={isDark ? '#e0e0e0' : '#666'} />
                </TouchableOpacity>
            )}
        </View>

        {pickerError && (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{pickerError}</Text>
            </View>
        )}

        {uploadProgress > 0 && uploadProgress < 100 && (
            <UploadProgress
                uploadProgress={uploadProgress}
                currentUploadIndex={currentUploadIndex}
                totalCount={formData.mediaItems.length}
                isDark={isDark}
                styles={styles}
            />
        )}
    </View>
);

export default MediaGrid;
