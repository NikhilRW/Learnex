import {View, TouchableOpacity, StyleSheet} from 'react-native';
import React from 'react';
import {FloatingBottomTabBarPropsType} from 'shared/types/bottomTabBarTypes';
import navigationIconHelper from 'shared/helpers/navigation/NavigationIconHelper';
import {NavigationRoute, ParamListBase} from '@react-navigation/native';
import {primaryColor} from 'shared/res/strings/eng';
import {useTheme} from 'hooks/common/useTheme';
import Animated, {
  FadeIn,
  FadingTransition,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {useTypedSelector} from 'hooks/redux/useTypedSelector';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const BUTTON_SIZE = 48;

const AnimtedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

const FloatingBottomTabBar = ({
  navigation,
  state,
}: FloatingBottomTabBarPropsType) => {
  const {isDark} = useTheme();
  const onPress = (route: NavigationRoute<ParamListBase, string>) => {
    navigation.navigate(route.name);
  };
  const tabsButton = TabsButton(state.routes, state.index, onPress);
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

  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.mainContainer]}
      className="bg-neutral-300 dark:bg-neutral-700">
      <View
        style={[
          styles.floatingTabBarContainer,
          {
            backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
            marginBottom: insets.bottom,
          },
        ]}>
        <View className="flex-row gap-[60]">
          <Animated.View
            style={[
              {
                backgroundColor: isDark ? 'white' : '#0987C1',
                width: BUTTON_SIZE,
                height: 5,
                borderRadius: 10,
                position: 'absolute',
                zIndex: -8,
                bottom: -5,
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

const TabsButton = (
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
          isFocused ? (isDark ? 'white' : '#0987C1') : primaryColor,
          true,
        )}
        {isFocused && (
          <Animated.Text
            entering={FadeIn}
            numberOfLines={1}
            style={[{color: isDark ? 'white' : '#0987C1'}, styles.tabIconText]}>
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
    gap: 60,
    width: '100%',
    paddingVertical: 4,
    paddingHorizontal: 48,
  },
  tabIconText: {
    width: 45,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: 300,
    textTransform: 'capitalize',
  },
  mainContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
