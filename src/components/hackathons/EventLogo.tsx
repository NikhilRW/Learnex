import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import {EventSource} from '../../types/hackathon';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface EventLogoProps {
  source: EventSource;
  size: number;
  style?: ViewStyle;
  isDark: boolean;
  imageUrl?: string;
}

// Default icons for each source
// const DEFAULT_HACKEREARTH_ICON = 'code';
// const DEFAULT_DEVFOLIO_ICON = 'rocket-launch';
const DEFAULT_GENERIC_ICON = 'calendar';

/**
 * Component that displays a branded logo for each event source using vector icons
 */
const EventLogo: React.FC<EventLogoProps> = ({source, size, style, isDark}) => {
  const containerSize = size;
  const iconSize = size * 0.5;

  // Convert source to a reliable string for comparison
  const sourceStr =
    typeof source === 'string'
      ? source.toLowerCase()
      : String(source).toLowerCase();

  // Set colors based on theme and source
  const bgColor =
    sourceStr === 'hackerearth'
      ? isDark
        ? '#2A3F5F'
        : '#3176B9'
      : isDark
      ? '#563D7C'
      : '#6C4AA0';

  const textColor = 'white';

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          backgroundColor: bgColor,
          borderRadius: containerSize / 2,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.3)',
        },
        style,
      ]}>
      {sourceStr === 'hackerearth' && (
        <>
          <FontAwesome name={'code'} size={iconSize} color={textColor} />
          <Text
            style={[
              styles.logoText,
              {fontSize: size * 0.12, color: textColor},
            ]}>
            HackerEarth
          </Text>
        </>
      )}

      {sourceStr === 'devfolio' && (
        <>
          <MaterialCommunityIcons
            name={'rocket-launch'}
            size={iconSize}
            color={textColor}
          />
          <Text
            style={[
              styles.logoText,
              {fontSize: size * 0.12, color: textColor},
            ]}>
            Devfolio
          </Text>
        </>
      )}

      {/* Handle any other event source with a generic icon */}
      {sourceStr !== 'hackerearth' && sourceStr !== 'devfolio' && (
        <>
          <Ionicons
            name={DEFAULT_GENERIC_ICON}
            size={iconSize}
            color={textColor}
          />
          <Text
            style={[
              styles.logoText,
              {fontSize: size * 0.12, color: textColor},
            ]}>
            Event
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoText: {
    fontWeight: 'bold',
    marginTop: 4,
  },
});

export default EventLogo;
