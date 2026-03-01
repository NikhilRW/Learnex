import React from 'react';
import { View, Dimensions } from 'react-native';
import { LegendList } from '@legendapp/list';
import ParticipantItem from './ParticipantItem';
import { ParticipantGridProps } from '../types';
import { calculateGridLayout, calculateUnpinnedLayout } from '../utils/layout';
import { styles } from '../styles/RoomComponent.styles';

const ParticipantGrid: React.FC<ParticipantGridProps> = ({
    participants,
    currentUserId,
    pinnedParticipantId,
    participantStates,
    isAudioEnabled,
    isVideoEnabled,
    onPinParticipant,
}) => {
    const { height } = Dimensions.get('window');
    const totalParticipants = participants.length;

    // Check if any participant is screen sharing
    const screenSharingParticipant = participants.find(
        p => participantStates.get(p.id)?.isScreenSharing,
    );

    const screenSharingId = screenSharingParticipant?.id;

    // Calculate layout
    const layout = calculateGridLayout(
        totalParticipants,
        screenSharingId,
        pinnedParticipantId,
        height,
    );

    // If there's a pinned participant and multiple participants, calculate unpinned layout
    const unpinnedLayout =
        pinnedParticipantId && totalParticipants > 1
            ? calculateUnpinnedLayout(totalParticipants - 1, height)
            : null;

    const renderGridItem = ({ item, index }: { item: any; index: number }) => {
        const isItemScreenSharing = participantStates.get(
            item.id,
        )?.isScreenSharing;
        const isPinned =
            item.id === pinnedParticipantId ||
            (item.id === currentUserId && isItemScreenSharing);
        const isCurrentUser = item.id === currentUserId;

        // Determine which layout to use
        const isPinnedItem = index === 0 && pinnedParticipantId === item.id;
        const currentLayout = isPinnedItem ? layout : unpinnedLayout || layout;

        return (
            <View
                style={[
                    styles.participantWrapper,
                    isPinned ? styles.pinnedZIndex : styles.unpinnedZIndex,
                    {
                        width: `${100 / currentLayout.numColumns}%`,
                        height: currentLayout.itemHeight,
                    },
                ]}>
                <ParticipantItem
                    participant={item}
                    isCurrentUser={isCurrentUser}
                    isPinned={isPinned}
                    isAudioEnabled={isAudioEnabled}
                    isVideoEnabled={isVideoEnabled}
                    onLongPress={onPinParticipant}
                />
            </View>
        );
    };

    return (
        <LegendList
            data={participants}
            renderItem={renderGridItem}
            keyExtractor={item => item.id}
            style={styles.participantsList}
            contentContainerStyle={styles.participantsListContent}
            showsVerticalScrollIndicator={true}
            numColumns={layout.numColumns}
            key={layout.numColumns}
            estimatedItemSize={300}
        />
    );
};

export default ParticipantGrid;
