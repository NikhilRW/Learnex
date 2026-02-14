import React from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { EmptyStateProps } from '../types';
import { copyRoomCode, shareMeetingInvite } from '../utils/sharing';
import { styles } from '../styles/RoomComponent.styles';

const EmptyState: React.FC<EmptyStateProps> = ({
    isConnecting,
    meetingTitle,
    roomCode,
}) => {
    return (
        <View style={styles.emptyStateContainer}>
            {isConnecting ? (
                <>
                    <ActivityIndicator size="large" color="#4285F4" />
                    <Text style={styles.emptyStateTitle}>Connecting to meeting...</Text>
                    <Text style={styles.emptyStateSubtitle}>
                        Please wait while we connect to the meeting
                    </Text>
                </>
            ) : (
                <>
                    <Text style={styles.emptyStateTitle}>You're the only one here</Text>
                    <Text style={styles.emptyStateSubtitle}>
                        Share this meeting link with others you want in the meeting
                    </Text>
                    <View style={styles.meetingLinkContainer}>
                        <Text style={styles.meetingLink}>{roomCode}</Text>
                        <TouchableOpacity
                            style={styles.copyButton}
                            onPress={() => copyRoomCode(roomCode)}>
                            <Icon name="content-copy" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={styles.shareInviteButton}
                        onPress={() => shareMeetingInvite(roomCode, meetingTitle)}>
                        <Icon name="share" size={20} color="#fff" style={styles.shareIcon} />
                        <Text style={styles.shareButtonText}>Share invite</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
};

export default EmptyState;
