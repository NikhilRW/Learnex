import { renderHook } from '@testing-library/react-native';
import { useTheme } from 'shared/hooks/common/useTheme';
import { useTypedSelector } from 'shared/hooks/redux/useTypedSelector';

jest.mock('shared/hooks/redux/useTypedSelector');

describe('useTheme Hook', () => {
    it('returns light theme colors when theme is light', () => {
        (useTypedSelector as jest.Mock).mockImplementation(selector => selector({ user: { theme: 'light' } }));

        const { result } = renderHook(() => useTheme());

        expect(result.current.isDark).toBe(false);
        expect(result.current.colors.background).toBe('#f5f5f5');
        expect(result.current.colors.text).toBe('#333333');
    });

    it('returns dark theme colors when theme is dark', () => {
        (useTypedSelector as jest.Mock).mockImplementation(selector => selector({ user: { theme: 'dark' } }));

        const { result } = renderHook(() => useTheme());

        expect(result.current.isDark).toBe(true);
        expect(result.current.colors.background).toBe('#121212');
        expect(result.current.colors.text).toBe('#f5f5f5');
    });
});
