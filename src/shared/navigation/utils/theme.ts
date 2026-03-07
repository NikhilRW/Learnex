import { DefaultTheme } from '@react-navigation/native';

export const getDefaultTheme = ({
  backgroundColor,
}: {
  backgroundColor: string;
}) => {
  return {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: backgroundColor,
    },
  };
};
