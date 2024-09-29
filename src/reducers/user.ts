import { createSlice } from "@reduxjs/toolkit";

export const userSlice = createSlice({
    name: "user",
    initialState: {
        username: "username",
        password: "password",
    },
    reducers: {
        changeUername : (state,action)=>{
            state.username = action.payload;
        }
    }
});

export default userSlice.reducer;
export const {changeUername} = userSlice.actions;