import { Alert, DeviceEventEmitter, KeyboardAvoidingView, ScrollView, Text, TouchableWithoutFeedback, View } from "react-native";
import { BottomButton } from "../components/commonComponents";
import { SettingButtonView, SettingSectionDetailWrapper, SettingSectionInput, SettingSectionLabel, SettingSectionTitle, SettingSectionWrapper, SettingSenctionInputView, SettingSenctionInputViewColumn, SettingWrapper } from "../style/setting";
import { serviceCancelPayment } from "../utils/smartro";
import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EventRegister } from "react-native-event-listeners";
import { useDispatch, useSelector } from "react-redux";
import { Picker } from '@react-native-picker/picker';
import { isEmpty } from 'lodash'
import { colorBlack, colorWhite } from "../resources/colors";
import { useFocusEffect, useIsFocused, useNavigation } from "@react-navigation/native";
import { getStoreInfo } from "../store/metaPos";
import { KocesAppPay } from "../utils/kocess";
import { EventEmitter } from "react-native";
import { getBanner, initializeApp, setAdShow, setCommon } from "../store/common";
import { setMenu } from "../store/menu";
import { USBPrinter } from "react-native-thermal-receipt-printer-image-qr";
import { printReceipt } from "../utils/common";
import { NativeModules } from "react-native"
import { storage } from "../utils/localStorage";
import { MMKV, Mode } from 'react-native-mmkv'


const SettingScreen = (props) =>{
    const {Printer,
         Weight, 
         Serial
        } = NativeModules;
    

    const navigate = useNavigation();
    const dispatch = useDispatch();
    const pickerRef = useRef();
    const printerPickerRef = useRef();

    const [approvalAmt, setApprovalAmt] = useState("4091");
    const [vatAmt, setVatAmt] = useState("409");
    const [tradeNo, setTradeNo] = useState("000003930829");
    const [approvalNo, setApprovalNo] = useState("14495321");
    const [approvalDate, setApprovalDate] = useState("250310");
    const [storeID, setStoreID] = useState("");
    const [breadStoreID, setBreadStoreId] = useState(""); // 빵 등록 아이디
    const [posNo, setPosNo] = useState("");
    const [table, setTable] = useState("");
    const [productName, setProductName] = useState("");
    const [weightProductName, setWeightProductName] = useState("");
    const [weightPortNumber, setWeightPortNumber] = useState("");
    const [bellProductName, setBellProductName] = useState("");
    const [printerList, setPrinterList] = useState([]);
    const [cdcList, setCdcLIst] = useState([]);
    const [isWeight, setWeight] = useState(true);

    const {storeInfo, tableList} = useSelector(state=>state.meta);
    const {weight} = useSelector(state=>state.common);
    // 단말기 관련
    const [bsnNo, setBsnNo] = useState("");
    const [catId, setCatId] = useState("");
    const [serialNo, setSerialNo] = useState("");

    const [tmpWeight, setTmpWeight] = useState("");

    const isFocused = useIsFocused();


    useFocusEffect(
        useCallback(()=>{
            console.log('화면 진입');
            return () => {
            // 화면이 벗어날 때 실행
            console.log('화면에서 나감, 포커스 해제');
            // 여기서 USB 포트 닫기나 리소스 정리
                Weight.closeSerialConnection();
            };

        },[])
    )

    function cancelPayment(){
        EventRegister.emit("showSpinner",{isSpinnerShow:true, msg:"카드 취소 중 입니다.", spinnerType:"pay",closeText:"취소"})
        //const cancelData = { "total-amount":approvalAmt, "approval-no":approvalNo,"approval-date":approvalDate,  "attribute":["attr-continuous-trx","attr-include-sign-bmp-buffer","attr-enable-switching-payment","attr-display-ui-of-choice-pay"]}
        const cancelData = {amt:approvalAmt,taxAmt:vatAmt,auDate:approvalDate,auNo:approvalNo,tradeNo:tradeNo};
        var kocessAppPay = new KocesAppPay();
        kocessAppPay.cancelPayment(cancelData)
        .then(async (result)=>{ 
            console.log("cancel result: ", JSON.stringify(result));
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""})
        })
        .catch((err)=>{
           // 결제 진행끝이다.
           EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""})
       })
        /*  const cancelData = { "total-amount":approvalAmt, "approval-no":approvalNo,"approval-date":approvalDate,  "attribute":["attr-continuous-trx","attr-include-sign-bmp-buffer","attr-enable-switching-payment","attr-display-ui-of-choice-pay"]}
        console.log("cancelData: ",cancelData);
        serviceCancelPayment(cancelData)
        .then((result)=>{
            console.log(result);
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"pay",closeText:""})
        })
        .catch((err)=>{

            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"pay",closeText:""})
        }) */
    }

    useEffect(()=>{
        setBsnNo(storage.getString("BSN_NO"));    
        setCatId(storage.getString("TID_NO"));
        setSerialNo(storage.getString("SERIAL_NO"));
        setTable(storage.getString("TABLE_INFO"));
        setPosNo(storage.getString("POS_NO"));
        setBreadStoreId(storage.getString("BREAD_STORE_ID")); 
        setStoreID(storage.getString("STORE_IDX")); 
        setWeight(storage.getBoolean("WEIGHT_SET"));

        dispatch(getStoreInfo());

        var deviceListStr = Printer.getAllUsbDeviceList();
        if(!isEmpty(deviceListStr)) {
            setPrinterList(JSON.parse(deviceListStr));
        }
    
        setProductName(storage.getString("productName"));
        

        if(printerPickerRef.current != null) {
            const prodIDResult = storage.getString("productID");
            const vendorIDResult = storage.getString("vendorID")
            if(prodIDResult!=null) {
                if(vendorIDResult!=null) {
                    console.log("printer:",printerPickerRef.current.selectedValue);
                    if(printerPickerRef.current.selectedValue ) {
                        printerPickerRef.current.selectedValue = {productID:Number(prodIDResult), vendorID:Number(vendorIDResult)}
                    }
                }
            }        
        }

        setBellProductName(storage.getString("bellProductName"));
        setWeightProductName(storage.getString("weightProductName"));
        setWeightPortNumber(storage.getString("weightPortNumber"));
        
        

        if(printerPickerRef.current != null) {

            const weightProdID = storage.getString("weightProductID")
            const weightVendorID = storage.getString("weightVendorID");
            if(weightProdID!=null) {
                if(printerPickerRef.current.selectedValue) {
                    printerPickerRef.current.selectedValue = {productID:Number(weightProdID), vendorID:Number(weightVendorID)}
                }
            }
        }
        
        const serialPortsList = Serial.getSerialPorts();        
        setCdcLIst(JSON.parse(serialPortsList))
        
    },[])

    useEffect(()=>{
        if(!isEmpty(storeInfo)) {
            if(!isEmpty(storeInfo.table_list)) {
                console.log("storeInfo.table_list: ",storeInfo.table_list);
                if(storeInfo?.table_list?.length>0) {
                    
                    const tableResult = storage.getString("TABLE_INFO");
                    if(!isEmpty(tableResult)){
                        const tblList = tableResult?.table_list;
                            if(tblList?.length>0) {
                                const tblFilter = tblList.filter(el=>el.t_num == result);
                                if(tblFilter.length > 0) {
                                    setTable(tblFilter[0]);
                                } 
                            }
                            
                    }
                }
            }
        }
    },[storeInfo])

    const setTableInfo = async (itemValue) =>{
        console.log("itemValue: ",itemValue)
        storage.set("TABLE_INFO", itemValue.t_num);   
        storage.set("TABLE_NM", itemValue.t_name);   
        storage.set("TABLE_FLOOR",itemValue.floor);
        storage.set("BSN_NO",itemValue.business_no);
        storage.set("TID_NO",itemValue.terminal_id);
        storage.set("SERIAL_NO",itemValue.serial_no);

        setBsnNo(itemValue.business_no)
        setCatId(itemValue.terminal_id)
        setSerialNo(itemValue.serial_no)
        setTable(itemValue);
        EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"세팅", str:'저장되었습니다.'}); 
        /* 
        const prevStoreID = await AsyncStorage.getItem("STORE_IDX").catch(()=>{return null;});
        console.log("previous table topic: ",`${prevStoreID}_${prevTableCode}`)
        if(prevTableCode){      
            try{
               await messaging().unsubscribeFromTopic(`${prevStoreID}_${prevTableCode}`);
            }catch(err){
                console.log("err:",err);
                EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});                displayOnAlert(`${err}`,{});        
                return;    
            }
        }
        try {
            await messaging().subscribeToTopic(`${prevStoreID}_${itemValue}`)
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
            displayOnAlert("테이블이 설정되었습니다.",{});            
            dispatch(regularUpdate());
        }catch(err){
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
            displayOnAlert(`${err}`,{});            
            return;
        } */

    }

    async function completeStoreInfo() {
        storage.set("BREAD_STORE_ID",breadStoreID); 
        storage.set("STORE_IDX",storeID)
        console.log("OK");
        dispatch(getStoreInfo()); 
        dispatch(initializeApp());
        dispatch(getBanner());
        dispatch(setAdShow());
        EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"세팅", str:'저장되었습니다.'});    
    }
    async function weightInitiate() {
        async function startMeasuring() {
            const prodID = storage.getString("weightProductID");
            const vendorID = storage.getString("weightVendorID");
            const portNo = storage.getString("weightPortNumber");
            console.log("connect: ",portNo);
            Weight.initiateWeight(Number(portNo));
        }
        startMeasuring();
    }
    async function weighingTest() {
        
        async function startMeasuring() {
            const prodID = storage.getString("weightProductID");
            const vendorID = storage.getString("weightVendorID");
            const portNo = storage.getString("weightPortNumber");
            console.log("connect: ",portNo);
            Weight.closeSerialConnection();
            Weight.connectDevice();
        }
        startMeasuring();
        DeviceEventEmitter.removeAllListeners("onWeightChanged"); 
        DeviceEventEmitter.addListener("onWeightChanged",(data)=>{    
            const result = data?.weight.replace(/[^0-9.]/g, ""); // 숫자와 소숫점 제외 모든 문자 제거
            const weight = parseFloat(result);
            console.log("weight: ",weight);
            //if(Number(weight)>0) {
                setTmpWeight(weight*1000);    //dispatch(setCommon({weight:weight*1000}))
                //startScan(weight);
            //}
        });  
    }

    async function testPrint() {
        const productID = storage.getString("productID");
        const vendorID = storage.getString("vendorID");
        console.log("productID: ",productID,"vendorID: ",vendorID);
        
        Printer.printWithID(Number(vendorID), Number(productID))
        
    }

    return(
        <>
            <ScrollView style={{backgroundColor:colorWhite}}>   
                <KeyboardAvoidingView enabled style={{width:'100%', height:'100%'}}>
                    <View style={{flexDirection:'row', paddingLeft:30,paddingRight:30}}>
                        <TouchableWithoutFeedback onPress={()=>{props.setSetting(false);}}>
                            <Text style={{flex:1,fontSize:40,color:colorBlack, textAlign:'left'}} >{"<"}</Text>
                        </TouchableWithoutFeedback>
                        <Text style={{flex:1,fontSize:40,color:colorBlack, textAlign:'center'}} >설정</Text>
                        <Text style={{flex:1,fontSize:40,color:colorBlack}} ></Text>
                    </View>
                    <SettingWrapper>
                        <SettingSectionWrapper>
                            <SettingSectionTitle>저울 사용 설정</SettingSectionTitle>
                            <SettingSectionDetailWrapper>
                                <SettingSenctionInputView>
                                    <TouchableWithoutFeedback onPress={async()=>{  
                                        storage.set("WEIGHT_SET",!storage.getBoolean("WEIGHT_SET")); 
                                        setWeight(storage.getBoolean("WEIGHT_SET"));
                                        EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"세팅", str:'설정 되었습니다.'}); 
                                        
                                        }} >
                                        <SettingButtonView>
                                            <SettingSectionTitle>{isWeight?"사용":'미사용'}</SettingSectionTitle>
                                        </SettingButtonView>
                                    </TouchableWithoutFeedback>
                                </SettingSenctionInputView>
                            </SettingSectionDetailWrapper>
                            {/* <SettingSectionDetailWrapper>
                                <SettingSenctionInputView>
                                    <TouchableWithoutFeedback onPress={()=>{ Serial.getSerialPorts() }} >
                                        <SettingButtonView>
                                            <SettingSectionTitle>시리얼</SettingSectionTitle>
                                        </SettingButtonView>
                                    </TouchableWithoutFeedback>
                                </SettingSenctionInputView>
                            </SettingSectionDetailWrapper> */}
                        </SettingSectionWrapper>
                        <SettingSectionWrapper>
                            <SettingSectionTitle>카트 초기화</SettingSectionTitle>
                            <SettingSectionDetailWrapper>
                                <SettingSenctionInputView>
                                    <TouchableWithoutFeedback onPress={async()=>{ dispatch(setMenu({orderList:[],breadOrderList:[]}));EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"세팅", str:'초기화 되었습니다.'}); }} >
                                        <SettingButtonView>
                                            <SettingSectionTitle>초기화</SettingSectionTitle>
                                        </SettingButtonView>
                                    </TouchableWithoutFeedback>
                                </SettingSenctionInputView>
                            </SettingSectionDetailWrapper>
                            {/* <SettingSectionDetailWrapper>
                                <SettingSenctionInputView>
                                    <TouchableWithoutFeedback onPress={()=>{ Serial.getSerialPorts() }} >
                                        <SettingButtonView>
                                            <SettingSectionTitle>시리얼</SettingSectionTitle>
                                        </SettingButtonView>
                                    </TouchableWithoutFeedback>
                                </SettingSenctionInputView>
                            </SettingSectionDetailWrapper> */}
                        </SettingSectionWrapper>
                        <SettingSectionWrapper>
                            <SettingSectionTitle>진동벨</SettingSectionTitle>
                            <SettingSectionDetailWrapper>
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>USB 연결 기기</SettingSectionLabel>
                                    {printerList &&
                                        <Picker
                                            ref={printerPickerRef}
                                            key={"tablePicker"}
                                            mode='dialog'
                                            onValueChange = {(itemValue, itemIndex) => {
                                                //if(itemValue) {
                                                    storage.set("bellProductID",`${itemValue.productID}`);
                                                    storage.set("bellVendorID",`${itemValue.vendorID}`);
                                                    storage.set("bellProductName",`${itemValue.productName}`);
                                                    setBellProductName(itemValue.productName);
                                                //}
                                            }}
                                            style = {{
                                                width: 300,
                                                height: 50,
                                            }}>
                                                <Picker.Item key={"none"} label = {"미선택"} value ={{}} />
                                            {printerList?.map(el=>{
                                                return(
                                                    <Picker.Item key={"_"+el.productId}  label = {el.productName} value ={{productID:el.productId, vendorID:el.vendorId, productName:el.productName}} />
                                                )
                                            })
                                            }
                                        </Picker>
                                    }
                                </SettingSenctionInputView>
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>{bellProductName}</SettingSectionLabel>
                                </SettingSenctionInputView>
                                <SettingSenctionInputView>
                                    <TouchableWithoutFeedback onPress={async()=>{  
                                            const {Bell} = NativeModules; 
                                            const bellVID = storage.getString("bellVendorID")
                                            const bellPID = storage.getString("bellProductID")
                                            Bell.bellTest(bellVID,bellPID,"134");
                                            //Bell.bellCancel(bellVID,bellPID);
                                            //Printer.OpenPrinter()
                                            //Printer.usbDeviceList();

                                     }} >
                                        <SettingButtonView>
                                            <SettingSectionTitle>진동벨 테스트</SettingSectionTitle>
                                        </SettingButtonView>
                                    </TouchableWithoutFeedback>
                                </SettingSenctionInputView>
                            </SettingSectionDetailWrapper>
                        </SettingSectionWrapper>

                        <SettingSectionWrapper>
                            <SettingSectionTitle>프린터 테스트</SettingSectionTitle>
                            <SettingSectionDetailWrapper>
                                <SettingSenctionInputView>
                                    <TouchableWithoutFeedback onPress={async()=>{  
                                            const {Printer} = NativeModules; 
                                            const orderFinalData = {"VERSION":"0010","WORK_CD":"6010","ORDER_NO":"2508081754618026148","TBL_NO":"001","PRINT_YN":"Y","USER_PRINT_YN":"N","PRINT_ORDER_NO":"1-147","TOT_INWON":4,"ITEM_CNT":1,"ITEM_INFO":[{"ITEM_SEQ":1,"ITEM_CD":"900014","ITEM_NM":"아메리카노","ITEM_QTY":1,"ITEM_AMT":5,"ITEM_VAT":46,"ITEM_DC":0,"ITEM_CANCEL_YN":"N","ITEM_GB":"","ITEM_MSG":"","SETITEM_CNT":3,"SETITEM_INFO":[{"ITEM_SEQ":1,"SET_SEQ":1,"PROD_I_NM":"시나몬 추가","QTY":1,"AMT":0,"VAT":0},{"ITEM_SEQ":1,"SET_SEQ":2,"PROD_I_NM":"아이스","QTY":1,"AMT":0,"VAT":0},{"ITEM_SEQ":1,"SET_SEQ":3,"PROD_I_NM":"샷추가","QTY":3,"AMT":1365,"VAT":135}]}]};
                                            const finalOrderData = [{"sale_status":"2","store_account":"504","good_use":"100","use_timea":"","use_timeaa":"","use_timeb":"","use_timebb":"","good_use1":"100","use_time1a":"","use_time1aa":"","use_time1b":"","use_time1bb":"","mem_idx":"2","index_no":"2","brand_idx":"1","prod_l1_cd":"111","prod_l2_cd":"","prod_gb":"09","gname_kr":"아메리카노","gname_en":"americano","gname_kr1":"","gname_jp":"アメリカーノ","gname_cn":"美式咖啡","wonsanji":"","wonsanji_en":"","wonsanji_jp":"","wonsanji_cn":"","howmany":"","cate_code":"111","account":"504","sal_tot_amt":"504","account_etc":null,"account_pur":"4500","sal_amt":"458","sal_vat":"46","vat_rate":"10","tax_sw":"1","gmemo":"","gmemo_en":"","gmemo_jp":"","gmemo_cn":"","related_goods":"","gimg_org":"ccccc.jpeg","gimg_chg":"http://zzigbbang.com/a_tablet/upload_file/goods/1735224026-nrwov.jpeg","gimg_thum":"http://zzigbbang.com/a_tablet/upload_file/goods/img_thumb/1735224026-nrwov.jpeg","spicy":"0","temp":"","colors":"","prod_cd":"900014","pos_yn":"N","kiosk_yn":"N","always":"N","recom_date":"","is_view":"Y","weight":"0","w_margin_error":"0","soldout":"N","is_new":"N","is_best":"N","is_popup":"N","is_use":"Y","is_on":"N","is_fav":"N","is_whipping":"N","is_stamp":"N","is_stamp_ok":"N","regDate":"2024-12-26 23:39:32","is_del":"N","total_sort":"1","delDate":null,"related":[],"option":[{"idx":"3","shop_idx":"2","shop_id":"3113810001","cate_code":null,"op_name":"시럽추가","op_name_en":"Syrup","op_name_jp":"シロップ","op_name_cn":"糖漿","op_price":"0","limit_count":"0","number":"0","op_use":"Y","prod_cd":"","gimg_org":"ccccc.jpeg","gimg_chg":"/a_tablet/upload_file/goods/1735224595-qtvdc.jpeg","op_del":"N","op_regDate":"2024-12-26 23:49:55","op_modDate":"2025-01-09 00:05:27","prod_i_cd":["2828","10012"]},{"idx":"2","shop_idx":"2","shop_id":"3113810001","cate_code":null,"op_name":"아메리카노 얼음","op_name_en":"","op_name_jp":"","op_name_cn":"","op_price":"0","limit_count":"1","number":"0","op_use":"Y","prod_cd":"","gimg_org":"ccccc.jpeg","gimg_chg":"/a_tablet/upload_file/goods/1735224320-xibtm.jpeg","op_del":"N","op_regDate":"2024-12-26 23:45:20","op_modDate":"2024-12-26 23:47:52","prod_i_cd":["4545","10003"]},{"idx":"1","shop_idx":"2","shop_id":"3113810001","cate_code":null,"op_name":"아메리카노 샷추가","op_name_en":"","op_name_jp":"","op_name_cn":"","op_price":"0","limit_count":"3","number":"0","op_use":"Y","prod_cd":"","gimg_org":"ccccc.jpeg","gimg_chg":"/a_tablet/upload_file/goods/1735224275-rdkvn.jpeg","op_del":"N","op_regDate":"2024-12-26 23:44:35","op_modDate":"2024-12-27 01:07:53","prod_i_cd":["78098","1111111"]}],"order_amt":1}]
                                            const payResultData = {"AnsCode":"0000","AnswerTrdNo":"null","AuNo":"28872915","AuthType":"null","BillNo":"","CardKind":"1","CardNo":"9411-9400-****-****","ChargeAmt":"null","DDCYn":"1","DisAmt":"null","EDCYn":"0","GiftAmt":"","InpCd":"1107","InpNm":"신한카드","Keydate":"","MchData":"wooriorder","MchNo":"22101257","Message":"마이신한P잔여 : 109                     ","Month":"00","OrdCd":"1107","OrdNm":"개인신용","PcCard":"null","PcCoupon":"null","PcKind":"null","PcPoint":"null","QrKind":"null","RefundAmt":"null","SvcAmt":"0","TaxAmt":"181","TaxFreeAmt":"0","TermID":"0710000900","TradeNo":"000004689679","TrdAmt":"1823","TrdDate":"240902182728","TrdType":"A15"};
                                            const businessData = "{\"TrdDate\":\"250808105306\",\"HardwareKey\":\"133D34F060AFE2B\",\"Message\":\"정상처리\",\"BsnNo\":\"6645600780\",\"AnsCode\":\"0000\",\"ShpTel\":\"0215664551     \",\"MchData\":\"\",\"PtcInfo\":\"011OK 캐쉬백     020MyLGPoint     030바우처카드    040그린카드      050한마음의료    060Oh 포인트     070GB포인트      090과천 바로마켓 110LG보너스클럽  150파주농수산    160코엑스포인트  170바나나포인트  180Extrade       190코레일멤버쉽  200SC리워드      \",\"ShpNm\":\"에이치제이상사                          \",\"ShpAdr\":\"인천 부평구 부평대로 337 807호 일부(청천동, 부평제\",\"TermID\":\"1612417002\",\"TrdType\":\"D15\",\"AsNum\":\"1566-4551      \",\"PreNm\":\"김현정              \",\"PtcCnt\":\"15\"}";
                                            const adminStoreName = "테스트";
                                            const orderNo = "1-145";
                                            Printer.Sam4sStartPrint(JSON.stringify(orderFinalData), JSON.stringify(finalOrderData), JSON.stringify(payResultData), businessData, adminStoreName, orderNo);
                                            
                                            //Printer.OpenPrinter()
                                            //Printer.usbDeviceList();

                                     }} >
                                        <SettingButtonView>
                                            <SettingSectionTitle>프린트</SettingSectionTitle>
                                        </SettingButtonView>
                                    </TouchableWithoutFeedback>
                                </SettingSenctionInputView>
                                {/* <SettingSenctionInputView>
                                    <TouchableWithoutFeedback onPress={async()=>{  
                                            const {Printer} = NativeModules; 
                                            Printer.getDeviceList();
                                            //Printer.OpenPrinter()
                                            //Printer.usbDeviceList();

                                     }} >
                                        <SettingButtonView>
                                            <SettingSectionTitle>프린트 리스트</SettingSectionTitle>
                                        </SettingButtonView>
                                    </TouchableWithoutFeedback>
                                </SettingSenctionInputView> */}
                            </SettingSectionDetailWrapper>
                        </SettingSectionWrapper>
                        {/* <SettingSectionWrapper>
                            <SettingSectionTitle>프린터 선택</SettingSectionTitle>
                            <SettingSectionDetailWrapper>
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>USB 연결 기기</SettingSectionLabel>
                                    {printerList &&
                                        <Picker
                                            ref={printerPickerRef}
                                            key={"tablePicker"}
                                            mode='dialog'
                                            onValueChange = {(itemValue, itemIndex) => {
                                                console.log(itemValue.productName);
                                                //if(itemValue) {
                                                    AsyncStorage.setItem("productID",`${itemValue.productID}`);
                                                    AsyncStorage.setItem("vendorID",`${itemValue.vendorID}`);
                                                    AsyncStorage.setItem("productName",`${itemValue.productName}`);
                                                    setProductName(itemValue.productName);
                                                //}
                                            }}
                                            style = {{
                                                width: 300,
                                                height: 50,
                                            }}>
                                                <Picker.Item key={"none"} label = {"미선택"} value ={{}} />
                                            {printerList?.map(el=>{
                                                return(
                                                    <Picker.Item key={"_"+el.productId}  label = {el.productName} value ={{productID:el.productId, vendorID:el.vendorId, productName:el.productName}} />
                                                )
                                            })
                                            }
                                        </Picker>
                                    }
                                </SettingSenctionInputView>
                                <View style={{width:'100%',textAlign:'center',alignItems:'center'}} >
                                    <SettingSectionLabel>{productName}</SettingSectionLabel>
                                </View>
                                <TouchableWithoutFeedback onPress={async()=>{ testPrint() }} >
                                    <SettingButtonView style={{ margin:'auto', width:240, textAlign:'center', alignItem:'center'}} >
                                        <SettingSectionTitle style={{textAlign:'center'}} >테스트 프린트</SettingSectionTitle>
                                    </SettingButtonView>
                                </TouchableWithoutFeedback>
                            </SettingSectionDetailWrapper>
                        </SettingSectionWrapper> */}
                        <SettingSectionWrapper>
                            <SettingSectionTitle>저울세팅</SettingSectionTitle>
                            <SettingSectionDetailWrapper>
                                <SettingSenctionInputView>
                                    {/* <SettingSectionLabel>USB 연결 기기</SettingSectionLabel> */}
                                    {/*cdcList &&
                                        <Picker
                                            ref={printerPickerRef}
                                            key={"tablePicker"}
                                            mode='dialog'
                                            onValueChange = {(itemValue, itemIndex) => {
                                                //if(itemValue) {
                                                    //AsyncStorage.setItem("weightProductID",`${itemValue.productID}`);
                                                    //AsyncStorage.setItem("weightVendorID",`${itemValue.vendorID}`);
                                                    //AsyncStorage.setItem("weightPortNumber",`${itemValue.portNumber}`);

                                                    storage.set("weightProductID",`${itemValue.productID}`);
                                                    storage.set("weightVendorID",`${itemValue.vendorID}`);
                                                    storage.set("weightPortNumber",`${itemValue.portNumber}`);
                                                    setWeightProductName(itemValue.portNumber);
                                                //}
                                            }}
                                            style = {{
                                                width: 300,
                                                height: 50,
                                            }}>
                                                <Picker.Item key={"none"} label = {"미선택"} value ={{}} />
                                            {cdcList?.map(el=>{
                                                return(
                                                    <Picker.Item key={"_"+el.product_id+"_"+el.port_number}  label = {el.device_name+"_"+el.port_number} value ={{productID:el.product_id, vendorID:el.device_id, portNumber:el.port_number}} />
                                                )
                                            })
                                            }
                                        </Picker>
                                        */}
                                    {/* printerList &&
                                        <Picker
                                            ref={printerPickerRef}
                                            key={"tablePicker"}
                                            mode='dialog'
                                            onValueChange = {(itemValue, itemIndex) => {
                                                console.log(itemValue.productName);
                                                //if(itemValue) {
                                                    AsyncStorage.setItem("weightProductID",`${itemValue.productID}`);
                                                    AsyncStorage.setItem("weightVendorID",`${itemValue.vendorID}`);
                                                    AsyncStorage.setItem("weightProductName",`${itemValue.productName}`);
                                                    setWeightProductName(itemValue.productName);
                                                //}
                                            }}
                                            style = {{
                                                width: 300,
                                                height: 50,
                                            }}>
                                                <Picker.Item key={"none"} label = {"미선택"} value ={{}} />
                                            {printerList?.map(el=>{
                                                return(
                                                    <Picker.Item key={"_"+el.productId}  label = {el.productName} value ={{productID:el.productId, vendorID:el.vendorId, productName:el.productName}} />
                                                )
                                            })
                                            }
                                        </Picker>
                                     */}
                                </SettingSenctionInputView>
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>{weightProductName}</SettingSectionLabel>
                                </SettingSenctionInputView>
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>{tmpWeight} g</SettingSectionLabel>
                                    <TouchableWithoutFeedback onPress={async()=>{ weighingTest(); }} >
                                        <SettingButtonView>
                                            <SettingSectionTitle>연결</SettingSectionTitle>
                                        </SettingButtonView>
                                    </TouchableWithoutFeedback>
                                </SettingSenctionInputView>
                                {/* <SettingSenctionInputView>
                                    <SettingSectionLabel>{weight} kg</SettingSectionLabel>
                                    <TouchableWithoutFeedback onPress={async()=>{ weightInitiate(); }} >
                                        <SettingButtonView>
                                            <SettingSectionTitle>영점맞추기</SettingSectionTitle>
                                        </SettingButtonView>
                                    </TouchableWithoutFeedback>
                                </SettingSenctionInputView> */}
                            </SettingSectionDetailWrapper>
                        </SettingSectionWrapper>
                        <SettingSectionWrapper>
                            <SettingSectionTitle>매장정보</SettingSectionTitle>
                            <SettingSectionDetailWrapper>
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>스토어 아이디</SettingSectionLabel>
                                    <SettingSectionInput onChangeText={(val)=>{setStoreID(val)}} value={storeID} ></SettingSectionInput>
                                </SettingSenctionInputView>
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>제품등록 아이디</SettingSectionLabel>
                                    <SettingSectionInput onChangeText={(val)=>{setBreadStoreId(val)}} value={breadStoreID} ></SettingSectionInput>
                                </SettingSenctionInputView>
                                <SettingSenctionInputView>
                                    <TouchableWithoutFeedback onPress={async()=>{ completeStoreInfo(); }} >
                                        <SettingButtonView>
                                            <SettingSectionTitle>저장</SettingSectionTitle>
                                        </SettingButtonView>
                                    </TouchableWithoutFeedback>
                                </SettingSenctionInputView>
                            </SettingSectionDetailWrapper>
                            


                            <SettingSectionTitle>포스정보</SettingSectionTitle>
                            <SettingSectionDetailWrapper>
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>포스번호</SettingSectionLabel>
                                    <SettingSectionInput inputMode="numeric" onChangeText={(val)=>{setPosNo(val)}} value={posNo} ></SettingSectionInput>
                                </SettingSenctionInputView>
                                <SettingSenctionInputView>
                                    <TouchableWithoutFeedback onPress={()=>{ storage.set("POS_NO",posNo);/*  AsyncStorage.setItem("POS_NO",posNo); */ EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"세팅", str:'저장되었습니다.'}); }} >
                                        <SettingButtonView>
                                            <SettingSectionTitle>저장</SettingSectionTitle>
                                        </SettingButtonView>
                                    </TouchableWithoutFeedback>
                                </SettingSenctionInputView>
                            </SettingSectionDetailWrapper>
                            <SettingSectionTitle>테이블 선택</SettingSectionTitle>
                            <SettingSectionDetailWrapper>
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>테이블</SettingSectionLabel>
                                    {storeInfo &&
                                        <Picker
                                            ref={pickerRef}
                                            key={"tablePicker"}
                                            mode='dialog'
                                            onValueChange = {(itemValue, itemIndex) => {
                                                if(!isEmpty(storeInfo?.table_list)){
                                                    if(storeInfo?.table_list?.length>0) {
                                                        if(!isEmpty(itemValue)){
                                                            setTableInfo(itemValue)     
                                                        }                
                                                    }
                                                }              
                                            }}
                                            selectedValue={table}
                                            style = {{
                                                width: 300,
                                                height: 50,
                                            }}>
                                                <Picker.Item key={"none"} label = {"미선택"} value ={{}} />
                                            {storeInfo?.table_list?.map(el=>{
                                                return(
                                                    <Picker.Item key={"_"+el.t_num}  label = {el.floor+"층 "+el.t_name} value ={el} />
                                                )
                                            })
                                            }
                                        </Picker>
                                    }
                                </SettingSenctionInputView>
                            </SettingSectionDetailWrapper>
                            
                        </SettingSectionWrapper>
                        {
                        <SettingSectionWrapper>
                            <SettingSectionTitle>결제</SettingSectionTitle>
                            <SettingSectionDetailWrapper>
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>승인번호</SettingSectionLabel>
                                    <SettingSectionInput onChangeText={(val)=>{setApprovalNo(val)}} value={approvalNo} inputMode="numeric" ></SettingSectionInput>
                                </SettingSenctionInputView>
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>tradeNo</SettingSectionLabel>
                                    <SettingSectionInput onChangeText={(val)=>{setTradeNo(val)}} value={tradeNo} inputMode="numeric" ></SettingSectionInput>
                                </SettingSenctionInputView>
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>금액</SettingSectionLabel>
                                    <SettingSectionInput onChangeText={(val)=>{setApprovalAmt(val)}} value={approvalAmt}  inputMode="numeric" ></SettingSectionInput>
                                </SettingSenctionInputView>
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>vat</SettingSectionLabel>
                                    <SettingSectionInput onChangeText={(val)=>{setVatAmt(val)}} value={vatAmt}  inputMode="numeric" ></SettingSectionInput>
                                </SettingSenctionInputView>
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>날짜</SettingSectionLabel>
                                    <SettingSectionInput onChangeText={(val)=>{setApprovalDate(val)}} value={approvalDate}  inputMode="numeric" ></SettingSectionInput>
                                </SettingSenctionInputView>
                                <SettingSenctionInputView>
                                    <TouchableWithoutFeedback onPress={()=>{cancelPayment()}} >
                                        <SettingButtonView>
                                            <SettingSectionTitle>취소</SettingSectionTitle>
                                        </SettingButtonView>
                                    </TouchableWithoutFeedback>
                                </SettingSenctionInputView>
                            </SettingSectionDetailWrapper>
                        </SettingSectionWrapper>
                        }
                        <SettingSectionWrapper>
                            <SettingSectionTitle>사업자 정보</SettingSectionTitle>
                            <SettingSectionDetailWrapper>
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>사업자번호</SettingSectionLabel>
                                    <SettingSectionInput editable={false} onChangeText={(val)=>{setBsnNo(val)}} value={bsnNo} inputMode="numeric" ></SettingSectionInput>
                                </SettingSenctionInputView>
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>CAT ID</SettingSectionLabel>
                                    <SettingSectionInput editable={false} onChangeText={(val)=>{setCatId(val)}} value={catId}  inputMode="numeric" ></SettingSectionInput>
                                </SettingSenctionInputView>
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>SERIAL_NO</SettingSectionLabel>
                                    <SettingSectionInput editable={false} onChangeText={(val)=>{setSerialNo(`${val}`)}} value={serialNo}  inputMode="numeric" ></SettingSectionInput>
                                </SettingSenctionInputView>
                                <SettingSenctionInputView>
                                   <TouchableWithoutFeedback onPress={async ()=>{
                                     var kocessAppPay = new KocesAppPay();
                                     try{
                                         const storeDownload = await kocessAppPay.storeDownload();
                                         EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"완료", str:"완료되었습니다."});    
                                    }
                                     catch(err) {
                                         console.log("err: ",err)
                                         EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                                         EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"오류", str:err.Message});    
                                     }
                                    }} >
                                        <SettingButtonView>
                                            <SettingSectionTitle>스토어 다운로드</SettingSectionTitle>
                                        </SettingButtonView>
                                    </TouchableWithoutFeedback> 
                                </SettingSenctionInputView>
                            </SettingSectionDetailWrapper>
                        </SettingSectionWrapper>
                        <SettingSectionWrapper>
                            <SettingSectionTitle>업데이트 정보</SettingSectionTitle>
                            <SettingSectionDetailWrapper>
                                <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 결제버튼 안나오는 버그 수정</SettingSectionLabel>
                                </SettingSenctionInputViewColumn>
                            </SettingSectionDetailWrapper>
                        </SettingSectionWrapper>
                    </SettingWrapper>
                </KeyboardAvoidingView>
            </ScrollView>
        </>
    )
}
export default SettingScreen;