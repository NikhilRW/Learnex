import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Switch,
    Image,
    Animated,
    Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LexAIMode } from 'lex-ai/types/lexAITypes';
import { styles } from 'lex-ai/styles/LexAI.styles';
import { ThemeColors } from '../types/lexAI.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ChatHeaderProps {
    colors: ThemeColors;
    isDarkMode: boolean;
    currentMode: LexAIMode;
    spin: Animated.AnimatedInterpolation<string>;
    iconScale: Animated.Value;
    onHistoryPress: () => void;
    onToggleMode: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    colors,
    isDarkMode,
    currentMode,
    spin,
    iconScale,
    onHistoryPress,
    onToggleMode,
}) => {
    return (
        <LinearGradient
            colors={isDarkMode ? ['#1A2740', '#15213A'] : ['#E9F2FF', '#DAEAFF']}
            style={styles.enhancedHeader}>
            <View style={styles.headerContent}>
                <View style={styles.headerTitleArea}>
                    <Animated.View
                        style={{
                            marginRight: 8,
                            transform: [{ rotate: spin }, { scale: iconScale }],
                        }}>
                        <LinearGradient
                            colors={
                                isDarkMode ? ['#4E7CF6', '#6A5AE0'] : ['#3E7BFA', '#6A5AE0']
                            }
                            style={styles.headerIcon}>
                            <Image
                                source={require('shared/res/pngs/lexai.png')}
                                style={{
                                    width: Math.min(SCREEN_WIDTH * 0.045, 18),
                                    height: Math.min(SCREEN_WIDTH * 0.045, 18),
                                    tintColor: 'white',
                                }}
                            />
                        </LinearGradient>
                    </Animated.View>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        LexAI {currentMode === LexAIMode.AGENT ? 'Assistant' : 'Chat'}
                    </Text>
                </View>
                <View style={styles.headerControls}>
                    <TouchableOpacity
                        style={[styles.headerButton, { marginRight: 12 }]}
                        onPress={onHistoryPress}>
                        <Ionicons name="time-outline" size={22} color={colors.primary} />
                    </TouchableOpacity>
                    <View style={styles.modeToggleContainer}>
                        <Text
                            style={{ color: colors.subtext, fontSize: 14, marginRight: 8 }}>
                            {currentMode === LexAIMode.AGENT ? 'Agent' : 'Chat'}
                        </Text>
                        <Switch
                            value={currentMode === LexAIMode.AGENT}
                            onValueChange={onToggleMode}
                            trackColor={{ false: '#767577', true: colors.primary }}
                            thumbColor={'#f4f3f4'}
                            style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
                        />
                    </View>
                </View>
            </View>
        </LinearGradient>
    );
};
