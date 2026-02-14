import React from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
import { LegendList } from '@legendapp/list';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { ParticipantsPanelProps } from '../types';
import { getAvatarInfo } from '../utils/avatar';
import { styles } from '../styles/RoomComponent.styles';

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
    participants,
    currentUserId,
    pinnedParticipantId,
    participantStates: _participantStates,
    isAudioEnabled,
    isVideoEnabled,
    isDark,
    showParticipants,
    participantsPanelOpacity,
    onClose,
    onPinParticipant,
}) => {
    const renderParticipantListItem = ({ item }: { item: any }) => {
        const participantState = item.state || {};
        const isCurrentUser = item.id === currentUserId;
        const isVideoOn = isCurrentUser
            ? isVideoEnabled
            : (participantState.isVideoEnabled ?? true);
        const isAudioOn = isCurrentUser
            ? isAudioEnabled
            : (participantState.isAudioEnabled ?? true);
        const isParticipantSpeaking = participantState.isSpeaking ?? false;
        const isMicMuted = !isAudioOn;
        const isVideoMuted = !isVideoOn;

        const avatarInfo = getAvatarInfo(item.id, item.name);

        return (
            <TouchableOpacity
                style={styles.participantListItem}
                onPress={() => onPinParticipant(item.id)}>
                <View style={styles.participantListItemAvatarContainer}>
                    <View
                        style={[
                            styles.participantListItemAvatar,
                            { backgroundColor: avatarInfo.backgroundColor },
                        ]}>
                        <Text
                            style={[
                                styles.participantListItemAvatarText,
                                { color: avatarInfo.textColor },
                            ]}>
                            {avatarInfo.initials}
                        </Text>
                    </View>
                </View>
                <View style={styles.participantListItemInfo}>
                    <Text
                        style={[
                            styles.participantListItemName,
                            { color: isDark ? 'white' : 'black' },
                        ]}
                        numberOfLines={1}>
                        {item.name} {isCurrentUser && '(You)'}
                    </Text>
                    {item.email && (
                        <Text
                            style={styles.participantListItemEmail}
                            numberOfLines={1}
                            ellipsizeMode="middle">
                            {item.email}
                        </Text>
                    )}
                </View>
                <View style={styles.participantListItemActions}>
                    {isParticipantSpeaking && (
                        <Icon name="volume-up" size={22} color="#4285f4" />
                    )}
                    {isMicMuted ? (
                        <Icon name="mic-off" size={22} color="#d66b6b" />
                    ) : (
                        <Icon name="mic" size={22} color="#9aa0a6" />
                    )}
                    {isVideoMuted ? (
                        <Icon name="videocam-off" size={22} color="#d66b6b" />
                    ) : (
                        <Icon name="videocam" size={22} color="#9aa0a6" />
                    )}
                    <TouchableOpacity
                        onPress={() => onPinParticipant(item.id)}
                        style={styles.participantListItemMoreButton}>
                        <AntDesign
                            name="pushpin"
                            size={22}
                            color={pinnedParticipantId === item.id ? '#2196f3' : '#9aa0a6'}
                        />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    if (!showParticipants) {
        return null;
    }

    return (
        <Animated.View
            style={[
                styles.fullScreenPanel,
                isDark ? styles.fullScreenPanelDark : styles.fullScreenPanelLight,
                { opacity: participantsPanelOpacity },
            ]}>
            <View style={[styles.panelHeader, isDark && styles.panelHeaderDark]}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.panelTitle, isDark && styles.panelTitleDark]}>
                    Participants ({participants.length})
                </Text>
            </View>

            <LegendList
                data={participants}
                renderItem={renderParticipantListItem}
                keyExtractor={item => item.id}
                style={[styles.participantsList, isDark && styles.participantsListDark]}
                estimatedItemSize={70}
                recycleItems={true}
            />
        </Animated.View>
    );
};

export default ParticipantsPanel;
