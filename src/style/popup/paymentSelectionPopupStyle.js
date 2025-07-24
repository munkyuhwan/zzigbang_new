import FastImage from "react-native-fast-image";
import { styled } from "styled-components";
import { colorBlack, colorDarkGrey, colorWhite } from "../../resources/colors";

export const PaymentSelectionView = styled.View`
    width:1280px;
    height:984px;
    position:absolute;
    zIndex:999;
    bottom:0;
    right:0;
    backgroundColor:${colorWhite};
`
export const PaymentSelectionTitleView = styled.View`
    justifyContent:center;
    textAlign:center;
    alignItems:center;
    flex:0.4;
`
export const PaymentSelectionTitle = styled.Text`
    color:${colorBlack};
    fontSize:50px;
    fontWeight:bold;
`


export const PaymentSelectionListView = styled.View`
    flex:1;
    flexDirection:row;
    paddingRight:100px;
    paddingLeft:100px;
    gap:50px;
    justifyContent:center;
    alignItems:center;
`
export const PaymentSelectionItemView = styled.View`
    width:300px;
    height:350px;
    justifyContent:center;
    alignItems:center;
    textAlign:center;
    flexDirection:column;
    borderRadius:40px;
    borderWidth:${props => props.borderWidth};
    borderColor:${colorDarkGrey};
`
export const PaymentSelectionItemIconView = styled.View`
    flex:1;
    height:100%;
    width:100%;
    padding:40px;
    justifyContent:center;
    alignItems:center;
`
export const PaymentSelectionItemIcon = styled(FastImage)`
    width:80%;
    height:80%;
`
export const PaymentSelectionItemTitleView = styled.View`
    flex:1;
    paddingBottom:40px;
`
export const PaymentSelectionItemTitle = styled.Text`
    color:${colorBlack};
    fontWeight:bold;
    fontSize:40px;
    margin:auto;
    textAlign:center;
    ${props=>props.isHidden?"opacity:0.4;":""}
`