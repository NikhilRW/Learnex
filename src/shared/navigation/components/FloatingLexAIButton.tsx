import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { UserStackParamList } from 'shared/navigation/routes/UserStack';

interface FloatingLexAIButtonProps {
  position?: 'bottomRight' | 'bottomLeft';
  size?: number;
  iconSize?: number;
  color?: string;
}

/**
 * A floating button component that navigates to the LexAI screen
 */
const FloatingLexAIButton: React.FC<FloatingLexAIButtonProps> = ({
  position = 'bottomRight',
  size = 56,
  iconSize = 28,
  color = '#007AFF',
}) => {
  const navigation = useNavigation<NavigationProp<UserStackParamList>>();

  // Animation for button press
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // Handle press animation
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Handle release animation
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Navigate to LexAI screen when pressed
  const handlePress = () => {
    navigation.navigate('LexAI');
  };

  // Calculate position styles based on prop
  const positionStyle =
    position === 'bottomRight'
      ? { right: 20, bottom: 20 }
      : { left: 20, bottom: 20 };

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ scale: scaleAnim }],
        },
      ]}>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}>
        <Ionicons name="ios-chatbubbles" size={iconSize} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default FloatingLexAIButton;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  button: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
