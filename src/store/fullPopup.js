import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {isEmpty} from "lodash";


export const initFullPopup = createAsyncThunk("menu/initError", async(_,{dispatch,getState, rejectWithValue}) =>{
    return;
})
export const setFullPopup = createAsyncThunk("menu/setError", async(data,{dispatch,getState, rejectWithValue}) =>{
    return data;
})



// Slice
export const fullPopupSlice = createSlice({
    name: 'fullPopup',
    initialState: {
        fullPopupText: "",
        isShow:false,
    },
    extraReducers:(builder)=>{
        // 초기화
        builder.addCase(initFullPopup.fulfilled,(state, action)=>{
            state.errorMsg = "";
        })
        builder.addCase(initFullPopup.pending,(state, action)=>{
        })
        builder.addCase(initFullPopup.rejected,(state,action)=>{

        })
        // 셋
        builder.addCase(setFullPopup.fulfilled,(state, action)=>{
            return Object.assign({},state,action.payload);
        })
        builder.addCase(setFullPopup.pending,(state, action)=>{
        
        })
        builder.addCase(setFullPopup.rejected,(state,action)=>{

        })
        
    }
});
