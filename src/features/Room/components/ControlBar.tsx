import React from 'react';
import { View, TouchableOpacity, ScrollView, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ControlBarProps } from '../types';
import { styles } from '../styles/RoomComponent.styles';

const ControlBar: React.FC<ControlBarProps> = ({
    isControlsVisible,
    isAudioEnabled,
    isVideoEnabled,
    isHandRaised,
    showChat,
    showReactions,
    showParticipants,
    showMoreControls,
    isFrontCamera,
    meetingTitle,
    roomCode,
    onToggleAudio,
    onToggleVideo,
    onFlipCamera,
    onRaiseHand,
    onToggleChat,
    onToggleReactions,
    onToggleParticipants,
    onToggleMoreControls,
    onEndCall,
}) => {
    return (
        <View
            style={[
                styles.controlsContainer,
                isControlsVisible ? styles.controlsVisible : styles.controlsHidden,
            ]}>
            <View style={styles.meetingInfo}>
                <Text style={styles.meetingTitle}>{meetingTitle || 'Meeting'}</Text>
                <Text style={styles.roomCode}>{roomCode}</Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                indicatorStyle="white"
                contentContainerStyle={styles.controls}
                style={styles.controlsScrollView}>
                {!showMoreControls ? (
                    <>
                        {/* Primary Controls (Page 1) */}
                        <TouchableOpacity
                            style={[
                                styles.controlButton,
                                !isAudioEnabled && styles.controlButtonDisabled,
                            ]}
                            onPress={onToggleAudio}>
                            <Icon
                                name={isAudioEnabled ? 'mic' : 'mic-off'}
                                size={24}
                                color="white"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.controlButton,
                                !isVideoEnabled && styles.controlButtonDisabled,
                            ]}
                            onPress={onToggleVideo}>
                            <Icon
                                name={isVideoEnabled ? 'videocam' : 'videocam-off'}
                                size={24}
                                color="white"
                            />
                        </TouchableOpacity>

                        {isVideoEnabled && (
                            <TouchableOpacity
                                style={styles.controlButton}
                                onPress={onFlipCamera}>
                                <MaterialCommunityIcons
                                    name={isFrontCamera ? 'camera-front' : 'camera-rear'}
                                    size={24}
                                    color="white"
                                />
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.controlButton,
                                isHandRaised && styles.controlButtonActive,
                            ]}
                            onPress={onRaiseHand}>
                            <MaterialCommunityIcons
                                name="hand-wave"
                                size={24}
                                color="white"
                            />
                        </TouchableOpacity>

                        {/* More Controls Button */}
                        <TouchableOpacity
                            style={[styles.controlButton, styles.moreControlsButton]}
                            onPress={() => onToggleMoreControls(true)}>
                            <Icon name="more-horiz" size={24} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.controlButton, styles.endCallButton]}
                            onPress={onEndCall}>
                            <Icon name="call-end" size={24} color="white" />
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        {/* Secondary Controls (Page 2) */}
                        <TouchableOpacity
                            style={[styles.controlButton, styles.backControlsButton]}
                            onPress={() => onToggleMoreControls(false)}>
                            <Icon name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.controlButton,
                                showReactions && styles.controlButtonActive,
                            ]}
                            onPress={onToggleReactions}>
                            <MaterialCommunityIcons
                                name="emoticon-outline"
                                size={24}
                                color="white"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.controlButton,
                                showParticipants && styles.controlButtonActive,
                            ]}
                            onPress={onToggleParticipants}>
                            <Icon name="people" size={24} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.controlButton,
                                showChat && styles.controlButtonActive,
                            ]}
                            onPress={onToggleChat}>
                            <Icon name="chat" size={24} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.controlButton, styles.endCallButton]}
                            onPress={onEndCall}>
                            <Icon name="call-end" size={24} color="white" />
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </View>
    );
};

export default ControlBar;
