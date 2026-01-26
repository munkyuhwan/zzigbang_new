import React, { useCallback, useEffect, useRef, useState } from 'react'
import { NavigationContainer, useFocusEffect, useNavigation } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import MainScreen from '../screens/mainScreen';
import { useDispatch, useSelector } from 'react-redux';
import ScanScreen from '../screens/scanScreen';
import SettingScreen from '../screens/settingScreen';
import PopupIndicator from '../screens/popups/popupIndicator';
import { EventRegister } from 'react-native-event-listeners';
import { smartroCancelService } from '../utils/smartro';
import { Alert, DeviceEventEmitter, NativeEventEmitter, NativeModules, TextInput, View } from 'react-native';
import { InstallmentPopup } from '../screens/popups/installmentPopup';
import messaging from '@react-native-firebase/messaging';
import { dispatchShowAlert, getBanner, initializeApp, setAdShow, setCommon } from '../store/common';
import { POPUP_TIMEOUT_, SCREEN_TIMEOUT } from '../resources/values';
import { barcodeChecker, extractNumbers, openAlert } from '../utils/common';
import BasicNonCancel from '../screens/popups/basicNonCancel';
import { isEmpty } from 'lodash'
import { CallAssistance } from '../components/callAssistance';
import { AlertPopup } from '../components/alertPopup';
import { PhonePopup } from '../components/phonePopup';
import { storage } from '../utils/localStorage';
import { FullAutoClosePopup } from '../components/fullAutoclosePopup';
import { KocesAppPay } from '../utils/kocess';
import { setAlert } from '../store/alert';
import { VAN_KOCES, VAN_SMARTRO } from '../utils/apiRequest';
import { setMenu } from '../store/menu';

const Stack = createStackNavigator()
var statusInterval;
let timeoutSet = null;
let popupTimeoutSet = null;
//var popupTimeoutSec = 30;


export default function Navigation() {
    const navigate = useRef();
    const dispatch = useDispatch();
    let keyEvent = new NativeEventEmitter(NativeModules.MyEvent);

    const [isIndicatorShow, setIndicatorShow] = useState(false);
    const [isNonCancelShow, setIsNonCancelShow] = useState(false);
    const [nonCancelText, setNonCancelText] = useState("");
    const [spinnerText, setSpinnerText] = useState("");
    const [closeText, setCloseText] = useState("");
    const [spinnerType, setSpinnerType] = useState("");
 
    const [isMainShow, setMainShow] = useState(true);

    const {isAddShow,scanErrorCnt} = useSelector(state=>state.common);

    const isAddShowRef = useRef(false);
    const isScanError = useRef(false);


    const handleEventListener = () => {
        //리스너 중복방지를 위해 한번 삭제
        //DeviceEventEmitter.removeAllListeners("onPending");
        //DeviceEventEmitter.removeAllListeners("onComplete");
        EventRegister.removeAllListeners("showSpinner");
        EventRegister.removeAllListeners("showAlert");
        EventRegister.removeAllListeners("goBack");
        EventRegister.removeAllListeners("nonCancelPopup");
        keyEvent.removeAllListeners("onMyKeyPressed");
        /* DeviceEventEmitter.removeAllListeners("onWeightChanged");
        //EventRegister.removeAllListeners("showSpinnerNonCancel");
        DeviceEventEmitter.addListener("onWeightChanged",(data)=>{    
            const result = data?.weight.replace(/[^0-9.]/g, ""); // 숫자와 소숫점 제외 모든 문자 제거
            console.log();
            dispatch(setCommon({weight:parseFloat(result)}))
        });  */

        EventRegister.addEventListener("showSpinner",(data)=>{       
            if(data?.isSpinnerShow) { 
                setIndicatorShow(true);
                setSpinnerText(data?.msg)
                setSpinnerType(data?.spinnerType)
                setCloseText(data?.closeText);
            }else {
                setIndicatorShow(false);
                setSpinnerText("");
                setSpinnerText()

            }
        })
        EventRegister.addEventListener("showAlert",(data)=>{     
            /* Alert.alert(
                data?.title,
                data?.str,
                [{
                    text:'확인',
                }]
            ) */
            dispatch(setAlert(
                {
                    title:"테스트",
                    msg:data?.title,
                    subMsg:data?.str,
                    okText:'닫기',
                    cancelText:'',
                    isCancle:false,
                    isOK:true,
                    icon:"",   
                    isAlertOpen:true,
                    clickType:"",
                }
            ));
        })
        EventRegister.addEventListener("goBack",(data)=>{   
            if(navigate.current) {
                navigate.current.goBack();
            }    
        })
        EventRegister.addEventListener("nonCancelPopup",(data)=>{   
            setIsNonCancelShow(data.text);
            setIsNonCancelShow(data.isShow);
    
        })
        keyEvent.addListener("onMyKeyPressed",(ev)=>{
            console.log("ev.pressedKey: ",ev.pressedKey)
            if(ev.pressedKey) {
                const barcode = ev.pressedKey;
                barcodeChecker(barcode)
                .then(result=>{
                    console.log("result: ",result)
                    if(result?.result) {
                        dispatch(setCommon({isMaster:true}));
                    }
                })
            }
        })
    }
    function onCloseSpinner() {
        if(spinnerType == "pay" || spinnerType == "payCancel") {
            if(storage.getString("VAN")==VAN_SMARTRO) {
                smartroCancelService();
            }
        }
        else if(setSpinnerType=="searchReceipt") {

        }
    }

    async function initializeFcm() {
        const prevStoreID = storage.getString("STORE_IDX");
        if(prevStoreID){      
            try{
               await messaging().unsubscribeFromTopic(`${prevStoreID}`);
            }catch(err){
                
            }
            try {
                await messaging().subscribeToTopic(`${prevStoreID}`)
            }catch(err){
            }
        }
    }
    function onOkClick() {
        console.log("onOkClick ========================");
    } 
    useEffect(()=>{
        screenTimeOut()
        // 저울 스타트
        async function startConnect () {
            const productId = storage.getString("weightProductID");
            const vendorId = storage.getString("weightVendorID");   
            if(!isEmpty(productId) && !isEmpty(vendorId)) {
                console.log("connect");          
                const {Weight} = NativeModules;
                Weight.startWeighing(Number(vendorId), Number(productId));
            }
        }
        startConnect();
        initializeFcm();
        handleEventListener();

        /* 
        messaging().getToken()
        .then((result)=>{
            console.log("result: ");
            console.log("messaging().getToken: ",result);
        })
        .catch((err)=>{
            console.log("err: ",err)
        })
         */
        messaging().onMessage((result)=>{
            console.log("on message====================");
            dispatch(initializeApp());
            console.log("result: ",result);
        })

        if(isEmpty(storage.getString("STORE_INFO"))) {
            if(storage.getString("VAN")==VAN_KOCES){
                var kocessAppPay = new KocesAppPay();
                kocessAppPay.storeDownload()
                .then(storeDownload=>{
                    console.log("storeDownload: ",storeDownload);
                    storage.set("STORE_INFO",JSON.stringify(storeDownload));
                })
                .catch(err=>{
                });

            }else if(storage.getString("VAN")==VAN_SMARTRO) {
                
            }
        }
        /* keyEvent.removeAllListeners("onMyKeyBackPressed");
        keyEvent.addListener("onMyKeyBackPressed",(ev)=>{
            console.log("ev: ",ev.pressedKey)
        }) */

    },[])

    useEffect(()=>{
        console.log("useeffect isAddShow: ",isAddShow)
        isAddShowRef.current = isAddShow;
    },[isAddShow])

    useEffect(()=>{
        console.log("useeffect scanErrorCnt: ",scanErrorCnt)
        isScanError.current = scanErrorCnt>=3;
    },[scanErrorCnt])

    const {barcodeText, setBarcodeText} = useState("");
    function screenTimeOut(){
        clearInterval(timeoutSet);
        timeoutSet=null;
        var popupTimeoutSec=SCREEN_TIMEOUT;
/* 
        clearInterval(popupTimeoutSet);
        popupTimeoutSet=null;
        popupTimeoutSec=15;

 */
        timeoutSet = setInterval(()=>{
            popupTimeoutSec = popupTimeoutSec-1;
            if(popupTimeoutSec<=15 && popupTimeoutSec>0){
                //dispatch(setAlert({"isAlertOpen":true, clickType:"", subMsg:"",imageArr:[]}));
                //console.log("isAddShow: ",isAddShow);
                if(isAddShowRef.current==false && isScanError.current==false) {
                    dispatch(dispatchShowAlert({title:"알림", msg:"동작이 없어 주문을 중단합니다. 중단 하시겠습니까?"+"("+popupTimeoutSec+"초)", 
                            okFunction: ()=>{ 
                                clearInterval(popupTimeoutSet);
                                popupTimeoutSet=null;
                                popupTimeoutSec=SCREEN_TIMEOUT;
                                dispatch(setAlert({"isAlertOpen":false, clickType:"ok", subMsg:"",imageArr:[]}));
                            }, 
                            cancelFunction:()=>{
                                clearInterval(popupTimeoutSet);
                                popupTimeoutSet=null;
                                popupTimeoutSec=SCREEN_TIMEOUT;
                                dispatch(setAlert({"isAlertOpen":false, clickType:"cancel", subMsg:"",imageArr:[]}));
                            },
                            isCancle:false                
                        })
                    );
                }
            }else if(popupTimeoutSec<=0) {
                if(isScanError.current==false) {
                    dispatch(setMenu({
                        selectedItems:[],
                        detailItem:{},
                        isProcessing:false,
                        orderList:[],
                        breadOrderList:[],
                        isPayStarted:false,
                        payResultData:{}
                    }));
                    //setAdShow(true);
                    dispatch(getBanner());
                    dispatch(setAdShow());
                    setMainShow(true);
                    
                    clearInterval(popupTimeoutSet);
                    popupTimeoutSet=null;
                    popupTimeoutSec=SCREEN_TIMEOUT;
                    dispatch(setAlert({"isAlertOpen":false, clickType:"", subMsg:"",imageArr:[]}));
                    screenTimeOut();
                }
            
            }

        },POPUP_TIMEOUT_)


        /* timeoutSet = setTimeout(()=>{
            console.log("timeout!!!");
           
            popupTimeoutSet = setInterval(async()=>{
                console.log("show timeout popup");
                

                dispatch(dispatchShowAlert({title:"알림", msg:"동작이 없어 주문을 중단합니다. 중단 하시겠습니까?"+"("+popupTimeoutSec+"초)", 
                    okFunction: ()=>{ 
                        console.log("popop ok btn clicked");
                        clearInterval(popupTimeoutSet);
                        popupTimeoutSet=null;
                        popupTimeoutSec=15;
                        dispatch(setAlert({"isAlertOpen":false, clickType:"", subMsg:"",imageArr:[]}));
                    }, 
                    cancelFunction:()=>{
                        clearInterval(popupTimeoutSet);
                        popupTimeoutSet=null;
                        popupTimeoutSec=15;
                        dispatch(setAlert({"isAlertOpen":false, clickType:"", subMsg:"",imageArr:[]}));
                    },
                    isCancle:false                
                })
                );
                //EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"동작이 없어 주문을 중단합니다. 중단 하시겠습니까?"+"("+popupTimeoutSec+"초)", str:"",isCancle:false});
                if(popupTimeoutSec<=0) {
                    console.log("clear popup");
                    await dispatch(setMenu({
                        selectedItems:[],
                        detailItem:{},
                        isProcessing:false,
                        orderList:[],
                        breadOrderList:[],
                        isPayStarted:false,
                        payResultData:{}
                    }));
                    //setAdShow(true);
                    dispatch(getBanner());
                    dispatch(setAdShow());
                    setMainShow(true);
                    
                    clearInterval(popupTimeoutSet);
                    popupTimeoutSet=null;
                    popupTimeoutSec=15;
                    dispatch(setAlert({"isAlertOpen":false, clickType:"", subMsg:"",imageArr:[]}));
                    screenTimeOut();
                }
                popupTimeoutSec--;  
 
            },POPUP_TIMEOUT_)

        },SCREEN_TIMEOUT) */

    } 
    return (
        <>  
        <View style={{width:'100%',height:'100%'}} onTouchStart={()=>{ screenTimeOut(); }}  >

            {/* <TextInput value={barcodeText} onChangeText={(val)=>{setBarcodeText(val)}} style={{width:200, height:100, backgroundColor:'red',color:'white' }} /> */}
            {isIndicatorShow &&
                <PopupIndicator text={spinnerText} setText={setSpinnerText} closeText={closeText} setCloseText={setCloseText} onClosePress={()=>{  setCloseText(""); setSpinnerText(""); setIndicatorShow(""); onCloseSpinner(); }}/>
            }
            <FullAutoClosePopup/>
            <NavigationContainer
                ref={navigate}   
            >
                <Stack.Navigator
                    initialRouteName='scan'
                    screenOptions={{
                        gestureEnabled: true,
                        headerShown: false,
                    }}
                >
                    <Stack.Screen
                        name='main'
                        component={MainScreen}
                        options={{title:"Main Screen"}}
                    />
                    {/* <Stack.Screen
                       name='scan'
                       component={ScanScreen}
                       options={{title:"Scan Screen"}}
                    /> */}
                    <Stack.Screen name="scan" options={{ title: "Scan Screen" }}>
                        {(props) => (
                            <ScanScreen
                            {...props}
                            isMainShow={isMainShow}
                            setMainShow={setMainShow}
                            />
                        )}
                    </Stack.Screen>
                   <Stack.Screen
                      name='setting'
                      component={SettingScreen}
                      options={{title:"Scan Screen"}}
                  />
                </Stack.Navigator>
            </NavigationContainer>

            <AlertPopup/>
            {/* <CallAssistance/> */}
            <PhonePopup/>
            <BasicNonCancel isShow={isNonCancelShow} text={nonCancelText} />
        </View>
        </>
    )
}
