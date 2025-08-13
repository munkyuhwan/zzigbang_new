import styled from 'styled-components';
import { colorBackground, colorBlack, colorDarkGrey, colorGreen, colorGrey, colorLightGrey, colorMenuHeader, colorPink, colorRed, colorTransparent, colorWhite, colorYellow } from '../resources/colors';
import { Image, ScrollView, Text, View } from 'react-native';
import FastImage from "react-native-fast-image";

export const MainWrapper = styled.View`
    flex:1;
    flexDirection:row;
`
// 메뉴 자리
export const MainMenuWrapper = styled.View`
    flex:2;
    backgroundColor:${colorWhite};
`
// 메뉴 해더
export const MainMenuHeaderWrapper = styled.View`
    flexDirection:row;
    backgroundColor:${colorMenuHeader};
    paddingLeft:30px;
    paddingRight:30px;
    paddingTop:8px;
    paddingBottom:8px;
`
export const MainMenuHeaderSectionWrapper = styled.View`
    flex:${props => props.flex};
    margin:auto;
    flexDirection:row;
    justifyContent:center;
    paddingLeft:30px;
    paddingRight:30px;
`
// 로고
export const MainMenuHeaderLogo = styled(Text)`
    color:${colorGreen};
    fontWeight:bold;
    fontSize:30px;
    margin:auto;
`
// 날짜 시간
export const MainMenuHeaderDateTime = styled(Text)`
    backgroundColor:${colorWhite};
    textAlign:center;
    paddingTop:10px;
    paddingBottom:10px;
    paddingLeft:30px;
    paddingRight:30px;
    borderRadius:20px;
    color:${colorGreen};
    fontWeight:bold;
    fontSize:18px;
`
// 언어선택
export const MainMenuHeaderLanguageWrapper = styled.View`
    flex:1;
    flexDirection:row;
    justifyContent:flex-end;
`
export const LanguageWrapper = styled.View`
    backgroundColor:${props => props?.isSelected?colorRed:colorWhite};
    width:56px;
    height:56px;
    borderRadius:50px;
`
export const MainMenuHeaderLanguage = styled(Image)`
    resizeMode:contain;
    width:54px;
    height:54px;
    margin:auto;
`

// 카테고리 스타일
/* export const CategoryWrapper = styled(ScrollView)`
    width:100%;
    flex:0.09;
    marginTop:10px;
    paddingLeft:18px;
    paddingRight:18px;
` */
export const ArrowWrapper = styled.View`
    width:60px;
    height:100%;
    backgroundColor:${colorLightGrey};
    borderRadius:10px;
    justifyContent:center;
`
export const ArrowImg = styled(FastImage)`
    width:30px;
    height:30px;
    margin:auto;
`
export const CategoryWrapper = styled(View)`
    width:100%;
    flex:0.16;
    marginTop:16px;
    paddingLeft:8px;
    paddingRight:8px;
    flexDirection:row;
`
export const CategoryListWrapper = styled.View`
    flexDirection:row;
    flex:1;
    gap:4px;
    flexWrap:wrap;
    alignItems:center;
    justifyContent:center;
    margin:auto;
`
export const NewCategoryItem = styled.View`
    width:19%;
    height:70px;
    backgroundColor:${props => props?.isSelected?colorGreen:(props?.isEmpty?colorLightGrey:colorWhite)};
    ${props=> !props?.isEmpty?`borderColor:${colorGreen};borderWidth:1px;`:""}
    paddingRight:14px;
    paddingLeft:14px;
`
export const CategoryItemUnselect = styled.View`
    minWidth:150px;
    height:55px;
    backgroundColor:${props => props?.isSelected?colorGreen:colorWhite};
    borderColor:${colorGreen};
    borderWidth:2px;
    justifyContents:center;
    textAlign:center;
    marginRight:14px;
    justifyContents:center;
`
export const CategoryItem = styled.View`
    flex:1;
    height:55px;
    backgroundColor:${props => props?.isSelected?colorGreen:colorWhite};
    borderColor:${colorGreen};
    borderWidth:2px;
    justifyContents:center;
    textAlign:center;
    marginRight:14px;
    justifyContents:center;
`
export const CategoryText = styled.Text`
    color:${props => props?.isSelected?colorWhite:colorGreen};
    fontSize:24px;
    fontWeight:bold;
    margin:auto;
`
// 메뉴 영역
export const MenuItemWrapper = styled.View`
    flex:0.8;
    paddingBottom:0px;
`
export const MenuItemListWrapper = styled.View`
    flex:1;
    paddingLeft:10px;
    paddingRight:10px;
    paddingBottom:20px;
    margin:auto;
    width:100%;
`
// 메뉴 카테고리 뤠퍼
export const MenuCategoryTitleWrapper = styled.View`
    width:100%;
    ${props=>props?.isBorder?`borderBottom:solid;borderBottomWidth:2px;borderBottomColor:${colorPink};`:""}
    paddingBottom:3px;
    paddingLeft:${props=>props?.paddingLeft?`${props?.paddingLeft}px;`:'0px;'};
    flexDirection:column;
`
// 메뉴 카테고리 타이틀
export const MenuCategoryTitle = styled.Text`
    fontSize:${props=>props?.fontSiz};
    color:${colorGreen};
    fontWeight:800;
    marginBottom:10px;
    marginTop:10px;
`

// 메뉴 관련
export const ItemGroupWrapper = styled.View`
    flexDirection:row;
    width:100%;
    flexWrap:wrap;
    gap:16px;
`
export const ItemWrapper = styled.View`
    height:280px;
    borderWidth:2px;
    borderRadius:14px;
    borderColor:${props=>props?.isIn?colorGreen:colorGrey};
`
export const ItemInnerWrapper = styled.View`
    flex:1;
    borderRadius:14px;
    width:192px;
    borderColor:${colorGrey};
`
export const ItemTextWrapper = styled.View`
    backgroundColor:${props=>props?.isIn?colorGreen:colorWhite};
    borderBottomLeftRadius:10px;
    borderBottomRightRadius:10px;
    
`
export const ItemImage = styled(FastImage)`
    flex:1;
    width:100%;
    height:150px;
    backgroundColor:${colorBlack};
    margin:auto;
    borderTopLeftRadius:14px;
    borderTopRightRadius:14px;
    borderBottomColor:${colorGrey};
    borderBottomWidth:1px;
`
export const ItemTitle = styled.Text`
    color:${props=>props?.isIn?colorWhite:colorGreen};
    fontWeight:bold;
    fontSize:22px;
    textAlign:center;
    height:60px;
    textAlignVertical:center;
`
export const ItemAmtText = styled.Text`
    color:${colorGreen};
    fontWeight:bold;
    fontSize:42px;
    textAlign:center;
    width:60px;
    textAlignVertical:center;
`
export const ItemPrice = styled.Text`
color:${props=>props?.isIn?colorYellow:colorRed};
fontWeight:bold;
    fontSize:22px;
    width:100%;
    textAlign:center;
    paddingBottom:10px;
`

// 버튼 영역
export const MenuButtonWrapper = styled.View`
    flex:0.3;
`

// 카트 차리
export const MainCartWrapper = styled.View`
    flex:1;
    backgroundColor:${colorBackground};
`
export const CartItemView = styled.View`
    height:95px;
    width:100%;
    backgroundColor:${colorWhite};
    flexDirection:row;
    paddingRight:10px;
    borderRadius:10px;
    alignItems:center;
    justifyContents:center;
`
export const CartItemImage = styled(FastImage)`
    width:130px;
    height:100%;
    backgroundColor:${colorTransparent};
    borderTopLeftRadius:8px;
    borderBottomLeftRadius:8px;
    borderBottomColor:${colorGrey};
    borderBottomWidth:1px;
    margin:auto;
`
// 장바구니 아이템 텍스트   
export const CartItemTextView = styled.View`
    flex:1;
    flexDirection:column;
    justifyContent:center;
    paddingLeft:10px;
`
export const CartItemTitleText = styled.Text`
    color:${colorGreen};
    fontSize:20px;
    fontWeight:bold;
`
export const CartItemOptionText = styled.Text`
    color:${colorRed};
    fontSize:12px;
    fontWeight:bold;
`
// 수량 
export const CartItemAmtWrapper = styled.View`
    flex:1.6;
    justifyContent:center;
    marginRight:10px;
`
export const CartItemAmtBorderWrapper = styled.View`
    borderColor:${colorDarkGrey};
    borderWidth:1px;
    borderRadius:40px;
    alignItems:center;
`
export const CartItemAmtText = styled.Text`
    color:${props=>props?.textColor};
    fontSize:28px;
    fontWeight:bold;
`
// 금액
export const CartItemPriceWrapper = styled.View`
    flex:1;
    flexDirection:row;
    justifyContent:flex-end;
    paddingLeft:10px;
    margin:auto;
`
export const CartItemPriceText = styled.Text`
    color:${colorBlack};
    fontSize:24px;
    fontWeight:bold;
`
// 취소 버튼
export const CartItemCancelWrapper = styled.View`
    flex:0.4;
    justifyContent:center;
    alignItems:center;
`
export const CartItemCancelImage = styled.Image`
    width:45px;
    height:45px;
`
// 총금액
export const CartPaymentWrapper = styled.View`
    width:100%;
    height:80px;
    backgroundColor:${colorGreen};
    flexDirection:row;
    justifyContent:center;
    alignItems:center;
    paddingLeft:10px;
    paddingRight:10px;
`
export const CartPaymentLabel = styled.Text`
    flex:0.8;
    color:${colorWhite};
    fontSize:26px;
`
export const CartPaymentTotalAmt = styled.Text`
    flex:1;
    color:${colorPink};
    fontSize:26px;
    textAlign:right;
    fontWeight:bold;
`

// 메뉴 더보기
export const FloatingBtnWrapper = styled.View`
    position:absolute;
    zIndex:99;
    width:90px;
    height:90px;
    backgroundColor:${colorDarkGrey};
    borderRadius:100px;
    right:50px;
    bottom:120px;
    justifyContent:center;
    alignItems:center;
`
export const FloatingBtnImg = styled(FastImage)`
    width:20px;
    height:20px;
`
export const FloatingBtnText = styled.Text`
    fontSize:20px;
    fontWeight:bold;
    color:${colorWhite};
`

// 장바구니 더보기 버튼
export const CartFloatingBtnWrapper = styled.View`
    position:absolute;
    width:60px;
    height:60px;
    backgroundColor:transparent;
    borderRadius:100px;
    bottom:20px;
    justifyContent:center;
    alignItems:center;
`
export const CartFloatingBtnBg = styled.View`
    position:absolute;
    backgroundColor:rgba(0,0,0,0.7);
    width:100%;
    height:100%;
    borderRadius:100px;
`
export const InnerWrapper = styled.View`
    width:100%;
    height:100%;
    position:absolute;
    zIndex:999999;
    justifyContent:center;
    alignItems:center;
    borderRadius:100px;
`
export const CartFloatingBtnImg = styled(FastImage)`
    width:16px;
    height:16px;
    marginTop:2px;
`
export const InnerWrapperFullWidth = styled.View`
    width:100%;
    height:100%;
    position:absolute;
    zIndex:999999;
    justifyContent:center;
    alignItems:center;
    borderRadius:100px;
`
export const CartFloatingBtnWrapperFullWidth = styled.View`
    position:absolute;
    width:${props=>props?.width};
    height:40px; 
    bottom:0px;
    ${props=>props.isTop?'transform: rotate(180deg);':''}
    top:${props=>props?.top};
    justifyContent:center;
    alignItems:center;
`

export const ButtonGradientWrapper= styled.View`
    flex:0.1; 
    width:100%;
  `

export const CartFloatingBtnImgFullWidth = styled(FastImage)`
    width:16px;
    height:16px;
    marginTop:2px;
`
export const CartFloatingBtnText = styled.Text`
    fontSize:15px;
    fontWeight:bold;
    color:${colorWhite};
    marginTop:4px;
`

export const PayBtnWrapper = styled.View`
    backgroundColor:yellow;
    flexDirection:row;
    width:100%;
    
`