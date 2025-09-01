import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import React from 'react';
import {FloatingBottomTabBarPropsType} from '../../types/bottomTabBarTypes';
import navigationIconHelper from '../../helpers/NavigationIconHelper';
import {NavigationRoute, ParamListBase} from '@react-navigation/native';
import {primaryColor} from '../../res/strings/eng';
import {useTheme} from '../../hooks/useTheme';
import Animated, {
  FadeIn,
  FadingTransition,
  JumpingTransition,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {useTypedSelector} from '../../hooks/useTypedSelector';

const BUTTON_SIZE = 48;

const AnimtedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const FloatingBottomTabBar = ({
  descriptors,
  insets,
  navigation,
  state,
}: FloatingBottomTabBarPropsType) => {
  const {isDark} = useTheme();
  const onPress = (route: NavigationRoute<ParamListBase, string>) => {
    navigation.navigate(route.name);
  };
  const tabsButton = getTabsButton(state.routes, state.index, onPress);
  const backgroundHighlightX = useSharedValue(18);
  useDerivedValue(() => {
    const gapAdjustment = state.index * 60;
    const value = gapAdjustment + BUTTON_SIZE * state.index;
    backgroundHighlightX.value = withSpring(value, {
      duration: 500,
      dampingRatio: 2,
    });
  }, [state.index]);

  const animatedStyleBackgroundHighlight = useAnimatedStyle(() => {
    return {
      left: backgroundHighlightX.value,
    };
  });

  return (
    <View
      style={{
        backgroundColor: '#121212',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <View
        style={[
          styles.floatingTabBarContainer,
          {
            backgroundColor: isDark ? '#2A2A2A' : 'white',
          },
        ]}>
        <View className="flex-row gap-[60]">
          <Animated.View
            style={[
              {
                backgroundColor: 'white',
                width: BUTTON_SIZE,
                height: 8,
                borderRadius: 10,
                position: 'absolute',
                zIndex: -10,
                bottom: -15,
              },
              animatedStyleBackgroundHighlight,
            ]}
          />
          {tabsButton.map(ele => ele)}
        </View>
      </View>
    </View>
  );
};

export default FloatingBottomTabBar;

const getTabsButton = (
  routes: NavigationRoute<ParamListBase, string>[],
  focusedIndex: number,
  onPress: (route: NavigationRoute<ParamListBase, string>) => void,
) => {
  const isDark = useTypedSelector(state => state.user.theme) === 'dark';
  return routes.map((route, index) => {
    const isFocused = focusedIndex === index;

    return (
      <AnimtedTouchableOpacity
        onPress={() => onPress(route)}
        layout={FadingTransition}
        style={{
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          padding: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {navigationIconHelper(
          route,
          isFocused,
          24,
          isFocused ? 'white' : primaryColor,
          true,
        )}
        {isFocused && (
          <Animated.Text
            entering={FadeIn}
            numberOfLines={1}
            style={[{color: isDark ? 'white' : 'black'}, styles.tabIconText]}>
            {route.name === 'CreatePost' ? 'Post' : route.name}
          </Animated.Text>
        )}
      </AnimtedTouchableOpacity>
    );
  });
};

const styles = StyleSheet.create({
  floatingTabBarContainer: {
    transform: [{translateX: '-50%'}],
    flexDirection: 'row',
    marginHorizontal: 'auto',
    justifyContent: 'center',
    left: '50%',
    alignItems: 'center',
    bottom:-1,
    gap: 60,
    // flex: 1,
    width: '100%',
    paddingVertical: 11,
    paddingHorizontal: 48,
  },
  tabIconText: {
    width: 45,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: 300,
    textTransform: 'capitalize',
  },
});
