import { NativeModules } from "react-native"
import { BSN_ID, KOCES_CODE_KEY_RENEW, KOCES_CODE_STORE_DOWNLOAD, SN, TID } from "../resources/apiResources";
import moment from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { removeUnicodeControls } from "./common";

export function KocesAppPay () {
    this.data = {};
}
// 초기화
KocesAppPay.prototype.init = function () {
    console.log("initialize koces");
    this.data = {};
} 
// 가맹점 다운로드
KocesAppPay.prototype.storeDownload = async function () {
    const {KocesPay} = NativeModules;

    const bsnNo = await AsyncStorage.getItem("BSN_NO");
    const tidNo = await AsyncStorage.getItem("TID_NO");
    const serialNo = await AsyncStorage.getItem("SERIAL_NO");
    console.log("serial no type:",typeof serialNo);
    const storeData = {TrdType:"D10",TermID:`${tidNo}`, BsnNo:`${bsnNo}`, Serial:`${removeUnicodeControls(serialNo)}`, MchData:""};
    console.log("storeData: ",storeData);
    return await new Promise((resolve, reject)=>{
        KocesPay.prepareKocesPay(
            storeData,
            (error)=>{
                console.log("error msg: ",error);
                reject(JSON.parse(error));
            },
            (msg)=>{
                console.log("success msg: ",msg);
                resolve(JSON.parse(msg));
            }
        );
    });

} 
// 키 갱신
KocesAppPay.prototype.keyRenew = async function () {
    const bsnNo = await AsyncStorage.getItem("BSN_NO");
    const tidNo = await AsyncStorage.getItem("TID_NO");
    const serialNo = await AsyncStorage.getItem("SERIAL_NO");
    this.data = {TrdType:KOCES_CODE_KEY_RENEW,TermID:tidNo, BsnNo:bsnNo, Serial:serialNo, MchData:""};
    
} 
// 결제 요청
KocesAppPay.prototype.makePayment = async function ({amt,taxAmt,months}) {
    const tidNo = await AsyncStorage.getItem("TID_NO");

    this.data = {
        TrdType:'A10',
        TermID: tidNo, 
        Audate:`${moment().format("YYMMDD")}`,
        AuNo:'',
        KeyYn:'I',
        TrdAmt:`${amt}`,
        TaxAmt:`${taxAmt}`,
        SvcAmt:"0",
        TaxFreeAmt:"0",
        Month:`${months}`,
        MchData:"wooriorder",
        TrdCode:"",
        TradeNo:"",
        CompCode:"",
        DscYn:"1",
        DscData:"",
        FBYn:"0",
        InsYn:"1",
        CancelReason:"",
        CashNum:"",
        BillNo:"",
    };
} 

// 취소 요청
KocesAppPay.prototype.cancelPayment = async function ({amt,taxAmt,auDate,auNo,tradeNo}) {
    const {KocesPay} = NativeModules;
    const tidNo = await AsyncStorage.getItem("TID_NO");
    const payData = {
        TrdType:'A20',
        TermID: tidNo, 
        AuDate:`${auDate}`,
        AuNo:`${auNo}`,
        KeyYn:'I',
        TrdAmt:`${amt}`,
        TaxAmt:`${taxAmt}`,
        SvcAmt:"0",
        TaxFreeAmt:"0",
        Month:"00",
        MchData:"wooriorder",
        TrdCode:"",
        TradeNo:`${tradeNo}`,
        CompCode:"",
        DscYn:1,
        DscData:"",
        FBYn:0,
        InsYn:1,
        CancelReason:"1",
        CashNum:"",
        BillNo:"",
    };    
    return await new Promise((resolve, reject)=>{
        KocesPay.prepareKocesPay(
            payData,
            (error)=>{
                console.log("error msg: ",error);
                reject(error);
            },
            (msg)=>{
                console.log("success msg: ",msg);
                resolve(JSON.parse(msg));
            }
        );
    });

} 

// 결제요청 하기
KocesAppPay.prototype.requestKocesPayment = async function ({amt,taxAmt,months}) {
    const tidNo = await AsyncStorage.getItem("TID_NO");
    const {KocesPay} = NativeModules;
    const payData = {
        TrdType:'A10',
        TermID: tidNo, 
        Audate:`${moment().format("YYMMDD")}`,
        AuNo:'',
        KeyYn:'I',
        TrdAmt:`${amt}`,
        TaxAmt:`${taxAmt}`,
        SvcAmt:"0",
        TaxFreeAmt:"0",
        Month:`${months}`,
        MchData:"wooriorder",
        TrdCode:"",
        TradeNo:"",
        CompCode:"",
        DscYn:"1",
        DscData:"",
        FBYn:"0",
        InsYn:"1",
        CancelReason:"",
        CashNum:"",
        BillNo:"",
    };
    console.log("payData: ",payData);
    return await new Promise((resolve, reject)=>{
        KocesPay.prepareKocesPay(
            payData,
            (error)=>{
                console.log("error msg: ",error);
                reject(JSON.parse(error));
            },
            (msg)=>{
                console.log("success msg: ",msg);
                resolve(JSON.parse(msg));
            }
        );
    });

}


// 결제 등등 요청
KocesAppPay.prototype.requestKoces = async function () {
    const {KocesPay} = NativeModules;
    console.log("this.data: ",this.data);
    return await new Promise((resolve, reject)=>{
        KocesPay.prepareKocesPay(
            this.data,
            (error)=>{
                //console.log("error msg: ",error);
                reject(JSON.parse(error));
            },
            (msg)=>{
                //console.log("success msg: ",msg);
                resolve(JSON.parse(msg));
            }
        );
    });

}


export const prepareKocesPay = () =>{
    const {KocesPay} = NativeModules;
    
    const payData = {
        TrdType:'A10',
        TermID: TID, 
        Audate:`${moment().format("YYMMDD")}`,
        AuNo:'',
        KeyYn:'I',
        TrdAmt:"50000",
        TaxAmt:"5000",
        SvcAmt:"0",
        TaxFreeAmt:"0",
        Month:"00",
        MchData:"wooriorder",
        TrdCode:"",
        TradeNo:"",
        CompCode:"",
        DscYn:1,
        DscData:"",
        FBYn:0,
        InsYn:1,
        CancelReason:"",
        CashNum:"",
        BillNo:"",

    };
    KocesPay.prepareKocesPay(
        payData,
        (error)=>{
            reject(error);
        },
        (msg)=>{
            resolve(msg);
        }
    );
}