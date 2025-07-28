import { useDispatch, useSelector } from "react-redux";
import { BottomButton } from "../../components/commonComponents";
import { AdButtonIcon, AdButtonIconWrapper, AdButtonSquare, AdButtonText, AdButtonView, AdScreenView, SwiperImage, SwiperVideo } from "../../style/adScreenStyle";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { setCommon } from "../../store/common";
import { MainHeader } from "../../components/mainComponents";
import { NativeModules, Pressable, TouchableWithoutFeedback, View } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { ADMIN_API_BANNER_DIR } from "../../resources/apiResources";
import { LanguageWrapper, MainMenuHeaderLanguage, MainMenuHeaderLanguageWrapper, MainMenuHeaderSectionWrapper } from "../../style/main";
import { LAN_CN, LAN_EN, LAN_JP, LAN_KO } from "../../resources/values";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    USBPrinter,
    ColumnAlignment,
    COMMANDS,
  } from 'react-native-thermal-receipt-printer-image-qr';
import { colorGreen, colorPink, colorRed } from "../../resources/colors";
import FastImage from "react-native-fast-image";
import Sound from "react-native-sound";
import { storage } from "../../utils/localStorage";
  
let swipeTimeOut;
const AdScreen = (props) => {
    const navigate = useNavigation();
    const dispatch = useDispatch();
    const {strings,selectedLanguage, bannerList} = useSelector(state=>state.common);
    // 영상 플레이, 스톱
    const [adIndex, setAdIndex] = useState();
    const [displayUrl, setDisplayUrl] = useState("");
    const [isOpen, setOpen] = useState(false);

    useEffect(()=>{
        if( bannerList?.length > 0) {
            setDisplayUrl(ADMIN_API_BANNER_DIR+bannerList[0]?.img_chg)
            setAdIndex(0)
        }else {
            clearTimeout(swipeTimeOut); 
        }
    },[bannerList])
    useEffect(()=>{
        swipeTimeOut=setTimeout(()=>{
            let tmpIndex = adIndex;
            if(!tmpIndex) tmpIndex=0;
            let indexToSet = tmpIndex +1;
            if(indexToSet>=bannerList.length) {
                indexToSet = 0;
            }
            setAdIndex(indexToSet);
            if(bannerList[tmpIndex]?.img_chg!=undefined){
                //const imgToSet = adImgs.filter(el=>el.name ==bannerList[tmpIndex]?.img_chg );
                setDisplayUrl(ADMIN_API_BANNER_DIR+bannerList[tmpIndex]?.img_chg)
            }
            //clearTimeout(swipeTimeOut); 
            //swipeTimeOut=null;
        },10000)
    },[adIndex])

    if(bannerList.length<=0) {
        return(
            <></>
        )
    }

    async function testFunction() {
        //const {Printer} = NativeModules;
        //console.log(Printer.getDeviceList());
        await USBPrinter.init();

        const printerConnection = await USBPrinter.connectPrinter(1155, 41061).catch(err => new Error(err));
        console.log("printerConnection: ",printerConnection);
        USBPrinter.printText("찍빵찍빵찍빵찍빵",{encoding:"EUC-KR"});
        USBPrinter.printBill("\n",{cut:true});

    }



    return(
        <>
            <AdScreenView>
                <View style={{width:'100%',height:'72%'}}>
                    {displayUrl?.split(";")[0]?.split("/")[1]?.includes('mp4') &&
                        <SwiperVideo
                            key={"aa"}
                            source={{uri: displayUrl}} 
                            paused={false}
                            repeat={true}
                        />
                    }
                    {!displayUrl?.split(";")[0]?.split("/")[1]?.includes('mp4') &&
                        <>
                            <SwiperImage
                                key={"imageswipe"}
                                source={{ uri: displayUrl }}
                            />
                        </>
                    }
                </View>
                {/* <MainHeader isAbsolute={true} />  */}
                <View style={{ position:'absolute', width:'20%',right:10, top:10,}} >
                {/*isOpen==false &&
                    <MainMenuHeaderSectionWrapper  flex={1} >
                        {selectedLanguage == LAN_EN &&
                            <MainMenuHeaderLanguageWrapper>
                                <Pressable onPress={() => { setOpen(true);   }}>
                                    <LanguageWrapper isSelected={selectedLanguage == LAN_EN}  >
                                        <MainMenuHeaderLanguage source={require("../../resources/imgs/drawable-xxxhdpi/bt_american.png")} />
                                    </LanguageWrapper>
                                </Pressable>
                            </MainMenuHeaderLanguageWrapper>
                        }
                        
                        {selectedLanguage == LAN_CN &&
                            <MainMenuHeaderLanguageWrapper >
                                <Pressable onPress={() => { setOpen(true);   }}>
                                    <LanguageWrapper isSelected={selectedLanguage == LAN_CN}>
                                        <MainMenuHeaderLanguage source={require("../../resources/imgs/drawable-xxxhdpi/bt_chan.png")} />
                                    </LanguageWrapper>
                                </Pressable>
                            </MainMenuHeaderLanguageWrapper>
                        }

                        {selectedLanguage == LAN_JP &&
                            <MainMenuHeaderLanguageWrapper  >
                                <Pressable onPress={() => { setOpen(true);  }}>
                                    <LanguageWrapper isSelected={selectedLanguage == LAN_JP}>
                                        <MainMenuHeaderLanguage source={require("../../resources/imgs/drawable-xxxhdpi/bt_japan.png")} />
                                    </LanguageWrapper>
                                </Pressable>
                            </MainMenuHeaderLanguageWrapper>
                        }
                        {selectedLanguage == LAN_KO &&
                        <MainMenuHeaderLanguageWrapper >
                            <Pressable onPress={() => { setOpen(true);   }}>
                                <LanguageWrapper isSelected={selectedLanguage == LAN_KO}>
                                    <MainMenuHeaderLanguage source={require("../../resources/imgs/drawable-xxxhdpi/bt_kor.png")} />
                                </LanguageWrapper>
                            </Pressable>
                        </MainMenuHeaderLanguageWrapper>
                        }   

                    </MainMenuHeaderSectionWrapper>
                */}
                {//isOpen==true &&
                    <MainMenuHeaderSectionWrapper  flex={1} >
                        <MainMenuHeaderLanguageWrapper>
                            <Pressable onPress={() => {storage.set("LAN",LAN_EN); dispatch(setCommon({selectedLanguage:LAN_EN})); setOpen(false); }}>
                                <LanguageWrapper isSelected={selectedLanguage == LAN_EN}  >
                                    <MainMenuHeaderLanguage source={require("../../resources/imgs/drawable-xxxhdpi/bt_american.png")} />
                                </LanguageWrapper>
                            </Pressable>
                        </MainMenuHeaderLanguageWrapper>
                    
                        <MainMenuHeaderLanguageWrapper >
                            <Pressable onPress={() => {storage.set("LAN",LAN_CN);dispatch(setCommon({selectedLanguage:LAN_CN}));  setOpen(false);  }}>
                                <LanguageWrapper isSelected={selectedLanguage == LAN_CN}>
                                    <MainMenuHeaderLanguage source={require("../../resources/imgs/drawable-xxxhdpi/bt_chan.png")} />
                                </LanguageWrapper>
                            </Pressable>
                        </MainMenuHeaderLanguageWrapper>
                    
                        <MainMenuHeaderLanguageWrapper  >
                            <Pressable onPress={() => {storage.set("LAN",LAN_JP); dispatch(setCommon({selectedLanguage:LAN_JP})); setOpen(false);  }}>
                                <LanguageWrapper isSelected={selectedLanguage == LAN_JP}>
                                    <MainMenuHeaderLanguage source={require("../../resources/imgs/drawable-xxxhdpi/bt_japan.png")} />
                                </LanguageWrapper>
                            </Pressable>
                        </MainMenuHeaderLanguageWrapper>
                        
                        <MainMenuHeaderLanguageWrapper >
                            <Pressable onPress={() => {storage.set("LAN",LAN_KO); dispatch(setCommon({selectedLanguage:LAN_KO})); setOpen(false);  }}>
                                <LanguageWrapper isSelected={selectedLanguage == LAN_KO}>
                                    <MainMenuHeaderLanguage source={require("../../resources/imgs/drawable-xxxhdpi/bt_kor.png")} />
                                </LanguageWrapper>
                            </Pressable>
                        </MainMenuHeaderLanguageWrapper>

                    </MainMenuHeaderSectionWrapper>
                }
                </View>
                <AdButtonView>
                    <TouchableWithoutFeedback onPress={async()=>{ 
                         const sound = new Sound('z001.wav', Sound.MAIN_BUNDLE, (error) => {
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
                        props.setMainShow(false);
                        /* navigate.navigate("scan"); */ }} >
                        <AdButtonSquare bgColor={colorGreen} >
                            <AdButtonIconWrapper>
                                <AdButtonIcon resizeMode={FastImage.resizeMode.contain} source={require("../../resources/imgs/drawable-xxxhdpi/bread_scan.png")} />
                            </AdButtonIconWrapper>
                            <AdButtonText>{ strings["빵 + 음료\n주문"][`${selectedLanguage}`] }</AdButtonText>
                        </AdButtonSquare>
                    </TouchableWithoutFeedback>
                    <TouchableWithoutFeedback onPress={()=>{dispatch(setCommon({isAddShow:false}));props.setMainShow(true); /* navigate.navigate("main"); */}} >
                        <AdButtonSquare bgColor={colorRed} >
                            <AdButtonIconWrapper>
                                <AdButtonIcon  resizeMode={FastImage.resizeMode.contain} source={require("../../resources/imgs/drawable-xxxhdpi/drink_order.png")} />
                            </AdButtonIconWrapper>
                            <AdButtonText>{strings["음료 / 식사만\n주문"][`${selectedLanguage}`]}</AdButtonText>
                        </AdButtonSquare>
                    </TouchableWithoutFeedback>
                </AdButtonView>

                {/* <View style={{position:'absolute',bottom:0,padding:0}}>
                    <BottomButton 
                        greenTitle={strings["빵 스캔하기"][`${selectedLanguage}`]}
                        greenIcon={require("../../resources/imgs/drawable-xxxhdpi/img_scan.png")}
                        redTitle={strings["음료 주문하기"][`${selectedLanguage}`]}
                        redIcon={require("../../resources/imgs/drawable-xxxhdpi/img_close_1.png")}
                        onGreenClicked={()=>{ navigate.navigate("scan"); }}
                        onRedClicked={()=>{ dispatch(setCommon({isAddShow:false})); navigate.navigate("main"); }}
                    />
                </View> */}
            </AdScreenView>
        </>
    )
}
export default AdScreen;