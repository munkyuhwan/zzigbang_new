import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { stat } from "react-native-fs";

export const initAlert = createAsyncThunk("alert/initAlert", async(data,{dispatch,getState, rejectWithValue}) =>{
    return;
})
export const setAlert = createAsyncThunk("alert/setAlert", async(data,{dispatch,getState, rejectWithValue}) =>{
    return data;
})
export const getAlert = createAsyncThunk("alert/getAlert", async(data,{dispatch,getState, rejectWithValue}) =>{
    return data;
})

export const alertSlice = createSlice({
    name: 'alert',
    initialState: {
        title:"테스트",
        msg:"스트",
        okText:'확인',
        cancelText:'취소',
        isCancle:true,
        isOK:true,
        icon:"receipt",   
        subMsg:"",
        isAlertOpen:false,
        clickType:"",
    },
    extraReducers:(builder)=>{
        // 초기화
        builder.addCase(initAlert.fulfilled,(state, action)=>{
           
            const initState = {
                title:"",
                msg:"",
                okText:'',
                cancelText:'',
                isCancle:false,
                isOK:false,
                icon:"",   
                isAlertOpen:false,
                subMsg:"",
                clickType:"",
            }
            return initState;

        })
        builder.addCase(initAlert.pending,(state, action)=>{
            const stateToChange = Object.assign({},state);
            return stateToChange;        
        })
        builder.addCase(initAlert.rejected,(state,action)=>{
            const stateToChange = Object.assign({},state);
            return stateToChange;        
        })
        //셋
        builder.addCase(setAlert.fulfilled,(state, action)=>{
            const stateToChange = Object.assign({},state,action.payload);
            console.log("state: ",state)
            console.log("stateToChange: ",stateToChange)
            return { ...state, ...action.payload };;
        })
        builder.addCase(setAlert.pending,(state, action)=>{
            return;        
        })
        builder.addCase(setAlert.rejected,(state,action)=>{
            return;        
        })
    }
});