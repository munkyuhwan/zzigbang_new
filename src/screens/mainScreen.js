import { act, useCallback, useEffect, useReducer, useRef, useState } from "react";
import { InteractionManager, ScrollView, Text, TouchableWithoutFeedback, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { getCategories, getMenu, setMenu, startPayment } from "../store/menu";
import { ButtonGradientWrapper, CartFloatingBtnBg, CartFloatingBtnImg, CartFloatingBtnImgFullWidth, CartFloatingBtnText, CartFloatingBtnWrapper, CartFloatingBtnWrapperFullWidth, CartItemAmtBorderWrapper, CartItemAmtText, CartItemAmtWrapper, CartPaymentLabel, CartPaymentTotalAmt, CartPaymentWrapper, FloatingBtnImg, FloatingBtnText, FloatingBtnWrapper, InnerWrapper, InnerWrapperFullWidth, MainCartWrapper, MainMenuHeaderLogo, MainMenuWrapper, MainWrapper, MenuButtonWrapper, MenuItemWrapper, PayBtnWrapper } from "../style/main";
import { CartList, MainHeader, MenuCategories, MenuItemList } from "../components/mainComponents";
import FastImage from "react-native-fast-image";
import { MenuMetaDetailPopup } from "./popups/menuMetaDetailPopup";
import { MenuSmartroDetailPopup } from "./popups/menuSmartroDetailPopup";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { BottomButton } from "../components/commonComponents";
import { colorBlack, colorDarkGrey, colorGreen, colorLightGreen, colorLightGrey, colorRed, colorWhite } from "../resources/colors";
import { numberWithCommas } from "../utils/common";
import { getStoreInfo } from "../store/metaPos";
import { stat } from "react-native-fs";
import { InstallmentPopup } from "./popups/installmentPopup";
import { getBanner, initializeApp, setAdShow, setCommon } from "../store/common";
import AdScreen from "./popups/adScreen";
import { SCREEN_TIMEOUT } from "../resources/values";
import { ButtonImage, ButtonText, ButtonView, ButtonViewPercent, ButtonWrapper } from "../style/common";
import PaymentSelectionPopup from "./popups/paymentSelectionPopup";
import { EventRegister } from "react-native-event-listeners";
import LinearGradient from 'react-native-linear-gradient';
import {isEmpty} from 'lodash';
import Sound from "react-native-sound";
import SettingScreen from "./settingScreen";

let timeoutSet = null;

const MainScreen = (props) =>{
    const dispatch = useDispatch();
    const itemListRef = useRef();
    const cartListRef = useRef();
    const navigate = useNavigation();

    const itemLayouts = useRef({}); 

    const [scrollPosition, setScrollPosition] = useState(0);
    const [cartScrollPosition, setCartScrollPosition] = useState(0);
    const [isCartBottom, setCartBottom] = useState(false);
    const [isListBottom, setListBottom] = useState(false);
    const SCROLL_INCREMENT = 200; // 스크롤 이동 거리
    const MENU_SCROLL_INCREMENT = 400; // 스크롤 이동 거리

    const [lastAdded, setLastAdded] = useState("");

    // 번역
    const {strings,selectedLanguage, isAddShow} = useSelector(state=>state.common);
    const {categories, orderList, menu, items, breadOrderList, isPayStarted} = useSelector(state=>state.menu);
    const [mainCat, setMainCat] = useState("");
    const [subCat,setSubCat] = useState("");
    const [subCatList, setSubCatList] = useState([]);

    useEffect(()=>{
        if(categories?.length> 0) {
            setCategoryIndex(0);
            setMainCat(categories[0]?.cate_code1); 
        }
    },[categories])

    // 카테고리 선택
    const [categoryIndex, setCategoryIndex] = useState(0);

    const [totalAmt, setTotalAmt] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);
    const [totalVat, setTotalVat] = useState(0);

    const [orderCnt, setOrderCnt] = useState(0);
    const [breadCnt, setBreadCnt] = useState(0);
    const [isSetting, setSetting] = useState(false);

    // 리스트 뷰 관련 
    const [itemCords,setItemCords] = useState([]);
    const [dataSourceCords,setDataSourceCords ] = useState([]);
    const [isTouching, setIsTouching] = useState(false); // 터치 상태 관리

    const [tmpMenu, setTmpMenu] = useState([]);
    useEffect(()=>{
        const filteredMenu = menu.filter(el=>el?.mainCat?.code1 == mainCat);
        if(filteredMenu.length>0) {
            const newItems = filteredMenu[0];
            setTmpMenu([newItems]);
        }
    },[mainCat])


    useEffect(()=>{
        //console.log("itemCords: ",itemCords.length)
        //if(itemCords?.length>0){
            var tmpCordArray = Object.assign([],dataSourceCords);
            tmpCordArray.push(itemCords)
            setDataSourceCords(tmpCordArray);
        //}
    },[itemCords])

    const menuScrollDown = (action) => {
        if(action == "UP") {
            const newPosition = scrollPosition + MENU_SCROLL_INCREMENT;
            itemListRef.current?.scrollTo({ y: newPosition, animated: true });
        }else {
            const newPosition = scrollPosition - MENU_SCROLL_INCREMENT;
            if(newPosition<=0) {
                itemListRef.current?.scrollTo({ y: newPosition, animated: true });
            }else {
                itemListRef.current?.scrollTo({ y: 0, animated: true });
            }
        }
    };
    const scrollCartMove = (action) => {
        if(action=="DOWN") {
            const newPosition = cartScrollPosition + SCROLL_INCREMENT;
            cartListRef.current?.scrollTo({ y: newPosition, animated: true });    
        }else {
            const newPosition = cartScrollPosition - SCROLL_INCREMENT;
            if(newPosition<=0) {
                cartListRef.current?.scrollTo({ y: newPosition, animated: true });        
            }else {
                cartListRef.current?.scrollTo({ y: 0, animated: true });        
            }
        }
    };
    function screenTimeOut(){
        clearInterval(timeoutSet);
        timeoutSet=null;
        timeoutSet = setInterval(()=>{
            dispatch(getBanner());
            dispatch(setAdShow());
            //dispatch(regularUpdate());
            //dispatch(setAdScreen({isShow:true,isMain:true}))
        },SCREEN_TIMEOUT)
    } 
    function clearTimeout() {
        clearInterval(timeoutSet);
        timeoutSet=null;
    }

    useEffect(()=>{     
        //if(menu?.length<=0) {
            //dispatch(getMenu());
            //dispatch(getStoreInfo());
            screenTimeOut();
            dispatch(initializeApp());
        //}
    },[])

    useEffect(()=>{
        var tmpSale = 0
        var tmpVat = 0
        var tmpAmt = 0
        if(orderList.length>0) {
            //calculate order 
            var orderAmt = 0;
            for(var i=0;i<orderList.length;i++) {
                var item = items.filter(el=>el.prod_cd == orderList[i].prodCD);
                if(item.length>0) {
                    tmpSale = (Number(tmpSale)+(Number(item[0].sal_amt)*Number(orderList[i].amt)));
                    tmpVat = (Number(tmpVat)+(Number(item[0].sal_vat)*Number(orderList[i].amt)));
                    tmpAmt = (Number(tmpAmt)+Number(orderList[i].amt));
                    orderAmt += Number(orderList[i].amt);
                    const options = orderList[i].option;
                    if(options.length>0) {
                        for(var j=0;j<options.length;j++) {
                            const optionItemAmt = options[j].amt;
                            const optionItem = items.filter(el=>el.prod_cd == options[j].prodCD);
                            console.log(optionItem[0].gname_kr,"optionItemAmt: ",optionItemAmt)
                            if(optionItem.length>0) {
                                tmpSale = Number(tmpSale)+(Number(optionItem[0].sal_amt)*Number(optionItemAmt)*Number(orderList[i].amt));
                                tmpVat = (Number(tmpVat)+(Number(optionItem[0].sal_vat)*Number(optionItemAmt))*Number(orderList[i].amt));
                                //tmpAmt = Number(tmpAmt)+(Number(optionItem[0].sal_vat)*Number(optionItemAmt));
                            }
                        }
                    }
                }
            }
            setOrderCnt(Number(orderAmt));

        }
        
        if(breadOrderList.length>0) {
            //calculate order 
            var breadAmt = 0;
            for(var i=0;i<breadOrderList.length;i++) {
                var item = items.filter(el=>el.prod_cd == breadOrderList[i].prodCD);
                if(item.length>0) {
                    breadAmt += Number(breadOrderList[i].amt);
                    tmpSale = (Number(tmpSale)+(Number(item[0].sal_amt)*Number(breadOrderList[i].amt)));
                    tmpVat = (Number(tmpVat)+(Number(item[0].sal_vat)*Number(breadOrderList[i].amt)));
                    tmpAmt = (Number(tmpAmt)+Number(breadOrderList[i].amt));                   
                }
            }
            setBreadCnt(breadAmt);
        }
        
        setTotalPrice(tmpSale);
        setTotalVat(tmpVat);
        setTotalAmt(tmpAmt);

    },[orderList, breadOrderList])
    
    function onMenuSelect(prodCd) {
       // dispatch(setMenu({prodCd:item.prod_cd}));
        var selectedMenu = {};
        for(var i=0;i<items.length;i++) {
            if(items[i].prod_cd == prodCd) {
                selectedMenu = items[i];
            }
        }
        dispatch(setMenu({detailItem:selectedMenu}));
    }
    /* if(menu.length<=0) {
        return(<></>)
    } */

    function cancelList(index) {
        var tmpList = Object.assign([],orderList);
        tmpList.splice(index,1);
        dispatch(setMenu({orderList:tmpList}))
    }
    function handleScroll(ev) {
        //console.log('on scroll',ev.nativeEvent.contentOffset.y);
        //console.log(props.dataSourceCords)
        const filteredData = dataSourceCords.filter(el=>el.y >= ev.nativeEvent.contentOffset.y-50 && el.y <= ev.nativeEvent.contentOffset.y+50);

        if(filteredData.length>0) {
            var tmpData = filteredData[0].key.split("_");
            var cateCode = tmpData[1];
            if(isTouching) {
                setMainCat(cateCode);
            }
        }

    }

    if(props.isMainShow == false) {
        return(<></>);
    }


    if(isSetting == true) {
        return(
            <SettingScreen setSetting={setSetting} />
        )
    }
    const findYOffsetCodeByCate = (catId) => {
        //dispatch(setSelectedItems());
        setTimeout(() => {
            const targetY = itemLayouts.current[`${catId}`];
            console.log("targetY: ",targetY)
            if (targetY !== undefined && cartListRef.current) {
                cartListRef.current.scrollTo({ y: targetY, animated: false });
                setLastAdded(catId);
            }    
        }, 500);
        
    }
    function onListLayout(el){
        const layout = el.layout.nativeEvent.layout;
        // 렌더 완료 후 layout.y 기록
        InteractionManager.runAfterInteractions(() => {
            itemLayouts.current[el.item] = layout.y;
        });
    }
    return(
        <>
        {isAddShow &&
            <AdScreen setMainShow={props.setMainShow} />      
        }
        <MainWrapper onTouchStart={()=>{ screenTimeOut(); }} >
            <MainCartWrapper>
                <View style={{
                        flex:1,
                        paddingTop:25,
                    }}>
                    <MainMenuHeaderLogo>{strings["주문내역"][`${selectedLanguage}`]}</MainMenuHeaderLogo>
                    
                    <ScrollView 
                        ref={cartListRef} 
                        style={{flex:1, marginTop:30, marginBottom:15, paddingLeft:14,paddingRight:14}} 
                        onScroll={(ev)=>{
                            const y = ev.nativeEvent.contentOffset.y;
                            setCartScrollPosition(y);
                            const { layoutMeasurement, contentOffset, contentSize } = ev.nativeEvent;
                            const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 150; // 20은 여유 여백
                            setCartBottom(isBottom)
                        }}
                        onScrollBeginDrag={(ev)=>{
                            const y = ev.nativeEvent.contentOffset.y;
                            setCartScrollPosition(y);
                            const { layoutMeasurement, contentOffset, contentSize } = ev.nativeEvent;
                            const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 150; // 20은 여유 여백
                            setCartBottom(isBottom)
                        }}
                        onScrollEndDrag={(ev)=>{
                            const y = ev.nativeEvent.contentOffset.y;
                            setCartScrollPosition(y);

                            const { layoutMeasurement, contentOffset, contentSize } = ev.nativeEvent;
                            const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 350; // 20은 여유 여백
                            setCartBottom(isBottom)
                        }}
                        >
                        {breadOrderList.length>0 && 
                            <CartList
                                onLayout={onListLayout}
                                data={breadOrderList}
                                isCancelUse={false}
                                isImageUse={true}
                                isMargin={false}
                                placeHolder={strings["빵"][`${selectedLanguage}`]}
                                onCancelPress={(index)=>{ cancelList(index); }}
                                />
                        }
                        {orderList.length>0 &&       
                            <CartList
                                onLayout={onListLayout}
                                lastAdded={lastAdded}
                                data={orderList}
                                isCancelUse={true}
                                isImageUse={true}
                                isMargin={breadOrderList.length>0}
                                placeHolder={strings["음료"][`${selectedLanguage}`]}
                                onCancelPress={(index)=>{ cancelList(index); }}
                            />
                        }
                    </ScrollView>
                    
                    {cartScrollPosition > 0 &&
                        <TouchableWithoutFeedback onPress={()=>{scrollCartMove("UP");}} >
                            <CartFloatingBtnWrapperFullWidth top={"80px"} width={'100%'} isTop={true} >
                                <LinearGradient colors={['#00000000', 'rgba(0,0,0,0.3);']} style={{width:'100%',height:'100%'}}>
                                    <InnerWrapperFullWidth>
                                        <CartFloatingBtnImgFullWidth resizeMode={FastImage.resizeMode.contain} source={require("../resources/imgs/drawable-xxxhdpi/icon_down_1.png")} />
                                    </InnerWrapperFullWidth>
                                </LinearGradient>
                            </CartFloatingBtnWrapperFullWidth>
                        </TouchableWithoutFeedback>
                    }
                    {!isCartBottom &&
                        <TouchableWithoutFeedback  colors={['#4c669f', '#3b5998', '#192f6a']}  onPress={()=>{scrollCartMove("DOWN");}} >
                            <CartFloatingBtnWrapperFullWidth width={'100%'}  isTop={false} >
                                <LinearGradient colors={['#00000000', 'rgba(0,0,0,0.3);']} style={{width:'100%',height:'100%'}}>
                                    <InnerWrapperFullWidth>
                                        <CartFloatingBtnImgFullWidth resizeMode={FastImage.resizeMode.contain} source={require("../resources/imgs/drawable-xxxhdpi/icon_down_1.png")} />
                                    </InnerWrapperFullWidth>
                                </LinearGradient>
                            </CartFloatingBtnWrapperFullWidth>
                        </TouchableWithoutFeedback>
                        
                    }
                    {/* <TouchableWithoutFeedback onPress={()=>{scrollCartMove("DOWN");}} >
                            <CartFloatingBtnWrapper>
                                <InnerWrapper>
                                    <CartFloatingBtnText>{strings["더보기"][`${selectedLanguage}`]}</CartFloatingBtnText>
                                    <CartFloatingBtnImg resizeMode={FastImage.resizeMode.contain} source={require("../resources/imgs/drawable-xxxhdpi/icon_down_1.png")} />
                                </InnerWrapper>
                                <CartFloatingBtnBg/>
                            </CartFloatingBtnWrapper>
                    </TouchableWithoutFeedback> */}
                </View>
                <CartPaymentWrapper>
                    <CartPaymentLabel>{strings["결제금액"][`${selectedLanguage}`]}</CartPaymentLabel>
                    <CartItemAmtWrapper>
                        <CartItemAmtBorderWrapper>
                            <CartItemAmtText textColor={colorWhite} >{strings["빵"][`${selectedLanguage}`]} X {numberWithCommas(breadCnt)}</CartItemAmtText>
                        </CartItemAmtBorderWrapper>
                    </CartItemAmtWrapper>
                    <CartItemAmtWrapper>
                        <CartItemAmtBorderWrapper>
                            <CartItemAmtText textColor={colorWhite} >{strings["음료"][`${selectedLanguage}`]} X {numberWithCommas(orderCnt)}</CartItemAmtText>
                        </CartItemAmtBorderWrapper>
                    </CartItemAmtWrapper>
                    <CartPaymentTotalAmt>{numberWithCommas(Number(totalPrice)+Number(totalVat))+`${strings["원"][selectedLanguage]}`} </CartPaymentTotalAmt>
                </CartPaymentWrapper>
            </MainCartWrapper>
            <MainMenuWrapper>
                <MainHeader setSetting={setSetting}/>
                <MenuCategories  key={"mainCategory"} onCategoryLeftClick={()=>{if(categoryIndex>1){setCategoryIndex(categoryIndex-1);}else{setCategoryIndex(0)}; }} onCategoryRightClick={()=>{ setCategoryIndex(categoryIndex+1); }} categoryIndex={categoryIndex} isMain={true} categories={categories} catSelected={mainCat} onSelect={(item)=>{ setMainCat(item?.cate_code1); setSubCatList(item?.level2); setSubCat(); }}/>
                {/* <MenuCategories  key={"subCategory"} isMain={false} categories={subCatList} catSelected={subCat} onSelect={(item)=>{setSubCat(item?.cate_code2); }}/> */}
                <MenuItemWrapper>
                    {tmpMenu?.length>0 &&
                        <MenuItemList
                            itemListRef={itemListRef}
                            key={"menuItemList"}
                            menu={tmpMenu}
                            mainCat={mainCat}
                            subCat={subCat}
                            itemCords={itemCords}
                            setItemCords={setItemCords}
                            dataSourceCords={dataSourceCords}
                            setDataSourceCords={setDataSourceCords}
                            onPress={(item)=>{
                                onMenuSelect(item.prod_cd);
                            }}
                            onTouchStart={()=>{setIsTouching(true);}}
                            onScrollEndDrag={()=>{}}
                            onScroll={(ev)=>{
                                handleScroll(ev);
                                const y = ev.nativeEvent.contentOffset.y;
                                setScrollPosition(y);

                                const { layoutMeasurement, contentOffset, contentSize } = ev.nativeEvent;
                                const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 150; // 20은 여유 여백
                                setListBottom(isBottom)

                                const height = ev.nativeEvent.layoutMeasurement.height;
                                if(y <=0) {
                                    if(dataSourceCords?.length>0){
                                        var key = dataSourceCords[0]?.key
                                        if(key){
                                            key = key?.replaceAll("categoryTitle_","");
                                            if(isTouching) {
                                                //setMainCat(key);
                                                setIsTouching(false);
                                            }
                                        }
                                    }
                                }
                                else if(y>=height) {
                                    if(dataSourceCords?.length>0){
                                        var key = dataSourceCords[dataSourceCords.length-1]?.key
                                        if(!isEmpty(key)) {
                                            key = key.replaceAll("categoryTitle_","");
                                            if(isTouching) {
                                                ///setMainCat(key);
                                                setIsTouching(false);
                                            }
                                        }
                                    }
                                }
                                else {
                                    const filteredY = dataSourceCords.filter(el=> { return (Math.floor(el.y)>=(y) && Math.round(el.y)<(y+50)) }  ); 
                                    if(filteredY.length>0) {
                                        var key = filteredY[0].key;
                                        if(!isEmpty(key)) {
                                            key = key.replaceAll("categoryTitle_","");
                                            if(isTouching) {
                                                //setMainCat(key);
                                                setIsTouching(false);
                                            }
                                        }
                                        //console.log("key: ",key);
                                        //setScrollMainCat(key);
                                    }
                                }
                                
                            }}
                        />
                    }
                    {scrollPosition > 0 &&
                        <TouchableWithoutFeedback onPress={()=>{menuScrollDown("DOWN");}} >
                            <CartFloatingBtnWrapperFullWidth  colors={['#4c669f', '#3b5998', '#192f6a']}  top={"0px"} width={'100%'} isTop={true} >
                                <LinearGradient colors={['#00000000', 'rgba(0,0,0,0.3);']} style={{width:'100%',height:'100%'}}>
                                    <InnerWrapperFullWidth>
                                        <CartFloatingBtnImgFullWidth resizeMode={FastImage.resizeMode.contain} source={require("../resources/imgs/drawable-xxxhdpi/icon_down_1.png")} />
                                    </InnerWrapperFullWidth>
                                </LinearGradient>
                            </CartFloatingBtnWrapperFullWidth>
                        </TouchableWithoutFeedback>
                    }
                    {!isListBottom &&
                        <TouchableWithoutFeedback onPress={()=>{menuScrollDown("UP");}} >
                            <CartFloatingBtnWrapperFullWidth  colors={['#4c669f', '#3b5998', '#192f6a']}   width={'100%'}  isTop={false} >
                                <LinearGradient colors={['#00000000', 'rgba(0,0,0,0.3);']} style={{width:'100%',height:'100%'}}>
                                    <InnerWrapperFullWidth>
                                        <CartFloatingBtnImgFullWidth resizeMode={FastImage.resizeMode.contain} source={require("../resources/imgs/drawable-xxxhdpi/icon_down_1.png")} />
                                    </InnerWrapperFullWidth>
                                </LinearGradient>
                            </CartFloatingBtnWrapperFullWidth>
                        </TouchableWithoutFeedback>
                    }
                </MenuItemWrapper>
                <LinearGradient colors={['rgba(0,0,0,0.2);','#00000000']} style={{flex:0.089, width:'100%'}} > 
                    <ButtonWrapper>
                        <TouchableWithoutFeedback 
                            onPress={()=>{ 
                               /*  const sound = new Sound('z001.wav', Sound.MAIN_BUNDLE, (error) => {
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
                                if(breadOrderList?.length>0){  

                                }else {
                                    props.setMainShow(false); /* navigate.navigate("scan"); */
                                }  
                            }} 
                        >
                            <ButtonViewPercent backgroundColor={breadOrderList?.length>0?colorDarkGrey : colorGreen}>
                                <ButtonImage resizeMode="contain" source={require("../resources/imgs/drawable-xxxhdpi/img_scan.png")} />
                                <ButtonText>{strings["스캔하기"][`${selectedLanguage}`]}</ButtonText>
                            </ButtonViewPercent>
                        </TouchableWithoutFeedback>

                        <TouchableWithoutFeedback onPress={()=>{EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"결제", str:"준비중 입니다."});}} >
                            <ButtonViewPercent backgroundColor={colorLightGreen} >
                                <ButtonImage source={require("../resources/imgs/drawable-xxxhdpi/img_cupon_01.png")} resizeMode="contain" />
                                <ButtonText>{strings["쿠폰/포인트"][`${selectedLanguage}`]}</ButtonText>
                            </ButtonViewPercent>
                        </TouchableWithoutFeedback>
                        <TouchableWithoutFeedback onPress={()=>{ dispatch(startPayment({totalPrice,totalVat})); }} >
                            <ButtonViewPercent backgroundColor={colorRed} >
                                <ButtonImage source={require("../resources/imgs/drawable-xxxhdpi/img_pay.png")} resizeMode="contain" />
                                <ButtonText>{strings["결제하기"][`${selectedLanguage}`]}</ButtonText>
                            </ButtonViewPercent>
                        </TouchableWithoutFeedback>
                    </ButtonWrapper>
                </LinearGradient>
            </MainMenuWrapper>
            <MenuMetaDetailPopup onItemAdd={findYOffsetCodeByCate} />
            <MenuSmartroDetailPopup/> 
            {isPayStarted &&
                <PaymentSelectionPopup totalPrice={totalPrice} totalVat={totalVat} />
            }
        </MainWrapper>
        <InstallmentPopup/>  
        </>
    )
}

export default MainScreen;