import { useDispatch, useSelector } from "react-redux";
import { isEmpty } from "lodash";
import { BackgroundDim, BackgroundWrapper, ItemDetailViewImage, ItemView, ItemViewImage, ItemViewInfo, ItemViewSelectedCountBtn, ItemViewSelectedCountView, ItemViewSelectedOption, ItemViewSelectedOptionBorder, ItemViewSelectedOptionText, MenuBorder, OptionArea, OptionItemAmountBtn, OptionItemAmountOnlyText, OptionItemAmountText, OptionItemAmountView, OptionItemAmountViewOnly, OptionItemImg, OptionItemOnlyPriceText, OptionItemOnlyView, OptionItemPriceText, OptionItemScrollView, OptionItemSelected, OptionItemTitleOnlyText, OptionItemTitleText, OptionItemView, OptionItmeTextOnlyWrapper, OptionItmeTextWrapper, OptionListView, OptionTitle, OptionTitleText, OptionTitleView, OptionsView, OrderArea, PopupWrapper } from "../../style/popup/popupCommon";
import { MainItem } from "../../components/mainComponents";
import { ItemAmtText, ItemPrice, ItemTitle } from "../../style/main";
import FastImage from "react-native-fast-image";
import { compareArrays, isOptionValid, menuName, numberWithCommas, optionName, optionTrimmer } from "../../utils/common";
import { BottomButton } from "../../components/commonComponents";
import { setMenu } from "../../store/menu";
import { BlackDimWRapper, ButtonImage, ButtonText, ButtonView, ButtonWrapper, CloseBtnIcon, CloseBtnView } from "../../style/common";
import { FlatList, ScrollView, TouchableWithoutFeedback, View, ViewBase } from "react-native";
import { useEffect, useState } from "react";
import { EventRegister } from "react-native-event-listeners";
import { colorRed } from "../../resources/colors";

export const MenuMetaDetailPopup = (props) => {
    const dispatch = useDispatch();
    // 번역
    const {strings,selectedLanguage} = useSelector(state=>state.common);
    const { detailItem, items, orderList } = useSelector(state => state.menu);

    const [optionSelect, setOptionSelect] = useState([]);
    const [amt, setAmt] = useState(1);
    const [optPrice, setOptPrice] = useState(0);
    const [optString, setOptString] = useState("");

    function init() {
        setOptionSelect([]);
        setAmt(1);
        setOptString("");
    }

    useEffect(()=>{
        if(isEmpty(detailItem)) {
            init();
        }
    },[detailItem])
    
    useEffect(()=>{
        if(optionSelect.length > 0 ) {

            if(!isEmpty(optionSelect)) {
                //isOptionSelectValid(detailItem, optionSelect);
                var newStr = "";
                var tmpOptPrice = 0;
                optionSelect.map((item)=>{
                    const itemData = items.filter(el=>el.prod_cd==item.prodCD);
                    if(itemData.length>0) {
                        tmpOptPrice += (Number(itemData[0].sal_amt)+Number(itemData[0].sal_vat))*item.amt;
                        newStr += "- "+ menuName(itemData[0],selectedLanguage)+"\n";
                    }
                })
                setOptString(newStr.substring(-1,newStr.length-1));
                setOptPrice(tmpOptPrice);
            }

        }
    },[optionSelect])

    // 주문하기
    function addItemToCart() {
        if(!isEmpty(detailItem.option)){
            const isValid = isOptionValid(detailItem.option, optionSelect);
            if(isValid == false) {
                EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"옵션", str:'옵션 수량을 확인 해 주세요.'});
                return;
            }
        }
        const orderItemData = {prodCD:detailItem.prod_cd, option:optionSelect, amt:amt};
        // 아이템 비교 
        const checkDuple = orderList.filter(el=> el.prodCD == detailItem.prod_cd);
        if(checkDuple.length > 0) {
            // 선택한 아이템이 장바구니에 있으면 비교하기
            const itemData = items.filter(el=>el.prod_cd==detailItem.prod_cd);
            if(itemData.length>0) {
                if(itemData[0]?.prod_gb == "09") {
                    // 옵션있는 메뉴 옵션 선택 구분
                    const compareResult = compareArrays(checkDuple[0].option, optionSelect);
                    if(compareResult == true) {
                        // 이미 있는 메뉴
                        var tmpDuple = Object.assign({},checkDuple[0]);
                        tmpDuple = {...tmpDuple, ...{amt:(Number(tmpDuple.amt)+Number(amt))}};
                        var orderListExc = orderList.filter(el=>el.prodCD != detailItem.prod_cd);
                        
                        var dupleIndex = 0;
                        for(var i=0; i<orderList.length; i++) {
                            if(orderList[i].prodCD == detailItem.prod_cd){
                                dupleIndex = i;
                            }
                        }
                    
                        var tmpOrderList = Object.assign([], orderList);
                        tmpOrderList[dupleIndex] = tmpDuple;
                        dispatch(setMenu({orderList:tmpOrderList,detailItem:{}}));

                        //orderListExc.push(tmpDuple);
                        //dispatch(setMenu({orderList:orderListExc,detailItem:{}}));
                        props.onItemAdd(detailItem.prod_cd);
                    }else {
                        var tmpOrderList = [...orderList,...[orderItemData]];
                        dispatch(setMenu({orderList:tmpOrderList,detailItem:{}}));
                        props.onItemAdd(detailItem.prod_cd);
                    }
                }else {
                    // 이미 있는 메뉴
                    var tmpDuple = Object.assign({},checkDuple[0]);
                    tmpDuple = {...tmpDuple, ...{amt:(Number(tmpDuple.amt)+Number(amt))}};
                    var orderListExc = orderList.filter(el=>el.prodCD != detailItem.prod_cd);
                    var dupleIndex = 0;
                    for(var i=0; i<orderList.length; i++) {
                        if(orderList[i].prodCD == detailItem.prod_cd){
                            dupleIndex = i;
                        }
                    }
                 
                    var tmpOrderList = Object.assign([], orderList);
                    tmpOrderList[dupleIndex] = tmpDuple;
                    dispatch(setMenu({orderList:tmpOrderList,detailItem:{}}));

                    //orderListExc.push(tmpDuple);
                    //dispatch(setMenu({orderList:orderListExc,detailItem:{}}));

                    props.onItemAdd(detailItem.prod_cd);
                }
            }

        }else {
            var tmpOrderList = [...orderList,...[orderItemData]];
            dispatch(setMenu({orderList:tmpOrderList,detailItem:{}}));
            props.onItemAdd(detailItem.prod_cd);
        }

        const data1 = [{"amt": 2, "groupIdx": "3", "prodCD": "2828"},{"amt": 1, "groupIdx": "3", "prodCD": "10012"}, {"amt": 1, "groupIdx": "2", "prodCD": "10003"}, {"amt": 2, "groupIdx": "1", "prodCD": "78098"}, {"amt": 1, "groupIdx": "1", "prodCD": "1111111"}]
        const data2 = [{"amt": 1, "groupIdx": "3", "prodCD": "10012"}, {"amt": 2, "groupIdx": "3", "prodCD": "2828"}, {"amt": 1, "groupIdx": "2", "prodCD": "10003"}, {"amt": 2, "groupIdx": "1", "prodCD": "78098"}, {"amt": 1, "groupIdx": "1", "prodCD": "1111111"}]


    }
    
    // 옵션 선택
    function onOptionSelect(limitCnt, groupIdx, prodCD, operand=null) {
        const optionTrimResult = optionTrimmer(limitCnt, groupIdx, prodCD, optionSelect, operand)
        if(optionTrimResult.result == true) {
            setOptionSelect(optionTrimResult.list);
        }
    }
    
    if (isEmpty(detailItem)) {
        return (<></>)
    }

    const OptList = ({item, prodIcd}) =>{
        if(isEmpty(prodIcd)) {
            return(<></>)
        }
        if(prodIcd.length>0) {
            return prodIcd.map(opts=>{
                const optItem = items.filter(el => el.prod_cd == opts);
                if (isEmpty(optItem)) {
                    return (<></>);
                }
                if(optionSelect.length>0) {
                    var optSelectFilter = optionSelect.filter(optEl => (optEl.prodCD == optItem[0].prod_cd && item.idx==optEl.groupIdx ));
                }else {
                    var optSelectFilter = [];
                }
                //console.log("optItem[0]; ",optItem[0])
                const isSelected = optSelectFilter.length > 0;
                return (
                    <>
                        <OptionItemOnlyView isSelected={isSelected} >
                            <TouchableWithoutFeedback onPress={() => { onOptionSelect(item.limit_count, item.idx, opts, "plus"); }}>
                                <OptionItmeTextOnlyWrapper>
                                    <OptionItemTitleOnlyText isSelected={true} >
                                        { menuName(optItem[0],selectedLanguage)}
                                    </OptionItemTitleOnlyText>
                                </OptionItmeTextOnlyWrapper>
                            </TouchableWithoutFeedback>
                            {Number(item.limit_count) != 1 &&
                                <OptionItemAmountViewOnly>
                                    <TouchableWithoutFeedback onPress={() => { onOptionSelect(item.limit_count, item.idx, opts, "plus"); }} >
                                        <OptionItemAmountBtn source={require("../../resources/imgs/drawable-xxxhdpi/bt_add_on_1.png")} />
                                    </TouchableWithoutFeedback>
                                    <OptionItemAmountOnlyText>{optSelectFilter.filter(det=>(det.groupIdx == item.idx&&det.prodCD==optItem[0].prod_cd))[0]?.amt||0}</OptionItemAmountOnlyText>
                                    <TouchableWithoutFeedback onPress={() => { onOptionSelect(item.limit_count, item.idx, opts, "minus"); }} >
                                        <OptionItemAmountBtn source={require("../../resources/imgs/drawable-xxxhdpi/bt_sub_on_1.png")} />
                                    </TouchableWithoutFeedback>
                                </OptionItemAmountViewOnly>
                            }
                            <OptionItemOnlyPriceText>
                                {numberWithCommas(optItem[0].sal_tot_amt)}{strings["원"][`${selectedLanguage}`]}
                            </OptionItemOnlyPriceText>
                        </OptionItemOnlyView>
                    </>
                );
            })
        }else {
            return(<></>)
        }
    }

    return (
        <>
            <BackgroundWrapper>
                <BackgroundDim />
                <PopupWrapper>
                    <OrderArea>
                        <TouchableWithoutFeedback onPress={()=>{dispatch(setMenu({ detailItem: {} }));}} >
                            <CloseBtnView>
                                <CloseBtnIcon source={require("../../resources/imgs/drawable-xxxhdpi/img_close_1.png")}/>
                            </CloseBtnView>
                        </TouchableWithoutFeedback>
                        <ItemView>
                            <ItemViewInfo>
                                <MenuBorder>
                                    <ItemDetailViewImage source={{ uri: detailItem?.gimg_chg }} resizeMode={FastImage.resizeMode.cover} />
                                    <ItemTitle>{menuName(detailItem,selectedLanguage)}</ItemTitle>
                                    <ItemPrice>{numberWithCommas(detailItem?.sal_tot_amt)}{strings["원"][`${selectedLanguage}`]}{optPrice>0?"+"+numberWithCommas(optPrice)+strings["원"][`${selectedLanguage}`]:""}</ItemPrice>
                                </MenuBorder>
                            </ItemViewInfo>
                            <ItemViewSelectedOption>
                                <ItemViewSelectedOptionBorder>
                                    <ScrollView style={{width:'100%',height:'100%'}}>
                                        <ItemViewSelectedOptionText>{optString}</ItemViewSelectedOptionText>
                                    </ScrollView>
                                </ItemViewSelectedOptionBorder>
                            </ItemViewSelectedOption>
                            <ItemViewSelectedCountView>
                                <TouchableWithoutFeedback onPress={()=>{setAmt(Number(amt)+1)}} >
                                    <ItemViewSelectedCountBtn source={require('../../resources/imgs/drawable-xxxhdpi/bt_add_off_1.png')} resizeMode="contain" />
                                </TouchableWithoutFeedback>
                                    <ItemAmtText>{amt}</ItemAmtText>
                                <TouchableWithoutFeedback onPress={()=>{ if(amt>1){ setAmt(Number(amt)-1)}} } >
                                    <ItemViewSelectedCountBtn source={require('../../resources/imgs/drawable-xxxhdpi/bt_sub_off_1.png')} resizeMode="contain" />
                                </TouchableWithoutFeedback>
                            </ItemViewSelectedCountView>
                        </ItemView>
                        <OptionsView>
                            <OptionTitle>{strings["옵션선택"][`${selectedLanguage}`]}</OptionTitle>
                            <OptionArea>
                                {detailItem.option.length <= 0 &&
                                    <OptionListView showsVerticalScrollIndicator={false} horizontal={false} >
                                        <View></View>
                                    </OptionListView>
                                }
                                {detailItem.option.length > 0 &&
                                    <OptionListView showsVerticalScrollIndicator={false} horizontal={false} >
                                        {
                                            detailItem.option.map(item => {
                                                //return OptList(item, item?.prod_i_cd);
                                                return (
                                                    <OptionTitleView>
                                                        <OptionTitleText>{optionName(item,selectedLanguage)}{Number(item?.limit_count) > 2 ? ` (${strings["필수"][selectedLanguage]} ${numberWithCommas(item?.limit_count)}개)` : ""}</OptionTitleText>
                                                        <OptList item={item} prodIcd={item?.prod_i_cd} />
                                                    </OptionTitleView>
                                                )
                                                return (
                                                    <>
                                                        <OptionTitleView>
                                                            <OptionTitleText>{optionName(item,selectedLanguage)}{Number(item?.limit_count) > 2 ? ` (${strings["필수"][selectedLanguage]} ${numberWithCommas(item?.limit_count)}개)` : ""}</OptionTitleText>
                                                            
                                                            <FlatList
                                                                data={item?.prod_i_cd}
                                                                nestedScrollEnabled={true}
                                                                showsHorizontalScrollIndicator={false}
                                                                horizontal={true}
                                                                renderItem={(opts) => {
                                                                    const optItem = items.filter(el => el.prod_cd == opts.item);
                                                                    if (isEmpty(optItem)) {
                                                                        return (<></>);
                                                                    }
                                                                    if(optionSelect.length>0) {
                                                                        var optSelectFilter = optionSelect.filter(optEl => (optEl.prodCD == optItem[0].prod_cd && item.idx==optEl.groupIdx ));
                                                                    }else {
                                                                        var optSelectFilter = [];
                                                                    }
                                                                    //console.log("optItem[0]; ",optItem[0])
                                                                    const isSelected = optSelectFilter.length > 0;
                                                                    return (
                                                                        <>
                                                                            <OptionItemView>
                                                                                <OptionItemImg source={{ uri: (optItem[0].gimg_chg) }} />
                                                                                <TouchableWithoutFeedback onPress={() => { onOptionSelect(item.limit_count, item.idx, opts.item, "plus"); }}>
                                                                                    <OptionItmeTextWrapper>
                                                                                        <OptionItemSelected isSelected={isSelected} />
                                                                                        <BlackDimWRapper />
                                                                                        <OptionItemTitleText isSelected={true} >
                                                                                            { menuName(optItem[0],selectedLanguage)}
                                                                                        </OptionItemTitleText>
                                                                                        <OptionItemPriceText>
                                                                                            {numberWithCommas(optItem[0].sal_tot_amt)}{strings["원"][`${selectedLanguage}`]}
                                                                                        </OptionItemPriceText>
                                                                                    </OptionItmeTextWrapper>
                                                                                </TouchableWithoutFeedback>
                                                                                {Number(item.limit_count) != 1 &&
                                                                                    <OptionItemAmountView>
                                                                                        <TouchableWithoutFeedback onPress={() => { onOptionSelect(item.limit_count, item.idx, opts.item, "plus"); }} >
                                                                                            <OptionItemAmountBtn source={require("../../resources/imgs/drawable-xxxhdpi/bt_add_on_1.png")} />
                                                                                        </TouchableWithoutFeedback>
                                                                                        <OptionItemAmountText>{optSelectFilter.filter(det=>(det.groupIdx == item.idx&&det.prodCD==optItem[0].prod_cd))[0]?.amt||0}</OptionItemAmountText>
                                                                                        <TouchableWithoutFeedback onPress={() => { onOptionSelect(item.limit_count, item.idx, opts.item, "minus"); }} >
                                                                                            <OptionItemAmountBtn source={require("../../resources/imgs/drawable-xxxhdpi/bt_sub_on_1.png")} />
                                                                                        </TouchableWithoutFeedback>
                                                                                    </OptionItemAmountView>
                                                                                }
                                                                            </OptionItemView>

                                                                        </>
                                                                    );
                                                                }}
                                                            />
                                                        </OptionTitleView>
                                                    </>
                                                );
                                            })
                                        }
                                    </OptionListView>
                                }

                            </OptionArea>
                        </OptionsView>
                    </OrderArea>
                    <ButtonWrapper>
                        <TouchableWithoutFeedback onPress={()=>{ addItemToCart(); }} >
                            <ButtonView backgroundColor={colorRed}>
                                <ButtonImage resizeMode="contain" source={require("../../resources/imgs/drawable-xxxhdpi/img_order_1.png")} />
                                <ButtonText>{strings["주문하기"][`${selectedLanguage}`]}</ButtonText>
                            </ButtonView>
                        </TouchableWithoutFeedback>
                    </ButtonWrapper>
                    {/* <BottomButton
                        greenTitle={strings["주문하기"][`${selectedLanguage}`]}
                        greenIcon={require("../../resources/imgs/drawable-xxxhdpi/img_order_1.png")}
                        redTitle={strings["닫기"][`${selectedLanguage}`]}
                        redIcon={require("../../resources/imgs/drawable-xxxhdpi/img_close_1.png")}
                        onGreenClicked={() => { addItemToCart(); }}
                        onRedClicked={() => { dispatch(setMenu({ detailItem: {} })); }}
                    /> */}
                </PopupWrapper>
            </BackgroundWrapper>
        </>
    )
}