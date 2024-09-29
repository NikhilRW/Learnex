import { createSlice } from "@reduxjs/toolkit";

export const userSlice = createSlice({
    name: "user",
    initialState: {
        isLoggedIn:false,
    },
    reducers: {
        changeIsLoggedIn:(state,action)=>{
            state.isLoggedIn=action.payload;
        }
    }
});

export default userSlice.reducer;
export const {changeIsLoggedIn} = userSlice.actions;