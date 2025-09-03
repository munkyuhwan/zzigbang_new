import { NativeModules } from 'react-native'
import isEmpty from 'lodash';
import { hasPayError, payErrorHandler } from './errorHandler/ErrorHandler';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from './localStorage';
//import LogWriter from './logWriter';


// print

export const servicePrinting = async () => {
    const {SmartroPay} = NativeModules;
    const smartroData = {"service":"printing","printer":"printer-comm1","contents":[ 32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,42,42,
        32,-57,-63,-72,-80,-59,-51,32,-59,-41,-67,-70,-58,-82,
        32,42,42,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,
        10,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,42,
        42,32,80,114,105,110,116,101,114,32,84,101,120,116,
        32,42,42,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,
        32,10,10,10,-64,-52,32,-71,-82,-79,-72,-80,-95,32,-70,
        -72,-64,-52,-67,-61,-72,-23,44,32,-57,-63,-72,-80,-59,
        -51,32,-59,-21,-67,-59,32,-68,-77,-63,-92,-64,-52,32,
        -63,-92,-69,-13,-64,-44,-76,-49,-76,-39,46,10,10,73,102,
        32,121,111,117,32,115,101,101,32,116,104,105,115,32,
        116,101,120,116,44,32,116,104,101,32,112,114,105,110,
        116,101,114,32,99,111,109,109,117,110,105,99,97,116,105,
        111,110,32,115,101,116,116,105,110,103,115,32,97,114,101,
        32,110,111,114,109,97,108,46,10,10,10,10,10,10,10,10,10,10,27,109]};
    return await new Promise(function(resolve, reject){
        SmartroPay.prepareSmartroPay(
            JSON.stringify(smartroData),
            (error)=>{
                reject(error);
            },
            (msg)=>{
                resolve(msg);
            });
    })
}

export const serviceIndicate = async () => {
    const {SmartroPay} = NativeModules;
    const smartroData = {"service":"indicate","available":"com"};
    return await new Promise(function(resolve, reject){
        SmartroPay.prepareSmartroPay(
            JSON.stringify(smartroData),
            (error)=>{
                reject(error);
            },
            (msg)=>{
                resolve(msg);
            });
    })
}
export const serviceSetting = async () =>{
    const {SmartroPay} = NativeModules;
    const smartroData = {"service":"setting","device":"dongle", "device-comm":["com","auto-detection"],"additional-device":"signpad","additional-device-comm":["com","auto-detection"],  "printer-comm3":["com","auto-detection"], "external":""};
    return await new Promise(function(resolve, reject){
        SmartroPay.prepareSmartroPay(
            JSON.stringify(smartroData),
            (error)=>{
                reject(error);
            },
            (msg)=>{
                resolve(msg);
            });
    })
}
export const serviceGetting = async () => {
    const {SmartroPay} = NativeModules;
    const smartroData = {"service":"getting"};
    return await new Promise(function(resolve, reject){
        SmartroPay.prepareSmartroPay(
            JSON.stringify(smartroData),
            (error)=>{
                reject(error);
            },
            (msg)=>{
                resolve(msg);
            });
    })
}
export const serviceFunction =async (funcStr) => {
    const {SmartroPay} = NativeModules;
    const DEVICE_NO = await AsyncStorage.getItem("CAT_ID").catch(err => "");
    const BUSINESS_NO = await AsyncStorage.getItem("BUSINESS_NO").catch(err => "");
    
    const smartroData = {"service":"function","cat-id":DEVICE_NO, "business-no":BUSINESS_NO,};
    console.log("function data: ",JSON.stringify({...smartroData,...funcStr}))
    return await new Promise(function(resolve, reject){
        SmartroPay.prepareSmartroPay(
            JSON.stringify({...smartroData,...funcStr}),
            (error)=>{
                reject(error);
            },
            (msg)=>{
                resolve(msg);
            });
    })
}
export const serviceCancelPayment  = async(data)=>{
    const {SmartroPay} = NativeModules;
    const BSN_NO = await AsyncStorage.getItem("BSN_NO")
    const CAT_ID = await AsyncStorage.getItem("TID_NO")
    //const CAT_ID = "7109912041";

    const COMMON_PAY_DATA = {"cat-id":CAT_ID, "business-no":BSN_NO};
    const smartroData = {"service":"payment", "deal":"cancellation", "type":"credit", "persional-id":"", ...data, ...COMMON_PAY_DATA};
    console.log("smartroData: ",smartroData);
    return await new Promise(function(resolve, reject){
        SmartroPay.prepareSmartroPay(
            JSON.stringify(smartroData),
            (error)=>{
                console.log("error: ",error);
                reject(error);
            },
            (msg)=>{
                console.log("msg: ",msg);
                resolve(msg);
            });
    })
}


// 결제 진행 중단
export const smartroCancelService = async() =>{
    const {SmartroPay} = NativeModules;
    SmartroPay.smartroCancelService();
}

// 결제 현금영수증 요청
export const serviceCashReceipt = async(isCancel, data) =>{
    const {SmartroPay} = NativeModules;
    const DEVICE_NO = await AsyncStorage.getItem("CAT_ID").catch(err => "");
    const BUSINESS_NO = await AsyncStorage.getItem("BUSINESS_NO").catch(err => "");
    const SMARTRO_COMMON_DATA = {"cat-id":DEVICE_NO, "business-no":BUSINESS_NO};

    var smartroData = {};
    if(isCancel == true) {
        // 현금영수증 취소 요청
        smartroData = {"service":"payment", "type":"cash", "deal":"cancellation","cancel-reason":"1", "approval-no":"031383008","approval-date":"240722",...data, ...SMARTRO_COMMON_DATA};
    }else {
        // 현금영수증 발급 요청
        smartroData = {"service":"payment", "type":"cash", "deal":"approval",...data, ...SMARTRO_COMMON_DATA};
        //smartroData = {"service":"payment", "type":"cash", "cash-type":"0", "deal":"approval",...data};
    }
    console.log("smartroData: ",smartroData);
    return await new Promise(function(resolve, reject){
        SmartroPay.prepareSmartroPay(
            JSON.stringify(smartroData),
            (error)=>{
                const logErr = `\nERROR PAYMENT DATA==================================\nerrorResult:${JSON.stringify(error)}\n`
                //lw.writeLog(logErr);
                reject(error);
            },
            (msg)=>{
                const logMsg = `\nMSG PAYMENT DATA==================================\nerrorResult:${JSON.stringify(msg)}\n`
                //lw.writeLog(logMsg);
                resolve(msg);
            });
    })
}

// 결제 현금영수증 요청
export const serviceCashReceiptCancel = async(data) =>{
    const {SmartroPay} = NativeModules;
    const DEVICE_NO = await AsyncStorage.getItem("CAT_ID").catch(err => "");
    const BUSINESS_NO = await AsyncStorage.getItem("BUSINESS_NO").catch(err => "");
    //const SMARTRO_COMMON_DATA = {"cat-id":DEVICE_NO, "business-no":BUSINESS_NO};
    const SMARTRO_COMMON_DATA = {"cat-id":data['cat-id'], "business-no":BUSINESS_NO};

    var smartroData = {};
   //"approval-no":"031383008","approval-date":"240722"
    // 현금영수증 취소 요청
    smartroData = {"service":"payment", "type":"cash", "deal":"cancellation","cancel-reason":"0",...data, ...SMARTRO_COMMON_DATA};
    console.log("smartroData: ",smartroData);
    return await new Promise(function(resolve, reject){
        SmartroPay.prepareSmartroPay(
            JSON.stringify(smartroData),
            (error)=>{
                const logErr = `\nERROR PAYMENT DATA==================================\nerrorResult:${JSON.stringify(error)}\n`
                //lw.writeLog(logErr);
                reject(error);
            },
            (msg)=>{
                const logMsg = `\nMSG PAYMENT DATA==================================\nerrorResult:${JSON.stringify(msg)}\n`
                //lw.writeLog(logMsg);
                resolve(msg);
            });
    })
}

// 결제 승인/취소 요청 
export const servicePayment = async(dispatch, isCancel, data)=>{
    console.log("adsfasfasfdawefa");
    console.log("NativeModules: ",NativeModules)
    const {SmartroPay} = NativeModules;
    console.log("adsfasfasfdawefa111111111");
    
    const BUSINESS_NO = storage.getString("BSN_NO");
    const DEVICE_NO = storage.getString("TID_NO");
    
    console.log("BUSINESS_NO: ",BUSINESS_NO);
    console.log("DEVICE_NO: ",DEVICE_NO);
    var smartroData = {};
    if(isCancel==true) { 
        // service payment 결제 취소 요청
        //{"service":"payment","type":"credit","persional-id":"01040618432","deal":"approval","total-amount":"1004","cat-id":"7109912041","business-no":"2118806806","device-name":"SMT-Q453","device-auth-info":"####SMT-Q453","device-auth-ver":"1201","device-serial":"S423050950","card-no":"94119400********","business-name":"주식회사 우리포스","business-address":"인천 부평구 부평대로 337  (청천동) 제이타워3차지신산업센터 806,807호","business-owner-name":"김정엽","business-phone-no":"02  15664551","van-tran-seq":"240613000757","response-code":"00","approval-date":"240613","approval-time":"000755","issuer-info":"0300마이홈플러스신한","acquire-info":"0300신한카드사","merchant-no":"0105512446","approval-no":"33396115","display-msg":"정상승인거래\r간편결제수단: 삼성페이승인","receipt-msg":"정상승인거래\r간편결제수단: 삼성페이승인","service-result":"0000"}
        const SMARTRO_CANCEL_DATA = {"cat-id":DEVICE_NO, "business-no":BUSINESS_NO};
        console.log("SMARTRO_CANCEL_DATA:",SMARTRO_CANCEL_DATA);
        smartroData = {"service":"payment", "type":"credit", "deal":"cancellation", "personal-id":"",...data, ...SMARTRO_CANCEL_DATA};
    }else {
        // 결제 요청 데이터
        const SMARTRO_COMMON_DATA = {"cat-id":DEVICE_NO, "business-no":BUSINESS_NO};
        console.log("SMARTRO_COMMON_DATA:",SMARTRO_COMMON_DATA);
        smartroData = {...{"service":"payment", "type":"credit", "deal":"approval", "personal-id":""}, ...data, ...SMARTRO_COMMON_DATA};
    }
    console.log("smartroData: ",JSON.stringify(smartroData));
    // write log
    //const lw = new LogWriter();
    //const logStr = `\nPOST PAYMENT DATA==================================\nfunction:servicePayment\ndata:${JSON.stringify(smartroData)}\n`
    //lw.writeLog(logStr);
    
    return await new Promise(function(resolve, reject){
        SmartroPay.prepareSmartroPay(
            JSON.stringify(smartroData),
            (error)=>{
                const logErr = `\nERROR PAYMENT DATA==================================\nerrorResult:${JSON.stringify(error)}\n`
                //lw.writeLog(logErr);
                reject(error);
            },
            (msg)=>{
                const logMsg = `\nMSG PAYMENT DATA==================================\nerrorResult:${JSON.stringify(msg)}\n`
                //lw.writeLog(logMsg);
                resolve(msg);
            });
    }) 
}

export const getLastPaymentData = async(dispatch)=>{
    const {SmartroPay} = NativeModules;
    const DEVICE_NO = await AsyncStorage.getItem("BUSINESS_NO").catch(err => "");
    const BUSINESS_NO = await AsyncStorage.getItem("CAT_ID").catch(err => "");
    const SMARTRO_COMMON_DATA = {"cat-id":DEVICE_NO, "business-no":BUSINESS_NO};

    const smartroData = {"service":"function","getting-data":"last-payment",...SMARTRO_COMMON_DATA};
    
    return await new Promise(function(resolve, reject){
        SmartroPay.prepareSmartroPay(
            JSON.stringify(smartroData),
            (error)=>{
                reject(error);
            },
            (msg)=>{
                resolve(msg);
            });
    })
}



export const varivariTest = async() =>{
    const {SmartroPay} = NativeModules;
    const DEVICE_NO = await AsyncStorage.getItem("BUSINESS_NO").catch(err => "");
    const BUSINESS_NO = await AsyncStorage.getItem("CAT_ID").catch(err => "");
    const SMARTRO_COMMON_DATA = {"cat-id":DEVICE_NO, "business-no":BUSINESS_NO};
    // 사용 가능한 통신장치 정보 확인
    //const smartroData = `{"service":"indicate","available":"com"}`;
    // auto-detection, Ftdi1

    // setting 
    //const smartroData = {"service":"setting","device":"dongle", "device-comm":["com","auto-detection"],"additional-device":""};

    // getting
    //const smartroData = {"service":"getting","device":"dongle", "device-comm":["com","auto-detection"],"additional-device":""};

    // function device-manage exchange key
    //const smartroData = {"service":"function","device-manage":"exchange-key","cat-id":DEVICE_NO,"business-no":BUSINESS_NO,}

    // function device-manage check-integrity
    //const smartroData = {"service":"function","device-manage":"check-integrity",...SMARTRO_COMMON_DATA};

    // getting-data last-payment 
    //const smartroData = {"service":"function","getting-data":"last-payment",...SMARTRO_COMMON_DATA};

    // service payment 결제 승인 요청
    //const smartroData = {"service":"payment", "type":"credit", "deal":"approval", "persional-id":"01040618432","total-amount":"10", ...SMARTRO_COMMON_DATA};
    // service payment 결제 취소 요청
    //const smartroData = {"service":"payment", "type":"credit", "deal":"cancellation", "persional-id":"01040618432","total-amount":"10", "approval-no":"10556666","approval-date":"231020", ...SMARTRO_COMMON_DATA};

    return await new Promise(function(resolve, reject){
        SmartroPay.prepareSmartroPay(
            JSON.stringify(smartroData),
            (error)=>{
                reject(error);
            },
            (msg)=>{
                resolve(msg);
            });
    })
}

export async function smartroPrint(contents) {
    const {SmartroPay} = NativeModules;
    const DEVICE_NO = await AsyncStorage.getItem("BUSINESS_NO").catch(err => "");
    const BUSINESS_NO = await AsyncStorage.getItem("CAT_ID").catch(err => "");
    const SMARTRO_COMMON_DATA = {"cat-id":DEVICE_NO, "business-no":BUSINESS_NO};
    const smartroData = {"service":"printing", "printer":"printer-comm1","contents":contents };
    
    return await new Promise(function(resolve, reject){
        SmartroPay.prepareSmartroPay(
            JSON.stringify(smartroData),
            (error)=>{
                reject(error);
            },
            (msg)=>{
                resolve(msg);
            });
    })

}


