import moment from "moment";
import { POS_VERSION_CODE, POS_WORK_CD_POSTPAY_ORDER, POS_WORK_CD_PREPAY_ORDER_REQUEST } from "../resources/apiResources";
import { getTableInfo, loadCounter, numberPad } from "./common";
import { isEqual, isEmpty } from 'lodash'
import { EventRegister } from "react-native-event-listeners";
import { storage } from "./localStorage";
/* 
var itemDataFormat = 
{
    "ITEM_SEQ" : 2,
    "ITEM_CD" : "900003",
    "ITEM_NM" : "시즌 스노우 라떼",
    "ITEM_QTY" : 1,
    "ITEM_AMT" : 9000,
    "ITEM_VAT" : 579,
    "ITEM_DC" : 2625,
    "ITEM_CANCEL_YN" : "N",
    "ITEM_GB" : "T",
    "ITEM_MSG" : "딸기시럽 듬뿍",
    "SETITEM_CNT" : 2,
    "SETITEM_INFO" : 
    [
      {
        "ITEM_SEQ" : 2,
        "SET_SEQ" : 1,
        "PROD_I_CD" : "100134",
        "PROD_I_NM" : "딸기시럽추가",
        "QTY" : 1,
        "AMT" : 0,
        "VAT" : 0,
      },
      {
        "ITEM_SEQ" : 2,
        "SET_SEQ" : 2,
        "PROD_I_CD" : "100135",
        "PROD_I_NM" : "휘핑크림추가",
        "QTY" : 1,
        "AMT" : 0,
        "VAT" : 0,
      }
    ]
}; */
/*
"service": "payment",
        "type": "credit",
        "persional-id": "01040618432",
        "deal": "approval",
        "total-amount": "1004",
        "cat-id": "7109912041",
        "business-no": "2118806806",
        "device-name": "SMT-Q453",
        "device-auth-info": "####SMT-Q453",
        "device-auth-ver": "1201",
        "device-serial": "S423050950",
        "card-no": "94119400********",
        "van-tran-seq": "240605215745",
        "business-name": "주식회사 우리포스",
        "business-owner-name": "김정엽",
        "business-phone-no": "02  15664551",
        "business-address": "인천 부평구 부평대로 337  (청천동) 제이타워3차지신산업센터 806,807호",
        "display-msg": "정상승인거래r간편결제수단: 삼성페이승인",
        "response-code": "00",
        "approval-date": "240605",
        "approval-time": "215744",
        "issuer-info": "0300마이홈플러스신한",
        "acquire-info": "0300신한카드사",
        "merchant-no": "0105512446",
        "approval-no": "37151483",
        "receipt-msg": "정상승인거래r간편결제수단: 삼성페이승인",
        "service-result": "0000"

*/

export const metaPostPayFormat = async (orderList,payData, allItems, PRINT_ORDER_NO) => {

    return new Promise(async(resolve,reject)=>{
        try{
            const date = new Date();
            //const tableNo = await getTableInfo().catch(err=>err);
            const tableNo = storage.getString("TABLE_INFO");
            console.log("tableNo: ",tableNo);
            if(tableNo instanceof Error) {
                reject("테이블 정보를 입력 하세요.");
            }
            //const orderNo = `${date.getFullYear().toString().substring(2,4)}${numberPad(date.getMonth()+1,2)}${numberPad(date.getDate(),2)}${moment().format("HHMMSSs")}`;
            const orderNo = `${date.getFullYear().toString().substring(2,4)}${numberPad(date.getMonth()+1,2)}${numberPad(date.getDate(),2)}${moment().valueOf()}`;
            const POS_NO = storage.getString("POS_NO");
            if(POS_NO instanceof Error) {
                EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문 오류", str:"포스번호를 설정해 주세요."});
                reject("포스번호를 설정해 주세요.");
            }
            if(POS_NO == null ){
                EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문 오류", str:"포스번호를 설정해 주세요."});
                reject("포스번호를 설정해 주세요.");
            }


            //const PRNT_ORD_NO = loadCounter();
            const storedCount = storage.getString("counterValue");
            if(storedCount == null) {
                var newCount = 1
            }else {
                var newCount = Number(storedCount)+1
            }
            storage.set("counterValue",`${newCount}`);
            var PRINT_ORDER_NO = `${POS_NO}-${newCount}`
            console.log("PRINT_ORDER_NO: ",PRINT_ORDER_NO);
 

            //const printOrderNo = ``;
            // order item 
            var itemList = [];
            for(var i=0;i<orderList.length;i++) {
                const itemDetail = allItems?.filter(el=>el.prod_cd == orderList[i]?.prodCD);
                const setItems = orderList[i].option;
                // set item 
                var setItemArray = [];
                for(var j=0;j<setItems.length;j++) {
                    const setItemDetail = allItems?.filter(el=>el.prod_cd == setItems[j]?.prodCD);
                    var setItem = {
                        "ITEM_SEQ" : 1,
                        "SET_SEQ" : 1,
                        "PROD_I_CD" : "",
                        "PROD_I_NM" : "",
                        "QTY" : 1,
                        "AMT" : 0,
                        "VAT" : 0,
                    }
                    setItem["ITEM_SEQ"] = i+1;
                    setItem["SET_SEQ"] = j+1;
                    setItem["PROD_I_CD"] = setItems[j].optItem;
                    setItem["PROD_I_NM"] = setItemDetail[0].gname_kr;
                    setItem["QTY"] = Number(setItems[j].amt)*Number(orderList[i].amt);
                    setItem["AMT"] = Number(setItemDetail[0]?.sal_amt)*Number(setItems[j].amt)*Number(orderList[i].amt);
                    setItem["VAT"] = Number(setItemDetail[0]?.sal_vat)*Number(setItems[j].amt)*Number(orderList[i].amt);
                    setItemArray.push(setItem);
                }
                var itemDataFormat ={}
                itemDataFormat["ITEM_SEQ"]=i+1;
                itemDataFormat["ITEM_CD"] = itemDetail[0]?.prod_cd;
                itemDataFormat["ITEM_NM"] = itemDetail[0]?.gname_kr;
                itemDataFormat["ITEM_QTY"] = orderList[i].amt;
                itemDataFormat["ITEM_AMT"] = (Number(itemDetail[0]?.sal_amt)+Number(itemDetail[0]?.sal_vat))*Number(orderList[i].amt);
                itemDataFormat["ITEM_VAT"] = Number(itemDetail[0]?.sal_vat)*Number(orderList[i].amt);
                itemDataFormat["ITEM_DC"] = 0;
                itemDataFormat["ITEM_CANCEL_YN"] = "N";
                itemDataFormat["ITEM_GB"] = "";
                itemDataFormat["ITEM_MSG"] = "";
                itemDataFormat["SETITEM_CNT"] = setItemArray.length;
                itemDataFormat["SETITEM_INFO"] = setItemArray;
                itemList.push(itemDataFormat);
            }
            let orderData = {
                "VERSION" : POS_VERSION_CODE,
                "WORK_CD" : POS_WORK_CD_PREPAY_ORDER_REQUEST, //선불 후불에 따라 코드 다름
                "ORDER_NO" : orderNo,
                "TBL_NO" : `${tableNo}`, 
                "PRINT_YN" : "Y",
                "USER_PRINT_YN" : "N",
                "PRINT_ORDER_NO" : PRINT_ORDER_NO, 
                "TOT_INWON" : 4,
                "ITEM_CNT" : orderList.length,
                "ITEM_INFO" :itemList
            }    
            resolve(orderData);
            //return orderData;
        }catch(error) {
            reject(error);
        }
    })

    

}