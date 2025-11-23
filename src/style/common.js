import { styled } from "styled-components";
import { colorBlack, colorGreen, colorLightGrey, colorPink, colorRed, colorWhite } from "../resources/colors";
import { Image } from "react-native";

export const ButtonWrapper = styled.View`
    flex:0.1; 
    flexDirection:row;
    gap:10px;
    justifyContent:center;
    alignItems:top;
    paddingTop:10px;
    marginBottom:0px;
`;

export const ButtonView = styled.View`
    flexDirection:row;
    width:48%;
    height:70px;
    backgroundColor:${props=>props.backgroundColor};
    borderRadius:10px;
    justifyContent:center;
    alignItems:center;
    gap:15px;
`

export const ButtonViewPercent = styled.View`
    flexDirection:row;
    width:28%;
    height:60px;
    backgroundColor:${props=>props.backgroundColor};
    borderRadius:10px;
    justifyContent:center;
    alignItems:center;
    gap:15px;
`

export const SquareButtonView = styled.View`
    flexDirection:row;
    width:220px;
    height:190px;
    backgroundColor:${props=>props.backgroundColor};
    borderRadius:10px;
    justifyContent:center;
    alignItems:center;
    gap:15px;
`

export const ButtonImage = styled(Image)`
    width:38px;
    height:38px;
`
export const ButtonText = styled.Text`
    color:${colorPink};
    fontSize:25px;
    fontWeight:bold;
    textAlign:center;
`

export const BlackDimWRapper = styled.View`
    width:100%;
    height:100%;
    backgroundColor:${colorBlack};
    opacity:0.4;
    position:absolute;
    borderRadius:10px;
`
export const PinkDimWRapper = styled.View`
    width:100%;
    height:100%;
    backgroundColor:${colorPink};
    opacity:0.4;
    position:absolute;
    borderRadius:10px;
`


export const OpaciyWrapper = styled.View`
    flex:1;
    width:100%;
    height:100%;
    position:absolute;
    zIndex:99999;
    backgroundColor:rgba(0,0,0,0.7);
`
export const PopupButtonWrapper = styled.View`
    flexDirection:row;
    width:100%;
    height:50px;
    gap:6px;
    ${props=>{props?.flexValue? "flex:"+props?.flexValue:'' } };
`

export const RoundButtonWrapper = styled.View`
    flex:1;
    ${props=>{props?.flexDirection?"flexDirection:"+props?.flexDirection+";":""}};
    ${props=>{props?.backgroundColor?"backgroundColor:"+props?.backgroundColor+";":""}};
    ${props=>{props?.borderRadius?`borderRadius:10px;`:""}};
    ${props=>{props?.paddingRight?`paddingLeft:${props?.paddingRight}px;`:""}};
`
export const RoundButtonTextBig = styled.Text`
    margin:auto;
    color:${props => props?.color? props?.color:colorBlack};
    fontWeight:bold;
    fontSize:26px;
`

// 닫기 버튼
export const CloseBtnView = styled.View`
    position:absolute;
    width:50px;
    height:50px;
    right:10px;
    backgroundColor:${colorRed};
    borderRadius:40px;
    padding:1px;
    justifyContent:center;
    alignItems:center;
    textAlign:center;
    zIndex:9999999999;
`
export const CloseBtnIcon = styled.Image`
    resizeMode:contain;
    width:100%;
    height:100%;
`

// 도움버튼
export const AssistanceWrapper = styled.View`
    position:absolute;
    flex:1;
    flexDirection:row;
    width:220px;
    height:70px;
    backgroundColor:${colorWhite};
    left:400px;
    top:10px;
    paddingLeft:14px;
    paddingRight:14px;
    borderWidth:1px;
    borderColor:${colorGreen};
    borderRadius:40px;
    justifyContent:center;
`
export const AssistanceInnerWrapper = styled.View`
    backgroundColor:${colorGreen};
    width:100%;
    height:100%;
    borderRadius:300px;
    justifyContent:center;
    alignItems:center;
`
export const AssistanceText = styled.Text`
    fontSize:28px;
    width:70%;
    textAlign:center;
    lineHeight:37px;
    color:${colorGreen};
    fontWeight:bold;
    margin:auto;
`