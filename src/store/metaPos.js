import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getIP, getStoreID } from "../utils/common";
import { apiRequest, callApiWithExceptionHandling, posApiRequest } from "../utils/apiRequest";
import { ADMIN_API_BANNER, ADMIN_API_BASE_URL, ADMIN_API_STORE_INFO, POS_BASE_URL } from "../resources/apiResources";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { storage } from "../utils/localStorage";


export const initMeta = createAsyncThunk("meta/initMeta", async(data,{dispatch,getState, rejectWithValue}) =>{
    return;
})
export const setMeta = createAsyncThunk("meta/setMeta", async(data,{dispatch,getState, rejectWithValue}) =>{
    return data;
})
export const getTableData = createAsyncThunk("meta/getTableData", async(data,{dispatch,getState, rejectWithValue}) =>{
    const {POS_IP} = await getIP();
    const postData = {
        "VERSION" : "0010",
        "WORK_CD" : "4000",
        "FLOOR" : 1,
        "TBL_NO" : "",
        "TBL_NM" : ""
    };
   try {
        const resultData = await posApiRequest(`${POS_BASE_URL(POS_IP)}`,postData).catch(error=>error);
        dispatch(setMeta({tableList:resultData.TBL_LIST}));
        return;
        
    } catch (error) {
        // 예외 처리
        console.error(error);
        return rejectWithValue(error.message);
    }
})


export const getStoreInfo = createAsyncThunk("meta/getStoreInfo", async(data, {dispatch,rejectWithValue})=>{
    //const STORE_IDX = await AsyncStorage.getItem("STORE_IDX");
    const STORE_IDX = storage.getString("STORE_IDX");
    if(!STORE_IDX) {
        return rejectWithValue();
    }
    try {
        const data = await apiRequest( `${ADMIN_API_BASE_URL}${ADMIN_API_STORE_INFO}`,{"STORE_ID":`${STORE_IDX}`});
        if(data?.data == null) {
            return rejectWithValue("DATA DOES NOT EXIST");
        }else {
            if(data.result == true){
                //AsyncStorage.setItem("POS_IP", data?.data.ip);
                //AsyncStorage.setItem("STORE_NAME", data?.data.store_name);
                storage.set("POS_IP", data?.data.ip);
                storage.set("STORE_NAME", data?.data.store_name);

                //AsyncStorage.setItem("BSN_NO",bsnNo);
                //AsyncStorage.setItem("TID_NO",catId); 
                dispatch(setMeta({storeInfo:data?.data}));
                return;
            }else {
                return rejectWithValue("DATA DOES NOT EXIST");
            }
        }
      } catch (error) {
        // 예외 처리
        console.error(error.message);
        return rejectWithValue(error.message);
    }
})

export const metaSlice = createSlice({
    name: 'meta',
    initialState: {
        storeInfo:{},
        tableList:[],
        isProcessing:false
    },
    extraReducers:(builder)=>{
        builder.addCase(initMeta.fulfilled,(state, action)=>{
            const initState = {
                storeInfo:{},
                tableList:[],
                isProcessing:false
            }
            return initState;
        })
        builder.addCase(initMeta.pending,(state, action)=>{
            const stateToChange = Object.assign({},state,{isProcessing:true});
            return stateToChange;        
        })
        builder.addCase(initMeta.rejected,(state,action)=>{
            const stateToChange = Object.assign({},state,{isProcessing:false});
            return stateToChange;
        })

        // 셋
        builder.addCase(setMeta.fulfilled,(state, action)=>{
            const payload = action.payload;
            const stateToChange = Object.assign({},state,payload);
            return stateToChange;
        })
        builder.addCase(setMeta.pending,(state, action)=>{
            const stateToChange = Object.assign({},state,{isProcessing:true});
            return stateToChange;
        })
        builder.addCase(setMeta.rejected,(state,action)=>{
            const stateToChange = Object.assign({},state,{isProcessing:false});
            return stateToChange;

        })
        builder.addCase(getTableData.fulfilled,(state, action)=>{
        })
        builder.addCase(getTableData.pending,(state, action)=>{
        })
        builder.addCase(getTableData.rejected,(state,action)=>{
        })
    }

});
