import { 
    configureStore, 
    combineReducers,
    getDefaultMiddleware,
} from '@reduxjs/toolkit'
import { menuSlice } from './menu';
import { errorSlice } from './error';
import { commonSlice } from './common';
import { metaSlice } from './metaPos';
import {phoneSlice} from './phone';
import { alertSlice } from './alert';

//slices

const store = configureStore({
    reducer:{
        menu:menuSlice.reducer,
        error:errorSlice.reducer,
        common:commonSlice.reducer,
        meta:metaSlice.reducer,
        phone:phoneSlice.reducer,
        alert:alertSlice.reducer,
    },
    devTools:true
})


export default store;
