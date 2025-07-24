import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { ADMIN_API_BASE_URL, ADMIN_API_CATEGORY, ADMIN_API_GOODS } from "../resources/apiResources";
import { apiRequest } from "../utils/apiRequest";
import {isEmpty} from "lodash";


export const initError = createAsyncThunk("menu/initError", async(_,{dispatch,getState, rejectWithValue}) =>{
    return;
})
export const setError = createAsyncThunk("menu/setError", async(data,{dispatch,getState, rejectWithValue}) =>{
    return data;
})



// Slice
export const errorSlice = createSlice({
    name: 'error',
    initialState: {
        errorMsg: "",
    },
    extraReducers:(builder)=>{
        // 초기화
        builder.addCase(initError.fulfilled,(state, action)=>{
            state.errorMsg = "";
        })
        builder.addCase(initError.pending,(state, action)=>{
        })
        builder.addCase(initError.rejected,(state,action)=>{

        })
        // 셋
        builder.addCase(setError.fulfilled,(state, action)=>{
            const payload = action.payload;
            const stateToChange = Object.assign({},state,payload);
            state.errorMsg = stateToChange.errorMsg;

        })
        builder.addCase(setError.pending,(state, action)=>{
        
        })
        builder.addCase(setError.rejected,(state,action)=>{

        })
        
    }
});
