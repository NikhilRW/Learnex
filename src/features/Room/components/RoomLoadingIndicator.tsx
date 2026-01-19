import {View, Text, ActivityIndicator, TouchableOpacity} from 'react-native';
import React from 'react';
import {styles} from 'room/styles/RoomScreen';
import {RoomLoadingIndicatorProps} from '../types/props';
import { MAX_CONNECTION_ATTEMPTS } from '../constants/common';

const RoomLoadingIndicator: React.FC<RoomLoadingIndicatorProps> = ({
  connectionState,
  connectionError,
  connectionAttempts,
  confirmLeaveRoom
}) => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4285F4" />
      <Text style={styles.loadingText}>
        {connectionState === 'connecting'
          ? 'Connecting to meeting...'
          : connectionState === 'failed'
            ? 'Connection failed'
            : 'Setting up connection...'}
      </Text>
      {connectionError && (
        <Text style={styles.errorText}>
          Error: {connectionError}.{' '}
          {connectionAttempts < MAX_CONNECTION_ATTEMPTS
            ? `Retrying (${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})...`
            : 'Max retries reached.'}
        </Text>
      )}
      <TouchableOpacity
        style={styles.exitButton}
        onPress={() => {
          confirmLeaveRoom();
        }}>
        <Text style={styles.exitButtonText}>Exit Meeting</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RoomLoadingIndicator;
