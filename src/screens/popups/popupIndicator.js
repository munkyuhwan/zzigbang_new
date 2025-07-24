import { ActivityIndicator, Pressable, TouchableWithoutFeedback } from "react-native";
import { IndicatorWrapper, PopInticatorCancelWrapper, PopupIndicatorText, PopupIndicatorWrapper, PopupSpinner, TextIndicatorWrapper } from "../../style/popup/popupIndicatorStyle";


const PopupIndicator = (props) => {
    return (
             <PopupIndicatorWrapper>
                <IndicatorWrapper>
                    <TextIndicatorWrapper>
                        <PopupSpinner size={'large'}/>
                        <PopupIndicatorText>{props?.text}</PopupIndicatorText>
                    </TextIndicatorWrapper>
                    {props?.closeText != "" &&
                    <PopInticatorCancelWrapper>
                        <Pressable onPress={()=>{ props?.onClosePress(); }} >
                            <PopupIndicatorText>{props?.closeText}</PopupIndicatorText>
                        </Pressable>
                    </PopInticatorCancelWrapper>
                    }
                </IndicatorWrapper>
            </PopupIndicatorWrapper>
    )
}
export default PopupIndicator;