import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { userState } from "../types/userType";


const initialState : userState = {isLoggedIn:false}

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        changeIsLoggedIn:(state,action:PayloadAction<boolean>)=>{
            state.isLoggedIn=action.payload;
        }
    }
    
});

export default userSlice.reducer;
export const {changeIsLoggedIn} = userSlice.actions;