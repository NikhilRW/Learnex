import {Platform, ToastAndroid, Alert} from 'react-native';
import {
  showErrorToast,
  showSuccessToast,
} from '../../../src/shared/utils/toast';

// Mock react-native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
  },
  ToastAndroid: {
    show: jest.fn(),
    SHORT: 0,
  },
  Alert: {
    alert: jest.fn(),
  },
}));

describe('toast utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('showErrorToast', () => {
    describe('on Android', () => {
      beforeAll(() => {
        (Platform as any).OS = 'android';
      });

      it('should show ToastAndroid with error message', () => {
        const message = 'Something went wrong';
        showErrorToast(message);

        expect(ToastAndroid.show).toHaveBeenCalledWith(
          message,
          ToastAndroid.SHORT,
        );
        expect(Alert.alert).not.toHaveBeenCalled();
      });

      it('should handle empty message', () => {
        showErrorToast('');

        expect(ToastAndroid.show).toHaveBeenCalledWith('', ToastAndroid.SHORT);
      });

      it('should handle long message', () => {
        const longMessage = 'A'.repeat(200);
        showErrorToast(longMessage);

        expect(ToastAndroid.show).toHaveBeenCalledWith(
          longMessage,
          ToastAndroid.SHORT,
        );
      });
    });

    describe('on iOS', () => {
      beforeAll(() => {
        (Platform as any).OS = 'ios';
      });

      afterAll(() => {
        (Platform as any).OS = 'android';
      });

      it('should show Alert with error title and message', () => {
        const message = 'Something went wrong';
        showErrorToast(message);

        expect(Alert.alert).toHaveBeenCalledWith('Error', message);
        expect(ToastAndroid.show).not.toHaveBeenCalled();
      });
    });
  });

  describe('showSuccessToast', () => {
    describe('on Android', () => {
      beforeAll(() => {
        (Platform as any).OS = 'android';
      });

      it('should show ToastAndroid with success message', () => {
        const message = 'Operation successful';
        showSuccessToast(message);

        expect(ToastAndroid.show).toHaveBeenCalledWith(
          message,
          ToastAndroid.SHORT,
        );
        expect(Alert.alert).not.toHaveBeenCalled();
      });

      it('should handle different success messages', () => {
        const messages = [
          'Task created successfully',
          'Profile updated',
          'File uploaded',
        ];

        messages.forEach(message => {
          jest.clearAllMocks();
          showSuccessToast(message);
          expect(ToastAndroid.show).toHaveBeenCalledWith(
            message,
            ToastAndroid.SHORT,
          );
        });
      });
    });

    describe('on iOS', () => {
      beforeAll(() => {
        (Platform as any).OS = 'ios';
      });

      afterAll(() => {
        (Platform as any).OS = 'android';
      });

      it('should show Alert with success title and message', () => {
        const message = 'Operation successful';
        showSuccessToast(message);

        expect(Alert.alert).toHaveBeenCalledWith('Success', message);
        expect(ToastAndroid.show).not.toHaveBeenCalled();
      });
    });
  });
});
