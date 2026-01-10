import React from 'react';
import { View, Animated } from 'react-native';
import { styles } from 'lex-ai/styles/LexAI.styles';

interface LoadingDotsProps {
    primaryColor: string;
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

export const LoadingDots: React.FC<LoadingDotsProps> = ({
    primaryColor,
    dot1Opacity,
    dot1Scale,
    dot1TranslateY,
    dot2Opacity,
    dot2Scale,
    dot2TranslateY,
    dot3Opacity,
    dot3Scale,
    dot3TranslateY,
}) => (
    <View
        style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            height: 20,
        }}>
        <Animated.View
            style={[
                styles.loadingDot,
                {
                    backgroundColor: primaryColor,
                    opacity: dot1Opacity,
                    transform: [{ scale: dot1Scale }, { translateY: dot1TranslateY }],
                },
            ]}
        />
        <Animated.View
            style={[
                styles.loadingDot,
                {
                    backgroundColor: primaryColor,
                    opacity: dot2Opacity,
                    transform: [{ scale: dot2Scale }, { translateY: dot2TranslateY }],
                },
            ]}
        />
        <Animated.View
            style={[
                styles.loadingDot,
                {
                    backgroundColor: primaryColor,
                    opacity: dot3Opacity,
                    transform: [{ scale: dot3Scale }, { translateY: dot3TranslateY }],
                },
            ]}
        />
    </View>
);
