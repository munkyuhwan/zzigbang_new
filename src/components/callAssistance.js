import { useDispatch, useSelector } from "react-redux";
import { AssistanceInnerWrapper, AssistanceText, AssistanceWrapper } from "../style/common"
import { TouchableWithoutFeedback } from "react-native";
import { postAssistance } from "../store/common";
import FastImage from "react-native-fast-image";


export const CallAssistance = () => {
    const dispatch = useDispatch();
    const {strings,selectedLanguage, isAddShow} = useSelector(state=>state.common);
    return(
        <>
            <TouchableWithoutFeedback onPress={()=>{dispatch(postAssistance()); }}>
                <AssistanceWrapper>
                        <FastImage style={{width:40,height:40,margin:'auto'}} resizeMode="contain" source={require("../resources/imgs/drawable-xxxhdpi/img_bell_111.png")} />
                        <AssistanceText>{strings["직원호출"][`${selectedLanguage}`]}</AssistanceText>
                </AssistanceWrapper>
            </TouchableWithoutFeedback>
        </>
    )
}