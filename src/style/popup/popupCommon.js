import { styled } from "styled-components";
import { colorBlack, colorCartFont, colorGreen, colorGrey, colorPink, colorRed, colorWhite } from "../../resources/colors";
import FastImage from "react-native-fast-image";
import { FlatList, Image, ScrollView } from "react-native";
import { ScrollView as GestureScrollView } from "react-native-gesture-handler";
import { ListViewComponent } from "react-native";

export const BackgroundWrapper = styled.View`
    width:100%;
    height:100%;
    backgroundColor:transparent;
    position:absolute;
`
export const BackgroundDim = styled.View`
    width:100%;
    height:100%;
    position:absolute;
    backgroundColor:rgba(0,0,0,0.7);
`
export const PopupWrapper = styled.View`
    width:70%;
    height:90%;
    backgroundColor:${colorWhite};
    margin:auto;
    borderRadius:20px;
    paddingTop:17px;
    paddingBottom:0px;
    paddingLeft:10px;
    paddingRight:10px;
    flexDirection:column;
`
export const OrderArea = styled.View`
    backgroundColor:${colorWhite};
    width:100%;
    height:100%;
    flexDirection:row;
    flex:1;
    paddingBottom:10px;
`
export const ItemView = styled.View`
    flex:0.8;
    paddingRight:7px;
`
export const ItemViewInfo = styled.View`
    flex:1;
    justifyContent:center;
    alignItems:center;
    paddingTop:30px;
`
export const MenuBorder = styled.View`
    borderWidth:1px;
    borderColor:${colorRed};
    borderRadius:10px; 
    paddingBottom:20px;
    justifyContent:center;
    alignItems:center;
`
export const ItemViewImage = styled(FastImage)`
    width:504px;
    height:350px;
    borderRadius:14px;
`
export const ItemDetailViewImage = styled(FastImage)`
    width:504px;
    height:350px;
    borderTopLeftRadius:8px;
    borderTopRightRadius:8px;
`
export const ItemViewSelectedOption = styled.View`
    paddingLeft:40px;
    paddingRight:40px;
    flex:0.4;
`
export const ItemViewSelectedOptionBorder = styled.View`
    borderColor:${colorRed};
    borderWidth:2px;
    borderRadius:10px;
    width:100%;
    padding:10px;
    margin:auto;
    alignItems:center;
    justifyContent:center;
    overflow:scroll;
`
export const ItemViewSelectedOptionText = styled.Text`
    color:${colorRed};
    fontSize:23px;
    fontWeight:bold;
`
export const ItemViewSelectedCountView = styled.View`
    flex:0.25;
    flexDirection:row;
    paddingLeft:20px;
    paddingRight:20px;
`
export const ItemViewSelectedCountBtn = styled(Image)`
    flex:1;
    width:60px;
    height:60px;
    margin:auto;
`
export const OptionsView = styled.View`
    flex:1;
    paddingTop:10px;
`
export const OptionTitle = styled.Text`
    fontSize:30px;
    color:${colorBlack};
    fontWeight:bold;
`
export const OptionArea = styled.View`
    flex:1;
`
export const OptionTitleView = styled.View`
    gap:14px;
    marginTop:14px;
    marginBottom:14px;
`
export const OptionTitleText = styled.Text`
    color:${colorCartFont};
    fontSize:25px;
    fontWeight:bold;
`
/* export const OptionListView = styled(FlatList)`
    borderWidth:1px;
    borderColor:${colorGrey};
    borderRadius:10px; 
    paddingBottom:20px;
    paddingLeft:22px;
    paddingRight:22px;
    flex:1;
` */
export const OptionListView = styled(ScrollView)`
    paddingLeft:22px;
    paddingRight:22px;
    flex:1;
` 
export const OptionItemView = styled.View`
    width:210px;
    height:210px;
    flexDirection:column;
    justifyContent:center;
    alignItems:center;
    borderRadius:10px;
    marginRight:14px;
`
export const OptionItemSelected = styled.View`
    position:absolute;
    width:100%;
    height:100%;
    zIndex:9999;
    flexDirection:column;
    justifyContent:center;
    alignItems:center;
    
    ${props=>props?.isSelected?`
        borderWidth:4px;
        borderColor:${colorRed};
    `:""}

    borderRadius:10px;
    marginRight:14px;
`
export const OptionItemImg = styled.Image`
    width:100%;
    height:100%;
    resizeMode:cover;
    borderRadius:10px;
`

export const OptionItemOnlyView = styled.View`
    width:100%;
    height:90px;
    flexDirection:row;
    justifyContent:center;
    alignItems:center;
    borderRadius:10px;
    marginRight:14px;
    borderWidth:${props=>props.isSelected?"3px":"1px"};
    borderColor:${props=>props.isSelected?colorRed:colorBlack};
`
export const OptionItmeTextOnlyWrapper = styled.View`
    height:100%;
    flex:1.3;
    justifyContent:center;
`
export const OptionItemTitleOnlyText = styled.Text`
    color:${colorBlack};
    fontSize:20px;
    fontWeight:bold;
    marginLeft:14px;
`
export const OptionItemOnlyPriceText = styled.Text`
    flex:1;
    color:${colorBlack};
    fontSize:25px;
    fontWeight:bold;
    marginLeft:14px;
    textAlign:right;
    paddingRight:20px;
`
export const OptionItemAmountOnlyView = styled.View`
    flexDirection:row;
    padding:10px;
    bottom:0;
    width:100%;
    zIndex:9999;
`
export const OptionItemAmountOnlyText = styled.Text`
    flex:1;
    fontSize:34px;
    color:${colorBlack};
    fontWeight:bold;
    textAlign:center;   
`
export const OptionItemAmountViewOnly = styled.View`
    flexDirection:row;
    bottom:0;
    flex:1;
`

export const OptionItmeTextWrapper = styled.View`
    position:absolute;
    zIndex:9998;
    width:100%;
    height:100%;
`
export const OptionItemTitleText = styled.Text`
    color:${props=>props.isSelected?colorWhite:colorRed};
    fontSize:20px;
    fontWeight:bold;
    marginLeft:14px;
    marginTop:14px;
`
export const OptionItemPriceText = styled.Text`
    flex:1;
    color:${colorPink};
    fontSize:20px;
    fontWeight:bold;
    marginLeft:14px;
`
export const OptionItemAmountView = styled.View`
    flexDirection:row;
    padding:10px;
    position:absolute;
    bottom:0;
    width:100%;
    zIndex:9999;
`
export const OptionItemAmountBtn = styled.Image`
    width:50px;
    height:50px;
    resizeMode:contain;
    flex:1;
`
export const OptionItemAmountText = styled.Text`
    flex:1;
    fontSize:34px;
    color:${colorWhite};
    fontWeight:bold;
    textAlign:center;
    
`
export const ImgArea = styled.View`

`


export const NonCancelPopupView = styled.View`
    position:absolute;
    width:100%;
    height:100%;
    backgroundColor:transparent;
    justifyContent:center;
    alignItems:center;
`
export const NonCancelPopupTextView = styled.View`
    position:absolute;
    backgroundColor:${colorWhite};
    width:80%;
    minHeight:300px;
    borderRadius:17px;
    justifyContent:center;
    alignItems:center;
    padding:20px;
`

export const NonCancelPopupDimView = styled.View`
    position:absolute;
    backgroundColor:rgba(0,0,0,0.7);
    width:100%;
    height:100%;
`
export const NonCancelPopupText = styled.Text`
    color:${colorBlack};
    fontSize:80px;
`

// confirm popup

export const ConfirmPopupView = styled.View`
    flex:1; 
    flexDirection:column;
    position:absolute;
    width:100%;
    height:100%;
    zIndex:99999999999;
    justifyContent:center;
    alignItems:center;
`
export const ConfirmPopupDim = styled.View`
    flex:1; 
    position:absolute;
    width:100%;
    height:100%;
    backgroundColor:rgba(0,0,0,0.7);
`
export const ConfirmPopupWrapper = styled.View`
    width:800px;
    height:800px;
    position:absolute;
    backgroundColor:${colorWhite};
    borderRadius:13px;
`
export const ConfirmPopupTitleWrapper = styled.View`
    width:100%;
    height:60px;
    backgroundColor:${colorRed};
    borderTopLeftRadius:13px;
    borderTopRightRadius:13px;
    justifyContent:center;
    alignItems:center;
`
export const ConfirmPopupTitleText = styled.Text`
    color:${colorWhite};
    fontSize:24px;
    fontWeight:bold;
`
// 메시지 영역
export const ConfirmPopupMsgArea = styled.View`
    flex:1;
    justifyContent:center;
    alignItems:center;
`
export const ConfirmPopupIcon = styled(FastImage)`
    flex:1;
    width:200px;
    height:500px;
    marginTop:100px;
`
export const ConfirmPopupTextArea = styled.View`
    flex:0.8;
    width:100%;
    flexDirection:row;
    justifyContent:center;
    alignItems:center;
`
export const ConfirmPopupTextRed = styled.Text`
    fontSize:50px;
    color:${colorRed};
`
export const ConfirmPopupTextBlack = styled.Text`
    fontSize:50px;
    color:${colorBlack};
    textAlign:center;
    fontWeight:bold;
`
export const ConfirmPopupTextBlackSmall = styled.Text`
    fontSize:30px;
    color:${colorBlack};
`
// 버튼 영역
export const ConfirmPopupButtonArea = styled.View`
    flex:0.3;
    flexDirection:row;
    jsutifyContent:center;
    alignItems:center;
    gap:30px;
    margin:auto;
`
export const ConfirmPopupButtonOK = styled.View`
    width:300px;
    height:100px;
    backgroundColor:${colorGreen};
    borderRadius:50px;
    borderWidth:1px;
    bordercolor:${colorGreen};
    justifyContent:center;
    alignItems:center;
`
export const ConfirmPopupButtonOKText = styled.Text`
    color:${colorWhite};
    fontSize:30px;
    fontWeight:bold;
`
export const ConfirmPopupButtonCancel = styled.View`
    width:300px;
    height:100px;
    backgroundColor:${colorWhite};
    borderRadius:50px;
    borderWidth:1px;
    bordercolor:${colorGreen};
    justifyContent:center;
    alignItems:center;
`
export const ConfirmPopupButtonCancelText = styled.Text`
    color:${colorGreen};
    fontSize:30px;
    fontWeight:bold;
`