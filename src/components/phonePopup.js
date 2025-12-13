/* import { useDispatch, useSelector } from "react-redux"
import { ConfirmPopupButtonArea, ConfirmPopupButtonCancel, ConfirmPopupButtonCancelText, ConfirmPopupButtonOK, ConfirmPopupButtonOKText, ConfirmPopupDim, ConfirmPopupIcon, ConfirmPopupMsgArea, ConfirmPopupTextArea, ConfirmPopupTextBlack, ConfirmPopupTextRed, ConfirmPopupTitleText, ConfirmPopupTitleWrapper, ConfirmPopupView, ConfirmPopupWrapper } from "../style/popup/popupCommon";
import FastImage from "react-native-fast-image";
import { TouchableWithoutFeedback } from "react-native";
import { onConfirmCancelClick, onConfirmOKClick, setCommon } from "../store/common";
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import Modal from 'react-native-modal';
import { useDispatch, useSelector } from 'react-redux';
import { setPhoneNumber } from '../store/phone';
import { dispatchShowAlert, setCommon } from '../store/common';
import { colorBlack, colorGreen, colorWhite } from '../resources/colors';
import Immersive from "react-native-immersive-mode";
import { EventRegister } from 'react-native-event-listeners';
import { initOrderList } from '../store/menu';
import { adminDataPost, printReceipt, setBell } from '../utils/common';
import { setFullPopup } from '../store/fullPopup';
import { storage } from '../utils/localStorage';


export const PhonePopup = () => {
    const dispatch = useDispatch();
    const savedNumber = useSelector((state) => state.phone);
    const {isPhonePopup, adminPostData} = useSelector(state => state.common);
    const {orderList, breadOrderList, items, payResultData} = useSelector(state => state.menu);
    const {strings,selectedLanguage} = useSelector(state=>state.common);

    const [phoneNumber, setPhoneNumberState] = useState("");

    
    function onClose() {
        dispatch(setCommon({isPhonePopup:false}));
    }
    // 키패드 입력
    const handlePress = (num) => {
        if(phoneNumber.length<8) {
            setPhoneNumberState(`${phoneNumber}${num}`);    
        }
    };

    // 삭제 버튼
    const handleDelete = () => {
        setPhoneNumberState(phoneNumber.slice(0, -1));
    };

    // 입력 버튼 (Redux에 저장)
    const handleSubmit = () => {
        if(phoneNumber.length<8) {
            EventRegister.emit("showAlert",{showAlert:true, msg:"", title:"알림", str:"정확한 휴대폰번호를 입력 해 주세요."});
        }else {
            adminDataPost(adminPostData.result, adminPostData.orderFinalData ,adminPostData.items, `010${phoneNumber}`).catch(err=>{return err});
            dispatch(setPhoneNumber(""));
            setPhoneNumberState("");
            onClose(); // 팝업 닫기

            dispatch(dispatchShowAlert({title:"영수증", msg:"영수증을 출력하시겠습니까?", 
              okFunction:async ()=>{ 
                await printReceipt(orderList, breadOrderList, items, payResultData); 
                dispatch(initOrderList()); 
                if(storage.getString("isBellUse")=="Y"){
                  setBell(dispatch,orderList,items);
                }else {
                  storage.set("LAN",LAN_KO);
                  dispatch(setCommon({selectedLanguage:LAN_KO}));
                  dispatch(setCommon({isAddShow:true})); 
                }
                /* dispatch(setFullPopup({isShow:true,fullPopupText:strings["주문완료"][`${selectedLanguage}`]})); */
              }, 
              cancelFunction:()=>{
                dispatch(initOrderList());
                
                if(storage.getString("isBellUse")=="Y"){
                  setBell(dispatch,orderList,items);
                }else {
                  storage.set("LAN",LAN_KO);
                  dispatch(setCommon({selectedLanguage:LAN_KO}));
                  dispatch(setCommon({isAddShow:true}));
                }
                /* dispatch(setFullPopup({isShow:true,fullPopupText:strings["주문완료"][`${selectedLanguage}`]})); */
              } 
            }
            )
          ); 
        }
    };
    if(isPhonePopup == false) {
        return(<></>)
    }

    return (
      /*   <Modal 
            isVisible={isPhonePopup} 
            onBackdropPress={onClose} 
            style={styles.modal}
        > */
            <View
                style={{
                    width:'100%',
                    height:'100%',
                    position:'absolute',
                    backgroundColor:"rgba(0,0,0,0.7)",
                    justifyContent:'center',
                    alignItems:'center'
                }}
            >
          <View style={styles.container}>
            <Text style={styles.title}>휴대 전화 번호를 입력해주세요.</Text>
            <Text style={styles.subtitle}>주문완료시 알림톡이 전송됩니다.</Text>
    
            <View style={styles.inputContainer}>
              <Text style={styles.prefix}>010-</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                defaultValue={phoneNumber}
                placeholder="뒷번호 입력"
                editable={false}
              />
            </View>
    
            {/* 약관 동의 */}
            <View style={styles.termsContainer}>
              <TouchableOpacity>
                <Text style={styles.termsText}>✅ 서비스 이용 및 개인정보 취급방침에 동의 합니다.</Text>
              </TouchableOpacity>
            </View>
    
            {/* 키패드 */}
            <View style={styles.keypad}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '<', '0', '입력'].map((item, index) => {
                if(item== "<" || item== "입력" ) {
                    return(
                        <TouchableOpacity
                        key={index}
                        style={styles.keyGreen}
                        onPress={() => {
                            if (item === '<') handleDelete();
                            else if (item === '입력') handleSubmit();
                            else handlePress(item);
                        }}
                        >
                            <Text style={styles.keyWhiteText}>{item}</Text>
                        </TouchableOpacity>
                    )
                }else {
                    return(
                        <TouchableOpacity
                        key={index}
                        style={styles.key}
                        onPress={() => {
                            if (item === '<') handleDelete();
                            else if (item === '입력') handleSubmit();
                            else handlePress(item);
                        }}
                        >
                            <Text style={styles.keyText}>{item}</Text>
                        </TouchableOpacity>
                    )
                }
                
              })
              }
            </View>
          </View>
          </View>
 
    );

}


const styles = StyleSheet.create({
    modal: { justifyContent: 'center', alignItems: 'center' },
    container: {
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 10,
      alignItems: 'center',
      width: 700,
      height:800,
    },
    title: { fontSize: 30, fontWeight: 'bold', marginBottom: 5, color:colorBlack, marginTop:30 },
    subtitle: { fontSize: 24, color: 'gray', marginBottom: 15, color:colorBlack, },
    inputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop:20 },
    prefix: { fontSize: 30, fontWeight: 'bold' },
    input: {
      borderWidth: 1,
      borderRadius:10,
      borderColor: 'gray',
      fontSize: 30,
      paddingTop: 10,
      paddingBottom: 10,
      paddingLeft: 14,
      paddingRight: 14,
      width: 300,
      textAlign: 'left',
      marginLeft:14,
    },
    termsContainer: { marginBottom: 0, marginTop:30 },
    termsText: { fontSize: 18, color: 'red' },
    keypad: { width:500, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop:50 },
    key: {
      width: 130,
      height: 80,
      margin: 5,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colorWhite,
      borderWidth:1,
      borderColor:colorGreen,
      borderRadius: 10,
    },
    keyGreen: {
        width: 130,
        height: 80,
        margin: 5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colorGreen,
        borderWidth:1,
        borderColor:colorGreen,
        borderRadius: 10,
      },
    keyText: { fontSize: 30, color:colorGreen, fontWeight: 'bold' },
    keyWhiteText: { fontSize: 30, color:colorWhite, fontWeight: 'bold' },
  });
  
  export default PhonePopup;
