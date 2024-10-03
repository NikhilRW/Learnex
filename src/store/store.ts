import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../reducers/User";
import appwriteSlice  from "../reducers/Appwrite";
import rootReducer from "../reducers/rootReducer";

export const store = configureStore({
    reducer: rootReducer,
})
export type RootState = ReturnType<typeof rootReducer>;

export default store;