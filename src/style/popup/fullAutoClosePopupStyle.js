import { styled } from "styled-components";
import { colorBlack, colorRed } from "../../resources/colors";


export const FullWrapper = styled.View`
    flex:1;
    width:100%;
    height:100%;
    position:absolute;
    zIndex:99;
    justifyContent:center;
    alignItems:center;
`

export const FullWrapperBlackDimWRapper = styled.View`
    width:100%;
    height:100%;
    backgroundColor:${colorBlack};
    opacity:0.7;
    position:absolute;
    borderRadius:10px;
`
export const FullWrapperText = styled.Text`
    color:${colorRed};
    fontSize:150px;
    fontWeight:600;
`