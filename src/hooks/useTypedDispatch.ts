import { useDispatch } from 'react-redux';
import type { DispatchType } from '../store/store';
export const useTypedDispatch = () => useDispatch<DispatchType>();