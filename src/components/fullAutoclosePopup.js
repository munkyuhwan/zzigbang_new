import { useDispatch, useSelector } from "react-redux"
import { BlackDimWRapper } from "../style/common"
import { FullWrapper, FullWrapperBlackDimWRapper, FullWrapperText } from "../style/popup/fullAutoClosePopupStyle"
import { useEffect } from "react";
import { setFullPopup } from "../store/fullPopup";

const timeout = 2000;
var to = null;

export const FullAutoClosePopup = () => {
    const dispatch = useDispatch();

    const { fullPopupText, isShow } = useSelector(state => state.fullPopup);

    useEffect(()=>{
        if(isShow) {
            to=setTimeout(() => {
                console.log("timeout");
                dispatch(setFullPopup({isShow:false}));
                clearTimeout(to);
                to=null;
            }, timeout);
        }else {

        }
    },[isShow])

    if(!isShow) {
        return(<></>);
    }else {
        return(
            <>
                <FullWrapper>
                    <FullWrapperBlackDimWRapper/>
                    <FullWrapperText>{fullPopupText}</FullWrapperText>
                </FullWrapper>
            </>
        )
    }

}

