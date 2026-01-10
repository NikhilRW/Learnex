import {useState, useEffect, useCallback} from 'react';
import {Animated, Easing} from 'react-native';

export interface UseLexAIAnimationsReturn {
  // Icon animations
  iconRotate: Animated.Value;
  iconScale: Animated.Value;
  spin: Animated.AnimatedInterpolation<string>;
  animateIcon: () => void;

  // Send button animations
  sendButtonScale: Animated.Value;
  sendButtonGlow: Animated.Value;
  sendButtonRotate: Animated.Value;
  sendRotation: Animated.AnimatedInterpolation<string>;
  glowOpacity: Animated.AnimatedInterpolation<number>;
  animateSendButton: () => void;

  // Loading dots animations
  dot1Scale: Animated.AnimatedInterpolation<number>;
  dot2Scale: Animated.AnimatedInterpolation<number>;
  dot3Scale: Animated.AnimatedInterpolation<number>;
  dot1Opacity: Animated.AnimatedInterpolation<number>;
  dot2Opacity: Animated.AnimatedInterpolation<number>;
  dot3Opacity: Animated.AnimatedInterpolation<number>;
  dot1TranslateY: Animated.AnimatedInterpolation<number>;
  dot2TranslateY: Animated.AnimatedInterpolation<number>;
  dot3TranslateY: Animated.AnimatedInterpolation<number>;

  // History drawer animations
  historyOpacity: Animated.Value;
  historyTranslateX: Animated.Value;
  handleShowHistory: (setShowHistory: (show: boolean) => void) => void;
  handleHideHistory: (setShowHistory: (show: boolean) => void) => void;

  // History item animations
  historyItemAnimations: {
    getAnimation: (id: string) => {
      scale: Animated.Value;
      opacity: Animated.Value;
      translateX: Animated.Value;
    };
    animateItem: (id: string) => void;
  };
}

export const useLexAIAnimations = (
  isLoading: boolean,
  isStreaming: boolean,
  inputMessage: string,
): UseLexAIAnimationsReturn => {
  // Icon animations
  const [iconRotate] = useState(new Animated.Value(0));
  const [iconScale] = useState(new Animated.Value(1));

  // Send button animations
  const [sendButtonScale] = useState(new Animated.Value(1));
  const [sendButtonGlow] = useState(new Animated.Value(0));
  const [sendButtonRotate] = useState(new Animated.Value(0));

  // Loading dots animations
  const [dot1Anim] = useState(new Animated.Value(0));
  const [dot2Anim] = useState(new Animated.Value(0));
  const [dot3Anim] = useState(new Animated.Value(0));

  // History drawer animations
  const [historyOpacity] = useState(new Animated.Value(0));
  const [historyTranslateX] = useState(new Animated.Value(300));

  // Create rotation interpolation for icon
  const spin = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Create interpolated rotation value for send button
  const sendRotation = sendButtonRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '30deg'],
  });

  // Create interpolated values for the glow effect
  const glowOpacity = sendButtonGlow.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.4, 0],
  });

  // Create interpolated values for loading dots
  const dot1Scale = dot1Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.5, 1],
  });

  const dot2Scale = dot2Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.5, 1],
  });

  const dot3Scale = dot3Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.5, 1],
  });

  const dot1Opacity = dot1Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1, 0.5],
  });

  const dot2Opacity = dot2Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1, 0.5],
  });

  const dot3Opacity = dot3Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1, 0.5],
  });

  // Add vertical position interpolation for bounce effect
  const dot1TranslateY = dot1Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -3, 0],
  });

  const dot2TranslateY = dot2Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -3, 0],
  });

  const dot3TranslateY = dot3Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -3, 0],
  });

  // Create animated icon effect
  const animateIcon = useCallback(() => {
    Animated.sequence([
      Animated.timing(iconScale, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(iconScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(iconRotate, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      iconRotate.setValue(0);
    });
  }, [iconRotate, iconScale]);

  // Create a more sophisticated animation for the send button
  const animateSendButton = useCallback(() => {
    // Reset values
    sendButtonGlow.setValue(0);
    sendButtonRotate.setValue(0);

    // Create parallel animations for scale, glow, and rotation
    Animated.parallel([
      // Pulse animation
      Animated.sequence([
        Animated.timing(sendButtonScale, {
          toValue: 0.92,
          duration: 80,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(sendButtonScale, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
      // Glow animation
      Animated.timing(sendButtonGlow, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }),
      // Subtle rotation on click
      Animated.sequence([
        Animated.timing(sendButtonRotate, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
        Animated.timing(sendButtonRotate, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
      ]),
    ]).start();
  }, [sendButtonGlow, sendButtonRotate, sendButtonScale]);

  // Show history drawer with animation
  const handleShowHistory = useCallback(
    (setShowHistory: (show: boolean) => void) => {
      setShowHistory(true);
      Animated.parallel([
        Animated.timing(historyOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(historyTranslateX, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]).start();
    },
    [historyOpacity, historyTranslateX],
  );

  // Hide history drawer with animation
  const handleHideHistory = useCallback(
    (setShowHistory: (show: boolean) => void) => {
      Animated.parallel([
        Animated.timing(historyOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(historyTranslateX, {
          toValue: 300,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowHistory(false);
      });
    },
    [historyOpacity, historyTranslateX],
  );

  // Create a map of animations for list items
  const historyItemAnimations = {
    animations: new Map<
      string,
      {
        scale: Animated.Value;
        opacity: Animated.Value;
        translateX: Animated.Value;
      }
    >(),
    getAnimation: function (id: string) {
      if (!this.animations.has(id)) {
        this.animations.set(id, {
          scale: new Animated.Value(1),
          opacity: new Animated.Value(1),
          translateX: new Animated.Value(0),
        });
      }
      return this.animations.get(id)!;
    },
    animateItem: function (id: string) {
      const anim = this.animations.get(id);
      if (anim) {
        Animated.sequence([
          Animated.timing(anim.scale, {
            toValue: 0.97,
            duration: 100,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
          Animated.timing(anim.scale, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
            easing: Easing.elastic(1.2),
          }),
        ]).start();

        // Add a subtle horizontal animation
        Animated.sequence([
          Animated.timing(anim.translateX, {
            toValue: -5,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateX, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
            easing: Easing.elastic(1.2),
          }),
        ]).start();
      }
    },
  };

  // Animate loading dots when isLoading is true
  useEffect(() => {
    let dotAnimation: Animated.CompositeAnimation;

    if (isLoading || isStreaming) {
      // Reset animation values
      dot1Anim.setValue(0);
      dot2Anim.setValue(0);
      dot3Anim.setValue(0);

      // Create a continuous looping animation
      dotAnimation = Animated.loop(
        Animated.stagger(200, [
          Animated.timing(dot1Anim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(dot2Anim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(dot3Anim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ]),
        {iterations: 5},
      );

      // Start the animation
      dotAnimation.start();
    }

    // Clean up animation when component unmounts or isLoading changes
    return () => {
      if (dotAnimation) {
        dotAnimation.stop();
      }
    };
  }, [isLoading, isStreaming, dot1Anim, dot2Anim, dot3Anim]);

  // Add effect to animate button when input changes from empty to filled
  useEffect(() => {
    // Only animate if going from empty to having content
    if (inputMessage.trim().length === 1) {
      // Reset rotation
      sendButtonRotate.setValue(0);

      // Trigger animation
      Animated.sequence([
        Animated.timing(sendButtonScale, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.timing(sendButtonScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Add subtle rotation
      Animated.sequence([
        Animated.timing(sendButtonRotate, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(sendButtonRotate, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
      ]).start();
    }
  }, [inputMessage, sendButtonRotate, sendButtonScale]);

  return {
    // Icon animations
    iconRotate,
    iconScale,
    spin,
    animateIcon,

    // Send button animations
    sendButtonScale,
    sendButtonGlow,
    sendButtonRotate,
    sendRotation,
    glowOpacity,
    animateSendButton,

    // Loading dots animations
    dot1Scale,
    dot2Scale,
    dot3Scale,
    dot1Opacity,
    dot2Opacity,
    dot3Opacity,
    dot1TranslateY,
    dot2TranslateY,
    dot3TranslateY,

    // History drawer animations
    historyOpacity,
    historyTranslateX,
    handleShowHistory,
    handleHideHistory,

    // History item animations
    historyItemAnimations,
  };
};
