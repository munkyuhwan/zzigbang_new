import { Alert, DeviceEventEmitter, KeyboardAvoidingView, ScrollView, Text, TouchableWithoutFeedback, View } from "react-native";
import { BottomButton } from "../components/commonComponents";
import { SettingButtonView, SettingSectionDetailInnerWrapper, SettingSectionDetailRowWrapper, SettingSectionDetailWrapper, SettingSectionInput, SettingSectionLabel, SettingSectionTitle, SettingSectionWrapper, SettingSenctionInputView, SettingSenctionInputViewColumn, SettingWrapper } from "../style/setting";
import { serviceCancelPayment, servicePayment } from "../utils/smartro";
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
import { VAN_KOCES, VAN_KOCESS, VAN_SMARTRO } from "../utils/apiRequest";
import { setAlert } from "../store/alert";


const SettingScreen = (props) =>{
    const {Printer,
         Weight, 
         Serial,
         LED,
         Etc
        } = NativeModules;
    

    const navigate = useNavigation();
    const dispatch = useDispatch();
    const pickerRef = useRef();
    const vanRef = useRef();
    const printerPickerRef = useRef();
    const weightRef = useRef();
    const bellRef = useRef();
    const receiptRef = useRef();
    const printerRef = useRef();

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
    const [printerPort, setPrinterPort] = useState("");
    const [isBellUse, setBellUse] = useState("");
    const [isReceiptUse, setReceiptUse] = useState("");
    const [printerList, setPrinterList] = useState([]);
    const [cdcList, setCdcLIst] = useState([]);
    const [isWeight, setWeight] = useState(true);
    const [trayWeight, setTrayWeight] = useState(true);

    const {storeInfo, tableList} = useSelector(state=>state.meta);
    const {isMaster} = useSelector(state=>state.common);
    // 단말기 관련
    const [bsnNo, setBsnNo] = useState("");
    const [catId, setCatId] = useState("");
    const [serialNo, setSerialNo] = useState("");

    // van 선택
    const [van,setVan] = useState("");

    // 저울
    const [tmpWeight, setTmpWeight] = useState("");

    // 진동벨
    const [bellLan, setBellLan] = useState("a");
    const [bellNumber, setBellNumber] = useState("1234");
    const [bellCorner, setBellCorner] = useState("A");


    const isFocused = useIsFocused();


    useFocusEffect(
        useCallback(()=>{
            console.log('화면 진입');
            return () => {
            // 화면이 벗어날 때 실행
            console.log('화면에서 나감, 포커스 해제');
            // 여기서 USB 포트 닫기나 리소스 정리
                //props.initScanScreen();
            };

        },[])
    )

    async function smartroCancel() {

        const data = { "total-amount":2900, "approval-no":"21937150","approval-date":"251022",  "attribute":["attr-continuous-trx","attr-include-sign-bmp-buffer","attr-enable-switching-payment","attr-display-ui-of-choice-pay"]};

        const result = await servicePayment(dispatch,true, data);
    }

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
        setVan(storage.getString("VAN"));
        setTrayWeight(storage.getString("TRAY_WEIGHT"));
        setBellUse(storage.getString("isBellUse"));
        setPrinterPort(storage.getString("PRINT_PORT"));
        setReceiptUse(storage.getString("IS_RECEIPT"));
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
       
    }

    async function completeStoreInfo() {
        storage.set("BREAD_STORE_ID",breadStoreID); 

        const prevStoreID = storage.getString("STORE_IDX");
        storage.set("STORE_IDX",storeID)
        try{
            messaging().unsubscribeFromTopic(`${prevStoreID}`);
        }catch(err){
             
        }
        try {
            messaging().subscribeToTopic(`${storeID}`)
        }catch(err){
        }

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

    async function testPrint() {
        const productID = storage.getString("productID");
        const vendorID = storage.getString("vendorID");
        console.log("productID: ",productID,"vendorID: ",vendorID);
        
        Printer.printWithID(Number(vendorID), Number(productID))
        
    }

    function testLed() {
        //LED.connectDevice("1");
        LED.sendLed1Color("3",true,true,true);
        //LED.sendLedCommand(false, true, false);
    }

    return(
        <>
            <ScrollView style={{backgroundColor:colorWhite}}>   
                <KeyboardAvoidingView enabled style={{width:'100%', height:'100%'}}>
                    <View style={{flexDirection:'row', paddingLeft:30,paddingRight:30}}>
                        <TouchableWithoutFeedback onPress={()=>{if(!isMaster){dispatch(setCommon({isAddShow:true}));} props.setSetting(false); }}>
                            <Text style={{flex:1,fontSize:60,color:colorBlack, textAlign:'left'}} >{"<"}</Text>
                        </TouchableWithoutFeedback>
                        <Text style={{flex:1,fontSize:40,color:colorBlack, textAlign:'center'}} >설정</Text>
                        <Text style={{flex:1,fontSize:40,color:colorBlack}} ></Text>
                    </View>
                    <View style={{flexDirection:'row', paddingLeft:30,paddingRight:30}}>
                        <Text style={{flex:1,fontSize:20,color:colorBlack,textAlign:'center'}} >v1.0.54</Text>
                    </View>
                    <SettingWrapper>

                        {/* <SettingSectionWrapper>
                            <SettingSectionTitle></SettingSectionTitle>
                            <SettingSectionDetailWrapper>
                                <SettingSenctionInputView>
                                    <TouchableWithoutFeedback onPress={()=>{smartroCancel() }} >
                                        <SettingButtonView>
                                            <SettingSectionTitle>스마트로 취소</SettingSectionTitle>
                                        </SettingButtonView>
                                    </TouchableWithoutFeedback>
                                </SettingSenctionInputView>
                            </SettingSectionDetailWrapper>
                        </SettingSectionWrapper>
                     */}
                         <SettingSectionWrapper>
                            <SettingSectionTitle>관리자 설정</SettingSectionTitle>
                            <SettingSectionDetailWrapper>
                                <SettingSenctionInputView>
                                    <TouchableWithoutFeedback onPress={async()=>{ dispatch(setMenu({orderList:[],breadOrderList:[]}));EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"세팅", str:'초기화 되었습니다.'}); }} >
                                        <SettingButtonView>
                                            <SettingSectionTitle>장바구니 초기화</SettingSectionTitle>
                                        </SettingButtonView>
                                    </TouchableWithoutFeedback>
                                </SettingSenctionInputView>
                                <SettingSenctionInputView>
                                        <TouchableWithoutFeedback onPress={()=>{ Etc.openManageIntent(storage.getString("STORE_IDX"),storage.getString("BREAD_STORE_ID")); }} >
                                            <SettingButtonView>
                                                <SettingSectionTitle>매니지 앱 열기</SettingSectionTitle>
                                            </SettingButtonView>
                                        </TouchableWithoutFeedback>
                                    </SettingSenctionInputView>
                            </SettingSectionDetailWrapper>
                        </SettingSectionWrapper>

                        <SettingSectionWrapper>
                            <SettingSectionTitle>매장정보</SettingSectionTitle>
                            
                            <SettingSectionDetailWrapper>

                                <SettingSectionDetailRowWrapper>
                                    <SettingSectionDetailInnerWrapper>
                                        <SettingSenctionInputView>
                                            <SettingSectionLabel>스토어 아이디</SettingSectionLabel>
                                            <SettingSectionInput 
                                            onChangeText={(val)=>{
                                                setStoreID(val)
                                                
                                                }} value={storeID} ></SettingSectionInput>
                                        </SettingSenctionInputView>
                                        <SettingSenctionInputView>
                                            <SettingSectionLabel>제품등록 아이디</SettingSectionLabel>
                                            <SettingSectionInput onChangeText={(val)=>{setBreadStoreId(val)}} value={breadStoreID} ></SettingSectionInput>
                                        </SettingSenctionInputView> 
                                        <SettingSenctionInputView>
                                            <SettingSectionLabel>포스번호</SettingSectionLabel>
                                            <SettingSectionInput inputMode="numeric" onChangeText={(val)=>{setPosNo(val)}} value={posNo} ></SettingSectionInput>
                                        </SettingSenctionInputView>
                                        <SettingSenctionInputView>
                                            <TouchableWithoutFeedback onPress={()=>{ storage.set("POS_NO",posNo); completeStoreInfo();/*  AsyncStorage.setItem("POS_NO",posNo); */ EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"세팅", str:'저장되었습니다.'}); }} >
                                                <SettingButtonView>
                                                    <SettingSectionTitle>저장</SettingSectionTitle>
                                                </SettingButtonView>
                                            </TouchableWithoutFeedback>
                                        </SettingSenctionInputView>
                                    </SettingSectionDetailInnerWrapper>
                                </SettingSectionDetailRowWrapper>



                                <SettingSenctionInputView>
                                    <SettingSectionLabel>테이블 선택</SettingSectionLabel>
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
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>결제 단말기 선택</SettingSectionLabel>
                                    <Picker
                                        ref={vanRef}
                                        key={"tablePicker"}
                                        mode='dialog'
                                        onValueChange = {(itemValue, itemIndex) => {
                                            if(itemValue) {
                                                storage.set("VAN",itemValue);
                                                setVan(itemValue);
                                            }
                                        }}
                                        selectedValue={van}
                                        style = {{
                                            width: 300,
                                            height: 50,
                                        }}>
                                            <Picker.Item key={"none"} label = {"미선택"} value ={{}} />
                                            <Picker.Item key={"_kocess"}  label = {"코세스"} value ={VAN_KOCES} />
                                            <Picker.Item key={"_smartro"}  label = {"스마트로"} value ={VAN_SMARTRO} />
                                        
                                    </Picker>
                                </SettingSenctionInputView>

                                <SettingSectionDetailInnerWrapper>
                                    <SettingSenctionInputView>
                                        <SettingSectionLabel>쟁반무게</SettingSectionLabel>
                                        <SettingSectionInput onChangeText={(val)=>{setTrayWeight(val)}} value={trayWeight} inputMode="numeric" ></SettingSectionInput>
                                    </SettingSenctionInputView>
                                    <SettingSenctionInputView>
                                        <TouchableWithoutFeedback onPress={()=>{storage.set("TRAY_WEIGHT",trayWeight); EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"알림", str:"저장되었습니다."});}} >
                                            <SettingButtonView>
                                                <SettingSectionTitle>저장</SettingSectionTitle>
                                            </SettingButtonView>
                                        </TouchableWithoutFeedback>
                                    </SettingSenctionInputView>
                                </SettingSectionDetailInnerWrapper>
                            </SettingSectionDetailWrapper>
                        </SettingSectionWrapper>

                        <SettingSectionWrapper>
                            <SettingSectionTitle>LED 테스트</SettingSectionTitle>
                            <SettingSectionDetailWrapper>
                                <SettingSenctionInputView>
                                    <TouchableWithoutFeedback onPress={()=>{testLed(); }}>
                                        <SettingButtonView>
                                            <SettingSectionTitle>{"테스트"}</SettingSectionTitle>
                                        </SettingButtonView>
                                    </TouchableWithoutFeedback>
                                </SettingSenctionInputView>
                             </SettingSectionDetailWrapper>
                        </SettingSectionWrapper>
                         
                        <SettingSectionWrapper>
                            <SettingSectionTitle>저울세팅</SettingSectionTitle>
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
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>포트선택</SettingSectionLabel>
                                        <Picker
                                            ref={weightRef}
                                            key={"weightPort"}
                                            mode='dialog'
                                            onValueChange = {(itemValue, itemIndex) => {
                                                if(itemValue) {
                                                    storage.set("weightPortNumber",`${itemValue}`);
                                                    setWeightPortNumber(itemValue);
                                                    props.initScanScreen();
                                                }
                                            }}
                                            selectedValue={Number(storage.getString("weightPortNumber"))}
                                            style = {{
                                                width: 300,
                                                height: 50,
                                            }}>
                                                <Picker.Item key={"none"} label = {"미선택"} value ={{}} />
                                                <Picker.Item key={"weight_port_0"}  label = {0} value ={0} />
                                                <Picker.Item key={"weight_port_1"}  label = {1} value ={1} />
                                                <Picker.Item key={"weight_port_2"}  label = {2} value ={2} />
                                                <Picker.Item key={"weight_port_3"}  label = {3} value ={3} />
                                                
                                          
                                            
                                        </Picker>
                                </SettingSenctionInputView>
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>{props.currentWeight}</SettingSectionLabel>
                                </SettingSenctionInputView>
                                {/* <SettingSenctionInputView>
                                    <SettingSectionLabel>{props.currentWeight} g</SettingSectionLabel>
                                    <TouchableWithoutFeedback onPress={async()=>{ weighingTest(); }} >
                                        <SettingButtonView>
                                            <SettingSectionTitle>연결 테스트</SettingSectionTitle>
                                        </SettingButtonView>
                                    </TouchableWithoutFeedback>
                                </SettingSenctionInputView> */}
                            </SettingSectionDetailWrapper>
                        </SettingSectionWrapper>

                        <SettingSectionWrapper>
                            <SettingSectionTitle>영수증 출력</SettingSectionTitle>
                            <SettingSenctionInputView>
                                <SettingSectionLabel>영수증 출력 팝업 사용 여부</SettingSectionLabel>
                                {
                                    <Picker
                                        ref={receiptRef}
                                        key={"tablePicker"}
                                        mode='dialog'
                                        selectedValue={isReceiptUse}
                                        onValueChange = {(itemValue, itemIndex) => {
                                            //if(itemValue) {
                                                storage.set("IS_RECEIPT",`${itemValue}`);
                                                setReceiptUse(itemValue);
                                            //}
                                        }}
                                        style = {{
                                            width: 300,
                                            height: 50,
                                        }}>
                                            <Picker.Item key={"none"} label = {"미선택"} value ={""} />
                                            <Picker.Item key={"none"} label = {"미사용"} value ={"N"} />
                                            <Picker.Item key={"none"} label = {"사용"} value ={"Y"} />
                                       
                                        
                                    </Picker>
                                }
                            </SettingSenctionInputView>
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
                                    <SettingSectionLabel>진동벨 사용여부</SettingSectionLabel>
                                    {
                                        <Picker
                                            ref={bellRef}
                                            key={"tablePicker"}
                                            mode='dialog'
                                            selectedValue={isBellUse}
                                            onValueChange = {(itemValue, itemIndex) => {
                                                //if(itemValue) {
                                                    storage.set("isBellUse",`${itemValue}`);
                                                    setBellUse(itemValue.productName);
                                                //}
                                            }}
                                            style = {{
                                                width: 300,
                                                height: 50,
                                            }}>
                                                <Picker.Item key={"none"} label = {"미선택"} value ={""} />
                                                <Picker.Item key={"none"} label = {"미사용"} value ={"N"} />
                                                <Picker.Item key={"none"} label = {"사용"} value ={"Y"} />
                                           
                                            
                                        </Picker>
                                    }
                                </SettingSenctionInputView>
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>{bellProductName}</SettingSectionLabel>
                                </SettingSenctionInputView>
                                {/* <SettingSenctionInputView>
                                    <SettingSectionLabel>언어</SettingSectionLabel>
                                    <SettingSectionInput onChangeText={(val)=>{setBellLan(val)}} value={bellLan} ></SettingSectionInput>
                                </SettingSenctionInputView>
                                */}
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>코너</SettingSectionLabel>
                                    <SettingSectionInput onChangeText={(val)=>{setBellCorner(val)}} value={bellCorner} ></SettingSectionInput>
                                </SettingSenctionInputView>
                                <SettingSenctionInputView>
                                    <SettingSectionLabel>고객번호</SettingSectionLabel>
                                    <SettingSectionInput type={"numeric"} onChangeText={(val)=>{setBellNumber(val)}} value={bellNumber} ></SettingSectionInput>
                                </SettingSenctionInputView>

                                <SettingSenctionInputView>
                                    <TouchableWithoutFeedback onPress={async()=>{  
                                            const {Bell} = NativeModules; 
                                            const bellVID = storage.getString("bellVendorID")
                                            const bellPID = storage.getString("bellProductID")
                                            console.log("selectedLanguage: ",storage.getString("LAN"))
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
                                            console.log(lan,JSON.stringify([bellCorner]),bellNumber,bellVID,bellPID);
                                            Bell.bellRing(lan,bellCorner,bellNumber,bellVID,bellPID);
                                            EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문완료", str:"진동벨을 챙겨주세요.",isCancle:false});
                                            DeviceEventEmitter.removeAllListeners("onBellChange"); 
                                            DeviceEventEmitter.addListener("onBellChange",(data)=>{    
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
                                                        //EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"주문오류", str:"진동벨에 오류가 있습니다.",isCancle:true});
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
                                                    }
                                                }
                                            });
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
                                    <SettingSectionLabel>프린터 포트 선택</SettingSectionLabel>
                                    {
                                        <Picker
                                            ref={printerRef}
                                            key={"tablePicker"}
                                            mode='dialog'
                                            selectedValue={printerPort}
                                            onValueChange = {(itemValue, itemIndex) => {
                                                //if(itemValue) {
                                                    storage.set("PRINT_PORT",`${itemValue}`);
                                                    setPrinterPort(itemValue);
                                                //}
                                            }}
                                            style = {{
                                                width: 300,
                                                height: 50,
                                            }}>
                                                <Picker.Item key={"none"} label = {"미선택"} value ={""} />
                                                <Picker.Item key={"none"} label = {"0"} value ={"0"} />
                                                <Picker.Item key={"none"} label = {"1"} value ={"1"} />
                                                <Picker.Item key={"none"} label = {"2"} value ={"2"} />
                                                <Picker.Item key={"none"} label = {"3"} value ={"3"} />
                                           
                                            
                                        </Picker>
                                    }
                                </SettingSenctionInputView>
                                <SettingSenctionInputView>
                                    <TouchableWithoutFeedback onPress={async()=>{  
                                            const {Printer} = NativeModules; 
                                            const orderFinalData = {"VERSION":"0010","WORK_CD":"6010","ORDER_NO":"2508081754618026148","TBL_NO":"001","PRINT_YN":"Y","USER_PRINT_YN":"N","PRINT_ORDER_NO":"1-147","TOT_INWON":4,"ITEM_CNT":1,"ITEM_INFO":[{"ITEM_SEQ":1,"ITEM_CD":"900014","ITEM_NM":"아메리카노","ITEM_QTY":1,"ITEM_AMT":5,"ITEM_VAT":46,"ITEM_DC":0,"ITEM_CANCEL_YN":"N","ITEM_GB":"","ITEM_MSG":"","SETITEM_CNT":3,"SETITEM_INFO":[{"ITEM_SEQ":1,"SET_SEQ":1,"PROD_I_NM":"시나몬 추가","QTY":1,"AMT":0,"VAT":0},{"ITEM_SEQ":1,"SET_SEQ":2,"PROD_I_NM":"아이스","QTY":1,"AMT":0,"VAT":0},{"ITEM_SEQ":1,"SET_SEQ":3,"PROD_I_NM":"샷추가","QTY":3,"AMT":1365,"VAT":135}]}]};
                                            const finalOrderData = [{"sale_status":"2","store_account":"504","good_use":"100","use_timea":"","use_timeaa":"","use_timeb":"","use_timebb":"","good_use1":"100","use_time1a":"","use_time1aa":"","use_time1b":"","use_time1bb":"","mem_idx":"2","index_no":"2","brand_idx":"1","prod_l1_cd":"111","prod_l2_cd":"","prod_gb":"09","gname_kr":"아메리카노","gname_en":"americano","gname_kr1":"","gname_jp":"アメリカーノ","gname_cn":"美式咖啡","wonsanji":"","wonsanji_en":"","wonsanji_jp":"","wonsanji_cn":"","howmany":"","cate_code":"111","account":"504","sal_tot_amt":"504","account_etc":null,"account_pur":"4500","sal_amt":"458","sal_vat":"46","vat_rate":"10","tax_sw":"1","gmemo":"","gmemo_en":"","gmemo_jp":"","gmemo_cn":"","related_goods":"","gimg_org":"ccccc.jpeg","gimg_chg":"http://zzigbbang.com/a_tablet/upload_file/goods/1735224026-nrwov.jpeg","gimg_thum":"http://zzigbbang.com/a_tablet/upload_file/goods/img_thumb/1735224026-nrwov.jpeg","spicy":"0","temp":"","colors":"","prod_cd":"900014","pos_yn":"N","kiosk_yn":"N","always":"N","recom_date":"","is_view":"Y","weight":"0","w_margin_error":"0","soldout":"N","is_new":"N","is_best":"N","is_popup":"N","is_use":"Y","is_on":"N","is_fav":"N","is_whipping":"N","is_stamp":"N","is_stamp_ok":"N","regDate":"2024-12-26 23:39:32","is_del":"N","total_sort":"1","delDate":null,"related":[],"option":[{"idx":"3","shop_idx":"2","shop_id":"3113810001","cate_code":null,"op_name":"시럽추가","op_name_en":"Syrup","op_name_jp":"シロップ","op_name_cn":"糖漿","op_price":"0","limit_count":"0","number":"0","op_use":"Y","prod_cd":"","gimg_org":"ccccc.jpeg","gimg_chg":"/a_tablet/upload_file/goods/1735224595-qtvdc.jpeg","op_del":"N","op_regDate":"2024-12-26 23:49:55","op_modDate":"2025-01-09 00:05:27","prod_i_cd":["2828","10012"]},{"idx":"2","shop_idx":"2","shop_id":"3113810001","cate_code":null,"op_name":"아메리카노 얼음","op_name_en":"","op_name_jp":"","op_name_cn":"","op_price":"0","limit_count":"1","number":"0","op_use":"Y","prod_cd":"","gimg_org":"ccccc.jpeg","gimg_chg":"/a_tablet/upload_file/goods/1735224320-xibtm.jpeg","op_del":"N","op_regDate":"2024-12-26 23:45:20","op_modDate":"2024-12-26 23:47:52","prod_i_cd":["4545","10003"]},{"idx":"1","shop_idx":"2","shop_id":"3113810001","cate_code":null,"op_name":"아메리카노 샷추가","op_name_en":"","op_name_jp":"","op_name_cn":"","op_price":"0","limit_count":"3","number":"0","op_use":"Y","prod_cd":"","gimg_org":"ccccc.jpeg","gimg_chg":"/a_tablet/upload_file/goods/1735224275-rdkvn.jpeg","op_del":"N","op_regDate":"2024-12-26 23:44:35","op_modDate":"2024-12-27 01:07:53","prod_i_cd":["78098","1111111"]}],"order_amt":1}]
                                            const payResultData = {"AnsCode":"0000","AnswerTrdNo":"null","AuNo":"28872915","AuthType":"null","BillNo":"","CardKind":"1","CardNo":"9411-9400-****-****","ChargeAmt":"null","DDCYn":"1","DisAmt":"null","EDCYn":"0","GiftAmt":"","InpCd":"1107","InpNm":"신한카드","Keydate":"","MchData":"wooriorder","MchNo":"22101257","Message":"마이신한P잔여 : 109                     ","Month":"00","OrdCd":"1107","OrdNm":"개인신용","PcCard":"null","PcCoupon":"null","PcKind":"null","PcPoint":"null","QrKind":"null","RefundAmt":"null","SvcAmt":"0","TaxAmt":"181","TaxFreeAmt":"0","TermID":"0710000900","TradeNo":"000004689679","TrdAmt":"1823","TrdDate":"240902182728","TrdType":"A15"};
                                            const SmartroPayResultData = {"service": "payment","type": "credit","persional-id": "01040618432","deal": "approval","total-amount": totalAmt+surtax,"surtax":surtax,"cat-id": "7109912041","business-no": "2118806806","device-name": "SMT-Q453","device-auth-info": "####SMT-Q453","device-auth-ver": "1201","device-serial": "S423050950","card-no": "94119400********","van-tran-seq": "240605215745","business-name": "주식회사 우리포스","business-owner-name": "김정엽","business-phone-no": "02  15664551","business-address": "인천 부평구 부평대로 337  (청천동) 제이타워3차지신산업센터 806,807호","display-msg": "정상승인거래r간편결제수단: 삼성페이승인","response-code": "00","approval-date": "240605","approval-time": "215744","issuer-info": "0300마이홈플러스신한","acquire-info": "0300신한카드사","merchant-no": "0105512446","approval-no": "37151483","receipt-msg": "정상승인거래r간편결제수단: 삼성페이승인","service-result": "0000"}

                                            const businessData = "{\"TrdDate\":\"250808105306\",\"HardwareKey\":\"133D34F060AFE2B\",\"Message\":\"정상처리\",\"BsnNo\":\"6645600780\",\"AnsCode\":\"0000\",\"ShpTel\":\"0215664551     \",\"MchData\":\"\",\"PtcInfo\":\"011OK 캐쉬백     020MyLGPoint     030바우처카드    040그린카드      050한마음의료    060Oh 포인트     070GB포인트      090과천 바로마켓 110LG보너스클럽  150파주농수산    160코엑스포인트  170바나나포인트  180Extrade       190코레일멤버쉽  200SC리워드      \",\"ShpNm\":\"에이치제이상사                          \",\"ShpAdr\":\"인천 부평구 부평대로 337 807호 일부(청천동, 부평제\",\"TermID\":\"1612417002\",\"TrdType\":\"D15\",\"AsNum\":\"1566-4551      \",\"PreNm\":\"김현정              \",\"PtcCnt\":\"15\"}";
                                            const adminStoreName = "테스트";
                                            const orderNo = "1-145";
                                            if(storage.getString("VAN") == VAN_KOCES) {
                                                Printer.Sam4sStartPrint(storage.getString("PRINT_PORT"), storage.getString("VAN"),JSON.stringify(orderFinalData), JSON.stringify(finalOrderData), JSON.stringify(payResultData), businessData, adminStoreName, orderNo);
                                            }else if(storage.getString("VAN") == VAN_SMARTRO) {
                                                Printer.Sam4sStartPrint(storage.getString("PRINT_PORT"), storage.getString("VAN"),JSON.stringify(orderFinalData), JSON.stringify(finalOrderData), JSON.stringify(SmartroPayResultData), businessData, adminStoreName, orderNo);
                                            }
                                            
                                            //Printer.OpenPrinter()
                                            //Printer.usbDeviceList();

                                     }} >
                                        <SettingButtonView>
                                            <SettingSectionTitle>프린트</SettingSectionTitle>
                                        </SettingButtonView>
                                    </TouchableWithoutFeedback>
                                </SettingSenctionInputView>
                            </SettingSectionDetailWrapper>
                        </SettingSectionWrapper>

                         
                       

                        
                        
                        {/* <SettingSectionWrapper>
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
                        </SettingSectionWrapper> */}
                        
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
                                    <SettingSectionLabel>- 대기시간 2분으로 수정 </SettingSectionLabel> 
                                    <SettingSectionLabel>- 옵션 품절 처리 </SettingSectionLabel> 
                                    <SettingSectionLabel>- 옵션 선택 금액 버그 수정 </SettingSectionLabel> 
                                    <SettingSectionLabel>- 스캔오류 3회시 팝업 </SettingSectionLabel> 
                                    {/* <SettingSectionLabel>- 동작 없을 시 메인 이동 버그 수정 </SettingSectionLabel> 
                                    <SettingSectionLabel>- 영수증 출력 팝업 사용 여부 세팅에 추가 (미사용 선택: 팝업 X, 사용 선택: 팝업 O, 미선택: 팝업 O) </SettingSectionLabel> 
                                    <SettingSectionLabel>- 빵스켄화면에서 대기화면 전환시 스캔빵 초기화 </SettingSectionLabel> */} 
                                </SettingSenctionInputViewColumn>
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 메뉴 상세설명 추가 </SettingSectionLabel> 
                                    <SettingSectionLabel>- 음료식사 주문 문구 수정</SettingSectionLabel> 
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 스캔화면 버튼 문구 수정</SettingSectionLabel> 
                                    <SettingSectionLabel>- 메뉴 사용 / 비사용 구분 적용</SettingSectionLabel> 
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 옵션선택 주문 오류 수정 테스트</SettingSectionLabel> 
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 진동벨 대기시간 줄임</SettingSectionLabel> 
                                    <SettingSectionLabel>- 결제하기기 버튼 깜빡임으로수정</SettingSectionLabel> 
                                    <SettingSectionLabel>- 스캔화면 확인 버튼위치 수정</SettingSectionLabel> 
                                    <SettingSectionLabel>- 배너화면 시작하기 버튼 하나로 수정</SettingSectionLabel> 
                                </SettingSenctionInputViewColumn> */}
                                {/* 
                                <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 스캔화면 점멸 / 화살표 안내 추가</SettingSectionLabel> 
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 날짜 지나면 주문번호 초기화</SettingSectionLabel> 
                                    <SettingSectionLabel>- 무게 오류 시 빵 리스트 수정</SettingSectionLabel> 
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 스캔 오류 화면 빵 리스팅 수정</SettingSectionLabel> 
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 쿠폰/포인트 버튼 회색 변경</SettingSectionLabel>
                                    <SettingSectionLabel>- 주문하기 문구 선택완료로 수정</SettingSectionLabel>
                                    <SettingSectionLabel>- 메뉴 상세 닫기 버튼 크기 수정</SettingSectionLabel>
                                    <SettingSectionLabel>- 스캔 실패시 곂침 상품 노출 수정</SettingSectionLabel>
                                    <SettingSectionLabel>- 진동벨 재할당 수정</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 확인가능한빵 리스트 수정</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                               {/*  <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 스마트로 결제 어드민 결제한 금액 안나오는 현상 수정</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 상세페이지 옵션금액 안바뀌는 버그 수정</SettingSectionLabel>
                                    <SettingSectionLabel>- 스캔 후 겹침 빵 리스트 노출</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 주방 프린트 주문번호 수정</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 스캔 오류 팝업 이미지 제거</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 진동벨 버그 수정</SettingSectionLabel>
                                    <SettingSectionLabel>- 장바구니 취소 버튼 버그 수정</SettingSectionLabel>
                                    <SettingSectionLabel>- 주문번호 형식 수정</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 진동벨 버그 수정</SettingSectionLabel>
                                    <SettingSectionLabel>- 진동벨 사용시 휴대전화번호 입력 안함</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 프린터 안되는 버그 수정</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 확인요청 빵 수정</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 오류 팝업 문구 줄바꿈 수정</SettingSectionLabel>
                                    <SettingSectionLabel>- 음료 선택 시 스크롤</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 결과에 none 포함 시 팝업 수정</SettingSectionLabel>
                                    <SettingSectionLabel>- 결과 오류 시 확인요청 빵 사이즈 조정 / 문구 추가</SettingSectionLabel>
                                    <SettingSectionLabel>- 음료 주문 내역 모두 삭제시 음료 개수 1로 남아 있는 버그 수정</SettingSectionLabel>
                                    <SettingSectionLabel>- 빵 / 음료 주문 리스트 위치 수정. 빵 주문 후 음료 주무시 스크롤 이동 확인</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 팝업 수정</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSectionDetailWrapper><SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 빵 카테고리 수정</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSectionDetailWrapper><SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 스캔 실패 문구 수정</SettingSectionLabel>
                                    <SettingSectionLabel>- 스캔실패 경우 수정</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSectionDetailWrapper><SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 셔터소리 안나는 버그 수정</SettingSectionLabel>
                                    <SettingSectionLabel>- 프린터 수정</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/* 16<SettingSectionDetailWrapper><SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 무게 측정중 문구 나오는 기준 수정</SettingSectionLabel>
                                    <SettingSectionLabel>- 스캔 실패시 빵 리스트 노출</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 저울 대기 시간 추가</SettingSectionLabel>
                                    <SettingSectionLabel>- 세팅화면 뒤로가기 버튼 크게 수정</SettingSectionLabel>
                                    <SettingSectionLabel>- 쟁반추가 후 리스트 순서 변경</SettingSectionLabel>
                                    <SettingSectionLabel>- 스캔 응답 로그 저장 추가</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                               {/*  <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 저울수정</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 진동벨 코너 여러개 테스트.</SettingSectionLabel>
                                    <SettingSectionLabel>- 진동벨 주문에 적용.</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 저울 포트 선택.</SettingSectionLabel>
                                    <SettingSectionLabel>- 무게 측정 대기화면 부터 시작.</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 세팅화면 뒤로가기시 선택화면으로 넘어가도록 수정.</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/* <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 진동벨 수정</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                               {/*  <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 메뉴 추가시 깜빡임 수정</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/*1.0.7 <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 매니지앱 호출 수정</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                                {/* 106<SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 스마트로 결제 영수증 수정</SettingSectionLabel>
                                    <SettingSectionLabel>- 스캔화면 측정무게 문구 수정</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                               {/*  <SettingSenctionInputViewColumn>
                                    <SettingSectionLabel>- 쟁반무게 입력 추가</SettingSectionLabel>
                                    <SettingSectionLabel>- 저울무게 수정 추가</SettingSectionLabel>
                                    <SettingSectionLabel>- 코세스 / 스마트로 결제 단말기 선택 추가</SettingSectionLabel>
                                </SettingSenctionInputViewColumn> */}
                            </SettingSectionDetailWrapper>
                        </SettingSectionWrapper>
                    </SettingWrapper>
                </KeyboardAvoidingView>
            </ScrollView>
        </>
    )
}
export default SettingScreen;