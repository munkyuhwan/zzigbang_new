import { TextInput } from "react-native";
import { styled } from "styled-components";
import { colorBlack, colorGrey, colorLightGrey } from "../resources/colors";

export const SettingWrapper = styled.View`
    flex:1;
`
export const SettingSectionWrapper = styled.View`
    justifyContent:center;
    alignItems:center;
    padding:14px;
`
export const SettingSectionTitle = styled.Text`
    fontSize:30px;
    color:${colorBlack};
    fontWeight:bold;
    padding:14px;
`
export const SettingSectionDetailWrapper = styled.View`
    width:100%;
    gap:10px;
    borderWidth:1px;
    borderRadius:10px;
    padding:14px;
`
export const SettingSectionDetailRowWrapper = styled.View`
    width:100%;
    gap:10px;
    padding:14px;
    flexDirection:row;
    flex:1;
    justifyContents:center;
    alignItems:center;
`
export const SettingSectionDetailInnerWrapper = styled.View`
    flexDirection:row;
    margin:auto; 
    gap:10;
`
export const SettingSenctionInputView = styled.View`
    flexDirection:row;
    justifyContent:center;
    gap:10px;
    alignItems:center;
`
export const SettingSenctionInputViewColumn = styled.View`
    flexDirection:column;
    justifyContent:center;
    gap:10px;
    alignItems:center;
`
export const SettingSectionLabel = styled.Text`
    fontSize:20px;
    color:${colorBlack};
    fontWeight:bold;
`
export const SettingSectionInput = styled(TextInput)`
    width:200px;
    height:40px;
    borderWidth:1px;
    borderRadius:10px;
    color:${colorBlack};
`

export const SettingButtonView = styled.View`
    borderWidth:1px;
    borderRadius:10px;
    backgroundColor:${colorGrey};
`