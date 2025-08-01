import { styled } from "styled-components";
import { colorBlack, colorGreen, colorGrey, colorLightGreen, colorWhite, colorYellow } from "../resources/colors";
import { ScrollView } from "react-native";


export const ScanProductList = styled(ScrollView)`
    width:300px;
    height:80%;
    position:absolute; 
    zIndex:999999;
    right:10;
    top:20;
    borderRadius:10px;
    alignItems:flex-end;
    opacity:0.75;
`
export const ScanProductCheckWrapper = styled.View`
    width:38px;
    height:38px;
    borderColor:${colorBlack};
    borderWidth:2px;
    borderRadius:100px;
    backgroundColor:red;
    justifyContents:center;
`

export const RescanView = styled.View`
    width:100%;
    height:50px;
    justifyContents:center;
    alignItems:center;
    backgroundColor:${colorLightGreen};
    borderRadius:13px;
`
export const RescanText = styled.Text`
    fontSize:30px;
    fontWeight:bold;
    color:${colorWhite};
`