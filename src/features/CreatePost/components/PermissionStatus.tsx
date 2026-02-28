import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { PermissionStatusProps } from '../types';

const PermissionStatus: React.FC<PermissionStatusProps> = ({
    onRequestPermissions,
    styles,
}) => (
    <View style={styles.permissionStatus}>
        <View style={styles.permissionStatusRow}>
            <Ionicons
                name="alert-circle"
                size={20}
                color="#FF3B30"
                style={styles.permissionIcon}
            />
            <Text style={styles.permissionStatusText}>
                Storage permission required for media uploads
            </Text>
        </View>
        <TouchableOpacity
            style={[
                styles.troubleshootingButton,
                styles.troubleshootingButtonAdditional,
            ]}
            onPress={onRequestPermissions}>
            <Text style={styles.troubleshootingButtonText}>Grant Permission</Text>
        </TouchableOpacity>
    </View>
);

export default PermissionStatus;
