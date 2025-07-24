import { TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { colorBlack, colorGreen, colorRed, colorWhite } from "../resources/colors";
import { ButtonImage, ButtonText, ButtonView, ButtonWrapper, RoundButtonTextBig, RoundButtonWrapper } from "../style/common";
import { Picker } from "@react-native-picker/picker";
import { LightGreyRoundSquareWrapper } from "../style/popup/popupStyle";

export const LongButton = () => {
    return(
        <>
        
        </>
    )
}

export const BottomButton = (props) => {

    const greenTitle = props?.greenTitle;
    const greenIcon = props?.greenIcon;
    const redTitle = props?.redTitle;
    const redIcon = props?.redIcon;

    return(
        <>
            <ButtonWrapper>
                <TouchableWithoutFeedback onPress={()=>{props?.onGreenClicked()}} >
                    <ButtonView backgroundColor={colorGreen}>
                        <ButtonImage resizeMode="contain" source={greenIcon} />
                        <ButtonText>{greenTitle}</ButtonText>
                    </ButtonView>
                </TouchableWithoutFeedback>
                <TouchableWithoutFeedback onPress={()=>{props?.onRedClicked()}} >
                    <ButtonView backgroundColor={colorRed} >
                        <ButtonImage source={redIcon} resizeMode="contain" />
                        <ButtonText>{redTitle}</ButtonText>
                    </ButtonView>
                </TouchableWithoutFeedback>
            </ButtonWrapper>
        </>
    )
}


export const BigTextButton = (props) =>{
    return(
        <TouchableOpacity style={{flex:1}} onPress={props.onPress}>
            <RoundButtonWrapper flexDirection={"row"} backgroundColor={props.color} borderRadius={10} paddingRight={10} >
                    <RoundButtonTextBig color={props?.titleColor?props?.titleColor:colorWhite} >{props?.title}</RoundButtonTextBig>
                </RoundButtonWrapper>
        </TouchableOpacity>
    )
} 


// 셀렉트 박스
export const MyInstallmentSelectBox = (props) =>{
    const data = props?.data;
    const width = props?.width;
    const selected = props?.selected;
    return(
        <>
            <LightGreyRoundSquareWrapper>
                <Picker
                    key={props?.keyStr}
                    ref={props?.refs}
                    style={{width:width}}
                    selectedValue={selected}
                    mode='dropdown'
                    onValueChange={(itemValue, itemIndex) => {
                        //if(itemValue) {
                            props?.onSelect(itemValue);
                        //}
                    }}>
                        <Picker.Item key={"00"} style={{color:colorBlack}} label={"일시불"} value={"00"} />
                        {
                            data&&
                            data?.map(el =>{
                                return(
                                    <Picker.Item key={"item_"+el.value} style={{color:colorBlack}} label={el.label} value={el.value} />
                                )
                            })
                        }
                </Picker>
            </LightGreyRoundSquareWrapper>
        </>
    )
}
