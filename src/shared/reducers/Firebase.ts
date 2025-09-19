import {createSlice} from '@reduxjs/toolkit';
import Firebase from '../services/firebase';

export const appwriteSlice = createSlice({
    name: 'firebase',
    initialState: {
        firebase: new Firebase(),
    },
    reducers: {},
});

export default appwriteSlice.reducer;