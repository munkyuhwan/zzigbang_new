import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

// 초기화 액션
export const initPhoneNumber = createAsyncThunk("phone/initPhoneNumber", async (_, { rejectWithValue }) => {
    return ""; // 번호 초기화
});

// 번호 저장 액션
export const setPhoneNumber = createAsyncThunk("phone/setPhoneNumber", async (data, { rejectWithValue }) => {
    return data; // 입력된 번호 저장
});

// Slice
export const phoneSlice = createSlice({
    name: "phone",
    initialState: {
        savedNumber: "",
    },
    extraReducers: (builder) => {
        // 초기화
        builder.addCase(initPhoneNumber.fulfilled, (state, action) => {
            state.savedNumber = "";
        });
        builder.addCase(initPhoneNumber.pending, (state, action) => {
            // 필요 시 로딩 상태 처리 가능
        });
        builder.addCase(initPhoneNumber.rejected, (state, action) => {
            // 필요 시 에러 처리 가능
        });

        // 번호 저장
        builder.addCase(setPhoneNumber.fulfilled, (state, action) => {
            state.savedNumber = action.payload;
        });
        builder.addCase(setPhoneNumber.pending, (state, action) => {
            // 필요 시 로딩 상태 처리 가능
        });
        builder.addCase(setPhoneNumber.rejected, (state, action) => {
            // 필요 시 에러 처리 가능
        });
    },
});

