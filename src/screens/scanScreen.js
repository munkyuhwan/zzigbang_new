import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, AppState, DeviceEventEmitter, Dimensions, Image, NativeModules, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import RNFS from 'react-native-fs';
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer'
import { BottomButton } from '../components/commonComponents';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colorBlack, colorDarkGrey, colorGreen, colorGrey, colorLightGrey, colorPink, colorRed, colorWhite, colorYellow } from '../resources/colors';
import { apiRequest, callApiWithExceptionHandling, formRequest } from '../utils/apiRequest';
import { AI_QUERY, AI_SERVER } from '../resources/apiResources';
import { useDispatch, useSelector } from 'react-redux';
import { EventRegister } from 'react-native-event-listeners';
import { setMenu } from '../store/menu';
import { CartList, CartListItem, ScannListItem } from '../components/mainComponents';
import { ButtonImage, ButtonText, ButtonView, SquareButtonView } from '../style/common';
import { RescanText, RescanView, ScanProductCheckWrapper, ScanProductList } from '../style/scanScreenStyle';
import {isEmpty} from 'lodash';
import { findWeightCombinations, getGimgChgByCandidates, getOptimizedWeightCombinations, getTopFive, getTopWeightMatches, numberPad, numberWithCommas, parseValue, postPayLog, speak, trimBreadList, updateList } from '../utils/common';
import { dispatchShowAlert, getBanner, setAdShow, setCommon } from '../store/common';
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
import { storage } from '../utils/localStorage';


let timeoutSet = null;
const INIT = "init";
const ADD = "add";
const RESCAN = "rescan";
const screenWidth = Dimensions.get('window').width; // 전체 너비 가져오기
let weightCDInterval = null
let weightCountDown = 30;

var startTime = 0;
var endTime = 0;
var duration = 0;
var mostFrequentWeight = 0;
const MAX_SIZE = 20;
const sound = new Sound("shutter.wav", null, (error) => {
    if (error) {
        console.log('오디오 로드 실패', error);
        return;
    }
    
});
const ScanScreen = (props) => {
    const [appState, setAppState] = useState(AppState.currentState);
    const { Weight } = NativeModules;
    const camera = useRef();
    const mainRef = useRef();
    const sumRef = useRef(0);
    const countRef = useRef(0);
    const averageRef = useRef(0);
    const weightArr = useRef(Array(MAX_SIZE).fill(null));
     
    const [isScanning, setScanning] = useState(false);
    const cameraOpacity = useRef(new Animated.Value(1)).current;
    const imageOpacity = useRef(new Animated.Value(0)).current;
    const scanBtnOpacity = useRef(new Animated.Value(1)).current; // 초기값: 보임

    const { getCameraPermissionStatus, requestPermission } = useCameraPermission()

    useEffect(()=>{
        requestPermission();
    },[])
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
    const [scanType, setScanType] = useState(INIT);
    const [rescanIndex, setRescanIndex] = useState();
    const [imgURL, setImgURL] = useState("");
    const [tmpBreadList, setTmpBreadList] = useState([]);
    const [totalBreadList, setTotalBreadList] = useState([]);
    const [price,setPrice] = useState(0);
    const [amt,setAmt] = useState(0);
    //const [isMainShow, setMainShow] = useState(true);
    const [storeID, setStoreID] = useState("");
    const [currentWeight, setCurrentWeight] = useState(0);
    const [scannedWeight, setScannedWeight] = useState("0");
    const [isWeightStable, setWeightStable] = useState("0");

    //const [weightArr, setWeightArr] = useState(Array(MAX_SIZE).fill(null));
    const indexRef = useRef(0);

    const { items, orderList } = useSelector(state=>state.menu);
    const {strings,selectedLanguage, isAddShow, weight, scanErrorCnt} = useSelector(state=>state.common);
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

    function getMostFrequent(arr) {
        const freqMap = {};
        let maxCount = 0;
        let mode = null;
      
        arr.forEach((val) => {
          if (val !== null) {
            freqMap[val] = (freqMap[val] || 0) + 1;
            if (freqMap[val] > maxCount) {
              maxCount = freqMap[val];
              mode = val;
            }
          }
        });
        return mode;
    }

  /*   useEffect(()=>{
        mostFrequentWeight = getMostFrequent(weightArr);
    },[weightArr])
       */

    useEffect(()=>{
        console.log("scanErrorCnt: ",scanErrorCnt)
        if(scanErrorCnt >=3) {
            EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"스캔오류", str:"직원을 호출 해 주세요."});
            dispatch(dispatchShowAlert({title:"스캔오류", msg:"직원을 호출 해 주세요.", 
            okFunction: ()=>{ 
                dispatch(setCommon({scanErrorCnt:0}));
                dispatch(setAlert({"isAlertOpen":false, clickType:"ok", subMsg:"",imageArr:[]}));
            }, 
            cancelFunction:()=>{
              
            },
            isCancle:false                
        })
    );
        }
    },[scanErrorCnt])
    useEffect(() => {
        const subscription = AppState.addEventListener("change", (nextAppState) => {
          if (
            appState.match(/inactive|background/) &&
            nextAppState === "active"
          ) {
            console.log("✅ 앱이 백그라운드에서 포그라운드로 돌아왔습니다!");
            // 👉 여기서 API 재호출, 토큰 갱신, 화면 새로고침 등을 처리하면 됩니다.
            DeviceEventEmitter.removeAllListeners("onWeightChanged"); 
            Weight.closeSerialConnection();
            Weight.connectDevice(storage.getString("weightPortNumber")); 
            startWeighting();
        }
    
          setAppState(nextAppState);
        });
        /* screenTimeOut() */
        return () => {
          subscription.remove();
        };
    }, [appState]);
    const isStableWeight = (arr, thresholdPercent = 0.9, tolerance = 2.0) => {
        if (!arr || arr.length === 0) return false;
      
        // null, undefined 제거
        const filtered = arr.filter(v => v !== null && v !== undefined);
        if (filtered.length === 0) return false;
      
        let maxCount = 0;
      
        // 각 값마다 비슷한 값들 카운트
        for (let i = 0; i < filtered.length; i++) {
          let count = 0;
          for (let j = 0; j < filtered.length; j++) {
            if (Math.abs(filtered[i] - filtered[j]) <= tolerance) {
              count++;
            }
          }
          if (count > maxCount) maxCount = count;
        }
      
        const ratio = maxCount / filtered.length;
        return ratio >= thresholdPercent;
    };
      
    function startWeighting() {
        DeviceEventEmitter.addListener("onWeightChanged",(data)=>{    
            //const result = data?.weight.replace(/[^0-9.]/g, ""); // 숫자와 소숫점 제외 모든 문자 제거
            var weight = parseFloat(data?.weight);

            if(!isNaN(weight) && Number(weight)>=0) {
                var kiloWeight = weight*1000;
                const roundInt = (num) => Math.round(num);
                kiloWeight = roundInt(kiloWeight)
                setCurrentWeight(kiloWeight);
                if(kiloWeight>Number(storage.getString("TRAY_WEIGHT"))) {
                    const newArr = weightArr.current;
                    newArr[indexRef.current] = kiloWeight; // 현재 인덱스에 덮어쓰기
                    indexRef.current = (indexRef.current + 1) % MAX_SIZE; // 다음 위치 (100 넘으면 0부터)
                    weightArr.current = newArr;
                    setWeightStable(isStableWeight(weightArr.current,0.9))
                    mostFrequentWeight = getMostFrequent(weightArr.current);
                    /* setWeightArr((prev) => {
                        const newArr = [...prev];
                        newArr[indexRef.current] = kiloWeight; // 현재 인덱스에 덮어쓰기
                        indexRef.current = (indexRef.current + 1) % MAX_SIZE; // 다음 위치 (100 넘으면 0부터)
                        return newArr;
                    }); */
                }else {
                    mostFrequentWeight=0;
                    weightArr.current = (Array(MAX_SIZE).fill(null))
                }
            
            }
        }); 
    }

    function initScanScreen() {
    
        Weight.closeSerialConnection();
        
        Weight.connectDevice(storage.getString("weightPortNumber")); 
        DeviceEventEmitter.removeAllListeners("onWeightChanged"); 
        startWeighting();

    }

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
        //if(tmpBreadList.length>0 &&rescanIndex!=null){
            Animated.loop(
                Animated.sequence([
                    Animated.timing(opacity, {
                    toValue: 0,
                    duration: 230,
                    useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                    toValue: 1,
                    duration: 230,
                    useNativeDriver: true,
                    }),
                    Animated.timing(colorAnim, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: false, // color 애니메이션은 false
                      }),
                      Animated.timing(colorAnim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: false,
                      }),
                ])
            ).start();
        //}
    }, [tmpBreadList, rescanIndex]);

    /* useEffect(() => {
        // 무한 반복 애니메이션
        //if(currentWeight>0 && !isMainShow  && tmpBreadList.length<=0 ){
            Animated.loop(
                Animated.sequence([
                    Animated.timing(opacity, {
                    toValue: 0,   // 투명하게
                    duration: 1000,
                    useNativeDriver: true,
                    delay:1500,
                    }),
                    Animated.timing(opacity, {
                    toValue: 1,   // 다시 보이게
                    duration: 1000,
                    useNativeDriver: true,
                    delay:1000,
                    }),
                ])
            ).start();
        //}
      }, [currentWeight,isMainShow, tmpBreadList]); */

  
    useFocusEffect(
        useCallback(()=>{
            initScanScreen();
        },[])
    )

    useEffect(()=>{
        setStoreID(storage.getString("BREAD_STORE_ID"));
    },[])
    
    /* function screenTimeOut(){
        clearInterval(timeoutSet);
        timeoutSet=null;
        timeoutSet = setInterval(async()=>{
            
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
            
        },SCREEN_TIMEOUT)

    }  */
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

    useEffect(()=>{
        if(currentWeight<=0 && !props.isMainShow ) {
            setImgURL(``)
        }
        if(props.isMainShow) {
            setImgURL(``);
            setTmpBreadList([]);
            setTotalBreadList([]);
            setPrice(0)
            setAmt(0)
        }

    },[currentWeight,props.isMainShow ])

    function addToTmpList(addData,type,index) {
        var toSet = Object.assign([],tmpBreadList);
        if(type == ADD) {
            // 추가 스캔
            //toSet.push(addData);
            toSet.unshift(addData);
            setTmpBreadList(toSet);
        }else if(type == INIT) {
            // 초기화 스캔
            setTmpBreadList([addData]);
        }else if(type == RESCAN) {
            // 다시 스캔
            toSet[index] = addData;
            setTmpBreadList(toSet);
        }else {

        }
    }
    
    async function startScan(type,index=null) {
        
        
        sound.play((success) => {
            if (success) {
                console.log('재생 성공');
            } else {
                console.log('재생 실패');
            }
        });
        //var breadStoreID = "test";
        setImgURL("");

        try{
            
            const {uri} = await camera.current.capture();
            
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
                formData.append("store_name", storage.getString("BREAD_STORE_ID"));
                formData.append("store_id", storage.getString("STORE_IDX"));
                /* if(storage.getBoolean("WEIGHT_SET")) {
                    formData.append("input_weight", Number(currentWeight)-Number(storage.getString("TRAY_WEIGHT")));
                }else {
                    formData.append("input_weight", 0.0);
                } */
                if(storage.getBoolean("WEIGHT_SET")) {
                    if(storage.getString("TRAY_WEIGHT")) {
                        formData.append("input_weight", Number(mostFrequentWeight)-Number(storage.getString("TRAY_WEIGHT")));
                    }else {
                        formData.append("input_weight", Number(mostFrequentWeight));
                    }
                }else {
                    formData.append("input_weight", 0.0);
                }
                //formData.append("input_weight", 0.03);
                console.log("foramdata: ",formData);
                

                const aiResult = await formRequest(dispatch,`${AI_SERVER}${AI_QUERY}`, formData );
                
                console.log("aiResult: ",aiResult.data);
                const date = new Date();

                postPayLog({
                    storeID:storage.getString("STORE_IDX"),
                    time:`${date.getFullYear()}${numberPad(date.getMonth()+1,2)}${numberPad(date.getDate(),2)}`,
                    ERROR_MSG:`${JSON.stringify(aiResult.data)}`,
                    ERROR_CD:"XXXX"
                });

                
                if(aiResult instanceof Error) {
                    EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""})
                    EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"스캔오류", str:aiResult.message});
                    setScanning(false);
                    RNFS.unlink(`${RNFS.DownloadDirectoryPath}/${fileName}`);

                    //const breadOrderList = [{prodCD:900040, option:[], amt:1}, {prodCD:900041, option:[], amt:1}];
                    //addToTmpList(breadOrderList)
                    return;
                }
                const data = aiResult.data;
                //const data = {"message":"✅ Query Completed successfully","detected_image_path":"/static/detected_image/woori-pos/detected_25-12-03-01-10-48-1048.jpg","similar_items":[{"product":"none","product_code":"none","bread_weight":0,"weight_tolerance":0,"distance":0.4152410626411438,"image_path":"static/uploaded_images/woori-pos/믹스츄러스/2025-11-25-12-21-53-314_aug_2.jpg"}],"item_counts":{"900459":1},"total_registered_weight":0,"total_tolerance":0,"within_tolerance":true,"execution_time":"0.20 seconds","input_weight":26,"alt_candidates":[{"rank":2,"product":"치즈바게트","product_code":"900459","bread_weight":166,"weight_tolerance":3,"distance":0.39367473125457764,"image_path":"static/uploaded_images/woori-pos/치즈바게트/2025-11-27-15-03-56-327_aug_1.jpg"},{"rank":3,"product":"동물쿠기","product_code":"33333","bread_weight":0,"weight_tolerance":1,"distance":0.36955246329307556,"image_path":"static/uploaded_images/woori-pos/동물쿠기/2025-11-13-10-11-31-494_aug_0.jpg"},{"rank":4,"product":"하트초코쿠키","product_code":"55555","bread_weight":18,"weight_tolerance":1,"distance":0.35007911920547485,"image_path":"static/uploaded_images/woori-pos/하트초코쿠키/2025-11-13-10-26-15-551_aug_1.jpg"},{"rank":5,"product":"츄러스","product_code":"8001","bread_weight":208,"weight_tolerance":1,"distance":0.3466029167175293,"image_path":"static/uploaded_images/woori-pos/츄러스/2025-11-25-12-20-02-110_aug_5.jpg"},{"rank":6,"product":"풋풋사과파이","product_code":"900436","bread_weight":68,"weight_tolerance":3,"distance":0.3397134244441986,"image_path":"static/uploaded_images/woori-pos/풋풋사과파이/2025-11-14-14-00-20-930_aug_2.jpg"}]}

                //console.log(JSON.stringify(data));
                //console.log("aiResult data: ",data);
                RNFS.unlink(`${RNFS.DownloadDirectoryPath}/${fileName}`);
                if(isEmpty(data.item_counts)) {
                    setScanning(false);
                    setImgURL(``)
                    EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""})
                    EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"스캔오류", str:"스캔할 수 있는 빵이 없습니다."});
                    dispatch(setCommon({scanErrorCnt:Number(scanErrorCnt)+1}));
                    //setRescanIndex();
                    //const breadOrderList = [{prodCD:900040, option:[], amt:3}, {prodCD:900041, option:[], amt:3}];
                    //addToTmpList(breadOrderList)
                    return;
                }else {
                    setScanning(false);
                    if(data.within_tolerance == false) {
                        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""})
                        //EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"스캔오류", str:"스캔이 잘 될수있도록 가져오신 상품을 쟁반안에 넣어주세요. 빵이 겹치지 않은지 확인해주세요."});
                        
                        const registeredWeight = Number(data.total_registered_weight)
                        const inputWeight = Number(data.input_weight);
                        const tolerance = Number(data.total_tolerance);
                        const difference = Math.abs(inputWeight - registeredWeight);
                        //const difference = 294;
                        const minWeight = Number(storage.getString("MIN_WEIGHT"));
                        console.log("difference: ",difference);
                        

                        if (data?.item_counts && 'none' in data.item_counts) { 
                            /* var topFive = getOptimizedWeightCombinations(items, minWeight,difference,5);
                                //const topFive = getTopFive(items, difference);
                                console.log("top five: ",topFive);
                                //[...topFive, ...sampleData]
                                dispatch(setAlert(
                                    {
                                        title:"테스트",
                                        msg:"스캔이 잘될수있도록 빵이 겹치지\n않게 골고루 펼쳐주세요.",
                                        subMsg:topFive.length>0?"확인요청 빵":"",
                                        okText:'닫기',
                                        cancelText:'',
                                        isCancle:false,
                                        isOK:true,
                                        icon:"",   
                                        isAlertOpen:true,
                                        clickType:"",
                                        imageArr:topFive
                                    }
                                ));  */
                             dispatch(setAlert(
                                {
                                    title:"테스트",
                                    msg:"미 등록된 상품이니 상품을 다시 확인해주세요.",
                                    subMsg:"",
                                    okText:'닫기',
                                    cancelText:'',
                                    isCancle:false,
                                    isOK:true,
                                    icon:"",   
                                    isAlertOpen:true,
                                    clickType:"",
                                    imageArr:[]
                                }
                            ));
                            dispatch(setCommon({scanErrorCnt:Number(scanErrorCnt)+1}));

                        }else {
                    
                            if(difference >= minWeight) {
                                console.log("겹침");
                                // 겹침
                                var topFive = getOptimizedWeightCombinations(items, minWeight,difference,5);
                                //const topFive = getTopFive(items, difference);
                                console.log("top five: ",topFive);
                                //[...topFive, ...sampleData]
                                /* dispatch(setAlert(
                                    {
                                        title:"테스트",
                                        msg:"스캔이 잘될수있도록 빵이 겹치지\n않게 골고루 펼쳐주세요.",
                                        subMsg:topFive.length>0?"확인요청 빵":"",
                                        okText:'닫기',
                                        cancelText:'',
                                        isCancle:false,
                                        isOK:true,
                                        icon:"",   
                                        isAlertOpen:true,
                                        clickType:"",
                                        imageArr:topFive
                                    }
                                )); */
                                dispatch(setAlert(
                                    {
                                        title:"테스트",
                                        msg:"스캔이 잘될수있도록 빵이 겹치지\n않게 골고루 펼쳐주세요.",
                                        subMsg:"",
                                        okText:'닫기',
                                        cancelText:'',
                                        isCancle:false,
                                        isOK:true,
                                        icon:"",   
                                        isAlertOpen:true,
                                        clickType:"",
                                        imageArr:[]
                                    }
                                ));
                                dispatch(setCommon({scanErrorCnt:Number(scanErrorCnt)+1}));

                            }else {
                                console.log("오인식");
                                // 오인식
                                const altCandidates = data?.alt_candidates;
                                if(altCandidates.length>0) {
                                    const altCandImgs = getGimgChgByCandidates(altCandidates,items);
                                    console.log(altCandImgs);
                                    dispatch(setAlert(
                                        {
                                            title:"테스트",
                                            msg:"스캔된 빵이 인식이 잘못됐으니\n다시 찍어주세요.",
                                            subMsg:"",
                                            okText:'닫기',
                                            cancelText:'',
                                            isCancle:false,
                                            isOK:true,
                                            icon:"",   
                                            isAlertOpen:true,
                                            clickType:"",
                                            imageArr:[]
                                        }
                                    ));
                                    dispatch(setCommon({scanErrorCnt:Number(scanErrorCnt)+1}));

                                }else {
                                    dispatch(setAlert(
                                        {
                                            title:"테스트",
                                            msg:"스캔된 빵이 인식이 잘못됐으니\n다시 찍어주세요.",
                                            subMsg:"",
                                            okText:'닫기',
                                            cancelText:'',
                                            isCancle:false,
                                            isOK:true,
                                            icon:"",   
                                            isAlertOpen:true,
                                            clickType:"",
                                            imageArr:[]
                                        }
                                    ));
                                    dispatch(setCommon({scanErrorCnt:Number(scanErrorCnt)+1}));

                                }
                            }
                        }
                        return;
                    }
    
                    setImgURL(`${AI_SERVER}${data.detected_image_path}`)
                    const itemData = data.item_counts;
                    const keys = Object.keys(itemData);
                    var breadOrderList = [];
                    for(const bread of keys) {
                        const itemCheck = items.filter(el=>{return el.prod_cd == bread});
                        if(itemCheck.length<=0) {
                            break;
                        }
                        const orderItem = {prodCD:bread, option:[], amt:itemData[bread]};
                        breadOrderList.push(orderItem);
                    }
                    setScannedWeight(`${data?.total_registered_weight}g±${(data?.total_tolerance.toFixed(2))}`);
                    EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""})
                    if(keys.length == breadOrderList.length) {
                        setRescanIndex(); 
                        //const finalBreadList = updateList(tmpBreadList, breadOrderList)
                        //console.log("finalBreadList: ",finalBreadList);
                        //setTmpBreadList([...finalBreadList]);

                        //const breadOrderList = [{prodCD:900040, option:[], amt:1}, {prodCD:900041, option:[], amt:1}];
                        addToTmpList(breadOrderList, type, index)
                        if(tmpBreadList.length<=0) {
                            //speak(selectedLanguage, strings["추가스캔안내"][selectedLanguage]);
                        }else {
                            //speak(selectedLanguage, strings["추가스캔확인"][selectedLanguage]);
                        }
                    }else {
                        EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"스캔오류", str:"등록되지 않은 빵입니다."});
                        dispatch(setCommon({scanErrorCnt:Number(scanErrorCnt)+1}));
                    }
                    setScanning(false);
                    
                }
            }else {
                EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""})
                EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"스캔오류", str:"이미지를 저장할 수 없습니다."});
                dispatch(setCommon({scanErrorCnt:Number(scanErrorCnt)+1}));
                return;
            } 
        }catch(err) {
            console.log("err: ",err);
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""})
            EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"스캔오류", str:err.errorMsg});
            setCountStart(false);
            dispatch(setCommon({scanErrorCnt:Number(scanErrorCnt)+1}));
            //const breadOrderList = [{prodCD:900040, option:[], amt:1}, {prodCD:900041, option:[], amt:1}];
            //addToTmpList(breadOrderList)
            return;
        }

        endTime = performance.now();
        duration = (endTime - startTime) / 1000; // 초 단위 변환
        console.log("data sent: ",duration);
    }

    function selectPlate(index) {
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
                                    <View style={{ flex:1,width:'90%', marginTop:7,gap:10, borderColor:colorDarkGrey, backgroundColor:colorLightGrey, borderWidth:1, padding:4, borderRadius:10}} >
                                        {
                                            el.map(item=>{
                                                return(
                                                    <>
                                                        {
                                                            <ScannListItem isScan={true} isImageUse={false} data={item} isCancelUse={false} onCancelPress={()=>{ }}  />
                                                        }
                                                    </>
                                                )
                                            })
                                        }        
                                        <TouchableOpacity
                                            style={{ padding:10}}
                                            onPress={()=>{
                                                console.log('다시찍기-------');
                                                EventRegister.emit("showSpinner",{isSpinnerShow:true, msg:"스캔 중 입니다.", spinnerType:"",closeText:""})
                                                //setScanType(RESCAN);
                                                //setRescanIndex(index);
                                                startScan(RESCAN, index);
                                            }}
                                        >
                                            <RescanView>
                                                <RescanText>{strings["다시스캔"][`${selectedLanguage}`]}</RescanText>
                                            </RescanView>
                                        </TouchableOpacity>      
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


    function timeoutFunction(){
        console.log("test timeoutFunction");
    }
    
    
    return(
        <>
        {/* 안내 UI */}
        {(currentWeight<=0 && !props.isMainShow )&&
            <View onTouchStart={()=>{ /* screenTimeOut(); */ }} style={{width:'100%' ,height:'100%',position:'absolute',zIndex:999999999,justifyContent:'center'}}>
                <View style={{width:'100%',height:'100%', position:'absolute',backgroundColor:'rgba(0,0,0,0.4)'}} ></View>
                <Text style={{fontSize:240, fontWeight:'900',color:'white', textAlign:'center'}} >{strings["쟁반을 올려주세요."][`${selectedLanguage}`]}</Text>
                <View style={{position:'absolute', zIndex:9999999, right:0, bottom:35, right:10}}>
                    <TouchableWithoutFeedback onPress={()=>{if(isScanning==false){ props.setMainShow(true); dispatch(setCommon({isAddShow:false})); dispatch(setMenu({breadOrderList:totalBreadList})); initCamera(); setTmpBreadList([]);setTotalBreadList([]); }}} >
                        <SquareButtonView backgroundColor={colorGreen} >
                            {tmpBreadList.length>0 &&
                                <>
                                    <Animated.View style={{ opacity, position:'absolute',justifyContent:"center", backgroundColor:"rgba(255,255,255,0.4)",width:'100%',height:'100%' }}>
                                                
                                    </Animated.View>
                                    <FastImage source={require("../resources/arrow_gif.gif")} style={{position:'absolute', right:-30,top:-30, width:100,height:100}} resizeMode={FastImage.resizeMode.contain} />
                                </>
                            }

                            <ButtonText>{strings["키오스크\n바로주문"][`${selectedLanguage}`]}</ButtonText>
                            
                        </SquareButtonView>
                        
                    </TouchableWithoutFeedback>
                </View>
            </View>
        }
        {( (storage.getBoolean("WEIGHT_SET") && currentWeight>Number(storage.getString("TRAY_WEIGHT")) && !props.isMainShow )&&!isWeightStable) &&
            <View onTouchStart={()=>{ /* screenTimeOut(); */ }} style={{width:'100%' ,height:'100%',position:'absolute',zIndex:999999999,justifyContent:'center'}}>
                <View style={{width:'100%',height:'100%', position:'absolute',backgroundColor:'rgba(0,0,0,0.4)'}} ></View>
                <Text style={{fontSize:240, fontWeight:'900',color:'white', textAlign:'center'}} >{strings["무게 측정 중 입니다."][`${selectedLanguage}`]}</Text>
            </View>
        }
        {/* <View style={{ padding:10, position:'absolute',zIndex:999999999, right:340, bottom:200, justifyContent:'center', alignItems:'center', width:300,height:180}}>
            <View style={{width:'100%',height:'100%',  position:'absolute',backgroundColor:'rgba(0,0,0,0.8)'}} ></View>
            <Text style={{fontSize:28, fontWeight:'900',color:colorYellow, textAlign:'center'}} >{strings["스캔하기버튼안내"][`${selectedLanguage}`]}</Text>
        </View> */}
        <View style={{width:'100%', height:'100%', flexDirection:'row'}} onTouchStart={()=>{ /* screenTimeOut(); */ }} >
            <View style={{flex:1,}}>
                    <Camera
                        ref={camera}
                        style={{flex:1, aspectRatio: 4 / 3}}
                        device={device}
                        format={format}
                        isActive={true}
                        flashMode='off'
                        focusMode='off'
                        zoomMode='off'
                        shutterPhotoSound={false}
                        resizeMode='contain'
                        onError={(err)=>{
                            console.log("err: ",err);
                        }}
                    />
                    {imgURL!="" &&
                        <FastImage style={{width:'100%', height:'100%', backgroundColor:colorBlack, position:'absolute'}} resizeMode='contain' source={{uri:imgURL}} />
                    }
            </View>
            <View style={{flex:0.343}} >
            {tmpBreadList.length > 0 &&
                <View style={{flex:1, backgroundColor:imgURL==""?"transparent":colorLightGrey }} >
                    <ScrollView style={{marginTop:10, marginLeft:10,marginRight:10, paddingBottom:140, width:530, height:'68%', position:'absolute', zIndex:99, backgroundColor:colorLightGrey }} keyboardShouldPersistTaps={"handled"} flexGrow={1} contentContainerStyle={{ flexGrow: 1 }} >
                        {tmpBreadList.length > 0 &&
                            <BreadTmpCartList/>
                        }
                    </ScrollView>
                    
                    <View style={{ marginLeft:10,marginRight:10, padding:10, backgroundColor:colorPink, width:480, height:100, bottom:240, position:'absolute', zIndex:9999999, }} >                
                        <View style={{flexDirection:'row'}} >
                            <CartItemTitleText style={{fontSize:30,flex:1}} >{`총 수량`}</CartItemTitleText>
                            <CartItemTitleText style={{fontSize:30,flex:1,textAlign:'right'}} >{`${amt+strings["개"][`${selectedLanguage}`]}`}</CartItemTitleText>
                        </View>
                        <View style={{flexDirection:'row'}} >
                            <CartItemTitleText style={{fontSize:30,flex:1}} >{`총 금액`}</CartItemTitleText>
                            <CartItemTitleText style={{fontSize:30,flex:1,textAlign:'right'}} >{`${price+strings["원"][`${selectedLanguage}`]}`}</CartItemTitleText>
                        </View>
                    </View>
                </View>
            }
                <View style={{position:'absolute', flexDirection:'column', backgroundColor:colorBlack, right:520, bottom:20,padding:6, zIndex:999999999}}>
                    <Text style={{fontSize:30,color:colorYellow}}>{strings["측정무게"][`${selectedLanguage}`]}: {currentWeight}g</Text>
                    {/* <Text style={{fontSize:30,color:colorYellow}}>{strings["실제무게"][`${selectedLanguage}`]}: {scannedWeight}g</Text> */}
                </View>
                <View style={{position:'absolute', zIndex:9999999, right:0, bottom:35, right:10}}>
                    <TouchableWithoutFeedback onPress={()=>{if(isScanning==false){ props.setMainShow(true); dispatch(setCommon({isAddShow:false})); dispatch(setMenu({breadOrderList:totalBreadList})); initCamera(); setTmpBreadList([]);setTotalBreadList([]); }}} >
                        <SquareButtonView backgroundColor={colorGreen} >
                            {tmpBreadList.length>0 &&
                                <>
                                    <Animated.View style={{ opacity, position:'absolute',justifyContent:"center", backgroundColor:"rgba(255,255,255,0.4)",width:'100%',height:'100%' }}>
                                                
                                    </Animated.View>
                                    <FastImage source={require("../resources/arrow_gif.gif")} style={{position:'absolute', right:-30,top:-30, width:100,height:100}} resizeMode={FastImage.resizeMode.contain} />
                                </>
                            }
                            {tmpBreadList.length<=0&&    
                                <ButtonText>{strings["키오스크\n바로주문"][`${selectedLanguage}`]}</ButtonText>
                            }
                            {tmpBreadList.length>0&&    
                                <ButtonText>{strings["확인"][`${selectedLanguage}`]}</ButtonText>
                            }
                        </SquareButtonView>
                        
                    </TouchableWithoutFeedback>
                </View>
                <View style={{position:'absolute', zIndex:9999999, right:250, bottom:35,}}>
                    <TouchableWithoutFeedback 
                        onPress={()=>{ 
                            startTime = performance.now();
                            /* const sound = new Sound("shutter.wav", null, (error) => {
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
                            }); */
                            if(isScanning==false){ 
                                setScanning(true);
                                EventRegister.emit("showSpinner",{isSpinnerShow:true, msg:"스캔 중 입니다.", spinnerType:"",closeText:""})
                                setImgURL("");
                                //setScanType(ADD);
                                startScan(ADD);
                                
                                
                            }

                        }} 
                    >
                        <SquareButtonView backgroundColor={colorRed}  >
                            {tmpBreadList.length>0 &&rescanIndex==null &&
                                <ButtonText>{strings["쟁반추가"][`${selectedLanguage}`]}</ButtonText>
                            }
                            {/*(currentWeight>0 && !isMainShow  && tmpBreadList.length>0 )&&
                                <View style={{position:'absolute',width:'100%',height:'100%', justifyContent:"center"}} >
                                    <Animated.View style={{ opacity, position:'absolute',justifyContent:"center", backgroundColor:"rgba(255,255,255,0.4)",width:'100%',height:'100%' }}>
                                        <Text style={{color:colorBlack, textAlign:'center', fontSize:32, fontWeight:800}}>
                                            {strings["쟁반추가안내"][`${selectedLanguage}`]}
                                        </Text>
                                    </Animated.View>
                                </View>
                            */}
                            <View style={{ width:'100%',height:'100%',position:'absolute', justifyContent:"center"}} >
                            
                            {tmpBreadList.length<=0 &&
                                <View style={{position:'absolute',width:'100%',height:'100%', justifyContent:"center"}} >
                                    {/* <ButtonText>{strings["스캔하기"][`${selectedLanguage}`]}</ButtonText> */}
                                    <Animated.View style={{ opacity, position:'absolute',justifyContent:"center", backgroundColor:"rgba(255,255,255,0.4)",width:'100%',height:'100%' }}>
                                        
                                    </Animated.View>
                                    <ButtonText>{strings["스캔하기"][`${selectedLanguage}`]}</ButtonText>
                                    <FastImage source={require("../resources/arrow_gif.gif")} style={{position:'absolute', right:-30,top:-30, width:100,height:100}} resizeMode={FastImage.resizeMode.contain} />
                                </View>
                            }
                            {/*(currentWeight>0 && !isMainShow  && tmpBreadList.length<=0 )&&
                                <View style={{position:'absolute',width:'100%',height:'100%', justifyContent:"center"}} >
                                    <Animated.View style={{ opacity, position:'absolute',justifyContent:"center", backgroundColor:"rgba(255,255,255,0.8)",width:'100%',height:'100%' }}>
                                        <Text style={{color:colorBlack, textAlign:'center', fontSize:34, fontWeight:800}}>
                                            {strings["스캔하기버튼안내"][`${selectedLanguage}`]}
                                        </Text>
                                    </Animated.View>
                                    
                                </View>
                            */}
                            </View>
                            
                        </SquareButtonView>
                    </TouchableWithoutFeedback>
                </View>
            </View>
        </View>
        {//isMainShow&&
            <View style={props.isMainShow?{width:'100%',height:'100%',position:'absolute'}:{width:'0%',height:'0%',position:'absolute'}}>
                <MainScreen /* screenTimeOut={screenTimeOut} */ ref={mainRef} isMainShow={props.isMainShow} initScanScreen={initScanScreen} currentWeight={currentWeight} setMainShow={props.setMainShow}/>
            </View>
        }
        </>
    )
}
export default ScanScreen;