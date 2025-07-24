import { styled } from "styled-components/native";
import { ActivityIndicator } from "react-native";
import { colorBlack, colorLightGrey, colorWhite } from "../../resources/colors";
const BORDER_RADIUS = "10px";

export const PopupIndicatorWrapper = styled.View`
    backgroundColor:'rgba(2,2,2,0.7)';
    top:0;
    position:absolute;
    width:100%; 
    height:100%;
    zIndex:999;
    justifyContents:center;
    alignItems:center;
    flex:1;
`
export const PopupIndicatorTransparentWrapper = styled.View`
    backgroundColor:#00000000;
    top:0;
    position:absolute;
    width:100%; 
    height:100%;
    zIndex:9999999;
    justifyContents:center;
    alignItems:center;
    flex:1;
`
export const IndicatorWrapper = styled.View`
    width:400px;
    backgroundColor:${colorWhite};
    flexDirection:column;
    marginTop:auto;
    marginBottom:auto;
    alignItems:center;
    paddingTop:17px;
    paddingBottom:17px;
    borderRadius:${BORDER_RADIUS};
    paddingLeft:15px;
    paddingRight:15px;
`
export const TextIndicatorWrapper = styled.View`
    flexDirection:row;
    gap:10px;
`
export const PopupSpinner = styled(ActivityIndicator)`

`
export const PopupIndicatorText = styled.Text`
    fontSize:20px;
    color:${colorBlack};
`
export const PopInticatorCancelWrapper = styled.View`
    borderWidth:1px;
    borderRadius:${BORDER_RADIUS};
    backgroundColor:${colorLightGrey};
    paddingLeft:10px;
    paddingRight:10px;
    paddingTop:4px;
    paddingBottom:4px;
    marginTop:4px;
`