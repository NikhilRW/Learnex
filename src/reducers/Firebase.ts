import { createSlice } from "@reduxjs/toolkit";
import Firebase from "../service/FirebaseService";

export const appwriteSlice = createSlice({
    name: "user",
    initialState: {
        firebase : new Firebase(),
    },
    reducers:{
    }
});
export default appwriteSlice.reducer;