import {NavigationProp, NavigationState} from '@react-navigation/native';

export type ChatNavigationObjectType = 
  NavigationProp<ReactNavigation.RootParamList> & {
  getState(): NavigationState | undefined;
  navigate: (
    screen: 'Conversations' | 'Chat',
    params?: {
      conversationId: string;
      recipientName: string;
      recipientId: string;
      recipientPhoto: string;
    },
  ) => void;
};
