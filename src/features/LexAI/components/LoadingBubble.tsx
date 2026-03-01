import React from 'react';
import { View, Animated } from 'react-native';
import { styles } from 'lex-ai/styles/LexAI.styles';
import { ThemeColors } from '../types/lexAI.types';
import { LoadingDots } from './LoadingDots';

interface LoadingBubbleProps {
    isLoading: boolean;
    isStreaming: boolean;
    colors: ThemeColors;
    dot1Opacity: Animated.AnimatedInterpolation<number>;
    dot1Scale: Animated.AnimatedInterpolation<number>;
    dot1TranslateY: Animated.AnimatedInterpolation<number>;
    dot2Opacity: Animated.AnimatedInterpolation<number>;
    dot2Scale: Animated.AnimatedInterpolation<number>;
    dot2TranslateY: Animated.AnimatedInterpolation<number>;
    dot3Opacity: Animated.AnimatedInterpolation<number>;
    dot3Scale: Animated.AnimatedInterpolation<number>;
    dot3TranslateY: Animated.AnimatedInterpolation<number>;
}

export const LoadingBubble: React.FC<LoadingBubbleProps> = ({
    isLoading,
    isStreaming,
    colors,
    dot1Opacity,
    dot1Scale,
    dot1TranslateY,
    dot2Opacity,
    dot2Scale,
    dot2TranslateY,
    dot3Opacity,
    dot3Scale,
    dot3TranslateY,
}) => {
    if (!isLoading && !isStreaming) return null;

    return (
        <View style={styles.loadingContainer}>
            <View
                style={[
                    styles.loadingBubble,
                    styles.loadingBubbleBorder,
                    {
                        backgroundColor: colors.aiBubble,
                        borderColor: colors.primary,
                    },
                ]}>
                <LoadingDots
                    primaryColor={colors.primary}
                    dot1Opacity={dot1Opacity}
                    dot1Scale={dot1Scale}
                    dot1TranslateY={dot1TranslateY}
                    dot2Opacity={dot2Opacity}
                    dot2Scale={dot2Scale}
                    dot2TranslateY={dot2TranslateY}
                    dot3Opacity={dot3Opacity}
                    dot3Scale={dot3Scale}
                    dot3TranslateY={dot3TranslateY}
                />
            </View>
        </View>
    );
};

export const FooterSpacer: React.FC = () => {
    return <View style={styles.footerSpacer} />;
};
