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
import { Alert, DeviceEventEmitter, NativeModules } from 'react-native';
import { InstallmentPopup } from '../screens/popups/installmentPopup';
import messaging from '@react-native-firebase/messaging';
import { initializeApp, setCommon } from '../store/common';
import { SCREEN_TIMEOUT } from '../resources/values';
import { extractNumbers, openAlert } from '../utils/common';
import BasicNonCancel from '../screens/popups/basicNonCancel';
import { isEmpty } from 'lodash'
import { CallAssistance } from '../components/callAssistance';
import { AlertPopup } from '../components/alertPopup';
import { PhonePopup } from '../components/phonePopup';
import { storage } from '../utils/localStorage';
import { FullAutoClosePopup } from '../components/fullAutoclosePopup';

const Stack = createStackNavigator()
var statusInterval;


export default function Navigation() {
    const navigate = useRef();
    const dispatch = useDispatch();
    const [isIndicatorShow, setIndicatorShow] = useState(false);
    const [isNonCancelShow, setIsNonCancelShow] = useState(false);
    const [nonCancelText, setNonCancelText] = useState("");
    const [spinnerText, setSpinnerText] = useState("");
    const [closeText, setCloseText] = useState("");
    const [spinnerType, setSpinnerType] = useState("");

    const { weight } = useSelector(state=>state.common);

    const handleEventListener = () => {
        //리스너 중복방지를 위해 한번 삭제
        //DeviceEventEmitter.removeAllListeners("onPending");
        //DeviceEventEmitter.removeAllListeners("onComplete");
        EventRegister.removeAllListeners("showSpinner");
        EventRegister.removeAllListeners("showAlert");
        EventRegister.removeAllListeners("goBack");
        EventRegister.removeAllListeners("nonCancelPopup");
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
            Alert.alert(
                data?.title,
                data?.str,
                [{
                    text:'확인',
                }]
            )
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
    }
    function onCloseSpinner() {
        if(spinnerType == "pay" || spinnerType == "payCancel") {
            smartroCancelService();
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
            initializeApp();
            console.log("result: ",result);
        })
    },[])

    return (
        <>  
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
                    <Stack.Screen
                       name='scan'
                       component={ScanScreen}
                       options={{title:"Scan Screen"}}
                    />
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
        </>
    )
}
