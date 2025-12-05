import FastImage from "react-native-fast-image";
import { styled } from "styled-components";
import Video from "react-native-video";
import { Text } from "react-native";
import { colorGreen, colorYellow } from "../resources/colors";

export const AdScreenView = styled.View`
    flex:1;
    zIndex:9999999; 
    position:absolute;
    width:100%;
    height:100%;
`

export const SwiperImage = styled(FastImage)`
    width:100%;
    height:100%;
    resizeMode:contain;
`
export const SwiperVideo = styled(Video)`
    width:100%;
    height:100%;
`

export const AdButtonView = styled.View`
    height:28%;
    justifyContent:flex-end;
    alignItems:center;
    flexDirection:row;
`
export const AdButtonSquare = styled.View`
    justifyContent:center;
    alignItems:center;
    flexDirection:column;
    width:50%;
    height:100%;
    paddingTop:40px;
    backgroundColor:${props=>props.bgColor};
    gap:15px;
`
export const AdButtonIconWrapper = styled.View`
    flex:1;
    width:100%;
    alignItems:center;
`
export const AdButtonIcon = styled(FastImage)`
    width:120px;
    height:120px;
    margin:auto;
    bottom:0;
`
export const AdButtonText = styled(Text)`
    color:${colorYellow};
    fontSize:54px;
    fontWeight:bold;
    textAlign:center;
    flex:1;
`



