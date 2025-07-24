import { styled } from "styled-components";
import { ScrollView } from "react-native";
import { colorLightGrey, colorWhite } from "../../resources/colors";

export const DirectonColumnWrapper= styled.View`
    flex:1;
    flexDirection:column;
    backgroundColor:blue;
`
export const RowWrapper = styled.View`
    flexDirection:row;
    height:${props=>props.height?props.height:"0"}px;
    flex:1;
`
export const ColumnWrapper = styled.View`
    flexDirection:column;
    height:${props=>props.height};
    width:${props=>props.width};
    flex:1;
`

export const GappedWrapper = styled.View`
    flex:1;
    flexDirection:column;
    justify-content:center;
    ${props=>props?.gap? `gap:${props?.gap};`:"" }
    
`
export const RoundOutterWrapper = styled.View`
    backgroundColor:${colorWhite};
    borderTopLeftRadius:22px;
    borderTopRightRadius:22px;
    borderBottomLeftRadius:22px;
    borderBottomRightRadius:22px;
    ${props=>props?.width? `width:${props?.width};`:"" }
    ${props=>props?.height? `height:${props?.height};`:"" }
    ${props=>props?.flex? `flex:${props?.flex};`:"" }
    ${props=>props?.padding? `padding:${props?.padding};`:"" }
`
export const LightGreyRoundSquareWrapper = styled.View`
    borderWidth:1px;
    borderStyle:solid;
    borderRadius:10px;
    borderColor:${colorLightGrey};
    height:57px;
    paddingLeft:14px;
    paddingRight:14px;
`
export const LightGreyRoundSquareWrapperNoPadding = styled.View`
    borderWidth:1px;
    borderStyle:solid;
    borderRadius:8px;
    borderColor:${colorLightGrey};
    height:57px;
`
export const SelectedCouponWrapper = styled(ScrollView)`
    width:80px;
    backgroundColor:red;
    paddingLeft:10px;
    paddingRight:10px;
    flexDirection:column;
`
export const InstallmentPopupWrapper = styled.View`
    width:30%;
    height:40%;
    backgroundColor:${colorWhite};
    margin:auto;
    borderRadius:10px;
    padding:13px;
`