import { TouchableWithoutFeedback } from "react-native";
import { PaymentSelectionItemIcon, PaymentSelectionItemIconView, PaymentSelectionItemTitle, PaymentSelectionItemTitleView, PaymentSelectionItemView, PaymentSelectionListView, PaymentSelectionTitle, PaymentSelectionTitleView, PaymentSelectionView } from "../../style/popup/paymentSelectionPopupStyle";
import { EventRegister } from "react-native-event-listeners";
import { useDispatch } from "react-redux";
import { setMenu, startPayment } from "../../store/menu";


const PaymentSelectionPopup = (props) => {
    const totalPrice = props?.totalPrice;
    const totalVat = props?.totalVat;
    const dispatch = useDispatch();

    function goPay() {
        if(totalPrice<=0 ) {
            EventRegister.emit("showAlert", { showAlert: true, msg: "", title: "결제", str: "메뉴를 선택 해 주세요." });
            return;
        }
        dispatch(startPayment({totalPrice,totalVat}))
    }

    return (
        <>
            <PaymentSelectionView>
                <TouchableWithoutFeedback onPress={()=>{dispatch(setMenu({isPayStarted:true}))}}>
                    <PaymentSelectionTitleView>
                        <PaymentSelectionTitle>결제 방법을 선택하세요.</PaymentSelectionTitle>
                    </PaymentSelectionTitleView>
                </TouchableWithoutFeedback>
                <PaymentSelectionListView>
                    <TouchableWithoutFeedback onPress={()=>{goPay()}}>
                        <PaymentSelectionItemView borderWidth={"1px"} >
                            <PaymentSelectionItemIconView>
                                <PaymentSelectionItemIcon resizeMode="contain" source={require("../../resources/imgs/drawable-xxxhdpi/img_payment_1.png")} />
                            </PaymentSelectionItemIconView>
                            <PaymentSelectionItemTitleView>
                                <PaymentSelectionItemTitle isHidden={false} >신용카드</PaymentSelectionItemTitle>
                            </PaymentSelectionItemTitleView>
                        </PaymentSelectionItemView>
                    </TouchableWithoutFeedback>

                    <TouchableWithoutFeedback onPress={() => { EventRegister.emit("showAlert", { showAlert: true, msg: "", title: "준비중", str: "준비중 입니다." }); }}>
                        <PaymentSelectionItemView borderWidth={"1px"} >
                            <PaymentSelectionItemIconView>
                                <PaymentSelectionItemIcon resizeMode="contain" source={require("../../resources/imgs/drawable-xxxhdpi/img_payment_2_1.png")} />
                            </PaymentSelectionItemIconView>
                            <PaymentSelectionItemTitleView>
                                <PaymentSelectionItemTitle isHidden={true} >{"카카오페이\n간편결제"}</PaymentSelectionItemTitle>
                            </PaymentSelectionItemTitleView>
                        </PaymentSelectionItemView>
                    </TouchableWithoutFeedback>
                    <TouchableWithoutFeedback onPress={() => { EventRegister.emit("showAlert", { showAlert: true, msg: "", title: "준비중", str: "준비중 입니다." }); }}>
                        <PaymentSelectionItemView borderWidth={"1px"} >
                            <PaymentSelectionItemIconView>
                                <PaymentSelectionItemIcon resizeMode="contain" source={require("../../resources/imgs/drawable-xxxhdpi/img_payment_3_1.png")} />
                            </PaymentSelectionItemIconView>
                            <PaymentSelectionItemTitleView>
                                <PaymentSelectionItemTitle isHidden={true} >모바일 교환권</PaymentSelectionItemTitle>
                            </PaymentSelectionItemTitleView>
                        </PaymentSelectionItemView>
                    </TouchableWithoutFeedback>
                </PaymentSelectionListView>
                <PaymentSelectionListView>
                    <TouchableWithoutFeedback onPress={() => { EventRegister.emit("showAlert", { showAlert: true, msg: "", title: "준비중", str: "준비중 입니다." }); }}>
                        <PaymentSelectionItemView borderWidth={"1px"} >
                            <PaymentSelectionItemIconView>
                                <PaymentSelectionItemIcon resizeMode="contain" source={require("../../resources/imgs/drawable-xxxhdpi/img_payment_4_1.png")} />
                            </PaymentSelectionItemIconView>
                            <PaymentSelectionItemTitleView>
                                <PaymentSelectionItemTitle isHidden={true} >포인트 사용</PaymentSelectionItemTitle>
                            </PaymentSelectionItemTitleView>
                        </PaymentSelectionItemView>
                    </TouchableWithoutFeedback>
                    <TouchableWithoutFeedback onPress={() => { EventRegister.emit("showAlert", { showAlert: true, msg: "", title: "준비중", str: "준비중 입니다." }); }}>

                        <PaymentSelectionItemView borderWidth={"1px"} >
                            <PaymentSelectionItemIconView>
                                <PaymentSelectionItemIcon resizeMode="contain" source={require("../../resources/imgs/drawable-xxxhdpi/img_payment_5_1.png")} />
                            </PaymentSelectionItemIconView>
                            <PaymentSelectionItemTitleView>
                                <PaymentSelectionItemTitle isHidden={true} >{"페이코 결제"}</PaymentSelectionItemTitle>
                            </PaymentSelectionItemTitleView>
                        </PaymentSelectionItemView>
                    </TouchableWithoutFeedback>
                    <PaymentSelectionItemView borderWidth={"0px"} >

                    </PaymentSelectionItemView>
                </PaymentSelectionListView>

            </PaymentSelectionView>
        </>
    )
}
export default PaymentSelectionPopup;