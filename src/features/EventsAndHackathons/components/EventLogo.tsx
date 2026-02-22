import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { EventLogoProps } from '../types';

// Default icons for each source
// const DEFAULT_HACKEREARTH_ICON = 'code';
// const DEFAULT_DEVFOLIO_ICON = 'rocket-launch';
const DEFAULT_GENERIC_ICON = 'calendar';

/**
 * Component that displays a branded logo for each event source using vector icons
 */
const EventLogo: React.FC<EventLogoProps> = ({ source, size, style, isDark }) => {
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

  const dynamicContainerStyle = {
    width: containerSize,
    height: containerSize,
    backgroundColor: bgColor,
    borderRadius: containerSize / 2,
  };
  const dynamicLogoTextStyle = { fontSize: size * 0.12 };

  return (
    <View style={[styles.container, dynamicContainerStyle, style]}>
      {sourceStr === 'hackerearth' && (
        <>
          <FontAwesome name={'code'} size={iconSize} color="white" />
          <Text style={[styles.logoText, dynamicLogoTextStyle]}>
            HackerEarth
          </Text>
        </>
      )}

      {sourceStr === 'devfolio' && (
        <>
          <MaterialCommunityIcons
            name={'rocket-launch'}
            size={iconSize}
            color="white"
          />
          <Text style={[styles.logoText, dynamicLogoTextStyle]}>
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
            color="white"
          />
          <Text style={[styles.logoText, dynamicLogoTextStyle]}>
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoText: {
    fontWeight: 'bold',
    marginTop: 4,
    color: 'white',
  },
});

export default EventLogo;
