import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../reducers/User";
import appwriteSlice  from "../reducers/Appwrite";

export const store = configureStore({
    reducer:{
        userReducer,
        appwriteSlice,
    }
})