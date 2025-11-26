import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setFullPopupContent, setFullPopupVisibility, setPopupContent, setPopupVisibility, setTransPopupContent, setTransPopupVisibility } from '../store/popup';
import {isEqual, isEmpty} from 'lodash';
import RNFS from 'react-native-fs';
import RNFetchBlob from 'rn-fetch-blob';
import { addImageStorage } from '../store/imageStorage';
import { getAD, setAdImgs } from '../store/ad';
import { fetch } from "@react-native-community/netinfo";
// device info
import DeviceInfo, { getUniqueId, getManufacturer } from 'react-native-device-info';
import moment from 'moment';
import { ADMIN_API_BASE_URL, ADMIN_API_MENU_CHECK, ADMIN_API_MENU_UPDATE, ADMIN_API_POST_ORDER, ADMIN_ERROR_LOG, ADMIN_PAY_LOG, POS_BASE_URL, POS_VERSION_CODE, POS_WORK_CD_REQ_STORE_INFO } from '../resources/apiResources';
import { EventRegister } from 'react-native-event-listeners';
import axios from 'axios';
import { setCommon } from '../store/common';
import { VAN_KOCES, VAN_SMARTRO, apiRequest, callApiWithExceptionHandling, posApiRequest } from './apiRequest';
import { LAN_CN, LAN_EN, LAN_JP } from '../resources/values';
import Tts from 'react-native-tts';
import { setAlert } from '../store/alert';
import { DeviceEventEmitter, NativeModules } from 'react-native';
import { KocesAppPay } from './kocess';
import store from '../store';
import { storage } from './localStorage';
import { metaPostPayFormat } from './metaPosDataForm';

const adminOrderHeader = {'Content-Type' : "text/plain"};

export const waitFor = (timeToDelay) => new Promise((resolve) => setTimeout(resolve, timeToDelay)) //이와 같이 선언 후

export function translator(input, lan){

}

/* 
export function getDeviceInfo () {
    DeviceInfo.getBatteryLevel().then((batteryLevel) => {
        //console.log("batteryLevel: ",batteryLevel)
    });
}

export function openPopup (dispatch, {innerView, isPopupVisible, param}) {
    if(isPopupVisible) {
        dispatch(setPopupContent({innerView:innerView,param:param})); 
        dispatch(setPopupVisibility({isPopupVisible:isPopupVisible}));    
    }else {
        dispatch(setPopupVisibility({isPopupVisible:isPopupVisible}));        
        dispatch(setPopupContent({innerView:innerView})); 
    }
}
export function openTransperentPopup (dispatch, {innerView, isPopupVisible, param}) {
    if(isPopupVisible) {
        dispatch(setTransPopupContent({innerView:innerView,param:param})); 
        dispatch(setTransPopupVisibility({isPopupVisible:isPopupVisible,param:param}));    
    }else {
        dispatch(setTransPopupVisibility({isPopupVisible:isPopupVisible,param:param}));    
        const disapearTimeout = setInterval(()=>{
            dispatch(setTransPopupContent({innerView:innerView,param:param})); 
            clearInterval(disapearTimeout);
        },500)
    } 
    dispatch(setTransPopupVisibility({isPopupVisible:isPopupVisible}));    
}

export function openFullSizePopup (dispatch, {innerFullView, isFullPopupVisible}) {
    if(isFullPopupVisible) {
        dispatch(setFullPopupContent({innerFullView:innerFullView})); 
        dispatch(setFullPopupVisibility({isFullPopupVisible:isFullPopupVisible}));    
    }else {
        dispatch(setFullPopupVisibility({isFullPopupVisible:isFullPopupVisible}));    
        const disapearTimeout = setInterval(()=>{
            dispatch(setFullPopupContent({innerFullView:innerFullView})); 
            clearInterval(disapearTimeout);
        },500)
    } 
    dispatch(setFullPopupVisibility({isFullPopupVisible:isFullPopupVisible}));    
}
*/
export function numberWithCommas(x) {
    if(x) {
        var parts = x.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }else {
        return "0";
    }
}
// 주문 가능 여부 체크
export function isOptionValid(itemOption, optionSelected) {
    return itemOption.every(option => {
        // `groupIdx`가 `idx`와 일치하는 `optionSelected`의 amt 합산
        const totalAmt = optionSelected
            .filter(selected => selected.groupIdx === option.idx)
            .reduce((sum, selected) => sum + selected.amt, 0);

        // limit_count 조건에 따른 검증
        const limitCount = parseInt(option.limit_count, 10);
        if (option.op_use !== "Y") return false; // 비활성화된 옵션
        if (limitCount === 0) return true; // 제한 없음
        if (limitCount === 1) return totalAmt === 1; // 합계가 1이어야 함
        if (limitCount >= 2) return totalAmt === limitCount; // 합계가 limit_count와 같아야 함

        return false; // 조건에 부합하지 않으면 유효하지 않음
    });
}

// 옵션 선택 데이터 정리
export function optionTrimmer(limitCnt, groupIdx, prodCD, optionSelect, operand=null) {
        var tmpOptionList = Object.assign([],optionSelect);
        const listCheck = tmpOptionList.filter(el=>el.groupIdx==groupIdx); // 선택한 옵션그룹
        const groupListWithout = tmpOptionList.filter(el=>el.groupIdx!=groupIdx); // 다른 옵션그룹
        var listToPush = [];
        if(limitCnt == 0) {
            // 무제한 
            // 선택외 리스트
            if(listCheck.length>0){
                var exceptedList = listCheck.filter(el=>el.prodCD!=prodCD);
                // 있으면 카운트 추가
                var prodData = listCheck.filter(el=>el.prodCD == prodCD);
                if(prodData.length>0) {
                    // 선택한 옵션이 있으면 카운트 올림
                    if(operand == "plus") {
                        var newList = {groupIdx: prodData[0].groupIdx, prodCD: prodData[0].prodCD, amt:(Number(prodData[0].amt)+1)}
                        exceptedList.push(newList);
                    }else {
                        if((Number(prodData[0].amt)-1) > 0) {
                            // 수량 내리기 0이상일 떄
                            var newList = {groupIdx: prodData[0].groupIdx, prodCD: prodData[0].prodCD, amt:(Number(prodData[0].amt)-1)}
                            exceptedList.push(newList);
                        }else {
                            // 수량 내리기 0일떄 
                            // 목록에서 빼야함;
                            var tmpProdData = listCheck.filter(el=>(el.prodCD != prodCD));
                            exceptedList = tmpProdData;
                        }
                    }
                    listToPush = exceptedList;
                }else {
                    if(operand == "plus") {
                        // 선택한 옵션이 없으면 추가
                        var newList = { groupIdx: groupIdx, prodCD: prodCD, amt:1 };
                        exceptedList.push(newList);
                        listToPush = exceptedList;
                    }else {
                        listToPush = exceptedList;
                    }
                }

            }else {
                if(operand == "plus") {
                    // 없으면 리스트에 추가
                    var exceptedList = listCheck.filter(el=>el.prodCD!=prodCD);
                    var newList = { groupIdx: groupIdx, prodCD: prodCD, amt:1 };
                    //listToPush = tmpOptionList.filter(el=>el.prodCD!=prodCD);
                    //groupListWithout.push(newList);
                    listToPush = [newList];
                }
            }
            return {result:true, list:[...groupListWithout,...listToPush]};

        }
        else if(limitCnt == 1) {
            // 라디오 선택
            var tmpList = [...groupListWithout,...[{ groupIdx: groupIdx, prodCD: prodCD, amt:1 }]]
            
            return {result:true, list:tmpList||[]};

        }
        else if(limitCnt > 1) {
            // 수량선택 제한
            if(listCheck.length>0){
                // 그룹에 선택한 메뉴가 있으면 카운트하기
                // 있으면 카운트 추가
                var prodData = listCheck.filter(el=>el.prodCD == prodCD);
                var groupAmt = 0;
                for(const groupCheck of listCheck) {
                    groupAmt += Number(groupCheck.amt);
                }
                if(groupAmt < limitCnt) {
                    // 이미 선택된 수량이 제한 수량보다 작을 떄 그냥 진행
                    if(operand == "plus") {
                        // 수량 더하기
                        if(prodData.length > 0){
                            console.log("수량제한 추가하기");
                            var newList = {groupIdx: prodData[0].groupIdx, prodCD: prodData[0].prodCD, amt:(Number(prodData[0].amt)+1)}
                        }else {
                            console.log("수량제한 새로 추가하기");
                            //var tmpList = listCheck;
                            var newList = {groupIdx: groupIdx, prodCD: prodCD, amt:1}
                        }
                        var tmpList = listCheck.filter(el=>(el.prodCD != prodCD ))
                        tmpList.push(newList);
                        tmpList = [...groupListWithout,...tmpList]
                        return {result:true, list:tmpList};
                    }else {
                        // 수량 빼기
                        if(prodData.length>0){
                            // 추가된 옵션이 있을 경우
                            if((Number(prodData[0].amt)-1) > 0) {
                                var newList = {groupIdx: prodData[0].groupIdx, prodCD: prodData[0].prodCD, amt:(Number(prodData[0].amt)-1)}
                                var tmpList = listCheck.filter(el=>(el.prodCD != prodData[0].prodCD));
                                tmpList.push(newList);
                            }else {
                                var tmpList = listCheck.filter(el=>(el.prodCD != prodData[0].prodCD));
                            }
                            tmpList = [...groupListWithout,...tmpList]
                            return {result:true, list:tmpList};
                        }else {
                            var tmpList = [...groupListWithout];
                            return {result:true, list:tmpList};
                        }
                    }
                }else {
                    // 수량이 초과할 때 마이너스만 계산함
                    if(operand == "minus") {
                        if(prodData.length>0) {
                            if((Number(prodData[0].amt)-1) > 0) {
                                var newList = {groupIdx: prodData[0].groupIdx, prodCD: prodData[0].prodCD, amt:(Number(prodData[0].amt)-1)}
                                var tmpList = listCheck.filter(el=>(el.prodCD != prodData[0].prodCD));
                                tmpList.push(newList);
                                tmpList = [...groupListWithout,...tmpList]
                                return {result:true, list:tmpList};
                            }else {
                                var tmpList = listCheck.filter(el=>( el.prodCD != prodData[0].prodCD));
                                tmpList = [...groupListWithout,...tmpList]
                                return {result:true, list:tmpList};
                            }
                        }else {
                            var tmpList = listCheck.filter(el=>( el.prodCD != prodData[0].prodCD));
                            tmpList = [...groupListWithout,...tmpList]
                            return {result:true, list:tmpList};
                        }
                    }else {
                        return {result:false, list:[]};
                    }
                }
            }else {
                if(operand == "plus") {
                    console.log("그룹 새로 추가")
                    // 없으면 리스트에 추가
                    var newList = { groupIdx: groupIdx, prodCD: prodCD, amt:1 };
                    var tmpList = tmpOptionList;
                    tmpList.push(newList||[]);
                }
            }
            return {result:true, list:tmpList||[]};
            
        }
        else {
            // 오류
            return {result:false, list:[]};
        }
}
export function numberPad(n, width) {
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}
export function getTableInfo() {
    return storage.getString("TABLE_INFO");
    /* 
    return await new Promise(function(resolve, reject){
        AsyncStorage.getItem("TABLE_INFO")
        .then((TABLE_INFO)=>{
            if(TABLE_INFO) {
                resolve({TABLE_INFO})
            }else {
                reject();                
            }
        })
    }) */
}
export function trimSmartroResultData(payData) {
    console.log("payData: ",payData);
    var cardNo = payData["card-no"];
    var TrdAmt = payData["payAmt"];
    var TaxAmt = payData["vatAmt"];
    var SvcAmt = 0;
    var AuNo = payData["approval-no"];
    var TrdDate = payData["approval-date"];
    var InpNm = payData["issuer-info"];
    var Month = payData["installment"];

    const trimmedData = {"CardNo":cardNo, "TrdAmt":TrdAmt,"TaxAmt":TaxAmt,"SvcAmt":SvcAmt,"AuNo":AuNo,"TrdDate":TrdDate,"InpNm":InpNm,"Month":Month}
    return trimmedData;
}
/// ip받기
export function getIP() {
    return storage.getString("POS_IP");
    /* 
    return await new Promise(function(resolve, reject){
        AsyncStorage.getItem("POS_IP")
        .then((POS_IP)=>{
            if(POS_IP) {
                resolve({POS_IP})
            }else {
                reject();                
            }
        })
        .catch(err=>{
            reject();
        })
    }) */
}

export async function postLog (payData,orderData) {
    const date = new Date();
    const tableNo = getTableInfo();
    // admin log
    const storeID = storage.getString("STORE_IDX");
    let auData = [];
    //  [{"prod_cd": "900026", "qty": 1, "set_item": [[Object]]}, {"prod_cd": "900022", "qty": 1, "set_item": []}]

    let logdata = {
        time:`${date.getFullYear()}${numberPad(date.getMonth()+1,2)}${numberPad(date.getDate(),2)}`,
        storeID: `${storeID}`,
        tableNo:`${tableNo['TABLE_INFO']}`,
        auData:JSON.stringify([{date:`${date.getFullYear()}${numberPad(date.getMonth()+1,2)}${numberPad(date.getDate(),2)}`, AuNo:`${payData?.AuNo}`,TrdAmt:`${Number(payData?.TrdAmt)+Number(payData?.TaxAmt)}` }]),
        orderList:JSON.stringify(orderData),
        payResult:JSON.stringify(payData)
    }
    //console.log("logdata: ",logdata);
    axios.post(
        `${ADMIN_API_BASE_URL}${ADMIN_PAY_LOG}`,
        logdata,
        adminOrderHeader,
    ) 
    .then((response => {
        
    })) 
    .catch(error=>{

    });
}
// 어드민 보내기
export async function adminDataPost(payData, orderData, allItems,phoneNumber) {
    new Promise(async (resolve,reject)=>{
        var postOrderData = Object.assign({}, orderData);
        const date = new Date();
        const tableNo = getTableInfo();
        if(tableNo instanceof Error) {
            reject("테이블을 선택 해 주세요.");
        }
        if(isEmpty(tableNo)) {
            EventRegister.emit("showSpinnerNonCancel",{isSpinnerShowNonCancel:false, msg:""})
            EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"결제", str:"테이블을 선택 해 주세요."});
            reject("테이블을 선택 해 주세요.");
        }
        //console.log("===========================")
        const STORE_IDX = getStoreID()
        // 결제시 추가 결제 결과 데이터
        let addOrderData = {};
        if(!isEmpty(payData)) {
            if(storage.getString("VAN")==VAN_KOCES) {
                addOrderData = {
                    TOTAL_AMT:Number(payData?.TrdAmt)+Number(payData?.TaxAmt),
                    TOTAL_VAT:Number(payData?.TaxAmt),
                    TOTAL_DC:Number(payData?.SvcAmt),
                    ORDER_STATUS:"3",
                    CANCEL_YN:"N",
                    PREPAYMENT_YN:"N",
                    CUST_CARD_NO:`${payData?.CardNo}`,
                    CUST_NM:``,
                    PAYMENT_CNT:1,
                    PAYMENT_INFO:[{
                        PAY_SEQ:1,
                        PAY_KIND:"2",
                        PAY_AMT:Number(payData?.TrdAmt)+Number(payData?.TaxAmt),
                        PAY_VAT:Number(payData?.TaxAmt),
                        PAY_APV_NO:`${payData?.AuNo}`,
                        PAY_APV_DATE:`20${payData?.TrdDate?.substr(0,6)}`,
                        PAY_CARD_NO:`${payData?.CardNo}********`,
                        PAY_UPD_DT:`20${payData?.TrdDate}`,
                        PAY_CANCEL_YN:"N",
                        PAY_CARD_TYPE:`${payData?.InpNm}`,
                        PAY_CARD_MONTH:`${payData?.Month}`
                    }]
                };
            }else if(storage.getString("VAN")==VAN_SMARTRO){
                addOrderData = {
                    TOTAL_AMT:Number(payData['total-amount']),
                    TOTAL_VAT:0,
                    TOTAL_DC:0,
                    ORDER_STATUS:"3",
                    CANCEL_YN:"N",
                    PREPAYMENT_YN:"N",
                    CUST_CARD_NO:`${payData['card-no']}`,
                    CUST_NM:``,
                    PAYMENT_CNT:1,
                    PAYMENT_INFO:[{
                        PAY_SEQ:1,
                        PAY_KIND:"2",
                        PAY_AMT:Number(payData['total-amount']),
                        PAY_VAT:0,
                        PAY_APV_NO:`${payData['approval-no']}`,
                        PAY_APV_DATE:`20${payData['approval-date']}`,
                        PAY_CARD_NO:`${payData['card-no']}`,
                        PAY_UPD_DT:`20${payData['approval-date']}`,
                        PAY_CANCEL_YN:"N",
                        PAY_CARD_TYPE:``,
                        PAY_CARD_MONTH:``
                    }]
                };
            }
            postOrderData = {...orderData,...addOrderData};
        }
        
        let addData = {
            "PREPAYMENT_YN":isEmpty(payData)?"N":"Y",
            "STORE_ID":STORE_IDX,
        }
        postOrderData = {...postOrderData,...addData,...{phone_number:phoneNumber}};
        console.log("1111postOrderData: ",postOrderData)
        try {
            const data = await apiRequest(`${ADMIN_API_BASE_URL}${ADMIN_API_POST_ORDER}`,postOrderData).catch(error=>error);;
            if(data) {
                if(data?.result) {
                    //dispatch(setCartView(false));
                    //dispatch(initOrderList());
                /*  if( tableStatus?.now_later == "선불") {
                        openTransperentPopup(dispatch, {innerView:"OrderComplete", isPopupVisible:true,param:{msg:"주문을 완료했습니다."}});
                    }else {
                        openTransperentPopup(dispatch, {innerView:"OrderComplete", isPopupVisible:true,param:{msg:"주문을 완료했습니다."}});
                        setTimeout(() => {
                            openTransperentPopup(dispatch, {innerView:"OrderList", isPopupVisible:true, param:{timeOut:10000} });
                        }, 3000);
                    } */
                    resolve();
                }else {
                    reject(data?.resultMsg)
                }
            }
        } catch (error) {
            // 예외 처리
            reject(error)
        }
    })

}
// 포스로 보내기
export async function postOrderToPos(vanType, postData,orderData, PRINT_ORDER_NO) {

    if(vanType == VAN_KOCES) {
        return new Promise(async(resolve, reject)=>{
            var postOrderData = Object.assign({},orderData);
            var cardNo = postData?.CardNo;
            cardNo = cardNo.replace(/\*/gi,"");
            cardNo = cardNo.replace(/-/gi,"");
            var addOrderData = {
                TOTAL_AMT:Number(postData?.TrdAmt)+Number(postData?.TaxAmt),
                TOTAL_VAT:Number(postData?.TaxAmt),
                TOTAL_DC:Number(postData?.SvcAmt),
                ORDER_STATUS:"3",
                CANCEL_YN:"N",
                PREPAYMENT_YN:"N",
                CUST_CARD_NO:`${postData?.CardNo}`,
                CUST_NM:``,
                PAYMENT_CNT:1,
                PAYMENT_INFO:[{
                    PAY_SEQ:1,
                    PAY_KIND:"2",
                    PAY_AMT:Number(postData?.TrdAmt)+Number(postData?.TaxAmt),
                    PAY_VAT:Number(postData?.TaxAmt),
                    PAY_APV_NO:`${postData?.AuNo}`,
                    PAY_APV_DATE:`20${postData?.TrdDate?.substr(0,6)}`,
                    PAY_CARD_NO:`${cardNo}********`,
                    PAY_UPD_DT:`20${postData?.TrdDate}`,
                    PAY_CANCEL_YN:"N",
                    PAY_CARD_TYPE:`${postData?.InpNm}`,
                    PAY_CARD_MONTH:`${postData?.Month}`
                }]
            };
            postOrderData = {...postOrderData,...addOrderData};

            const POS_IP = getIP() ;
            try {
                console.log("postOrderData: ",postOrderData);
                //const data = await callApiWithExceptionHandling(`${POS_BASE_URL(POS_IP)}`,postOrderData, {}); 
                const data = await posApiRequest(`${POS_BASE_URL(POS_IP)}`,postOrderData);   
                EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                if(data) {
                    if(data.ERROR_CD == "E0000") {
                        //EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문", str:data?.ERROR_MSG});
                        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                        resolve(data);
                        //return true;
                    }else {
                        EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문오류", str:data?.ERROR_MSG});
                        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                        reject(new Error(data?.ERROR_MSG));
                        //return new Error(data?.ERROR_MSG)
                    }
                }else {
                    EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문오류", str:"포스주문 실패."});
                    EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                    reject(new Error("POS ERROR"));
                }
            } catch (error) {
                // 예외 처리
                EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문오류", str:"포스 네트워크 오류."});
                EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                reject(new Error("POS ERROR"));
                //return new Error(error.message)
            }
        })
    }else if(vanType == VAN_SMARTRO) {
        console.log("postData: ",postData);
        return new Promise(async(resolve, reject)=>{
            var postOrderData = Object.assign({},orderData);
            
            var addOrderData = {
                TOTAL_AMT:Number(postData['total-amount']),
                TOTAL_VAT:Number(postData['surtax']),
                TOTAL_DC:"0",
                ORDER_STATUS:"3",
                CANCEL_YN:"N",
                PREPAYMENT_YN:"N",
                CUST_CARD_NO:`${postData['surtax']}`,
                CUST_NM:``,
                PAYMENT_CNT:1,
                PAYMENT_INFO:[{
                    PAY_SEQ:1,
                    PAY_KIND:"2",
                    PAY_AMT:Number(postData['total-amount']),
                    PAY_VAT:Number(postData['surtax']),
                    PAY_APV_NO:`${postData['approval-no']}`,
                    PAY_APV_DATE:`20${postData['approval-date']}`,
                    PAY_CARD_NO:`${postData['card-no']}`,
                    PAY_UPD_DT:`20${postData['approval-date']}`,
                    PAY_CANCEL_YN:"N",
                    PAY_CARD_TYPE:`${postData['acquire-info']}`,
                    PAY_CARD_MONTH:`${postData['installment']}`
                }]
            };
            postOrderData = {...postOrderData,...addOrderData};

            const POS_IP = getIP() ;
            try {
                //const data = await callApiWithExceptionHandling(`${POS_BASE_URL(POS_IP)}`,postOrderData, {}); 
                const data = await posApiRequest(`${POS_BASE_URL(POS_IP)}`,postOrderData);   
                EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                if(data) {
                    if(data.ERROR_CD == "E0000") {
                        //EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문", str:data?.ERROR_MSG});
                        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                        resolve(data);
                        //return true;
                    }else {
                        EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문오류", str:data?.ERROR_MSG});
                        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                        reject(new Error(data?.ERROR_MSG));
                        //return new Error(data?.ERROR_MSG)
                    }
                }else {
                    EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문오류", str:"포스주문 실패."});
                    EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                    reject(new Error("POS ERROR"));
                }
            } catch (error) {
                // 예외 처리
                EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문오류", str:"포스 네트워크 오류."});
                EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                reject(new Error("POS ERROR"));
                //return new Error(error.message)
            }
        })
    }
}
export function getStoreID() {
    return storage.getString("STORE_IDX");
    /* 
    return await new Promise(function(resolve, reject){
        AsyncStorage.getItem("STORE_IDX")
        .then((STORE_IDX)=>{
            if(STORE_IDX) {
                resolve({STORE_IDX  })
            }else {
                reject();                
            }
        })
    }) */
}

export async function openInstallmentPopup(dispatch,getState) {
    //dispatch(setDispatchPopup({isShowPopup:true,title:title,okTitle:okTitle,cancelTitle:cancelTitle,isCancelUse:isCancelUse}));
    dispatch(setCommon({installmentData:{isOpen:true}}));
    return new Promise((resolve, reject)=>{
        var timeInterval;
        try{
            timeInterval = setInterval(()=>{
                const {installmentData } = getState().common;
                const isCancelClicked = installmentData.isCancel;
                const isOkClicked = installmentData.isOk
                const returnData = installmentData.returnData;
                if(isCancelClicked || isOkClicked) {
                    clearInterval(timeInterval);
                    //dispatch(setPopup({isOkClicked:false,isCancelClicked:false,title:"",isShowPopup:false}));
                    var msg = "";
                    if(isCancelClicked){msg="cancel"}
                    if(isOkClicked){msg="ok"}
                    //dispatch(setCommon({installmentData:{isOpen:false,isCancel:false,isOk:false}}));
                    //reject({code:"XXXX",response:"error",data:{}});
                    resolve({code:"0000",response:msg,data:returnData});
                }
            },500)
        }
        catch(err) {
            reject({code:"XXXX",response:"error",data:{}});
        }
    })
}
export const compareArrays = (data1, data2) => {
    // 배열의 길이가 다르면 바로 false 리턴
  if (data1.length !== data2.length) {
    return false;
  }

  // 정렬 기준: groupIdx, prodCD, amt 순으로 정렬
  const sortByKey = (data) => {
    return data.slice().sort((a, b) => {
      if (a.groupIdx !== b.groupIdx) {
        return a.groupIdx.localeCompare(b.groupIdx);
      }
      if (a.prodCD !== b.prodCD) {
        return a.prodCD.localeCompare(b.prodCD);
      }
      return a.amt - b.amt;
    });
  };

  // 정렬된 두 배열 비교
  const sortedData1 = sortByKey(data1);
  const sortedData2 = sortByKey(data2);

  // 각 항목을 비교
  for (let i = 0; i < sortedData1.length; i++) {
    const item1 = sortedData1[i];
    const item2 = sortedData2[i];

    // 각 항목의 값들이 동일한지 비교
    if (item1.amt !== item2.amt || item1.groupIdx !== item2.groupIdx || item1.prodCD !== item2.prodCD) {
      return false;
    }
  }

  // 모든 조건을 만족하면 true
  return true;

};
  
export const isNetworkAvailable = async () => {
    return new Promise((resolve, reject) =>{
        fetch().then(state => {
            if(state.isConnected == true) {
                resolve(true);
            }else {
                resolve(false);
            }
        })
        .catch(err=>{
            reject();
        })
        ;
    } )
}
export const StoreInfo = async(dispatch, data) =>{
    const POS_IP = getIP() ;
    console.log("POS_IP: ",POS_IP);
    return await new Promise(function(resolve, reject){
        axios.post(
            `${POS_BASE_URL(POS_IP)}`,
            {
                "VERSION" : POS_VERSION_CODE,
                "WORK_CD" : POS_WORK_CD_REQ_STORE_INFO,
                "ACCESS_CODE" : "NICE"

            },
            posOrderHeader,
        ) 
        .then((response => {
            if(metaErrorHandler(dispatch, response?.data)) {
                resolve(response?.data)
            }    
        })) 
        .catch(error=>{
            reject(error.response.data)
        });
    }) 
}
export const itemEnableCheck = async (STORE_IDX, items) => {
    var checkItemList = [];
    const rearrangeList = (checkItem) =>{
        const duplicated = checkItemList.filter(el=>el.prod_cd == checkItem.prod_cd);
        var excepted = checkItemList.filter(el=>el.prod_cd != checkItem.prod_cd);
        if(duplicated?.length>0) {
            // 중복이 있으면 카운트를 올린다.
            // duplicated[0]?.qty 앞에 저장된 수량, items[i].qty 추가될 수량
            const qtyChanged = {prod_cd:checkItem.prod_cd, qty:Number(duplicated[0]?.qty)+Number(checkItem.qty)};
            excepted.push(qtyChanged);
            checkItemList = Object.assign([],excepted);
        }else {
            // 중복이 없으면 그냥 배열에 추가
            checkItemList.push(checkItem);
        }

    }
    for(var i=0;i<items.length;i++) {
        const itemSet = {prod_cd:items[i].prodCD,qty:items[i].amt};
        // 이미 있는지 확인
        rearrangeList(itemSet);
        const setItems = items[i].option;
        for(var j=0;j<setItems.length;j++) {
            const setItemSet = {prod_cd:setItems[j].prodCD,qty:setItems[j].amt};
            rearrangeList(setItemSet);
        }
    }
    //console.log("==============================================================================");
    console.log("url: ",`${ADMIN_API_BASE_URL}${ADMIN_API_MENU_CHECK}`)
    console.log("checkItemList: ",{"STORE_ID":`${STORE_IDX}`,"order":checkItemList});

    return new Promise((resolve,reject)=>{
        apiRequest(`${ADMIN_API_BASE_URL}${ADMIN_API_MENU_CHECK}`,{"STORE_ID":`${STORE_IDX}`,"order":checkItemList}, {})
        .then((response)=>{
            if(response) {
                if(response?.result == true) {
                    if(response?.data?.length> 0) {
                        const data = response?.data[0];
                        const unserviceableItems = data?.unserviceable_items;
                        if(unserviceableItems?.length>0) {
                            resolve({isAvailable:false, result:response?.data});
                        }else {
                            resolve({isAvailable:true, result:response?.data});
                        }
                    }else {
                        reject();
                    }
                }else {
                    reject();
                }
            }else {
                reject();
            }
        })
        .catch(err=>{
            reject();
        })
    }) 
    

}

// 매장 정보 요청
export const getPosStoreInfo = async(dispatch, data) =>{
    const POS_IP = getIP();
    console.log("POS_IP: ",POS_IP);
    if(isEmpty(POS_IP)) {
        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""}); 
        return;
    }
    return await new Promise(function(resolve, reject){
        axios.post(
            `${POS_BASE_URL(POS_IP)}`,
            {
                "VERSION" : POS_VERSION_CODE,
                "WORK_CD" : POS_WORK_CD_REQ_STORE_INFO,
                "ACCESS_CODE" : "NICE"

            },  
        ) 
        .then((response => {
            resolve(response?.data)
        })) 
        .catch(error=>{
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});   
            reject(error.response.data)
        });
    }) 
}

export const isNewDay = (lastResetDate) => {
    const today = new Date().toDateString(); // 오늘 날짜
    return lastResetDate !== today; // 날짜가 다르면 true 반환
};
export const loadCounter = () => {
    // 날짜 키 상수
    const COUNT_KEY = 'counterValue';
    const DATE_KEY = 'lastResetDate';
    try {
      const storedCount =  storage.getString(COUNT_KEY);
      const storedDate =   storage.getString.getString(DATE_KEY);

      const today = new Date().toDateString();

      if (storedDate && isNewDay(storedDate)) {
        // 날짜가 변경되었으면 초기화
        storage.set(COUNT_KEY, '1');
        storage.set(DATE_KEY, today);
        return (1);
      } else if (storedCount) {
        return (parseInt(storedCount, 10));
      } else {
        // 초기 상태 저장
        storage.set(COUNT_KEY, '1');
        storage.set(DATE_KEY, today);
        return (1);
      }
    } catch (error) {
      console.error('Failed to load counter:', error);
    } finally {
        return (1);
    }
};

export const categoryName = (item, lan) =>{
    if(lan == LAN_EN) {
        return item?.cate_name1_en||item?.cate_name1
    }
    else if(lan == LAN_CN) {
        return item?.cate_name1_cn||item?.cate_name1
    }
    else if(lan == LAN_JP) {
        return item?.cate_name1_jp||item?.cate_name1
    }else {
        return item?.cate_name1;
    }
}
export const optionName = (item, lan) =>{
    if(lan == LAN_EN) {
        return item?.op_name_en||item?.op_name
    }
    else if(lan == LAN_CN) {
        return item?.op_name_cn||item?.op_name
    }
    else if(lan == LAN_JP) {
        return item?.op_name_jp||item?.op_name
    }else {
        return item?.op_name;
    }
}
export const menuCatName = (item, lan) =>{
    if(lan == LAN_EN) {
        return item?.name_en||item?.name_kr
    }
    else if(lan == LAN_CN) {
        return item?.name_cn||item?.name_kr
    }
    else if(lan == LAN_JP) {
        return item?.name_jp||item?.name_kr
    }else {
        return item?.name_kr;
    }
}
export const subCategoryName = (item, lan) =>{
}
export const menuName = (item, lan) =>{
    if(lan == LAN_EN) {
        return item?.gname_en||item?.gname_kr
    }
    else if(lan == LAN_CN) {
        return item?.gname_cn||item?.gname_kr
    }
    else if(lan == LAN_JP) {
        return item?.gname_jp||item?.gname_kr
    }else {
        return item?.gname_kr;
    }
}

// 메뉴 리스트에 수량 추가 하는 함수
export function updateList(tmpBreadList, newBreadList) {
    newBreadList.forEach(newItem => {
      const existingItem = tmpBreadList.find(item => item.prodCD === newItem.prodCD);
      
      if (existingItem) {
        // 동일한 prodCD가 있으면 amt 증가
        existingItem.amt += newItem.amt;
      } else {
        // 동일한 prodCD가 없으면 새 항목 추가
        tmpBreadList.push(newItem);
      }
    });
  
    return tmpBreadList; // 최종 결과 반환
}

export function trimBreadList(data) {
    const flattened = data.flat();

    // 2. prodCD를 기준으로 amt 합산
    const result = flattened.reduce((acc, item) => {
      const existing = acc.find((entry) => entry.prodCD === item.prodCD);
      if (existing) {
        existing.amt += item.amt; // amt 값을 증가
      } else {
        acc.push({ ...item }); // 새 객체 추가
      }
      return acc;
    }, []);
  
    return result;
  
}

export function speak(lan, str) {
            // "en","cn","jp","kr"
    var defaultLan = "ko-KR"
    if(lan == "en") {
        defaultLan = "en-US"
    }
    else if(lan == "cn") {
        defaultLan = "zh-CN"
    }
    else if(lan == "jp") {
        defaultLan = "ja-JP"
    }
    else if(lan == "kr") {
        defaultLan = "ko-KR"
    }

    Tts.setDefaultLanguage(defaultLan) // 프랑스어
        .then(() => {
        Tts.speak(str);  // 입력한 텍스트를 음성으로 변환하여 출력
            
        })
        .catch(error => {
            
        });

}
export function removeUnicodeControls(str) {
    return str.replace(/[\u202A-\u202E]/g, ""); // LTR, RTL 관련 유니코드 제거
}
  
var popupInterval;

export function openAlert(dispatch,getState, titleStr, msgStr, okFunction, cancelFunction) {
    dispatch(setAlert( {
        title:titleStr,
        msg:msgStr,
        okText:'출력',
        cancelText:'닫기',
        isCancle:true,
        isOK:true,
        icon:"receipt",   
        isAlertOpen:true,
    }))

    popupInterval = setInterval(() => {
        const {isAlertOpen, clickType} = getState().alert;
        console.log("isAlertOpen:",isAlertOpen);
        if(isAlertOpen == false ) {
            clearInterval(popupInterval);
            popupInterval=null;
            if(clickType=="OK") {
                okFunction();
            }else {
                cancelFunction();
            }
        }
    }, 500);

}

export function setBell(dispatch,orderList,items) {
    console.log("============set bell-=====================");
    const {Bell} = NativeModules; 
    const bellVID = storage.getString("bellVendorID")
    const bellPID = storage.getString("bellProductID")
    const orderNo = storage.getString("orderNo");

    var lan = "a";
    if(storage.getString("LAN")=="ko") {
        lan = "a";
    }else if(storage.getString("LAN")=="jp") {
        lan = "c";
    }else if(storage.getString("LAN")=="cn") {
        lan = "d";
    }else if(storage.getString("LAN")=="en") {
        lan = "b";
    }

    //console.log("orderList: ",orderList)
    //console.log("items: ",items)

    
    const corners = new Set();

    for (var item of orderList) {
      const prodCD = item.prodCD;
      const itemDet = items.filter(el => el.prod_cd === prodCD);
    
      if (itemDet?.length > 0) {
        console.log("itemDet[0]: ",itemDet[0]);
        //corners.push(itemDet[0].corner)
        itemDet.forEach(det => corners.add(det.corner));
      }
    }
    
    const uniqueCorners = [...corners];
    console.log("uniqueCorners: ",uniqueCorners);
    Bell.bellRing(lan,JSON.stringify(uniqueCorners),orderNo,bellVID,bellPID);
    //EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문완료", str:"진동벨을 챙겨주세요.",isCancle:false, isOK:false});
    dispatch(setAlert(
        {
            title:"주문완료",
            msg:'진동벨을 챙겨주세요.',
            subMsg:"",
            okText:'닫기',
            cancelText:'닫기',
            isCancle:false,
            isOK:false,
            icon:"",   
            isAlertOpen:true,
            clickType:"",
        }
    ));
    DeviceEventEmitter.removeAllListeners("onBellChange"); 
    DeviceEventEmitter.addListener("onBellChange",(data)=>{    
        dispatch(setCommon({isAddShow:true}));
        if(data) {
            console.log("responseData: ",(data.response));
            const responseData = JSON.parse(data.response);
            if(responseData?.code == "0000") {
                if(responseData?.response == "1") {
                    dispatch(setAlert(
                        {
                            title:"",
                            msg:'',
                            subMsg:"",
                            okText:'닫기',
                            cancelText:'',
                            isCancle:false,
                            isOK:false,
                            icon:"",   
                            isAlertOpen:false,
                            clickType:"",
                        }
                    ));
                }else{
                    dispatch(setAlert(
                        {
                            title:"주문완료",
                            msg:responseData?.msg,
                            subMsg:"",
                            okText:'닫기',
                            cancelText:'',
                            isCancle:false,
                            isOK:false,
                            icon:"",   
                            showAlert:true,
                            isAlertOpen:true,
                            clickType:"",
                        }
                    ));
                    EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문완료", str:responseData?.msg,isCancle:true});
                }
            }else {
                if(responseData?.code == "0002") {
                    dispatch(setAlert(
                        {
                            title:"",
                            msg:'',
                            subMsg:"",
                            okText:'닫기',
                            cancelText:'',
                            isCancle:false,
                            isOK:false,
                            icon:"",   
                            isAlertOpen:false,
                            clickType:"",
                        }
                    ));
                }else {
                    EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문오류", str:"진동벨에 오류가 있습니다.",isCancle:true});
                }

            }
        }
    });
    
}

export async function printReceipt(orderList, breadOrderList, items, payResultData) {
    const {Printer} = NativeModules; 
    var kocessAppPay = new KocesAppPay();
    //const storeDownload = await kocessAppPay.storeDownload();
    const businessData = storage.getString("STORE_INFO");
    const adminStoreName = storage.getString("STORE_NAME");
    const finalOrderData = trimReceiptData([...orderList,...breadOrderList], items);

    const orderFinalData = await metaPostPayFormat([...orderList,...breadOrderList],payResultData, items, null);
    if(orderFinalData instanceof Error) {
        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
        EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문 오류", str:orderFinalData.errorMsg});    
        return rejectWithValue();
    }


    const orderNo = storage.getString("orderNo");
   console.log("orderNo: ",orderNo);
    console.log("====================================================================");
    console.log(JSON.stringify(orderFinalData));
    console.log(JSON.stringify(finalOrderData));
    console.log(JSON.stringify(payResultData));
    console.log(JSON.stringify(businessData));
    console.log(adminStoreName);
    console.log(orderNo);
    console.log("====================================================================");
    Printer.Sam4sStartPrint(storage.getString("PRINT_PORT"), storage.getString("VAN"),JSON.stringify(orderFinalData), JSON.stringify(finalOrderData), JSON.stringify(payResultData), businessData, adminStoreName, orderNo);
}

export function trimReceiptData(data, items) {
    var returnData = [];
    for(var menu of data) {
        const filteredItem = items.filter(el=>el.prod_cd == menu.prodCD);
        if(filteredItem.length>0) {
            const itemDetail = {...filteredItem[0],...{order_amt:menu.amt}};
            returnData.push(itemDetail);
        }
    }
    return returnData;
    
}
export function paginateArray(data, pageSize = 10) {
    const paginated = [];
    for (let i = 0; i < data.length; i += pageSize) {
      paginated.push(data.slice(i, i + pageSize));
    }
    return paginated;
}

export const  postPayLog = async(data) =>{
    console.log(`${ADMIN_API_BASE_URL}${ADMIN_ERROR_LOG}`);
    console.log(data);
    return await new Promise(function(resolve, reject){
        axios.post(
            `${ADMIN_API_BASE_URL}${ADMIN_ERROR_LOG}`,
            data,
            adminOrderHeader,
        ) 
        .then((response => {
            const data = response?.data;
            if(data?.result) {
                resolve();     
            }else {
                reject()
            }
        })) 
        .catch(error=>{
            reject()
        });
    }) 
}
function findExactCombination(list, target, maxCount) {
    let found = null;

    function dfs(start, combo, sum) {
        if (found) return;
        if (combo.length > maxCount) return;

        if (sum === target) {
            found = [...combo];
            return;
        }
        if (sum > target) return;

        for (let i = start; i < list.length; i++) {
            const item = list[i];
            dfs(i + 1, [...combo, item], sum + item.w);
        }
    }

    dfs(0, [], 0);
    return found;
}

/**
 * 우선순위 3: 오차범위 적용 조합
 */
function findErrorCombination(list, target, maxCount) {
    let best = null;

    function dfs(start, combo, sumW, sumMin, sumMax) {
        if (best) return;
        if (combo.length > maxCount) return;

        // 오차범위 안에 들어오면 성공
        if (combo.length > 0) {
            if (sumMin <= target && target <= sumMax) {
                best = [...combo];
                return;
            }
        }

        for (let i = start; i < list.length; i++) {
            const it = list[i];

            const w = it.w;
            const err = it.err;

            const newSum = sumW + w;
            const newMin = sumMin + (w - err);
            const newMax = sumMax + (w + err);

            if (newMin > target) return; // 더 볼 필요 없음

            dfs(i + 1, [...combo, it], newSum, newMin, newMax);
        }
    }

    dfs(0, [], 0, 0, 0);
    return best;
}

export function getOptimizedWeightCombinations(items, minWeight, difference, maxCount = 5) {
      // 0. prod_l1_cd === '8000' 필터 추가
    var raw = items.filter(it => it.prod_l1_cd === "8000");
    if(storage.getString("MIN_WEIGHT")) {
        raw = raw.filter(it => Number(it.weight)>storage.getString("MIN_WEIGHT"));
    }

    // 1. 숫자 변환
    const candidates = raw
        .map(it => ({
            ...it,
            w: parseFloat(it.weight),
            err: parseFloat(it.w_margin_error || 0)
        }))
        .filter(it => !isNaN(it.w));

    // ===== 우선순위 1 : difference 와 정확히 동일한 단일 제품 =====
    const exactSingle = candidates.filter(it => it.w === difference);

    if (exactSingle.length > 0) {
        return exactSingle.slice(0, maxCount); // 여러 개면 maxCount 만큼
    }

    // ===== 우선순위 2 : 오차 없이 정확 조합 =====
    const exactCandidates = candidates.filter(it => it.w <= difference);
    exactCandidates.sort((a, b) => a.w - b.w);

    const exactCombo = findExactCombination(exactCandidates, difference, maxCount);
    if (exactCombo) return exactCombo;

    // ===== 우선순위 3 : 오차 포함 조합 =====
    const errorCombo = findErrorCombination(exactCandidates, difference, maxCount);
    if (errorCombo) return errorCombo;

    // 없으면 빈 배열
    return [];
    /* // prod_l1_cd 8000만 사용
    const raw = items.filter(it => it.prod_l1_cd === "8000");
    // 숫자 변환
    const candidates = raw
        .map(it => ({
            ...it,
            w: parseFloat(it.weight),
            err: parseFloat(it.w_margin_error || 0)
        }))
        .filter(it => !isNaN(it.w));

    // ⭐ 1) difference와 정확히 일치하는 빵 찾기 (여러 개일 수 있음)
    const exactMatches = candidates.filter(item => item.w === difference);

    if (exactMatches.length > 0) {
        // 여러 개일 경우 maxResults 만큼만 반환
        return exactMatches.slice(0, maxResults);
    }

    // ⬇️ exact match가 없을 때만 조합 알고리즘 실행

    const filtered = candidates.filter(i => i.w <= difference);
    filtered.sort((a, b) => a.w - b.w);
    console.log("filtered: ",filtered.length)

    let bestCombo = null;
    let bestGap = Infinity;

    function backtrack(start, combo, sumW, sumMin, sumMax) {
        if (combo.length > 5) return;

        if (combo.length >= 1) {
            if (sumMin <= difference && difference <= sumMax) {
                const gap = Math.abs(sumW - difference);
                if (gap < bestGap) {
                    bestGap = gap;
                    bestCombo = [...combo];
                }
            }
        }

        if (combo.length === 5) return;

        for (let i = start; i < filtered.length; i++) {
            const item = filtered[i];

            const w = item.w;
            const err = item.err;

            const newSumW = sumW + w;
            const newSumMin = sumMin + (w - err);
            const newSumMax = sumMax + (w + err);

            if (newSumMin > difference) break;

            combo.push(item);
            backtrack(i + 1, combo, newSumW, newSumMin, newSumMax);
            combo.pop();
        }
    }

    backtrack(0, [], 0, 0, 0);

    return bestCombo; */
}



export function getTopFive(items, difference, maxResults=5) {
    console.log("difference: ",difference);

    if (!Array.isArray(items) || items.length === 0) return [];

    // 숫자형으로 변환 + 필터링
    const validItems = items
        .map(item => {
        const weight = parseFloat(item.weight);
        console.log(item.gname_kr,": ",weight);
        const margin = parseFloat(item.w_margin_error);
        return { ...item, weight, margin };
        })
        .filter(item => !isNaN(item.weight) && !isNaN(item.margin));

    // difference가 아이템 무게 ± 허용오차 안에 있는지 체크
    const matched = validItems.filter(item => {
        const min = item.weight - item.margin;
        const max = item.weight + item.margin;
        return difference >= min && difference <= max;
    });

    // difference에 가장 가까운 순서대로 정렬
    const sorted = matched.sort(
        (a, b) =>
        Math.abs(a.weight - difference) - Math.abs(b.weight - difference)
    );
    console.log("sorted: ",sorted);
    // 상위 5개만 반환
    return sorted.slice(0, maxResults);

}

export function getGimgChgByCandidates(altCandidates, items) {
    if (!Array.isArray(altCandidates) || !Array.isArray(items)) return [];
  
    // allCandidates의 product_code 목록 추출
    const candidateCodes = altCandidates.map(c => c.product_code);
    console.log("items: ",items[0])
    // items 중 product_code가 일치하는 항목들의 gimg_chg만 추출
    
    
    const result = items
      .filter(item => candidateCodes.includes(item.prod_cd))
      .map(item => item);
  
    return result;
}
  
export   function getMinWeightItem(menuData) {
    if (!Array.isArray(menuData) || menuData.length === 0) return null;
  
    // 빵 데이터만 
    const breadMenuData = menuData.filter(item => item.cate_code == "8000");
    
    // weight가 유효한 숫자인 항목만 필터링
    const validItems = breadMenuData.filter(
      item => item.weight !== null && item.weight !== undefined && !isNaN(Number(item.weight))
    );
  
    if (validItems.length === 0) return null;
  
    // 최소 weight를 가진 객체 찾기
    return validItems.reduce((minItem, current) =>
      Number(current.weight) < Number(minItem.weight) ? current : minItem
    );
}

export function findWeightCombinations(menuData, targetWeight, tolerance = 10, maxResults = 5) {
    if (!Array.isArray(menuData) || menuData.length === 0) return [];
  
    const weights = menuData.map(item => Number(item.weight)).filter(w => !isNaN(w));
  
    const results = new Set();
  
    // 1~3개 조합까지 탐색 (A, A+B, A+B+C)
    for (let i = 0; i < weights.length; i++) {
      const w1 = weights[i];
  
      // 1개짜리 (단독)
      if (Math.abs(w1 - targetWeight) <= tolerance) {
        results.add(`${w1} = ${targetWeight}`);
      }
  
      for (let j = 0; j < weights.length; j++) {
        const w2 = weights[j];
  
        // 2개짜리 조합
        if (Math.abs(w1 + w2 - targetWeight) <= tolerance) {
          results.add(`${w1} + ${w2} = ${targetWeight}`);
        }
  
        for (let k = 0; k < weights.length; k++) {
          const w3 = weights[k];
  
          // 3개짜리 조합
          if (Math.abs(w1 + w2 + w3 - targetWeight) <= tolerance) {
            results.add(`${w1} + ${w2} + ${w3} = ${targetWeight}`);
          }
        }
      }
    }
  
    // 중복 제거 후 최대 5개까지만 반환
    return Array.from(results).slice(0, maxResults);
}

export function getTopWeightMatches(items, difference, maxResults = 4) {
    if (!Array.isArray(items) || items.length === 0) return [];
  
    // items의 무게 배열 추출
    const weights = items
      .map(item => Number(item.weight))
      .filter(w => !isNaN(w));
  
    const results = [];
  
    // 100g 단위로 계산 (100, 200, 300, ...)
    for (let base = 100; base < difference; base += 100) {
      const target = difference - base;
  
      // target 무게와 같은 아이템이 있는지 확인
      const matched = items.filter(
        item => Math.abs(item.weight - target) < 0.001 // 오차 방지
      );
  
      matched.forEach(m => {
        results.push({
          baseWeight: base,
          item: m,
          sum: base + m.weight,
        });
      });
    }
  
    // sum이 difference에 가까운 순으로 정렬
    const sorted = results.sort(
      (a, b) => Math.abs((a.sum ?? 0) - difference) - Math.abs((b.sum ?? 0) - difference)
    );
  
    // 상위 4개만 반환
    return sorted.slice(0, maxResults);
}
  
  
/*
export function grandTotalCalculate(data) {
    let amt = 0;
    let itemCnt = 0;
    let vatTotal = 0;
    if(data) {
        data?.map(el=>{
            vatTotal += Number(el?.ITEM_VAT)*Number(el.ITEM_QTY);
            amt += Number(el.ITEM_AMT);
            itemCnt += Number(el.ITEM_QTY);
        })
    }
    return {grandTotal:amt, itemCnt:itemCnt, vatTotal:vatTotal};
}



export async function getStoreID() {
    return await new Promise(function(resolve, reject){
        AsyncStorage.getItem("STORE_IDX")
        .then((STORE_IDX)=>{
            if(STORE_IDX) {
                resolve({STORE_IDX  })
            }else {
                reject();                
            }
        })
    })
}



export function setOrderData (data, orderList) {
    if(data?.length<0) return;
    
    let setMenuData = 
        {
            "ITEM_SEQ" : 0,
            "ITEM_CD" : "",
            "ITEM_NM" : "",
            "ITEM_QTY" : 0,
            "ITEM_AMT" : 0,
            "ITEM_VAT" : 0,
            "ITEM_DC" : 0,
            "ITEM_CANCEL_YN" : "N",
            "ITEM_GB" : "N",
            "ITEM_MSG" : "",
            "SETITEM_CNT" : 0,
            "SETITEM_INFO" : 
            [
            ] 
        }
        setMenuData.ITEM_SEQ=orderList.length+1;
        setMenuData.ITEM_CD = data?.prod_cd;
        setMenuData.ITEM_NM= data?.gname_kr;
        setMenuData.ITEM_QTY=  1;
        setMenuData.ITEM_AMT=  data?.sal_tot_amt;
        setMenuData.ITEM_VAT=  data?.sal_vat;
        setMenuData.ITEM_DC = 0;
        setMenuData.ITEM_CANCEL_YN= "N";
        setMenuData.ITEM_GB =  "N"; //포장 여부 포장"T"
        setMenuData.ITEM_MSG = "";
        setMenuData.SETITEM_CNT = 0;
        setMenuData.SETITEM_INFO=[];
      
    return setMenuData;
}

// 주문 리스트 중복 체크
export function orderListDuplicateCheck (currentOrderList, orderData) {
    //console.log("new order: ",orderData);
    var tmpOrderList = Object.assign([], currentOrderList);
    if(currentOrderList.length>0) {
        // 중복 체크
        //tmpOrderList.push(orderData);
        const duplicateCheck = tmpOrderList.filter(el=>el.ITEM_CD == orderData?.ITEM_CD&& isEqual(el.SETITEM_INFO,orderData?.SETITEM_INFO));
        if(duplicateCheck.length > 0) {
            //console.log("duplicateCheck: ",duplicateCheck);
            let duplicatedIndex = -1;
            tmpOrderList.map((el,index)=>{
                if(el.ITEM_CD == orderData?.ITEM_CD&& isEqual(el.SETITEM_INFO,orderData?.SETITEM_INFO)) {
                    duplicatedIndex = index;
                }
            })
            let addedQty = tmpOrderList[duplicatedIndex].ITEM_QTY+1;
            let addedPrice = orderData?.ITEM_AMT*addedQty;
            tmpOrderList[duplicatedIndex] = Object.assign({},{...tmpOrderList[duplicatedIndex],...{ITEM_QTY:addedQty,ITEM_AMT:addedPrice}})
     
        }else {
            tmpOrderList.unshift(orderData);
        }
        return tmpOrderList;
    }else {
        
        return [orderData];
    }
}

// 파일 다운로드
export async function fileDownloader(dispatch, name,url) {
    const ext = url.split(".");
    const extensionType = ext[ext.length-1]
    return await new Promise(function(resolve, reject){
        RNFetchBlob.config({
            fileCache: true
        })
        .fetch("GET", url)
        // the image is now dowloaded to device's storage
        
        .then( (resp) => {
          // the image path you can use it directly with Image component
            imagePath = resp.path();
            //console.log("create path=======",name);
            //console.log("create and read file")
            return resp.readFile("base64");
        })
        .then( async (base64Data) => {
            // here's base64 encoded image
            dispatch(addImageStorage({name:name,imgData:`data:image/${extensionType};base64,`+base64Data}));
            //console.log("add to store=======",base64Data);
            // remove the file from storage
            //console.log("get base 64");
            //console.log("====================================")
            resolve({name:name,data:base64Data});
            fs.unlink(imagePath);
            //return fs.unlink(imagePath);
        
        })
        .catch(ee=>{
            reject()
        })
    })
}

// 파일 다운로드
export async function adFileDownloader(dispatch, name,url) {
    const ext = url.split(".");
    const extensionType = ext[ext.length-1]
    return await new Promise(function(resolve, reject){
        RNFetchBlob.config({
            fileCache: true
        })
        .fetch("GET", url)
        // the image is now dowloaded to device's storage
        .then( (resp) => {
          // the image path you can use it directly with Image component
            imagePath = resp.path();
            return resp.readFile("base64");
        })
        .then( async (base64Data) => {
            //dispatch(addImageStorage({name:name,imgData:`data:image/${extensionType};base64,`+base64Data}));
            //dispatch(addImageStorage({name:name,imgData:`data:image/${extensionType};base64,`+base64Data}));
            dispatch(setAdImgs({name:name,imgData:`data:image/${extensionType};base64,`+base64Data}))
            resolve({name:name,data:base64Data});
            return fs.unlink(imagePath);
            
        })
        .catch(ee=>{
            reject()
        })
    })
}
export const isAvailable = (item) => {
    const startTimeAm = Number(`${item?.use_timea}${item?.use_timeaa}`);
    const endTimeAm = Number(`${item?.use_timeb}${item?.use_timebb}`);

    const startTimePm = Number(`${item?.use_time1a}${item?.use_time1aa}`);
    const endTimePm = Number(`${item?.use_time1b}${item?.use_time1bb}`);
    
    const currentTime = Number(moment().format("HHmm"));
    const hourNow = Number(moment().format("HH"));
    
    const amTimes = [item?.use_timea,item?.use_timeaa,item?.use_timeb,item?.use_timebb];
    const pmTimes = [item?.use_time1a,item?.use_time1aa,item?.use_time1b,item?.use_time1bb];

    const emptyAm = amTimes.filter(el=>el == "");
    const emptyPm = pmTimes.filter(el=>el == "");

    var isAmPass = true;
    var isPmPass = true;

    // 수량 오전 오후 시간 설정이 안되어 있다면 그냥 판매
    if(emptyAm?.length>0 && emptyPm?.length >0) {
        return true;
    }else {
        if(emptyAm?.length>0 && emptyPm?.length <=0) {
            // 오전만 비있다.
            if(currentTime>=startTimePm && currentTime<=endTimePm ) {
            }else {
                // 현재 시간이 오후에 해당되는 시간이 아니다
                return false;
            }
        }

        if(emptyAm?.length<=0 && emptyPm?.length>0) {
            // 오후만 비있다.
            if(currentTime>=startTimePm && currentTime<=endTimePm ) {
            }else {
                // 현재 시간이 오전에 해당하는 시간이 아니다.
                return false;

            }
        }

    }




    // 1. 수량제한 시간이 있는지 확인 
    if(emptyAm?.length <= 0) {
        // 오전 시간 설정 되어 있다면 체크
        if(currentTime>=startTimeAm && currentTime<=endTimeAm ) {
            //현 시간이 오전시간 사이에 있으면 판매중 
            isAmPass = true;
        }else {
            isAmPass = false;
        }
    }
    if(emptyPm?.length <= 0) {
        // 오후 시간 설정 되어 있다면 체크
        if(currentTime>=startTimePm && currentTime<=endTimePm ) {
            //현 시간이 오전시간 사이에 있으면 판매중 
            isPmPass = true;
        }else {
            isPmPass = false;
        }
    }
    return isAmPass || isPmPass;
    // 2. 시간이 수량제한1에 해당하는지 2에 해당하는지 확인 해 함.
}

// 인터넷 연결 체크


// 주문 가능 여부 체크


// 더치페이 선택 
export function dutchPayItemCalculator(dutchOrderList,dutchOrderToPayList, dutchOrderPaidList, itemToAdd) {
    // dutchOrderList: 주문내역
    // dutchOrderToPayList: 현재 선택 내역
    // dutchOrderPaidList: 결제한 내역
    // itemToAdd: 선택내역에 추가할 메뉴
    //console.log("dutchOrderList: ",dutchOrderList);
    //console.log("dutchOrderToPayList: ",dutchOrderToPayList);
    //console.log("dutchOrderPaidList: ",dutchOrderPaidList);
    //console.log("itemToAdd: ",itemToAdd);
    var returnDutchOrderToPayList = Object.assign([],dutchOrderToPayList);
    var returnDutchOrderList = Object.assign([],dutchOrderList);
    var returnDutchOrderPaitList = dutchOrderPaidList;

    const isAdd = itemToAdd.isAdd;
    const orderIndex = itemToAdd.orderIndex;
    var selectIndex=null;
    if(itemToAdd.selectIndex!=undefined) {
        selectIndex = itemToAdd.selectIndex;
    }else {
        if(returnDutchOrderToPayList?.length>0) {
            for(var i=0;i<returnDutchOrderToPayList.length;i++) {
                if(returnDutchOrderToPayList[i].index == orderIndex) {
                    selectIndex = i;
                }
            }
        }else {
            selectIndex = itemToAdd.selectIndex;
        }
    }
    // 선택한 메뉴
    var selectedItem = dutchOrderList[orderIndex];
    var qty = selectedItem.qty;
    if(isAdd){
        if(qty<=0) {
            return;
        }
    }
    // 카트에 담긴 수량 조절
    if(!isAdd){
        returnDutchOrderList[orderIndex] =  Object.assign({},returnDutchOrderList[orderIndex],{qty:Number(returnDutchOrderList[orderIndex].qty)+1});
    }else {
        returnDutchOrderList[orderIndex] =  Object.assign({},returnDutchOrderList[orderIndex],{qty:Number(returnDutchOrderList[orderIndex].qty)-1});
    }
    // 선택한 메뉴 수량조절
    // 1. 메뉴에서는 하나 빼고
    // 2. 선택한 메뉴 수량은 1로 한다.
    selectedItem = {...selectedItem,...{qty:1}, index:orderIndex};

    // 선택한 아이템이 기존에 추가되어 있는 아이템인지 체크
    const checkSelected = dutchOrderToPayList.filter(el=> el.index == orderIndex);
    if(checkSelected.length>0) {
        // 선택된 아이템이 있으면 수량만 올린다.
        var newSelected = Object.assign({},checkSelected[0]);
        if(!isAdd){
            if(Number(newSelected.qty)<=1) {
                //delete returnDutchOrderToPayList[index];
                returnDutchOrderToPayList = returnDutchOrderToPayList.filter(el=>el.index!=orderIndex);
            }else {
                newSelected = {...newSelected, ...{qty:Number(newSelected.qty)-1}};
                returnDutchOrderToPayList[selectIndex] = newSelected;
            }
        }else {
            newSelected = {...newSelected, ...{qty:Number(newSelected.qty)+1}};
            returnDutchOrderToPayList[selectIndex] = newSelected;
        }
        console.log("new selected: ",newSelected)
    }else {
        returnDutchOrderToPayList.push(selectedItem);
    }


    return {
        dutchOrderList:returnDutchOrderList,
        dutchOrderToPayList:returnDutchOrderToPayList,
        dutchOrderPaidList:returnDutchOrderPaitList
    }
}

export async function isOrderAvailable (dispatch) {
    EventRegister.emit("showSpinnerNonCancel",{isSpinnerShowNonCancel:true, msg:"메뉴 확인 중 입니다."});
    return await new Promise(async function(resolve, reject){
        const isPostable = await isNetworkAvailable()
        .catch(()=>{
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
            reject({result:false,msg:"네트워크에 연결할 수 없습니다."})
        });
        if(!isPostable) {
            displayErrorNonClosePopup(dispatch, "XXXX", "인터넷에 연결할 수 없습니다.");
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
            reject({result:false,msg:"인터넷에 연결할 수 없습니다."})
        }
        const storeInfo = await getPosStoreInfo()
        .catch((err)=>{
            displayErrorNonClosePopup(dispatch, "XXXX", "상점 정보를 가져올 수 없습니다.");
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""}); 
            reject({result:false,msg:"상점 정보를 가져올 수 없습니다."})
        })
        // 개점정보 확인
        if(!storeInfo?.SAL_YMD) {
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
            displayErrorPopup(dispatch, "XXXX", "개점이 되지않아 주문을 할 수 없습니다.");
            reject({result:false,msg:"개점이 되지않아 주문을 할 수 없습니다."})
        }else {
            //테이블 주문 가능한지 체크            
            const tableAvail = await getTableAvailability(dispatch)
            .catch(()=>{
                EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                reject({result:false,msg:"주문을할 수 없습니다."})
            });
            if(!tableAvail) {
                EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                reject({result:false,msg:"테이블 상태를 확인 해 주세요."})
            }else {
                EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""}); 
                // 주문할 수 있음
                resolve({result:true,msg:""})
            }
        }
    })
}


// 할부 팝업
export async function openInstallmentPopup(dispatch,getState,title, okTitle, cancelTitle, isCancelUse) {
    dispatch(setDispatchPopup({isShowPopup:true,title:title,okTitle:okTitle,cancelTitle:cancelTitle,isCancelUse:isCancelUse}));
    return new Promise((resolve, reject)=>{
        var timeInterval;
        try{
            timeInterval = setInterval(()=>{
                const {popupType,isShowPopup,isOkClicked,isCancelClicked, isCloseClicked, returnData } = getState().dispatchPopup;
                if(isCancelClicked || isOkClicked || isCloseClicked) {
                    clearInterval(timeInterval);
                    dispatch(initDispatchPopup());
                    //dispatch(setPopup({isOkClicked:false,isCancelClicked:false,title:"",isShowPopup:false}));
                    var msg = "";
                    if(isCancelClicked){msg="cancel"}
                    if(isOkClicked){msg="ok"}
                    if(isCloseClicked){msg="close"}
                    resolve({code:"0000",response:msg,data:returnData});
                }
            },500)
        }
        catch(err) {
            reject({code:"XXXX",response:"error",data:{}});
        }
    })
}
 */
