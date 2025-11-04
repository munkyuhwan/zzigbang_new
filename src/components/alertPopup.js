import { useDispatch, useSelector } from "react-redux"
import { ConfirmPopupButtonArea, ConfirmPopupButtonCancel, ConfirmPopupButtonCancelText, ConfirmPopupButtonOK, ConfirmPopupButtonOKText, ConfirmPopupDim, ConfirmPopupIcon, ConfirmPopupMsgArea, ConfirmPopupTextArea, ConfirmPopupTextBlack, ConfirmPopupTextBlackSmall, ConfirmPopupTextRed, ConfirmPopupTitleText, ConfirmPopupTitleWrapper, ConfirmPopupView, ConfirmPopupWrapper, ImageArea, SampleImage } from "../style/popup/popupCommon";
import FastImage from "react-native-fast-image";
import { Text, TouchableWithoutFeedback, View } from "react-native";
import { onConfirmCancelClick, onConfirmOKClick, setCommon } from "../store/common";
import { stat } from "react-native-fs";
import { useEffect } from "react";
import { setAlert } from "../store/alert";
import { menuName } from "../utils/common";

export const AlertPopup = () => {
    const dispatch = useDispatch();
    const { selectedLanguage} = useSelector(state=>state.common);

    const IMGS = {
        receipt: require("../resources/imgs/drawable-xxxhdpi/img_receipt.png"),
    }

    const {title, msg, isAlertOpen, okText, subMsg, cancelText, isCancle, isOK, icon, imageArr} = useSelector(state=>state.alert);

    const { orderList, breadOrderList, items } = useSelector(state=>state.menu);
    
    
    function close(type) {
        console.log("close");
        dispatch(setAlert({"isAlertOpen":false, clickType:type, subMsg:"",imageArr:[]}))
    }

    if(isAlertOpen==false ){
        return(<></>)
    }
    return(
        <> 
            <ConfirmPopupView>
                <ConfirmPopupDim/>
                <ConfirmPopupWrapper>
                    <ConfirmPopupTitleWrapper>
                        <ConfirmPopupTitleText>알림</ConfirmPopupTitleText>
                    </ConfirmPopupTitleWrapper>
                    <ConfirmPopupMsgArea>
                        {icon &&
                            <ConfirmPopupIcon resizeMode={FastImage.resizeMode.contain} source={(IMGS[icon])} />
                        }
                        <ConfirmPopupTextArea>
                            <ConfirmPopupTextBlack>{msg}</ConfirmPopupTextBlack>
                        </ConfirmPopupTextArea>
                        {subMsg &&
                            <ConfirmPopupTextBlackSmall>{subMsg}</ConfirmPopupTextBlackSmall>
                        }
                    </ConfirmPopupMsgArea>
                    {imageArr.length>0 &&
                        <ImageArea>
                            {imageArr.map(el=>{
                                return(
                                    <View style={{width:148,alignItems:'center', flexDirection:"column" }}>
                                        <SampleImage resizeMode="contain" source={{uri:el.gimg_chg}}/>
                                        <Text style={{fontSize:30,width:'100%', textAlign:'center'}}>{menuName(el, selectedLanguage)}</Text>
                                    </View>
                                )
                            })
                            }
                        </ImageArea>
                    }
                    <ConfirmPopupButtonArea>
                        {isOK &&
                            <TouchableWithoutFeedback onPress={()=>{ close("OK"); /* dispatch(onConfirmCancelClick({confirmType:"pay"})); */  }} >
                                <ConfirmPopupButtonOK>
                                    <ConfirmPopupButtonOKText>{okText}</ConfirmPopupButtonOKText>
                                </ConfirmPopupButtonOK>
                            </TouchableWithoutFeedback>
                        }
                        {isCancle &&
                            <TouchableWithoutFeedback onPress={()=>{ 
                                    /*  dispatch(onConfirmCancelClick({confirmType:"pay"})); */
                                    close("CANCEL")
                                }} >
                                <ConfirmPopupButtonCancel>
                                    <ConfirmPopupButtonCancelText>{cancelText}</ConfirmPopupButtonCancelText>
                                </ConfirmPopupButtonCancel>
                            </TouchableWithoutFeedback>
                        }
                    </ConfirmPopupButtonArea>
                </ConfirmPopupWrapper>
            </ConfirmPopupView>
        
        </>
    )
    
}