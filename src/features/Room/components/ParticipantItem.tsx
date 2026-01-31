import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ReactionText from 'room/components/common/ReactionText';
import { ParticipantItemProps } from '../types/props';
import { getAvatarInfo } from '../utils/avatar';
import { styles } from '../styles/RoomComponent.styles';

const ParticipantItem: React.FC<ParticipantItemProps> = ({
    participant,
    isCurrentUser,
    isPinned = false,
    isAudioEnabled,
    isVideoEnabled,
    onLongPress,
}) => {
    const participantState = participant.state || {};
    const isVideoOn = isCurrentUser
        ? isVideoEnabled
        : (participantState.isVideoEnabled ?? true);
    const isAudioOn = isCurrentUser
        ? isAudioEnabled
        : (participantState.isAudioEnabled ?? true);
    const isParticipantHandRaised = participantState.isHandRaised ?? false;
    const isParticipantSpeaking = participantState.isSpeaking ?? false;
    const hasThumbsUp = participantState.isThumbsUp ?? false;
    const hasThumbsDown = participantState.isThumbsDown ?? false;
    const isClapping = participantState.isClapping ?? false;
    const isWaving = participantState.isWaving ?? false;
    const isSmiling = participantState.isSmiling ?? false;

    const avatarInfo = getAvatarInfo(participant.id, participant.name);

    return (
        <TouchableOpacity
            onLongPress={() => onLongPress(participant.id)}
            activeOpacity={1}
            style={{ flex: 1 }}>
            <View
                style={[
                    styles.participantContainer,
                    isParticipantSpeaking && styles.participantSpeakingContainer,
                    styles.participantPinnedContainer,
                    isCurrentUser && styles.currentUserContainer,
                    !isPinned && !isVideoOn && { backgroundColor: 'rgba(0,0,0,0.2)' },
                ]}>
                {/* RTCView or Placeholder */}
                {participant.stream && isVideoOn ? (
                    <RTCView
                        streamURL={participant.stream.toURL()}
                        style={styles.participantVideo}
                        objectFit="cover"
                        mirror={isCurrentUser}
                    />
                ) : (
                    <View
                        style={[
                            styles.videoPlaceholder,
                            { backgroundColor: isPinned ? '#1f1f1f' : 'rgba(0,0,0,0.2)' },
                        ]}>
                        <View
                            style={[
                                styles.avatarCircle,
                                { backgroundColor: avatarInfo.backgroundColor },
                                isParticipantSpeaking && styles.avatarCircleSpeaking,
                            ]}>
                            <Text style={[styles.avatarText, { color: avatarInfo.textColor }]}>
                                {avatarInfo.initials}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Indicators */}
                {!isAudioOn && (
                    <View style={styles.audioOffIndicator}>
                        <Icon name="mic-off" size={20} color="#fff" />
                    </View>
                )}
                {isParticipantSpeaking && isAudioOn && (
                    <View style={styles.speakingIndicator}>
                        <Icon name="volume-up" size={20} color="#fff" />
                    </View>
                )}
                {isParticipantHandRaised && (
                    <View style={styles.handRaisedIndicator}>
                        <ReactionText text="🤚🏻" />
                    </View>
                )}
                {hasThumbsUp && (
                    <View style={styles.reactionIndicator}>
                        <ReactionText text="👍🏻" />
                    </View>
                )}
                {hasThumbsDown && (
                    <View style={[styles.reactionIndicator, styles.thumbsDownIndicator]}>
                        <ReactionText text="👎🏻" />
                    </View>
                )}
                {isClapping && (
                    <View style={[styles.reactionIndicator, styles.clappingIndicator]}>
                        <ReactionText text="👏🏻" />
                    </View>
                )}
                {isSmiling && (
                    <View style={[styles.reactionIndicator, styles.clappingIndicator]}>
                        <ReactionText text="😂" />
                    </View>
                )}
                {isWaving && (
                    <View style={[styles.reactionIndicator, styles.wavingIndicator]}>
                        <Text className="text-2xl font-bold">👋🏻</Text>
                    </View>
                )}

                {/* Name Tag */}
                <View
                    style={[
                        styles.nameTag,
                        isCurrentUser && styles.currentUserNameTag,
                        isParticipantSpeaking && styles.speakingNameTag,
                    ]}>
                    <View style={styles.nameTagContent}>
                        {isCurrentUser && (
                            <View style={styles.youIndicator}>
                                <Text style={styles.youIndicatorText}>YOU</Text>
                            </View>
                        )}
                        <Text
                            style={[
                                styles.nameText,
                                isCurrentUser && styles.currentUserNameText,
                            ]}>
                            {participant.name}
                        </Text>
                        {participant.email && (
                            <Text
                                style={styles.emailText}
                                numberOfLines={1}
                                ellipsizeMode="middle">
                                {participant.email}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Pin indicator */}
                {isPinned && (
                    <View style={styles.pinnedIndicator}>
                        <Icon name="push-pin" size={16} color="#fff" />
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

export default ParticipantItem;
