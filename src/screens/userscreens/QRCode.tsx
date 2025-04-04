import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View, Share, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import QRCodeView from 'react-native-qrcode-svg';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import Icon from 'react-native-vector-icons/Ionicons';

// QR code format - uses a specific URI scheme for app deep linking
// Format: learnex://chat/{userId}
const QRCode = () => {
    const navigation = useNavigation<DrawerNavigationProp<any>>();
    const isDark = useTypedSelector((state) => state.user.theme) == "dark";
    const firebase = useTypedSelector((state) => state.firebase.firebase);
    const currentUser = firebase.auth.currentUser();
    const [fullName, setFullName] = useState<string>('');
    const [qrValue, setQrValue] = useState<string>('');
    const [isSharing, setIsSharing] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            const { fullName } = await firebase.user.getNameUsernamestring();
            setFullName(fullName);

            // Create a deep link URL with the current user's ID
            // This URL will be used to start a chat with the user when scanned
            if (currentUser && currentUser.uid) {
                const deepLinkUrl = `learnex://chat/${currentUser.uid}`;
                setQrValue(deepLinkUrl);
            }
        }
        fetchData();
    }, []);

    // Function to share the deep link
    const handleShare = async () => {
        if (!qrValue) return;

        try {
            setIsSharing(true);

            // Create message for different platforms
            const message = Platform.select({
                ios: `Chat with me on Learnex: ${qrValue}`,
                android: `Chat with me on Learnex: ${qrValue}`,
                default: `Chat with me on Learnex: ${qrValue}`
            });

            const result = await Share.share({
                message,
                url: qrValue, // iOS only
                title: 'Share Learnex Chat Link'
            });

            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    // Shared with activity type of result.activityType
                    console.log('Shared with activity type:', result.activityType);
                } else {
                    // Shared
                    console.log('Shared successfully');
                }
            } else if (result.action === Share.dismissedAction) {
                // Dismissed
                console.log('Share dismissed');
            }
        } catch (error) {
            console.error('Error sharing:', error);
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <SafeAreaView style={[
            styles.container,
            { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }
        ]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={isDark ? '#1a1a1a' : '#f5f5f5'}
            />
            <View style={[
                styles.customHeader,
                { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }
            ]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon
                        name="arrow-back"
                        size={24}
                        color={isDark ? 'white' : 'black'}
                    />
                </TouchableOpacity>
                <Text style={[
                    styles.headerTitle,
                    { color: isDark ? 'white' : 'black' }
                ]}>
                    Your QR Code
                </Text>
                <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShare}
                    disabled={isSharing || !qrValue}
                >
                    <Icon
                        name="share-social-outline"
                        size={24}
                        color={isDark ? 'white' : 'black'}
                    />
                </TouchableOpacity>
            </View>
            <View style={[styles.qrCodeContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
                <QRCodeView
                    ecl='M'
                    quietZone={10}
                    value={qrValue || "Loading..."}
                    logo={{ uri: currentUser?.photoURL || 'https://avatar.iran.liara.run/username?username=' + encodeURIComponent(fullName) || 'Anonymous' }}
                    logoSize={100}
                    logoMargin={-20}
                    logoBorderRadius={35}
                    logoBackgroundColor='transparent'
                    size={300}
                />

                <Text style={[styles.infoText, { color: isDark ? '#cccccc' : '#555555' }]}>
                    Scan this QR code to start a conversation with me
                </Text>

                <TouchableOpacity
                    style={[
                        styles.shareButtonLarge,
                        {
                            backgroundColor: isDark ? '#2379C2' : '#2379C2',
                            opacity: (!qrValue || isSharing) ? 0.6 : 1
                        }
                    ]}
                    onPress={handleShare}
                    disabled={isSharing || !qrValue}
                >
                    <Icon
                        name="share-social"
                        size={20}
                        color="white"
                        style={styles.shareButtonIcon}
                    />
                    <Text style={styles.shareButtonText}>
                        {isSharing ? 'Sharing...' : 'Share Chat Link'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

export default QRCode

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 13,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 8,
    },
    shareButton: {
        padding: 8,
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    qrCodeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        borderRadius: 20,
        padding: 20,
    },
    infoText: {
        marginTop: 20,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
    },
    shareButtonLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 20,
        width: '80%',
        maxWidth: 300,
    },
    shareButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    shareButtonIcon: {
        marginRight: 8,
    },
})