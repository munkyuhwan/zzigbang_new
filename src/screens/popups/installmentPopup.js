import { useDispatch, useSelector } from "react-redux"
import { OpaciyWrapper, PopupButtonWrapper } from "../../style/common";
import { InstallmentPopupWrapper } from "../../style/popup/popupStyle";
import { View } from "react-native";
import { BigTextButton, MyInstallmentSelectBox } from "../../components/commonComponents";
import { useCallback, useEffect, useRef, useState } from "react";
import { colorDarkGrey, colorPink, colorRed } from "../../resources/colors";
import { useFocusEffect } from "@react-navigation/native";
import { setCommon } from "../../store/common";

var isStill=null;

export const InstallmentPopup = () =>{
    const searchTypeRef = useRef();
    const dispatch = useDispatch();
    const { installmentData } = useSelector(state=>state.common);
    const [installmentTxt, setInstallmentTxt] = useState("00");
    const [monthList, setMonthList] = useState([]);
    useFocusEffect(useCallback(()=>{
        var MONTH_LIST = []
        for(var i=2;i<=72;i++) {
            const tmpData = {label:`${i}개월`,value:`${String(i).padStart(2,"0")}`};
            MONTH_LIST.push(tmpData);
        }
        setMonthList(MONTH_LIST);
    },[]))
    if(installmentData.isOpen == false) {
        return(<></>);
    }
    return(
        <>
             <OpaciyWrapper>
                <InstallmentPopupWrapper>
                    <View style={{flex:1,justifyContent:'center',padding:25}}>
                        <MyInstallmentSelectBox keyStr={"searchType"} refs={searchTypeRef} width={280} onSelect={(val)=>{if(val=="none"){setInstallmentTxt("");}else{ setInstallmentTxt(val);}}} selected={installmentTxt} data={monthList} />
                        {/* <PriceInputSingleWrapper flex={0.113} >
                            <InputField isNumeric={true} onChangeText={setInstallmentTxt} isSelected={true} isEditable={true} isComma={true} value={installmentTxt} title={"할부"} width={"80%"} titleColor={backgroundGrey} />
                         </PriceInputSingleWrapper> */}
                    </View>
                    <PopupButtonWrapper flexValue={"0.14"} >
                        <BigTextButton color={colorDarkGrey} title={"취소"} onPress={()=>{ dispatch(setCommon({installmentData:{isOpen:false,isCancel:true,isOk:false,returnData:{},}})); }} />
                        <BigTextButton color={colorRed} title={"결제 진행"} onPress={()=>{  dispatch(setCommon({installmentData:{isOpen:false,isCancel:false,isOk:true,returnData:{installment:installmentTxt},}})); }} />
                    </PopupButtonWrapper>
                </InstallmentPopupWrapper>
            </OpaciyWrapper>
        </>
    )

}