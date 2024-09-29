import { createSlice } from "@reduxjs/toolkit";
import AppWrite from "../service/AppwriteService"

export const appwriteSlice = createSlice({
    name: "user",
    initialState: {
        appwrite:new AppWrite(),
    },
    reducers:{}
});
export default appwriteSlice.reducer;