import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../reducers/user";

export const store = configureStore({
    reducer:{
        userReducer,
    }
})