import { NonCancelPopupDimView, NonCancelPopupText, NonCancelPopupTextView, NonCancelPopupView } from "../../style/popup/popupCommon";


const BasicNonCancel = (props) =>{
    const text = props.text
    const isShow = props.isShow;

    if(isShow==false) {
        return(<></>)
    }

    return(
        <>
            <NonCancelPopupView>
                <NonCancelPopupDimView/>
                <NonCancelPopupTextView>
                    {text &&
                        <NonCancelPopupText>{text}</NonCancelPopupText>
                    }
                </NonCancelPopupTextView>
            </NonCancelPopupView>
        </>
    )
}

export default BasicNonCancel;