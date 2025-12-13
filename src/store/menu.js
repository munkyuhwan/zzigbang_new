import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { ADMIN_API_BASE_URL, ADMIN_API_CATEGORY, ADMIN_API_GOODS } from "../resources/apiResources";
import { VAN_KOCES, VAN_SMARTRO, apiRequest } from "../utils/apiRequest";
import {isEmpty} from "lodash";
import { errorSlice, setError } from "./error";
import FastImage from "react-native-fast-image";
import { serviceFunction, servicePayment } from "../utils/smartro";
import { EventRegister } from "react-native-event-listeners";
import { metaPostPayFormat } from "../utils/metaPosDataForm";
import { adminDataPost, getMinWeightItem, getPosStoreInfo, getStoreID, isNetworkAvailable, isNewDay, itemEnableCheck, openAlert, openInstallmentPopup, postLog, postOrderToPos, printReceipt, setBell, trimSmartroResultData } from "../utils/common";
import { dispatchShowAlert, onConfirmCancelClick, setCommon } from "./common";
import { KocesAppPay } from "../utils/kocess";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { increment, reset } from "./counter";
import { storage } from "../utils/localStorage";
import { setFullPopup } from "./fullPopup";
import { NativeModules } from "react-native";

export const initMenu = createAsyncThunk("menu/initMenu", async(_,{dispatch,getState, rejectWithValue}) =>{
    return;
})
export const setMenu = createAsyncThunk("menu/setMenu", async(data,{dispatch,getState, rejectWithValue}) =>{
    return data;
})
export const getCategories = createAsyncThunk("menu/getCategories", async(_,{dispatch,getState, rejectWithValue}) =>{
    
    const storeID = storage.getString("STORE_IDX");
    const bsnNo = storage.getString("BSN_NO");
    const tidNo = storage.getString("TID_NO");
    const result = await apiRequest(`${ADMIN_API_BASE_URL}${ADMIN_API_CATEGORY}`,{"STORE_ID":`${storeID}`}).catch(error=>error);
    if(!isEmpty(result?.errorMsg)) {
        return rejectWithValue(result?.errorMsg);
    }
    return result;
})

export const getMenu = createAsyncThunk("menu/getMenu", async(_,{dispatch,getState, rejectWithValue}) =>{
    
    //const storeID = await AsyncStorage.getItem("STORE_IDX");
    //const bsnNo = await AsyncStorage.getItem("BSN_NO");
    //const tidNo = await AsyncStorage.getItem("TID_NO");

    const storeID = storage.getString("STORE_IDX");
    const bsnNo = storage.getString("BSN_NO");
    const tidNo = storage.getString("TID_NO");
    

    const categoryResult = await apiRequest(`${ADMIN_API_BASE_URL}${ADMIN_API_CATEGORY}`,{"STORE_ID":`${storeID}`}).catch(error=>error);
    if(!isEmpty(categoryResult?.errorMsg)) {
        EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"초기화", str:categoryResult?.errorMsg});
        return rejectWithValue(result?.errorMsg);
    }
    var categories = categoryResult?.goods_category
    const result = await apiRequest( `${ADMIN_API_BASE_URL}${ADMIN_API_GOODS}`,{"STORE_ID":`${storeID}`}).catch(error=>error);;
    if(!isEmpty(result?.errorMsg)) {
        EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"초기화", str:result?.errorMsg});

        return rejectWithValue(result?.errorMsg);
    }   
    categories = categories.filter(el=>(el.is_del=="N" && el.is_use=="Y"  && el.is_view=="Y") );
    const menuData = result.order;
    const minWeight = getMinWeightItem(menuData);
    console.log("minWeight: ",minWeight);
    if(minWeight!=null) {
        storage.set("MIN_WEIGHT",minWeight?.weight);
    }
    // 카테고리 별로 데이터 정렬 
    const menuInOrder = [];
    for(var i=0;i<categories.length;i++) {
        var subCat = [];
        var mainItems = [];
        for(var k=0;k<menuData.length;k++) {
            if(categories[i]?.cate_code1 ==menuData[k]?.cate_code ) {
                if(!isEmpty(menuData[k].gimg_chg)) {
                    FastImage.preload([{uri:`${menuData[k].gimg_chg}`}]);
                }
                if(menuData[k].is_del=="N" && menuData[k].is_use=="Y"  && menuData[k].is_view=="Y"   ){
                    mainItems.push(menuData[k])
                }
                if(categories[i].is_del=="N" && categories[i].is_use=="Y"  && categories[i].is_view=="Y"   ){
                }
            }
        }
        //console.log("categories[",i,"]: ",categories[i]);
        if(!isEmpty(categories[i].level2)) {
            var mainData = {items:mainItems,code1:categories[i].cate_code1,name_kr:categories[i]?.cate_name1, name_cn:categories[i].cate_name1_cn, name_en:categories[i].cate_name1_en, name_jp:categories[i].cate_name1_jp }
            var subItems = [];
            for(var j=0;j<categories[i].level2?.length;j++) {
                if(categories[i].level2[j].is_del=="N" && categories[i].level2[j].is_use=="Y"  && categories[i].level2[j].is_view=="Y"   ){
                    
                    for(var k=0;k<menuData.length;k++) {
                        if(categories[i].level2[j]?.cate_code2 ==menuData[k]?.cate_code ) {
                            if(!isEmpty(menuData[k].gimg_chg)) {
                                FastImage.preload([{uri:`${menuData[k].gimg_chg}`}]);
                                //FastImage.preload([{uri:menuData[k].gimg_chg}]);
                            }
                            subItems.push(menuData[k])
                        }
                    }
                    const subCatData = {items:subItems,code2:categories[i].level2[j]?.cate_code2, name_kr:categories[i].level2[j]?.cate_name2, name_cn:categories[i].level2[j]?.cate_name2_cn, name_en:categories[i].level2[j]?.cate_name2_en, name_jp:categories[i].level2[j]?.cate_name2_jp};
                    subCat.push(subCatData);
                }
            }
        }else {
            console.log("main");
            var mainData = {items:mainItems,code1:categories[i].cate_code1,name_kr:categories[i]?.cate_name1, name_cn:categories[i].cate_name1_cn, name_en:categories[i].cate_name1_en, name_jp:categories[i].cate_name1_jp }
        }
        var tmpCat = { mainCat:mainData, subCat:subCat };
        menuInOrder.push(tmpCat);
    }
    return {menuData:menuInOrder, categories: categories, items:menuData};
})

export const initOrderList = createAsyncThunk("menu/initOrderList", async(data,{dispatch,getState, rejectWithValue}) =>{
    return;
})

// 결제
export const startPayment = createAsyncThunk("menu/startPayment", async(data,{dispatch,getState, rejectWithValue}) =>{
    EventRegister.emit("showSpinner",{isSpinnerShow:true, msg:"주문 중 입니다.", spinnerType:"",closeText:""})
    //const {STORE_IDX} = await getStoreID();
    const STORE_IDX = storage.getString("STORE_IDX");
    const { orderList, breadOrderList, items } = getState().menu;
    const { weight, strings, selectedLanguage } = getState().common;

    var totalAmt = 0;
    var surtax = 0;

    totalAmt = data?.totalPrice;
    surtax = data?.totalVat;

    console.log("orderList: ",orderList);
    // 주문내역확인
    if(orderList.length <=0 && breadOrderList.length <=0 ) {
        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
        EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문하기", str:`주문 내역을 확인 해 주세요.`});
        return rejectWithValue();
    }
    if(totalAmt<=0) {
        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
        EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"결제", str:"메뉴를 선택 해 주세요."});
        return rejectWithValue();
    }
    
    //if(breadOrderList.length>0) {
    //    if(weight.includes("-")) {
    //        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
    //        EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"오류", str:"저울의 영점이 맞지 않습니다. 직원을 호출 해 주세요."});
    //        return rejectWithValue();
    //    }
    //}
    
    // 할부 선택
    var installment = "00";
    if(Number(totalAmt) > 50000) {
        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""})
        const installmentResult = await openInstallmentPopup(dispatch, getState)
        .catch((err)=>{
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
            return new Error("할부를 선택할 수 없습니다.");
        })
        try{
            if(installmentResult?.response == "ok") {
                installment = installmentResult?.data?.installment;
                dispatch(setCommon({installmentData:{isOpen:false,isCancel:false,isOk:false,returnData:{}}}));
            }else if(installmentResult?.response == "cancel") {
                dispatch(setCommon({installmentData:{isOpen:false,isCancel:false,isOk:false,returnData:{}}}));
                return rejectWithValue();
            }else {
                console.log("installmentResult: ",installmentResult)
                EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"할부", str:"할부를 선택할 수 없습니다."});
                dispatch(setCommon({installmentData:{isOpen:true,isCancel:false,isOk:false,returnData:{}}}));
                return rejectWithValue();
            }
        }catch(err) {
            console.log("err: ",err);
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
            EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"할부", str:err.message});
            dispatch(setCommon({installmentData:{isOpen:true,isCancel:false,isOk:false,returnData:{}}}));
            return rejectWithValue();
        }
    }

    // 주문 가능 상태 확인
    const POS_NO = storage.getString("POS_NO");
    try {
        const isPostable = await isNetworkAvailable();
        if(!isPostable) {
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
            return rejectWithValue();
        }
        const storeInfo = await getPosStoreInfo();
        // 개점정보 확인
        if(!storeInfo?.SAL_YMD) {
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
            EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"포스 오류", str:"개점이 되지않아 주문을 할 수 없습니다."});
            return rejectWithValue();
        }
        // 포스번호 확인
        if(POS_NO instanceof Error) {
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
            EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문 오류", str:"포스번호를 설정해 주세요."});
            return rejectWithValue();
        }
        if(POS_NO == null ){
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
            EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문 오류", str:"포스번호를 설정해 주세요."});
            return rejectWithValue();
        }
        var PRNT_ORD_NO = await AsyncStorage.getItem("POS_NO").catch(err=>err);
        if(PRNT_ORD_NO instanceof Error) {
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
            EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문 오류", str:"포스번호를 설정해 주세요."});
            return rejectWithValue();  
        }
           
    }catch(err) {
        console.log("err: ",err)
        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
        EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"포스 오류", str:err.errorMsg});
        return rejectWithValue();
    }
    /// 카트메뉴 주문 가능 여부 체크
    
    const isItemOrderble = await itemEnableCheck(STORE_IDX,[...orderList,...breadOrderList]).catch(err=>{ return{isAvailable:false, result:null} } );
    if(isItemOrderble?.isAvailable == false) {
        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
        EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문 오류", str:"수량을 초과해 주문을 할 수 없습니다."});
        return rejectWithValue();
    }
  
    const bsnNo = storage.getString("BSN_NO");
    const tidNo = storage.getString("TID_NO");
    const amtData = {amt:totalAmt, taxAmt:surtax, months:installment, bsnNo:bsnNo,termID:tidNo }
    
    /* const storedCount = storage.getString("counterValue");
    if(storedCount == null) {
        var newCount = 1
    }else {
        if(Number(storedCount)>=999) {
            var newCount = 1;
        }else {
            var newCount = Number(storedCount)+1
        }
    }
    storage.set("counterValue",`${newCount}`);
    console.log("newCount: ",newCount);
    var PRINT_ORDER_NO = `${POS_NO}${newCount}`
    storage.set("orderNo",`${PRINT_ORDER_NO}`);  */
    // 오늘 날짜 문자열 (예: 2025-11-26)
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // 저장된 날짜
    const storedDate = storage.getString("counterDate");

    // 저장된 카운트
    const storedCount = storage.getString("counterValue");

    // 날짜가 다르면 카운트 리셋
    let newCount;

    if (storedDate !== today) {
        // 날짜가 다르면 1로 초기화
        newCount = 1;
        storage.set("counterDate", today); // 날짜 갱신
    } else {
        // 날짜가 같으면 기존 카운트 증가
        if (storedCount == null) {
            newCount = 1;
        } else {
            if (Number(storedCount) >= 999) {
                newCount = 1; // 최대값 초과 시 초기화
            } else {
                newCount = Number(storedCount) + 1;
            }
        }
    }

    // 카운트 저장
    storage.set("counterValue", `${newCount}`);

    console.log("newCount:", newCount);

    // 주문 번호 생성
    const PRINT_ORDER_NO = `${POS_NO}${newCount}`;
    storage.set("orderNo", PRINT_ORDER_NO);

    var result;

    if(storage.getString("VAN")==VAN_KOCES) {

        var kocessAppPay = new KocesAppPay();
        try{
            result = await kocessAppPay.requestKocesPayment(amtData)
            //result = {"AnsCode": "0000", "AnswerTrdNo": "null", "AuNo": "28872915", "AuthType": "null", "BillNo": "", "CardKind": "1", "CardNo": "9411-9400-****-****", "ChargeAmt": "null", "DDCYn": "1", "DisAmt": "null", "EDCYn": "0", "GiftAmt": "", "InpCd": "1107", "InpNm": "신한카드", "Keydate": "", "MchData": "wooriorder", "MchNo": "22101257", "Message": "마이신한P잔여 : 109                     ", "Month": "00", "OrdCd": "1107", "OrdNm": "개인신용", "PcCard": "null", "PcCoupon": "null", "PcKind": "null", "PcPoint": "null", "QrKind": "null", "RefundAmt": "null", "SvcAmt": "0", "TaxAmt": `${surtax}`, "TaxFreeAmt": "0", "TermID": "0710000900", "TradeNo": "000004689679", "TrdAmt": `${totalAmt}`, "TrdDate": "240902182728", "TrdType": "A15"}
            console.log("result: ",result);
        }catch(err) {
            console.log("err============",err);

            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
            EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"결제 오류", str:err.Message});    
            return rejectWithValue();
        }
    }
    else if(storage.getString("VAN")==VAN_SMARTRO) {
        EventRegister.emit("showSpinner",{isSpinnerShow:true, msg:"결제 중입니다.", spinnerType:"pay",closeText:"취소"});
        console.log("smartro============");
        const paymentData = {"deal":"approval","total-amount":totalAmt+surtax,"surtax":surtax,"installment":installment, "attribute":["attr-continuous-trx","attr-include-sign-bmp-buffer","attr-enable-switching-payment","attr-display-ui-of-choice-pay"]}
    //"approval-no":"031383008","approval-date":"240722"
        // 현금영수증 취소 요청
        //const smartroData = {...{"service":"payment", "type":"credit", "deal":"approval", "personal-id":""}, ...paymentData, ...SMARTRO_COMMON_DATA};
        //console.log("smartroData: ",smartroData);

        result = await servicePayment(dispatch,false, paymentData);   
        result = JSON.parse(result);
        //result = {"service": "payment","type": "credit","persional-id": "01040618432","deal": "approval","total-amount": totalAmt+surtax,"cat-id": "7109912041","business-no": "2118806806","device-name": "SMT-Q453","device-auth-info": "####SMT-Q453","device-auth-ver": "1201","device-serial": "S423050950","card-no": "94119400********","van-tran-seq": "240605215745","business-name": "주식회사 우리포스","business-owner-name": "김정엽","business-phone-no": "02  15664551","business-address": "인천 부평구 부평대로 337  (청천동) 제이타워3차지신산업센터 806,807호","display-msg": "정상승인거래r간편결제수단: 삼성페이승인","response-code": "00","approval-date": "240605","approval-time": "215744","issuer-info": "0300마이홈플러스신한","acquire-info": "0300신한카드사","merchant-no": "0105512446","approval-no": "37151483","receipt-msg": "정상승인거래r간편결제수단: 삼성페이승인","service-result": "0000"}
        /* result = {"service":"payment"
        ,"type":"credit"
        ,"deal":"approval"
        ,"personal-id":""
        ,"total-amount":2900
        ,"surtax":264
        ,"installment":"00"
        ,"attribute":["attr-continuous-trx"
        ,"attr-include-sign-bmp-buffer"
        ,"attr-enable-switching-payment"
        ,"attr-display-ui-of-choice-pay"]
        ,"cat-id":"7519571002"
        ,"business-no":"6645600780"
        ,"device-name":"SMT-Q453"
        ,"device-auth-info":"####SMT-Q453"
        ,"device-auth-ver":"1201"
        ,"device-serial":"S425030769"
        ,"card-no":"47224600********"
        ,"business-name":"에이치제이상사"
        ,"business-address":"인천 부평구 부평대로 337 807호 일부(청천동 부평 제이타워3차 지식산업센터)"
        ,"business-owner-name":"김현정"
        ,"business-phone-no":"02 15664551"
        ,"van-tran-seq":"251016152540"
        ,"response-code":"00"
        ,"approval-date":"251016"
        ,"approval-time":"152539"
        ,"issuer-info":"0300신한카드체크"
        ,"acquire-info":"0300신한카드"
        ,"merchant-no":"0133289785"
        ,"approval-no":"45946907"
        ,"display-msg":"정상승인거래 간편결제수단: 삼성페이승인"
        ,"receipt-msg":"정상승인거래 간편결제수단: 삼성페이승인"
        ,"service-result":"0000"}
   */

        console.log("smartro result: ",result);

        if(result["response-code"] != "00") {
            console.log("cardPayResult: ",result);
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""})
            if(result["service-result"] == "0000") {
                EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"결제 실패", str:`${result["service-result"]}: ${result["display-msg"]}`})
            }else {
                EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"결제 실패", str:`${result["service-result"]}: ${result["service-description"]}`})
            }
            //dispatch(setCalculator({isProcess:false}));
            return rejectWithValue();
        }
        result = {...result,...{surtax:surtax,installment:installment} };
    }else {
        EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문 오류", str:"결제 단말기를 선택 해 주세요"});    
        return rejectWithValue();
    }

    // 포스로 전달하기 위한 포멧으로 데이터 변경
    const orderFinalData = await metaPostPayFormat([...orderList,...breadOrderList],result, items, PRINT_ORDER_NO);
    if(orderFinalData instanceof Error) {
        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
        EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문 포맷 오류", str:orderFinalData.errorMsg});    
        return rejectWithValue();
    }

    //console.log("orderfinal data: ",orderFinalData);
    // 포스에 요청
    var posOrderResult = await postOrderToPos(storage.getString("VAN"), result,orderFinalData, PRINT_ORDER_NO).catch(err=>err);  
    //console.log("posOrderResult: ",posOrderResult)
    if(posOrderResult instanceof Error) {
        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
        EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문 오류", str:posOrderResult.errorMsg});    
        return rejectWithValue();
    }

    // 서버에 올림
    //const postAdminResult = adminDataPost(result,orderFinalData,items).catch(err=>{return err}); 
    postLog(result,orderFinalData);     
    
    EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
    //EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문 완료", str:"주문완료"});  
    const bellData = [...orderList,...breadOrderList];

    if(orderList.length<=0 && breadOrderList.length>0) {
        
        dispatch(dispatchShowAlert({
            title:"영수증", 
            msg:"영수증을 출력하시겠습니까?", 
            okFunction:()=>{ 
                printReceipt( orderList, breadOrderList, items, result); 
                dispatch(initOrderList()); 
                dispatch(setCommon({isAddShow:true})); 
            }, 
            cancelFunction:()=>{
                dispatch(initOrderList()); 
                dispatch(setCommon({isAddShow:true}));     
            }}
            )
        ); 
    }else {
        if(storage.getString("isBellUse")=="Y"){

            adminDataPost(result, orderFinalData ,items, `010`).catch(err=>{return err});
            
            dispatch(dispatchShowAlert({title:"영수증", msg:"영수증을 출력하시겠습니까?", 
                okFunction:async ()=>{ 
                    await printReceipt(orderList, breadOrderList, items, result); 
                    await dispatch(initOrderList()); 
                    setBell(dispatch,orderList,items);
                }, 
                cancelFunction:()=>{
                    dispatch(initOrderList());
                    setBell(dispatch,orderList,items);
                } 
            }
            )
          );
        
        }else {
            dispatch(onConfirmCancelClick({confirmType:"pay",payData:{result,orderFinalData,items}}));
        }
    }

    //openAlert(dispatch,getState, "영수증", "영수증을 출력하시겠습니까?", ()=>{console.log("on ok clicked");})

    return {payResultData:result};

    //.then(async (result)=>{ 
        //const result = {"AnsCode": "0000", "AnswerTrdNo": "null", "AuNo": "28872915", "AuthType": "null", "BillNo": "", "CardKind": "1", "CardNo": "9411-9400-****-****", "ChargeAmt": "null", "DDCYn": "1", "DisAmt": "null", "EDCYn": "0", "GiftAmt": "", "InpCd": "1107", "InpNm": "신한카드", "Keydate": "", "MchData": "wooriorder", "MchNo": "22101257", "Message": "마이신한P잔여 : 109                     ", "Month": "00", "OrdCd": "1107", "OrdNm": "개인신용", "PcCard": "null", "PcCoupon": "null", "PcKind": "null", "PcPoint": "null", "QrKind": "null", "RefundAmt": "null", "SvcAmt": "0", "TaxAmt": `${surtax}`, "TaxFreeAmt": "0", "TermID": "0710000900", "TradeNo": "000004689679", "TrdAmt": `${totalAmt}`, "TrdDate": "240902182728", "TrdType": "A15"}
       
   /*  })
    .catch((err)=>{
        // 결제 진행끝이다.
        dispatch(postLog({payData:err,orderData:null}))
        return rejectWithValue();
    }) */
})

// Slice
export const menuSlice = createSlice({
    name: 'menu',
    initialState: {
        menu: [],
        items:[],
        categories:[],
        selectedItems:[],
        detailItem:{},
        isProcessing:false,
        orderList:[],
        breadOrderList:[],
        isPayStarted:false,
        /////////////////
        payResultData:{},
    },
    extraReducers:(builder)=>{
        // 초기화
        builder.addCase(initMenu.fulfilled,(state, action)=>{
            const initState = {
                menu: [],
                items:[],
                categories:[],
                selectedItems:[],
                detailItem:{},
                isProcessing:false,
                orderList:[],
                breadOrderList:[],
                isPayStarted:false,
                payResultData:{}
            }
            return initState;
        })
        builder.addCase(initMenu.pending,(state, action)=>{
            const stateToChange = Object.assign({},state,{isProcessing:true});
            return stateToChange;        
        })
        builder.addCase(initMenu.rejected,(state,action)=>{
            const stateToChange = Object.assign({},state,{isProcessing:false});
            return stateToChange;
        })
        // 셋
        builder.addCase(setMenu.fulfilled,(state, action)=>{
            const payload = action.payload;
            const stateToChange = Object.assign({},state,payload);
            return stateToChange;
        })
        builder.addCase(setMenu.pending,(state, action)=>{
            const stateToChange = Object.assign({},state,{isProcessing:true});
            return stateToChange;
        })
        builder.addCase(setMenu.rejected,(state,action)=>{
            const stateToChange = Object.assign({},state,{isProcessing:false});
            return stateToChange;

        })
        // get menu
        builder.addCase(getMenu.fulfilled,(state, action)=>{
            const payload = {
                menu:action.payload.menuData,
                items:action.payload.items,
                categories:action.payload.categories,
                isProcessing:false,
            }
            const newPayload = Object.assign({},state,payload);
            return newPayload;
        })
        builder.addCase(getMenu.pending,(state, action)=>{
            const stateToChange = Object.assign({},state,{isProcessing:true});
            return stateToChange;
        })
        builder.addCase(getMenu.rejected,(state,action)=>{
            const stateToChange = Object.assign({},state,{isProcessing:false});
            return stateToChange;
        })
        // get categories
        builder.addCase(getCategories.fulfilled,(state, action)=>{
            const payload = {
                categories:action.payload.goods_category,
                isProcessing:false,
            }
            const newPayload = Object.assign({},state,payload);
            return newPayload;
        })
        builder.addCase(getCategories.pending,(state, action)=>{
            const stateToChange = Object.assign({},state,{isProcessing:true});
            return stateToChange;
        })
        builder.addCase(getCategories.rejected,(state,action)=>{
            const stateToChange = Object.assign({},state,{isProcessing:false});
            return stateToChange;
        })
        // startPayment
        builder.addCase(startPayment.fulfilled,(state, action)=>{
            const payload = action.payload;
            const stateToChange = Object.assign({},state,payload);
            return stateToChange;
            /* const initState = {
                selectedItems:[],
                detailItem:{},
                isProcessing:false,
                orderList:[],
                breadOrderList:[],
                isPayStarted:false,
            }
            return Object.assign({},state,initState); */
        })
        builder.addCase(startPayment.pending,(state, action)=>{
            const stateToChange = Object.assign({},state,{isProcessing:false});
            return stateToChange;
        })
        builder.addCase(startPayment.rejected,(state,action)=>{
            const stateToChange = Object.assign({},state,{isProcessing:false});
            return stateToChange;
        })
        // initOrderList
        builder.addCase(initOrderList.fulfilled,(state, action)=>{
            const initState = {
                selectedItems:[],
                detailItem:{},
                isProcessing:false,
                orderList:[],
                breadOrderList:[],
                isPayStarted:false,
                payResultData:{}
            }
            return Object.assign({},state,initState);
        })
        builder.addCase(initOrderList.pending,(state, action)=>{
            const stateToChange = Object.assign({},state,{isProcessing:false});
            return stateToChange;
        })
        builder.addCase(initOrderList.rejected,(state,action)=>{
            const stateToChange = Object.assign({},state,{isProcessing:false});
            return stateToChange;
        })
        
    }
});
