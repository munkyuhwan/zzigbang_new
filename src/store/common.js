import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {isEmpty} from "lodash";
import { getMenu } from "./menu";
import { getStoreInfo, getTableData } from "./metaPos";
import { ADMIN_API_BANNER, ADMIN_API_BASE_URL, ADMIN_API_CALL_SERVICE, ADMIN_API_POST_CALL_SERVICE } from "../resources/apiResources";
import { apiRequest } from "../utils/apiRequest";
import { openAlert } from "../utils/common";
import { storage } from "../utils/localStorage";
import { KocesAppPay } from "../utils/kocess";


export const initCommon = createAsyncThunk("common/initCommon", async(data,{dispatch,getState, rejectWithValue}) =>{
    return;
})
export const setCommon = createAsyncThunk("common/setCommon", async(data,{dispatch,getState, rejectWithValue}) =>{
    return data;
})
export const dispatchShowAlert = createAsyncThunk("common/showAlert", async(data,{dispatch,getState, rejectWithValue}) =>{
    openAlert(dispatch,getState, data.title, data.msg, data.okFunction, data.cancelFunction);

})

export const onConfirmOKClick = createAsyncThunk("common/onConfirmOKClick", async(data,{dispatch,getState, rejectWithValue}) =>{
    dispatch(setCommon({
        isConfirmPopup:true,
        isConfrim:data.isCancel,
        confirmType:"",
        confirmIconUri:"",
        confirmRedTitle:"",
        confirmBlackTitle:"",
        confirmOKTitle:"",
        confirmCancelTitle:"",
    }));  
    return;
})

export const onConfirmCancelClick = createAsyncThunk("common/onConfirmCancelClick", async(data,{dispatch,getState, rejectWithValue}) =>{
    dispatch(setCommon({
        isConfirmPopup:false,
        isConfrim:true,
        confirmIconUri:"",
        confirmRedTitle:"",
        confirmBlackTitle:"",
        confirmOKTitle:"",
        confirmCancelTitle:"",
    }));  
    if(data.confirmType=="pay") {
        dispatch(setCommon({
            isPhonePopup:true,
            adminPostData:data.payData,
        }));  
    }
    return;
})

export const setAdShow = createAsyncThunk("common/setAdShow", async(data,{dispatch,getState, rejectWithValue}) =>{
    const { bannerList} = getState().common;
    const { orderList, breadOrderList, detailItem} = getState().menu;

    if(bannerList.length<=0) {
        return rejectWithValue();
    }else {
        if(orderList.length<=0 && breadOrderList.length<=0) {
            if(isEmpty(detailItem)) {
                dispatch(setCommon({isAddShow:true}));
                return;
            }else {
                return rejectWithValue();
            }
        }else {
            return rejectWithValue();
        }
    }
})

export const initializeApp  = createAsyncThunk("common/initializeApp", async(data,{dispatch,getState, rejectWithValue}) =>{
    // store id 여부
    const storeID = storage.getString("STORE_IDX");

    if(isEmpty(storeID)) {

        return rejectWithValue();
    }

    dispatch(getMenu());
    dispatch(getStoreInfo());
    dispatch(getBanner());

    //AsyncStorage.removeItem("POS_NO");
    //dispatch(getTableData({}));

    
    return;
})
export const getBanner = createAsyncThunk("common/getBanner", async(_, {dispatch,rejectWithValue})=>{
    const STORE_IDX = storage.getString("STORE_IDX")
    if(!STORE_IDX) {
        return rejectWithValue();
    }
    try {
        const data = await apiRequest( `${ADMIN_API_BASE_URL}${ADMIN_API_BANNER}`,{"STORE_ID":`${STORE_IDX}`});
        if(data?.data == null) {
            return rejectWithValue("DATA DOES NOT EXIST");
        }else {
            if(data.result == true){                
                return {bannerList:data?.data};
            }else {
                return rejectWithValue("DATA DOES NOT EXIST");
            }
        }
      } catch (error) {
        // 예외 처리
        console.log('error: ',error);
        if(error.message) {
            return rejectWithValue(error.message);
        }else {
            return rejectWithValue();
        }
    }
})

export const postAssistance = createAsyncThunk("common/postHelp", async(_, {dispatch,rejectWithValue})=>{
    const STORE_IDX = storage.getString("STORE_IDX")
    if(!STORE_IDX) {
        return rejectWithValue();
    }
    try {
        console.log( `${ADMIN_API_BASE_URL}${ADMIN_API_POST_CALL_SERVICE}`,{"STORE_ID":`${STORE_IDX}`});
        const data = await apiRequest( `${ADMIN_API_BASE_URL}${ADMIN_API_POST_CALL_SERVICE}`,{"STORE_ID":`${STORE_IDX}`});
        if(data?.data == null) {
            return rejectWithValue("DATA DOES NOT EXIST");
        }else {
            if(data.result == true){                
                return {};
            }else {
                return rejectWithValue("DATA DOES NOT EXIST");
            }
        }
      } catch (error) {
        // 예외 처리
        console.log('error: ',error);
        if(error.message) {
            return rejectWithValue(error.message);
        }else {
            return rejectWithValue();
        }
    }

})

export const postHelp = createAsyncThunk("common/postHelp", async(_, {dispatch,rejectWithValue})=>{
    const STORE_IDX = await AsyncStorage.getItem("STORE_IDX")
    if(!STORE_IDX) {
        return rejectWithValue();
    }
    try {
        const data = await apiRequest( `${ADMIN_API_BASE_URL}${ADMIN_API_CALL_SERVICE}`,{"STORE_ID":`${STORE_IDX}`});
        if(data?.data == null) {
            return rejectWithValue("DATA DOES NOT EXIST");
        }else {
            if(data.result == true){                
                return {};
            }else {
                return rejectWithValue("DATA DOES NOT EXIST");
            }
        }
      } catch (error) {
        // 예외 처리
        console.log('error: ',error);
        if(error.message) {
            return rejectWithValue(error.message);
        }else {
            return rejectWithValue();
        }
    }
})

// Slice
export const commonSlice = createSlice({
    name: 'common',
    initialState: {
        languages: ["en","cn","jp","kr"],
        selectedLanguage:"ko",
        installmentData:{
            isOpen:false,
            isCancel:false,
            isOk:false,
            returnData:{},
        },
        isConfirmPopup:false,
        isConfrim:true,
        confirmType:"",
        confirmIconUri:"",
        confirmRedTitle:"",
        confirmBlackTitle:"",
        confirmOKTitle:"",
        confirmCancelTitle:"",

        isPhonePopup:false,
        adminPostData:{},

        isAddShow:true,
        bannerList:[],
        weight:0,
        strings:{
            "주문내역":{
                en:"Order List",
                jp:"注文履歴",
                cn:"訂單詳情",
                ko:"주문내역",
            },
            "결제금액":{
                en:"Payment amount",
                jp:"決済金額",
                cn:"付款金額",
                ko:"결제금액",
            },
            "원":{
                en:"won",
                jp:"won",
                cn:"won",
                ko:"원",
            },
            "개":{
                en:"ea",
                jp:"ea",
                cn:"ea",
                ko:"개",
            },
            "스캔하기":{
                en:"SCAN",
                jp:"スキャンする",
                cn:"掃描",
                ko:"스캔하기",
            },      
            "결제하기":{
                en:"Card Payment",
                jp:"カード決済",
                cn:"信用卡支付",
                ko:"카드결제",
            },         
            "간편결제":{
                en:"Easy Payment",
                jp:"簡単決済",
                cn:"快捷支付",
                ko:"간편결제",
            },    
            "옵션선택":{
                en:"Select Option",
                jp:"オプションを選択",
                cn:"選擇選項",
                ko:"옵션선택",
            },      
            "주문하기":{
                en:"Add To Cart",
                jp:"注文する",
                cn:"下訂單",
                ko:"주문하기",
            },      
            "닫기":{
                en:"Close",
                jp:"閉じる",
                cn:"閉じる",
                ko:"닫기",
            },      
            "필수":{
                en:"Select",
                jp:"必須",
                cn:"基本的",
                ko:"필수",
            },       
            "메뉴화면":{
                en:"to menu",
                jp:"ホーム",
                cn:"首页",
                ko:"메뉴화면",
            },          
            "스캔":{
                en:"Scan",
                jp:"スキャン",
                cn:"扫描",
                ko:"스캔",
            },            
            "스캔을 더 하시겠습니까?":{
                en:"Would you like to scan more",
                jp:"もっとスキャンしますか？",
                cn:" 您想继续扫描吗？",
                ko:"스캔을 더 하시겠습니까?",
            },          
            "장바구니 담기":{
                en:"Add to Cart",
                jp:"カートに追加",
                cn:"加入购物车",
                ko:"",
            },  
            "키오스크\n바로주문":{
                en:"Kiosk Order",
                jp:"キオスク注文",
                cn:"自助终端点餐",
                ko:"확인",
            },      
            "빵":{
                en:"Bread",
                jp:"パン",
                cn:"面包",
                ko:"빵",
            },      
            "음료":{
                en:"Drinks",
                jp:"飲み物",
                cn:"饮料",
                ko:"음료",
            },      
            "빵 스캔하기":{
                en:"Scan Bread",
                jp:"パンをスキャンする",
                cn:"扫描面包",
                ko:"빵 스캔하기",
            },      
            "음료 주문하기":{
                en:"Order Drink",
                jp:"飲み物を注文する",
                cn:"点饮料",
                ko:"음료 주문하기",
            },       
            "다시스캔":{
                en:"Rescan",
                jp:"再スキャンする",
                cn:"重新扫描",
                ko:"다시찍기",
            },       
            "총 금액":{
                en:"Total Amount",
                jp:"合計金額",
                cn:"总金额",
                ko:"총 금액",
            },        
            "총 수량":{
                en:"Total Quantity",
                jp:"合計数量",
                cn:"总数量",
                ko:"총 수량",
            },          
            "쟁반추가":{
                en:"Rescan",
                jp:"再スキャンする",
                cn:"重新扫描",
                ko:"쟁반추가",
            },          
            "빵 + 음료\n주문":{
                en:"Bread + Beverage Order",
                jp:"パン + ドリンク 注文",
                cn:"面包 + 饮料 订单",
                ko:"빵 + 음료 주문",
            },          
            "음료 / 식사만\n주문":{
                en:"Beverage Only / Meal Only Order",
                jp:"ドリンクのみ / 食事のみ 注文",
                cn:"仅饮料 / 仅餐点 订单",
                ko:"음료 / 식사만 주문",
            },      
            "더보기":{
                en:"More",
                jp:"もっと",
                cn:"更多",
                ko:"더보기",
            },      
            "스캔안내":{
                en:"Please place the tray correctly according to the guide lines.",
                jp:"トレーをガイドラインに合わせて置いてください。",
                cn:"请将托盘对准标示线放置。",
                ko:"트레이를 표시선 맞게 올려주세요.",    
            },
            "무게오류":{
                en:"Please place the items you brought into the tray to ensure a proper scan. Make sure the bread is not overlapping.",
                jp:"スキャンが正しく行われるように、お持ちいただいた商品をトレイに入れてください。パンが重なっていないか確認してください。",
                cn:"为了确保顺利扫描，请将您带来的商品放入托盘中。请确保面包没有重叠。",
                ko:"스캔이 잘 될수있도록 가져오신 상품을 쟁반안에 넣어주세요. 빵이 겹치지 않은지 확인해주세요.",        
            },
            "추가스캔안내":{
                en:"If you would like to add more items, please press the add button. If not, please press the kiosk order button.",
                jp:"追加する商品がある場合は、追加ボタンを押してください。ない場合は、キオスク注文ボタンを押してください。",
                cn:"如果您需要添加商品，请按添加按钮。如果不需要，请按自助终端点餐按钮",
                ko:"추가하실 상품이 있으시면 추가 버튼을 눌러주세요. 없으실 경우 키오스크 주문 버튼을 눌러주세요.",    
            },
            "추가스캔확인":{
                en:"Please check if the added items are correct.",
                jp:"追加した商品が正しいかご確認ください。",
                cn:"请确认您添加的商品是否正确。",
                ko:"추가하신 상품이 맞는지 확인 부탁드립니다.",    
            },      
            "직원호출":{
                en:"Call staff",
                jp:"スタッフ",
                cn:"呼叫员工",
                ko:"직원 호출",
            },   
            "영수증을 출력하시겠습니까?":{
                en:"Would you like to print the receipt?",
                jp:"領収書を印刷しますか?",
                cn:"您需要打印收据吗?",
                ko:"영수증을 출력하시겠습니까?",
            },     
            "쿠폰/포인트":{
                en:"Coupon/Point",
                jp:"クーポン/ポイント",
                cn:"优惠券/积分",
                ko:"쿠폰/포인트",
            }, 
            "출력":{
                en:"Print",
                jp:"印刷",
                cn:"打印",
                ko:"출력",
            },    
            "닫기":{
                en:"Close",
                jp:"閉じる",
                cn:"关闭",
                ko:"닫기",
            },     
            "주문완료":{
                en:"Your order has been completed.",
                jp:"ご注文が完了しました。",
                cn:"订单已完成。",
                ko:"주문을 완료했습니다.",
            },   
            
                
        }
    },
    extraReducers:(builder)=>{
        // 초기화
        builder.addCase(initCommon.fulfilled,(state, action)=>{
           
            const initState = {
                languages: ["en","cn","jp","kr"],
                selectedLanguage:"",
                installmentData:{
                    isOpen:false,
                    isCancel:false,
                    isOk:false,
                    returnData:{},
                },
                isConfirmPopup:false,
                isConfrim:true,
                confirmType:"",
                confirmIconUri:"",
                confirmRedTitle:"",
                confirmBlackTitle:"",
                confirmOKTitle:"",
                confirmCancelTitle:"",

                isPhonePopup:true,
                adminPostData:{},

                isAddShow:true,
                bannerList:[],
                weight:0,
            }
            return initState;

        })
        builder.addCase(initCommon.pending,(state, action)=>{
            const stateToChange = Object.assign({},state);
            return stateToChange;        
        })
        builder.addCase(initCommon.rejected,(state,action)=>{
            const stateToChange = Object.assign({},state);
            return stateToChange;        
        })
        // 셋
        builder.addCase(setCommon.fulfilled,(state, action)=>{
            const payload = action.payload;
            const stateToChange = Object.assign({},state,payload);
            return stateToChange;
        })
        builder.addCase(setCommon.pending,(state, action)=>{
            const stateToChange = Object.assign({},state);
            return stateToChange;
        })
        builder.addCase(setCommon.rejected,(state,action)=>{
            const stateToChange = Object.assign({},state);
            return stateToChange;
        })
        initializeApp
        // 앱 초기화
        builder.addCase(initializeApp.fulfilled,(state, action)=>{
            const payload = action.payload;
            const stateToChange = Object.assign({},state,payload);
            return stateToChange;
        })
        builder.addCase(initializeApp.pending,(state, action)=>{
            const stateToChange = Object.assign({},state);
            return stateToChange;
        })
        builder.addCase(initializeApp.rejected,(state,action)=>{
            const stateToChange = Object.assign({},state);
            return stateToChange;
        })
        // 배너
        builder.addCase(getBanner.fulfilled,(state, action)=>{
            const payload = action.payload;
            const stateToChange = Object.assign({},state,payload);
            return stateToChange;
        })
        builder.addCase(getBanner.pending,(state, action)=>{
            const stateToChange = Object.assign({},state);
            return stateToChange;
        })
        builder.addCase(getBanner.rejected,(state,action)=>{
            const stateToChange = Object.assign({},state);
            return stateToChange;
        })
        
        
        // 직원도움
        builder.addCase(postHelp.fulfilled,(state, action)=>{
        })
        builder.addCase(postHelp.pending,(state, action)=>{
        })
        builder.addCase(postHelp.rejected,(state,action)=>{
        })
    }
});
