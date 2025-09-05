import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowImg, ArrowWrapper, BreadItemTextView, CartItemAmtBorderWrapper, CartItemAmtText, CartItemAmtWrapper, CartItemCancelImage, CartItemCancelWrapper, CartItemImage, CartItemOptionText, CartItemPriceText, CartItemPriceWrapper, CartItemTextView, CartItemTitleText, CartItemView, CategoryItem, CategoryListWrapper, CategoryText, CategoryWrapper, ItemGroupWrapper, ItemImage, ItemInnerWrapper, ItemPrice, ItemTextWrapper, ItemTitle, ItemWrapper, LanguageWrapper, MainMenuHeaderDateTime, MainMenuHeaderLanguage, MainMenuHeaderLanguageWrapper, MainMenuHeaderLogo, MainMenuHeaderSectionWrapper, MainMenuHeaderWrapper, MenuCategoryTitle, MenuCategoryTitleWrapper, MenuItemListWrapper, MenuListItemImage, MenuListItemTitle, MenuListItemWrapper, NewCategoryItem } from "../style/main"
import moment, { lang } from "moment";
import { Animated, Pressable, ScrollView, SectionList, Text, TouchableWithoutFeedback, View } from "react-native";
import FastImage from "react-native-fast-image";
import { categoryName, menuCatName, menuName, numberWithCommas, paginateArray } from "../utils/common";
import {isEmpty} from 'lodash';
import { useDispatch, useSelector } from "react-redux";
import { colorBlack, colorDarkGrey, colorRed } from "../resources/colors";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { setCommon } from "../store/common";
import { LAN_CN, LAN_EN, LAN_JP, LAN_KO } from "../resources/values";
import SettingScreen from "../screens/settingScreen";
import { storage } from "../utils/localStorage";
  
// 헤더 컴포넌트
export const MainHeader = (props) => {
    const dispatch = useDispatch();
    const navigate = useNavigation();
    const [dateTime, setDateTime] = useState("");
    const {strings,selectedLanguage} = useSelector(state=>state.common);
    const [isOpen, setOpen] = useState(false);
   
    setInterval(() => {
        setDateTime(moment().format("YYYY년 MM월 DD일 HH시 mm분"));
    }, 10000);
    useEffect(()=>{
        setDateTime(moment().format("YYYY년 MM월 DD일 HH시 mm분"));
    },[])


    return (
        <>
            <MainMenuHeaderWrapper>
                <MainMenuHeaderSectionWrapper flex={1} >
                    <TouchableWithoutFeedback onPress={()=>{props.setSetting(true); }} >
                        <FastImage resizeMode="contain" style={{width:220, height:80, marginLeft:-160}} source={require("../resources/imgs/drawable-xxxhdpi/img_logo_11124.png")} />
                    </TouchableWithoutFeedback>
                </MainMenuHeaderSectionWrapper >
                
                <MainMenuHeaderSectionWrapper  flex={1.5} >
                    <MainMenuHeaderDateTime>{dateTime}</MainMenuHeaderDateTime>
                </MainMenuHeaderSectionWrapper>
                {/*isOpen==false &&
                    <MainMenuHeaderSectionWrapper  flex={1} >
                        {selectedLanguage == LAN_EN &&
                            <MainMenuHeaderLanguageWrapper>
                                <Pressable onPress={() => { setOpen(true);  }}>
                                    <LanguageWrapper isSelected={selectedLanguage == LAN_EN}  >
                                        <MainMenuHeaderLanguage source={require("../resources/imgs/drawable-xxxhdpi/bt_american.png")} />
                                    </LanguageWrapper>
                                </Pressable>
                            </MainMenuHeaderLanguageWrapper>
                        }
                        
                        {selectedLanguage == LAN_CN &&
                            <MainMenuHeaderLanguageWrapper >
                                <Pressable onPress={() => { setOpen(true);   }}>
                                    <LanguageWrapper isSelected={selectedLanguage == LAN_CN}>
                                        <MainMenuHeaderLanguage source={require("../resources/imgs/drawable-xxxhdpi/bt_chan.png")} />
                                    </LanguageWrapper>
                                </Pressable>
                            </MainMenuHeaderLanguageWrapper>
                        }

                        {selectedLanguage == LAN_JP &&
                            <MainMenuHeaderLanguageWrapper  >
                                <Pressable onPress={() => { setOpen(true);  }}>
                                    <LanguageWrapper isSelected={selectedLanguage == LAN_JP}>
                                        <MainMenuHeaderLanguage source={require("../resources/imgs/drawable-xxxhdpi/bt_japan.png")} />
                                    </LanguageWrapper>
                                </Pressable>
                            </MainMenuHeaderLanguageWrapper>
                        }
                        {selectedLanguage == LAN_KO &&
                        <MainMenuHeaderLanguageWrapper >
                            <Pressable onPress={() => { setOpen(true);  }}>
                                <LanguageWrapper isSelected={selectedLanguage == LAN_KO}>
                                    <MainMenuHeaderLanguage source={require("../resources/imgs/drawable-xxxhdpi/bt_kor.png")} />
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
                                    <MainMenuHeaderLanguage source={require("../resources/imgs/drawable-xxxhdpi/bt_american.png")} />
                                </LanguageWrapper>
                            </Pressable>
                        </MainMenuHeaderLanguageWrapper>
                    
                        <MainMenuHeaderLanguageWrapper >
                            <Pressable onPress={() => {storage.set("LAN",LAN_CN);dispatch(setCommon({selectedLanguage:LAN_CN}));  setOpen(false);  }}>
                                <LanguageWrapper isSelected={selectedLanguage == LAN_CN}>
                                    <MainMenuHeaderLanguage source={require("../resources/imgs/drawable-xxxhdpi/bt_chan.png")} />
                                </LanguageWrapper>
                            </Pressable>
                        </MainMenuHeaderLanguageWrapper>
                    
                        <MainMenuHeaderLanguageWrapper  >
                            <Pressable onPress={() => {storage.set("LAN",LAN_JP); dispatch(setCommon({selectedLanguage:LAN_JP})); setOpen(false);  }}>
                                <LanguageWrapper isSelected={selectedLanguage == LAN_JP}>
                                    <MainMenuHeaderLanguage source={require("../resources/imgs/drawable-xxxhdpi/bt_japan.png")} />
                                </LanguageWrapper>
                            </Pressable>
                        </MainMenuHeaderLanguageWrapper>
                        
                        <MainMenuHeaderLanguageWrapper >
                            <Pressable onPress={() => {storage.set("LAN",LAN_KO); dispatch(setCommon({selectedLanguage:LAN_KO})); setOpen(false);  }}>
                                <LanguageWrapper isSelected={selectedLanguage == LAN_KO}>
                                    <MainMenuHeaderLanguage source={require("../resources/imgs/drawable-xxxhdpi/bt_kor.png")} />
                                </LanguageWrapper>
                            </Pressable>
                        </MainMenuHeaderLanguageWrapper>

                    </MainMenuHeaderSectionWrapper>
                }
            </MainMenuHeaderWrapper>
        </>
    )
}

// 카테고리 컴포넌트
export const MenuCategories = (props) =>{
    const {strings,selectedLanguage} = useSelector(state=>state.common);
    const categories = props?.categories;
    const catSelected = props?.catSelected;
    const isMain = props?.isMain;
    const categoryIndex = props?.categoryIndex;
    const itemCount = 10;

    if(categories.length<=0) {
        return(<></>);
    }
    
    const trimmedCategories = paginateArray(categories,itemCount);
    const catsToShow = trimmedCategories[categoryIndex]

    return(
        <>
            <CategoryWrapper key={"catWrapper_"+isMain} horizontal={true} >
                {catsToShow?.length>0&&
                    <Pressable key={"press_cat_prev"} onPress={()=>{props?.onCategoryLeftClick();  }} >
                        <ArrowWrapper>
                            <ArrowImg source={require("../resources/imgs/drawable-xxxhdpi/icon_back_b.png")} />
                        </ArrowWrapper>
                    </Pressable>
                }
                <CategoryListWrapper>
                    {[0,1,2,3,4,5,6,7,8,9].map(el=>{
                        if(catsToShow[el]?.is_del=="Y"||catsToShow[el]?.is_use=="N"||catsToShow[el]?.is_view=="N") {
                            return(<></>);
                        }
                        
                        if(isMain==true) {
                            var isSelected=(catSelected==catsToShow[el]?.cate_code1);
                        }else {
                            var isSelected=(catSelected==catsToShow[el]?.cate_code2);
                        }
                        return(
                        <TouchableWithoutFeedback key={"press_"+(catsToShow[el]?.cate_name1?catsToShow[el]?.cate_name1:`empty_${el}`)} onPress={()=>{if(!isEmpty(catsToShow[el]?.cate_name1)){ props?.onSelect(catsToShow[el]); }}} >
                            <NewCategoryItem isSelected={isSelected} isEmpty={isEmpty(catsToShow[el])} style={el==0?{borderTopLeftRadius:10}:(el==4?{borderTopRightRadius:10}:(el==5?{borderBottomLeftRadius:10}:(el==9?{borderBottomRightRadius:10}:{})) )  } >
                                <CategoryText  key={"categoryText_"+(isMain==true?categoryName(catsToShow[el], selectedLanguage):catsToShow[el]?.cate_name2)} isSelected={isSelected}  >{isMain==true?categoryName(catsToShow[el], selectedLanguage):catsToShow[el]?.cate_name2}</CategoryText>
                            </NewCategoryItem>
                        </TouchableWithoutFeedback>
                        )
                    })


                    }

                    {/*categories?.length>0 &&
                        categories.map((el)=>{
                            
                            if(el.is_del=="Y"||el.is_use=="N"||el.is_view=="N") {
                                return(<></>);
                            }
                            
                            if(isMain==true) {
                                var isSelected=(catSelected==el.cate_code1);
                            }else {
                                var isSelected=(catSelected==el.cate_code2);
                            }
                            return(
                                <>
                                <Pressable key={"press_"+el.cate_name1} onPress={()=>{ props?.onSelect(el); }} >
                                    <CategoryItem key={"categoryItem_"+el.cate_name1} isSelected={isSelected} >
                                        <CategoryText  key={"categoryText_"+(isMain==true?categoryName(el, selectedLanguage):el.cate_name2)} isSelected={isSelected}  >{isMain==true?categoryName(el, selectedLanguage):el.cate_name2}</CategoryText>
                                    </CategoryItem>
                                </Pressable>
                                </>
                            )
                        })
                    */}
                    
                </CategoryListWrapper>
                {catsToShow?.length>0&&
                    <Pressable key={"press_cat_next"} onPress={()=>{console.log("trimmedCategories: ",trimmedCategories); if(categoryIndex<trimmedCategories?.length-1){props?.onCategoryRightClick(); } }} >
                        <ArrowWrapper>
                            <ArrowImg style={{transform:[{scaleX:-1}]}} source={require("../resources/imgs/drawable-xxxhdpi/icon_back_b.png")} />
                        </ArrowWrapper>
                    </Pressable>
                }
            </CategoryWrapper>
        </>
    )
}
var scrollInterval = null
export const MenuItemList = (props) =>{
    const {selectedLanguage} = useSelector(state=>state.common);
    const menu = props?.menu;
    const mainCat = props?.mainCat;
    const subCat = props?.subCat;
    const [tmpCord, setTmpCord] = useState({});
    var items = [];
    for(var i=0;i<menu.length;i++) {
        var tmp = { title:menu[i].mainCat.code1, data:menu[i].mainCat.items };
        items.push(tmp);
    }

    const [isTouching, setIsTouching] = useState(false); // 터치 상태 관리

    useEffect(()=>{
        if(!isEmpty(subCat)) {
            const scrollTo = `categoryTitle_${subCat}`;
            const filteredData = props.dataSourceCords.filter(el=>el.key == scrollTo);
            if(!isEmpty(filteredData)){
                if(isTouching==false) {
                    props.itemListRef.current.scrollTo({
                        x:0,
                        y:filteredData[0].y
                    })
                }
            }
        }else {
            if(!isEmpty(mainCat)) {
                const scrollTo = `categoryTitle_${mainCat}`;
                const filteredData = props.itemCords.filter(el=>el.key == scrollTo);
                if(filteredData?.length>0){
                    if(isTouching==false) {
                        props.itemListRef.current.scrollTo({
                            x:0,
                            y:filteredData[0].y-200
                        })
                    }
                }
            }
        }
    },[mainCat, subCat]);
    
    function startInterval() {
        scrollInterval = setInterval(() => {
            //console.log("scrolling......");
            //console.log();
            
        }, 500);
    }
    function endInterval() {
        clearInterval(scrollInterval);
        scrollInterval=null;
    }

    return(
        <>
            <ScrollView 
                ref={props.itemListRef} 
                onScroll={ev=>{props?.onScroll(ev);}} 
                scrollEventThrottle={16}
                key={"listScrollView"}  
                style={{height:'100%',flex:1, marginTop:20 }} 
                onTouchStart={()=>{startInterval(); props?.onTouchStart(); setIsTouching(true);}}
                onTouchEnd={()=>{endInterval();  }}
                onScrollEndDrag={()=>{ endInterval(); props?.onScrollEndDrag(); setIsTouching(false);}}
            >
                <MenuItemListWrapper key={"itemListWrapper"} >
                    {
                    menu.map((el)=>{
                        return(
                            <>
                            
                                <MenuCategoryTitleWrapper key={"titleWrapper_"+el.mainCat.code1} isBorder={false} >
                                    <MenuCategoryTitle 
                                        onLayout={(event)=>{
                                            event.target.measure(
                                                (x, y, width, height, pageX, pageY) => {
                                                    //props.setItemCords({key:"categoryTitle_"+el.mainCat.code1,y:pageY-244});
                                                    var tmpItemCords = props.itemCords;
                                                    tmpItemCords.push({key:"categoryTitle_"+el.mainCat.code1,y:pageY-173});
                                                    props.setItemCords(tmpItemCords);
                                                    //props.setItemCords({key:"categoryTitle_"+el.mainCat.code1,y:pageY-173});
                                                }
                                            )
                                        }} 
                                        key={"categoryTitle_"+el.mainCat.code1} fontSiz={"30px"} >{menuCatName(el.mainCat, selectedLanguage)}</MenuCategoryTitle>
                                    <ItemGroupWrapper key={"itemGroupWrapper_"+el.mainCat.code1} >
                                        {
                                        el.mainCat?.items?.length>0 && 
                                        el.mainCat?.items.map((itemEl,index)=>{
                                            //if(index>0) {
                                                return(
                                                    <MainItem key={"main_"+index} item={itemEl} onPress={()=>{props?.onPress(itemEl);}} />
                                                )
                                            //}
                                            }
                                        )
                                        }
                                    </ItemGroupWrapper>
                                    {el?.subCat?.length>0&&
                                        el.subCat.map(subEl=>{
                                            if(subEl.items.length<=0) {
                                                return<></>
                                            }else {
                                                return(
                                                    <>
                                                        <MenuCategoryTitleWrapper key={"itemGroupWrapperSub_"+subEl.code2} isBorder={false}   >
                                                            <MenuCategoryTitle 
                                                                onLayout={(event)=>{
                                                                    event.target.measure(
                                                                        (x, y, width, height, pageX, pageY) => {
                                                                            setTmpCord({key:"categoryTitle_"+subEl.code2,y:pageY-244});
                                                                        }
                                                                    )
                                                                }} 
                                                                key={"itemTitleSub_"+subEl.code2} fontSiz={"24px"} >{subEl.code2}</MenuCategoryTitle>
                                                            <ItemGroupWrapper key={"itemGroupSub_"+subEl.code2} >
                                                                {
                                                                subEl.items?.length>0 && 
                                                                subEl.items?.map(subItemEl=>{
                                                                    return(
                                                                        <MainItem key={"sub_item_"+subItemEl.prod_cd} item={subItemEl} onPress={()=>{props?.onPress(subItemEl);}}  />
                                                                        )
                                                                    })
                                                                    
                                                                }
                                                            </ItemGroupWrapper>
                                                        </MenuCategoryTitleWrapper>
                                                    </>
                                                )
                                            }

                                            
                                        })   
                                    }
                                </MenuCategoryTitleWrapper>
                            </>
                        )
                    })
                    }
                </MenuItemListWrapper>
            </ScrollView>  

        </>
    )
}
function isProductInCart(product, cart) {
    const found = cart.find(item => item.prodCD === product.prod_cd);
    if (!found) return false;
  
    const cartOptions = found.option;
  
    // 모든 옵션이 매칭되는지 확인
    for (const cartOp of cartOptions) {
      const group = product.option.find(o => o.idx === cartOp.groupIdx);
      if (!group) return false;
  
      // prodCD가 해당 그룹의 prod_i_cd 안에 있는지 확인
      if (!group.prod_i_cd.includes(cartOp.prodCD)) {
        return false;
      }
    }
  
    return true;
  }
  
  
export const MainItem = (props) => {
    const {strings, selectedLanguage} = useSelector(state=>state.common);
    const item = props?.item;
    const { orderList, menu } = useSelector(state=>state.menu);
    const isIn = isProductInCart(item,orderList);
    
    return(
        <>
        <Pressable key={"press_"+item?.cate_code+"_"+item?.prod_cd} onPress={()=>{ props?.onPress(); }} >
            <ItemWrapper isIn={isIn} key={"itemWrapper_"+item?.cate_code+"_"+item?.prod_cd} >
                {isIn &&
                    <FastImage style={{width:20,height:20,position:'absolute',zIndex:999,right:10,top:10}} source={require("../resources/imgs/drawable-xxxhdpi/img_check_1.png")} />
                }
                <ItemInnerWrapper key={"itemInnerWrapper_"+item?.cate_code+"_"+item?.prod_cd} >
                    <ItemImage key={"itemImage_"+item?.cate_code+"_"+item?.prod_cd} source={{uri:item?.gimg_chg}} resizeMode={FastImage.resizeMode.cover} />
                    <ItemTextWrapper isIn={isIn} key={"itemTextWrapper_"+item?.cate_code+"_"+item?.prod_cd} >
                        <ItemTitle isIn={isIn} key={"itemTitle_"+item?.cate_code+"_"+item?.prod_cd}>{menuName(item,selectedLanguage)}</ItemTitle>
                        <ItemPrice isIn={isIn} key={"itemPrice_"+item?.cate_code+"_"+item?.prod_cd} >{numberWithCommas(item?.sal_tot_amt)+strings["원"][`${selectedLanguage}`]}</ItemPrice>
                    </ItemTextWrapper>
                </ItemInnerWrapper>
            </ItemWrapper>
        </Pressable>
        </>
    );
}

// 카트 리스트
export const CartList = (props) =>{
    const orderList = props.data;
    const isCancelUse = props.isCancelUse;
    const isImageUse = props.isImageUse;
    const isMargin = props.isMargin;

    if(orderList.length<=0) {
        return(
            <View style={{flex:1}}> 
            </View>
        )
    }
    return(
        <View style={isMargin?{marginTop:20}:{}} >

            <View style={{gap:4}}>
                {
                    orderList.map((el,index)=>{
                        return(
                            <>
                                <CartListItem lastAdded={props.lastAdded} trigger={props.trigger} onLayout={(pr)=>{ props.onLayout({item:el.prodCD,layout:pr})}} isScan={false} isImageUse={isImageUse} data={el} isCancelUse={isCancelUse} onCancelPress={()=>{props.onCancelPress(index)}}  />
                            </>
                        )
                    })

                }
            </View>
        </View>
    )
}


export const CartListItem = (props) =>{
    const {strings, selectedLanguage} = useSelector(state=>state.common);
    const {items} = useSelector(state=>state.menu);
    const data = props.data;
    const isCancelUse = props.isCancelUse;
    const isImageUse = props.isImageUse;
    const item = items.filter(el=>el.prod_cd == data.prodCD);
    const options = data.option;
    var optTotal = 0;
    const opacity = useRef(new Animated.Value(0)).current;
    const heightAnim = useRef(new Animated.Value(0)).current; // 초기값: 0

    if(options.length>0) {
        for(var j=0;j<options.length;j++) {
            const optionItemAmt = options[j].amt;
            const optionItem = items.filter(el=>el.prod_cd == options[j].prodCD);
            if(optionItem.length>0) {
                optTotal = Number(optTotal)+(Number(optionItem[0].sal_tot_amt)*Number(optionItemAmt));
            }
        }
    }

    if(item.length<=0) {
        return(<></>)
    }
    var newStr = "";
    options.map((item)=>{
        const itemData = items.filter(el=>el.prod_cd==item.prodCD);
        if(itemData.length>0) {
            newStr += menuName(itemData[0],selectedLanguage)+item.amt+"+";
        }
    })
    function startAnimate() {
        Animated.sequence([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300, // 0.5초 동안 페이드인
                useNativeDriver: true,
            }),
            Animated.delay(100), // 1초 유지
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300, // 0.5초 동안 페이드아웃
                useNativeDriver: true,
            }),
        ]).start();
        Animated.sequence([
            Animated.timing(heightAnim, {
            toValue: 95, // 높이 커짐
            duration: 100,
            useNativeDriver: true,
            }),
            Animated.delay(150), // 1초 유지
            Animated.timing(heightAnim, {
            toValue: 0, // 다시 줄어듦
            duration: 350,
            useNativeDriver: true,
            }),
        ]).start();

    }
    useEffect(() => {
        // 1) 페이드인 → 2) 유지 → 3) 페이드아웃
        if(props?.lastAdded ==item[0]?.prod_cd){

            startAnimate();
            setTimeout(() => {
                startAnimate();
                setTimeout(() => {
                    startAnimate();
                }, 1000);                
            }, 1000);
          /*   animateInterval=setInterval(() => {
                startAnimate();
            }, 2000);   */  
              
        }else {
            //clearInterval(animateInterval);
            //animateInterval=null;
        }
    }, [props?.lastAdded,props?.trigger]);

    
    newStr.substring(-1,newStr.length-1);
    return(
        <>
        <View
            onLayout={props.onLayout}
        >

            <CartItemView>
                
                {isImageUse &&
                    <CartItemImage source={{uri:item[0]?.gimg_chg}} resizeMode={FastImage.resizeMode.cover}  />
                }
                <CartItemTextView>
                    <CartItemTitleText>{menuName(item[0], selectedLanguage)}</CartItemTitleText>
                    {newStr!="" &&
                        <CartItemOptionText>{newStr}</CartItemOptionText>
                    }
                </CartItemTextView>
                <CartItemAmtWrapper>
                    <CartItemAmtBorderWrapper>
                        <CartItemAmtText textColor={colorBlack} >X {data.amt}</CartItemAmtText>
                    </CartItemAmtBorderWrapper>
                </CartItemAmtWrapper>
                <CartItemPriceWrapper>
                    <CartItemPriceText>{numberWithCommas(Number(data.amt)*(Number(item[0].sal_tot_amt)+Number(optTotal)))} {strings["원"][`${selectedLanguage}`]}</CartItemPriceText>
                </CartItemPriceWrapper>
                {!props.isScan &&
                    <CartItemCancelWrapper>
                        {isCancelUse &&
                            <TouchableWithoutFeedback onPress={()=>{ props.onCancelPress();}}>
                                <CartItemCancelImage source={require("../resources/imgs/drawable-xxxhdpi/bt_delect.png")} resizeMode={"contain"} />
                            </TouchableWithoutFeedback>
                        }
                    </CartItemCancelWrapper>
                }
                
            </CartItemView>
            {
                <Animated.View style={{height:heightAnim,position:'absolute', backgroundColor:'rgba(210,27,25,0.5)',borderRadius:10, width:'100%',opacity}} />
            }  
        </View>

        </>
    )
}

export const ScannListItem = (props) =>{
    const {strings, selectedLanguage} = useSelector(state=>state.common);
    const {items} = useSelector(state=>state.menu);
    const data = props.data;
    const isCancelUse = props.isCancelUse;
    const isImageUse = props.isImageUse;
    const item = items.filter(el=>el.prod_cd == data.prodCD);
    const options = data.option;
    var optTotal = 0;
    
    if(options.length>0) {
        for(var j=0;j<options.length;j++) {
            const optionItemAmt = options[j].amt;
            const optionItem = items.filter(el=>el.prod_cd == options[j].prodCD);
            if(optionItem.length>0) {
                optTotal = Number(optTotal)+(Number(optionItem[0].sal_tot_amt)*Number(optionItemAmt));
            }
        }
    }

    if(item.length<=0) {
        return(<></>)
    }
    var newStr = "";
    options.map((item)=>{
        const itemData = items.filter(el=>el.prod_cd==item.prodCD);
        if(itemData.length>0) {
            newStr += menuName(itemData[0],selectedLanguage)+item.amt+"+";
        }
    })
    newStr.substring(-1,newStr.length-1);
    return(
        <>
        <View style={{flexDirection:'row'}} >
            <BreadItemTextView>
                <CartItemTitleText>{menuName(item[0], selectedLanguage)}</CartItemTitleText>
            </BreadItemTextView>
            <CartItemAmtWrapper>
                    <CartItemAmtText textColor={colorBlack} >X {data.amt}</CartItemAmtText>
            </CartItemAmtWrapper>
            <CartItemPriceWrapper>
                <CartItemPriceText>{numberWithCommas(Number(data.amt)*(Number(item[0].sal_tot_amt)+Number(optTotal)))} {strings["원"][`${selectedLanguage}`]}</CartItemPriceText>
            </CartItemPriceWrapper>
        </View>
        
        </>
    )
}
