import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, DeviceEventEmitter, Dimensions, Image, NativeModules, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import RNFS from 'react-native-fs';
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer'
import { BottomButton } from '../components/commonComponents';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colorBlack, colorDarkGrey, colorGreen, colorGrey, colorLightGrey, colorPink, colorRed, colorWhite } from '../resources/colors';
import { apiRequest, callApiWithExceptionHandling, formRequest } from '../utils/apiRequest';
import { AI_QUERY, AI_SERVER } from '../resources/apiResources';
import { useDispatch, useSelector } from 'react-redux';
import { EventRegister } from 'react-native-event-listeners';
import { setMenu } from '../store/menu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartList, CartListItem } from '../components/mainComponents';
import { ButtonImage, ButtonText, ButtonView, SquareButtonView } from '../style/common';
import { ScanProductCheckWrapper, ScanProductList } from '../style/scanScreenStyle';
import {isEmpty} from 'lodash';
import { numberWithCommas, speak, trimBreadList, updateList } from '../utils/common';
import { getBanner, setAdShow, setCommon } from '../store/common';
import { SCREEN_TIMEOUT } from '../resources/values';
import { CartItemTitleText } from '../style/main';
import Sound from 'react-native-sound';
import Tts from 'react-native-tts';
import { initializeApp } from '@react-native-firebase/app';
import FastImage from 'react-native-fast-image';
import { styled } from 'styled-components';
import moment from "moment";
import MainScreen from './mainScreen';
import { setAlert } from '../store/alert';
import {  useCameraDevice, useCameraFormat, useCameraPermission } from 'react-native-vision-camera';


let timeoutSet = null;
const INIT = "init";
const ADD = "add";
const RESCAN = "rescan";
const screenWidth = Dimensions.get('window').width; // 전체 너비 가져오기
let weightCDInterval = null
let weightCountDown = 30;

const ScanScreen = () => {
    const { Weight } = NativeModules;
    const camera = useRef();
     
    const cameraOpacity = useRef(new Animated.Value(1)).current;
    const imageOpacity = useRef(new Animated.Value(0)).current;

    const device = useCameraDevice('back');
    const format = device?.formats.find(f => {
        const ratio = f.videoWidth / f.videoHeight;
        return Math.abs(ratio - (4 / 3)) < 0.01; // 3:4 비율에 가장 근접한 포맷 선택
    });
 
    const timer = useRef();
    const img = useRef();
    const navigate = useNavigation();
    const dispatch = useDispatch();

    const [isCountStart, setCountStart] = useState(false);
    const [scanType, setScanType] = useState("");
    const [rescanIndex, setRescanIndex] = useState();
    const [imgURL, setImgURL] = useState("");
    const [tmpBreadList, setTmpBreadList] = useState([]);
    const [totalBreadList, setTotalBreadList] = useState([]);
    const [price,setPrice] = useState(0);
    const [amt,setAmt] = useState(0);
    const [isMainShow, setMainShow] = useState(true);
    const [storeID, setStoreID] = useState("");

    const { items, orderList } = useSelector(state=>state.menu);
    const {strings,selectedLanguage, isAddShow, weight} = useSelector(state=>state.common);
    
    // 깜빡깜빡이는
    const opacity = useRef(new Animated.Value(1)).current;
    const colorAnim = useRef(new Animated.Value(0)).current;

    const BlinkingView = styled(Animated.View)`
        background-color: ${colorPink};
        height:100%;
        width:100%;
        borderRadius:10px;
        justifyContents:center;
        flex:1;
        position:absolute;
    `;
    const animatedColor = colorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colorPink, '#0000ff'], // 빨강 ↔ 파랑
    });

    useEffect(() => {
        if (imgURL !== "") {
          // 카메라 페이드아웃, 이미지 페이드인
          Animated.parallel([
            Animated.timing(cameraOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
            Animated.timing(imageOpacity, { toValue: 1, duration: 500, useNativeDriver: true })
          ]).start();
        } else {
          // 이미지 페이드아웃, 카메라 페이드인
          Animated.parallel([
            Animated.timing(cameraOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(imageOpacity, { toValue: 0, duration: 500, useNativeDriver: true })
          ]).start();
        }
      }, [imgURL]);
    
    useEffect(() => {
        // 2. 깜빡이는 애니메이션 루프 설정
        if(tmpBreadList.length>0 &&rescanIndex!=null){
            Animated.loop(
                Animated.sequence([
                    Animated.timing(opacity, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                    }),
                    Animated.timing(colorAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: false, // color 애니메이션은 false
                      }),
                      Animated.timing(colorAnim, {
                        toValue: 0,
                        duration: 500,
                        useNativeDriver: false,
                      }),
                ])
            ).start();
        }
    }, [tmpBreadList, rescanIndex]);

    useEffect(()=>{
        AsyncStorage.getItem("BREAD_STORE_ID")
        .then(result=>{
            setStoreID(result);
        })
    },[])
    
    function screenTimeOut(){
        clearInterval(timeoutSet);
        timeoutSet=null;
        timeoutSet = setInterval(()=>{
            console.log("screen time out");
            dispatch(getBanner());
            dispatch(setAdShow());
            clearTimeOut();
            navigate.goBack();
        },SCREEN_TIMEOUT)
    } 
    function clearTimeOut() {
        clearInterval(timeoutSet);
        timeoutSet=null;
    }

    useEffect(()=>{
        if(tmpBreadList.length>0) {
            setTotalBreadList(trimBreadList(tmpBreadList));
        }
    },[tmpBreadList])
    useEffect(()=>{
        var tmpAmt = 0;
        var tmpPrice = 0;
        for(var i=0;i<totalBreadList.length;i++) {
            const selItem = items.filter(el=>el.prod_cd == totalBreadList[i].prodCD);
            if(selItem.length>0) {
                tmpAmt += totalBreadList[i].amt
                tmpPrice += (totalBreadList[i].amt*(Number(selItem[0].sal_amt)+Number(selItem[0].sal_vat)));
            }
        }
        setAmt(numberWithCommas(tmpAmt));
        setPrice(numberWithCommas(tmpPrice));
    },[totalBreadList])

    function addToTmpList(addData) {
        var toSet = Object.assign([],tmpBreadList);
        if(scanType == ADD) {
            // 추가 스캔
            toSet.push(addData);
            setTmpBreadList(toSet);
        }else if(scanType == INIT) {
            // 초기화 스캔
            setTmpBreadList([addData]);
        }else if(scanType == RESCAN) {
            // 다시 스캔
            toSet[rescanIndex] = addData;
            setTmpBreadList(toSet);
        }else {

        }
    }

    function clearWeightInterval() {
        DeviceEventEmitter.removeAllListeners("onWeightChanged"); 
        //Weight.closeSerialConnection();
        clearInterval(weightCDInterval);
        weightCDInterval = null
        weightCountDown = 30;
    }
    
    async function startScan(scanWeight) {
        clearWeightInterval();
        if(typeof(scanWeight)!="number") {
            EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"스캔오류", str:"무게를 확인할 수 없습니다."});
            return;
        }
        if(scanWeight=="NaN") {
            EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"스캔오류", str:"무게를 확인할 수 없습니다."});
            return;
        }
        
        /* try {
            const breadStoreID = await AsyncStorage.getItem("BREAD_STORE_ID");
        } catch (err) {
            console.error("AsyncStorage 에러: ", err);
        }   */
        var breadStoreID = storeID;

        //var breadStoreID = "test";
        setImgURL("");

       console.log("breadStoreID: ",breadStoreID);
        
        try{
            console.log("capture",camera.current);
            const {uri} = await camera.current.capture();
            
            
            /* 
            console.log("uri: ",uri);
            if (uri.startsWith('file://')) {
                // Platform dependent, iOS & Android uses '/'
                const pathSplitter = '/';
                // file:///foo/bar.jpg => /foo/bar.jpg
                const filePath = uri.replace('file://', '');
                // /foo/bar.jpg => [foo, bar.jpg]
                const pathSegments = filePath.split(pathSplitter);
                // [foo, bar.jpg] => bar.jpg
                //const fileName = pathSegments[pathSegments.length - 1];
                //YY-MM-DD-hh-mm-ss-ms 파일 포멧
                const fileName = `${moment().format("YY-MM-DD-hh-mm-ss-ms")}.jpg`;
                await RNFS.moveFile(filePath, `${RNFS.DownloadDirectoryPath}/${fileName}`);
                //setSaveDir(`${RNFS.DownloadDirectoryPath}/${fileName}`);
                //uri = `file://${destFilePath}`;
                setCountStart(false);

                const formData = new FormData();
                formData.append("image", {uri: `file://${RNFS.DownloadDirectoryPath}/${fileName}`,name:`${fileName}`, filename:`${fileName}`, type: "image/*"} );
                formData.append("store_name", breadStoreID);
                formData.append("input_weight", scanWeight);
                //formData.append("input_weight", 0.03);
                console.log("foramdata: ",formData);
                const aiResult = await formRequest(dispatch,`${AI_SERVER}${AI_QUERY}`, formData );
                console.log("aiResult: ",aiResult);

                if(aiResult instanceof Error) {
                    EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""})
                    EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"스캔오류", str:aiResult.message});
                    DeviceEventEmitter.removeAllListeners("onWeightChanged");
     
                    //const breadOrderList = [{prodCD:900040, option:[], amt:1}, {prodCD:900041, option:[], amt:1}];
                    //addToTmpList(breadOrderList)
                    return;
                }
                const data = aiResult.data;
                console.log("aiResult data: ",data);
                //RNFS.unlink(`${RNFS.DownloadDirectoryPath}/${fileName}`);
                if(isEmpty(data.item_counts)) {
                    setImgURL(``)
                    EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""})
                    EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"스캔오류", str:"스캔할 수 있는 빵이 없습니다."});
                    //setRescanIndex();
                    //const breadOrderList = [{prodCD:900040, option:[], amt:3}, {prodCD:900041, option:[], amt:3}];
                    //addToTmpList(breadOrderList)
                    DeviceEventEmitter.removeAllListeners("onWeightChanged");
                    return;
                }else {
                    if(data.within_tolerance == false) {
                        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""})
                        //EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"스캔오류", str:"스캔이 잘 될수있도록 가져오신 상품을 쟁반안에 넣어주세요. 빵이 겹치지 않은지 확인해주세요."});
                        dispatch(setAlert(
                            {
                                title:"테스트",
                                msg:"스캔이 잘 될 수 있도록\n가져오신 상품을 쟁반에\n넣어주세요.",
                                subMsg:"빵이 겹치치 않은지 확인해 주세요!",
                                okText:'닫기',
                                cancelText:'',
                                isCancle:false,
                                isOK:true,
                                icon:"",   
                                isAlertOpen:true,
                                clickType:"",
                            }
                        ));
                        const sound = new Sound("z004.wav", null, (error) => {
                            if (error) {
                                console.log('오디오 로드 실패', error);
                                return;
                            }
                            sound.play((success) => {
                                if (success) {
                                    console.log('재생 성공');
                                } else {
                                    console.log('재생 실패');
                                }
                            });
                        });
                        //speak(selectedLanguage, strings["무게오류"][selectedLanguage]);
                        DeviceEventEmitter.removeAllListeners("onWeightChanged");
                        return;
                    }
    
                    setImgURL(`${AI_SERVER}${data.detected_image_path}`)
                    RNFS.unlink(`${RNFS.DownloadDirectoryPath}/${fileName}`);
                    const itemData = data.item_counts;
                    const keys = Object.keys(itemData);
                    var breadOrderList = [];
                    for(const bread of keys) {
                        console.log("bread: ",bread);
                        const itemCheck = items.filter(el=>{return el.prod_cd == bread});
                        if(itemCheck.length<=0) {
                            break;
                        }
                        const orderItem = {prodCD:bread, option:[], amt:itemData[bread]};
                        breadOrderList.push(orderItem);
                    }
                    EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""})
                    if(keys.length == breadOrderList.length) {
                        setRescanIndex(); 
                        //const finalBreadList = updateList(tmpBreadList, breadOrderList)
                        //console.log("finalBreadList: ",finalBreadList);
                        //setTmpBreadList([...finalBreadList]);

                        //const breadOrderList = [{prodCD:900040, option:[], amt:1}, {prodCD:900041, option:[], amt:1}];
                        addToTmpList(breadOrderList)
                        if(tmpBreadList.length<=0) {
                            //speak(selectedLanguage, strings["추가스캔안내"][selectedLanguage]);
                        }else {
                            //speak(selectedLanguage, strings["추가스캔확인"][selectedLanguage]);
                        }
                      
                        DeviceEventEmitter.removeAllListeners("onWeightChanged");

                    }else {
                        DeviceEventEmitter.removeAllListeners("onWeightChanged");
                        EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"스캔오류", str:"등록되지 않은 빵입니다."});
                    }
                }
            }else {
                DeviceEventEmitter.removeAllListeners("onWeightChanged");
                EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""})
                EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"스캔오류", str:"이미지를 저장할 수 없습니다."});
                return;
            } */
        }catch(err) {
            console.log("err: ",err);
            DeviceEventEmitter.removeAllListeners("onWeightChanged");
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""})
            EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"스캔오류", str:err.errorMsg});
            setCountStart(false);
            //const breadOrderList = [{prodCD:900040, option:[], amt:1}, {prodCD:900041, option:[], amt:1}];
            //addToTmpList(breadOrderList)
            return;
        }
    }

    function selectPlate(index) {
        //setImgURL(""); 
        //setScanType(RESCAN); 
        //setCountStart(true); 
        console.log("index: ",index," recanIndex: ",rescanIndex);
        if(index == rescanIndex) {
            setRescanIndex();
        }else {
            setRescanIndex(index);
        }
    }

    const BreadTmpCartList = () =>{

        return(
            <>
                <View style={{padding:10}} pointerEvents='box-none' >
                    {
                        tmpBreadList.map((el,index) => {

                            return(
                                <>
                                    <View style={{ flex:1, marginTop:7,gap:10, borderColor:colorDarkGrey, backgroundColor:colorLightGrey, borderWidth:1, padding:4, borderRadius:10}} >
                                        <TouchableWithoutFeedback onPress={()=>{ selectPlate(index); }} >
                                            <ScanProductCheckWrapper>
                                                {index != rescanIndex &&
                                                    <FastImage resizeMode={FastImage.resizeMode.contain} source={require("../resources/imgs/drawable-xxxhdpi/checked.png")} style={{width:34,height:34}} />
                                                }
                                                {index == rescanIndex &&
                                                    <FastImage resizeMode={FastImage.resizeMode.contain} source={require("../resources/imgs/drawable-xxxhdpi/check_red.png")} style={{width:34,height:34}} />
                                                }
                                            </ScanProductCheckWrapper>
                                        </TouchableWithoutFeedback>
                                        {
                                            el.map(item=>{
                                                return(
                                                    <>
                                                        {
                                                            <CartListItem isImageUse={false} data={item} isCancelUse={false} onCancelPress={()=>{ }}  />
                                                        }
                                                    </>
                                                )
                                            })
                                        }              
                                    </View>
                                </>
                            )
                        })
                    }
                </View>
            </>
        )

    }

    function initCamera() {
        setImgURL("");
    }

    return(
        <>
        <View style={{width:'100%', height:'100%', flexDirection:'row'}} onTouchStart={()=>{ /* screenTimeOut(); */ }} >
            <View style={{flex:1,}}>
                {/* <Camera
                    style={{width:'100%',height:'100%', flex:1}}
                    ref={camera}
                    flashMode="off"
                    focusMode="off"
                    zoomMode="off"
                    torchMode="off"
                    scanBarcode={false}
                    showFrame={false}
                    cameraType={CameraType.Back} // front/back(default)
                    onError={()=>{console.log("error fail");}}
                /> */}
                <Animated.View style={{ flex: 1, opacity: cameraOpacity }}>

                    <Camera
                        ref={camera}
                        style={{flex:1, aspectRatio: 4 / 3}}
                        device={device}
                        format={format}
                        isActive={true}
                        resizeMode='contain'
                    />
                </Animated.View>
                <Animated.View style={{ 
                    width: '100%', 
                    height: '100%', 
                    backgroundColor: colorBlack, 
                    position: 'absolute', 
                    opacity: imageOpacity 
                }}>

                    {imgURL!="" &&
                        <Image style={{width:'100%', height:'100%', backgroundColor:colorBlack, position:'absolute'}} resizeMode='contain' source={{uri:imgURL}} />
                    }
                </Animated.View>

            </View>
            <View style={{flex:0.343}} >

                <View style={{flex:1, backgroundColor:'yellow', backgroundColor:imgURL==""?"transparent":colorLightGrey }} >
                    <ScrollView style={{marginTop:10, marginLeft:10,marginRight:10, paddingBottom:140, width:530, height:'68%', position:'absolute', zIndex:99, backgroundColor:colorLightGrey }} keyboardShouldPersistTaps={"handled"} flexGrow={1} contentContainerStyle={{ flexGrow: 1 }} >
                        {tmpBreadList.length > 0 &&
                            <BreadTmpCartList/>
                        }
                    </ScrollView>
                    <View style={{ marginLeft:10,marginRight:10, padding:10, backgroundColor:colorPink, width:480, height:100, bottom:240, position:'absolute', zIndex:9999999, }} >                
                        <View style={{flexDirection:'row'}} >
                            <CartItemTitleText style={{fontSize:30,flex:1}} >{`총 수량`}</CartItemTitleText>
                            <CartItemTitleText style={{fontSize:30,flex:1,textAlign:'right'}} >{`${amt}`}</CartItemTitleText>
                        </View>
                        <View style={{flexDirection:'row'}} >
                            <CartItemTitleText style={{fontSize:30,flex:1}} >{`총 금액`}</CartItemTitleText>
                            <CartItemTitleText style={{fontSize:30,flex:1,textAlign:'right'}} >{`${price+strings["원"][`${selectedLanguage}`]}`}</CartItemTitleText>
                        </View>
                    </View>
                </View>
            
            
                
                <View style={{position:'absolute', zIndex:9999999, right:0, bottom:35, right:10}}>
                    <TouchableWithoutFeedback onPress={()=>{ console.log("ok-=-==-=-=-"); setMainShow(true); dispatch(setCommon({isAddShow:false})); dispatch(setMenu({breadOrderList:totalBreadList}));setMainShow(true);initCamera(); clearWeightInterval(); DeviceEventEmitter.removeAllListeners("onWeightChanged"); /* navigate.navigate("main"); */ }} >
                        <SquareButtonView backgroundColor={colorDarkGrey} >
                            <ButtonText>{strings["키오스크\n바로주문"][`${selectedLanguage}`]}</ButtonText>
                        </SquareButtonView>
                    </TouchableWithoutFeedback>
                </View>
                <View style={{position:'absolute', zIndex:9999999, right:250, bottom:35,}}>
                    <TouchableWithoutFeedback 
                        onPress={()=>{ 
                            //EventRegister.emit("showSpinner",{isSpinnerShow:true, msg:"스캔 중 입니다.", spinnerType:"",closeText:""})
                            setImgURL("");
                            if(rescanIndex == null) {
                                setScanType(ADD);
                            }else {
                                setScanType(RESCAN); 
                            }
                            //startScan("")
                             
                            async function startMeasuring() {
                                const prodID = await AsyncStorage.getItem("weightProductID");
                                const vendorID = await AsyncStorage.getItem("weightVendorID");
                                const portNo = await AsyncStorage.getItem("weightPortNumber");
                                console.log("connect: ",portNo);
                                Weight.connectDevice(Number(portNo));
                            }
                            startMeasuring();
                            weightCDInterval = setInterval(() => {
                                if(weightCountDown <= 0) {
                                    clearWeightInterval();
                                    DeviceEventEmitter.removeAllListeners("onWeightChanged");
                                    EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"스캔오류", str:"쟁반을 올려주세요."});
                                    EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""})
                                }else {
                                    weightCountDown = weightCountDown-1;
                                }
                                
                            }, 1000);
                            //startScan(0.2);
                            
                            DeviceEventEmitter.removeAllListeners("onWeightChanged"); 
                            DeviceEventEmitter.addListener("onWeightChanged",(data)=>{    
                                const result = data?.weight.replace(/[^0-9.]/g, ""); // 숫자와 소숫점 제외 모든 문자 제거
                                const weight = parseFloat(result);
                                console.log("weight: ",weight);
                                if(Number(weight)>0) {
                                    console.log("start scan");
                                    startScan(weight)
                                    //dispatch(setCommon({weight:weight}))
                                    
                                }
                            });  
                            //startScan(1);
                            const sound = new Sound('z004.wav', Sound.MAIN_BUNDLE, (error) => {
                                if (error) {
                                    console.log('오디오 로드 실패', error);
                                    return;
                                }
                                sound.play((success) => {
                                    if (success) {
                                        console.log('재생 성공');
                                    } else {
                                        console.log('재생 실패');
                                    }
                                });
                                // 재생                            
                            });
                            

                        }} 
                    >
                        <SquareButtonView backgroundColor={colorRed}  >
                            {tmpBreadList.length>0 &&rescanIndex==null &&
                                <ButtonText>{strings["쟁반추가"][`${selectedLanguage}`]}</ButtonText>
                            }
                            {(tmpBreadList.length>0 &&rescanIndex!=null) &&
                                <>
                                    <BlinkingView style={{opacity}}/>
                                    <ButtonText style={{margin:'auto',animatedColor}} >{strings["다시스캔"][`${selectedLanguage}`]}</ButtonText>
                                </>
                            }
                            {tmpBreadList.length<=0 &&
                                <ButtonText>{strings["스캔하기"][`${selectedLanguage}`]}</ButtonText>
                            }
                        </SquareButtonView>
                    </TouchableWithoutFeedback>
                </View>
            </View>
        </View>
        {isMainShow&&
            <View style={{width:'100%',height:'100%',position:'absolute'}}>
                <MainScreen setMainShow={setMainShow}/>
            </View>
        }
        </>
    )
}
export default ScanScreen;