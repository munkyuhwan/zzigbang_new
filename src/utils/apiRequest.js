import axios from 'axios';
import { waitFor } from './common';
import { EventRegister } from 'react-native-event-listeners';
import { ADMIN_API_GOODS } from '../../resources/apiResources';
import { setError } from '../store/error';

export const VAN_KOCES = "koces";
export const VAN_SMARTRO = "smartro";

export async function formRequest(dispatch, url, postData) {
  
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 0.001; // 0.5초
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(url, postData, {
        headers: { 'Content-Type': 'multipart/form-data; boundary=boundary' },
        transformRequest: formData => formData,
        timeout:0
      });
      return response;
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        console.log(`요청 실패 (${attempt}/${MAX_RETRIES}) - 0.1초 후 재시도`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        console.log('모든 재시도 실패');
        return new Error(err);
      }
    }
  }
  
  /* try {
    const response = await axios.post(url,postData, {headers: {'Content-Type': 'multipart/form-data; boundary=boundary'},transformRequest: formData =>  formData,timeout:5000});
    //const response = await axios.post(url,postData, {});
    return response;
    
  }catch(err) {
    return new Error(err);
  } */
}
export async function posApiRequest(url, postData={}) {
  //callApiWithExceptionHandling(`${url}`,postData);
  const uploadFunction = () =>{
    EventRegister.emit("showSpinner",{isSpinnerShow:true, msg:"데이터 요청중입니다.", spinnerType:"",closeText:""});
  }

  return new Promise((resolve, reject)=>{   
    apiCaller(url,postData,uploadFunction, 0)
    .then((result)=>{
      EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
      resolve(result);      
    })
    .catch((err)=>{
      EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
      reject({errorMsg:err.message});
    })
  
  })


}

export async function apiRequest(url, postData={}) {
  //callApiWithExceptionHandling(`${url}`,postData);
  const uploadFunction = () =>{
    EventRegister.emit("showSpinner",{isSpinnerShow:true, msg:"데이터 요청중입니다.", spinnerType:"",closeText:""});
  }

  return new Promise((resolve, reject)=>{   
    apiCaller(url,postData,uploadFunction, 0)
    .then((result)=>{
      if(result?.result == true) {
        resolve(result);
      }else {
        reject({errorMsg:result?.resultMsg});
      }
      
    })
    .catch((err)=>{
      reject({errorMsg:err.message});
    })
  
  })


}

export async function apiCaller(url,postData,uploadFunction, callCnt) {
  const delayTime = 5000;
  const optData = {timeout:1000*60*1, timeoutErrorMessage:'요청시간이 초과되었습니다.', onUploadProgress:uploadFunction};
  try {
    const response = await axios.post(url,postData, optData);
    if (response?.status < 200 || response?.status >= 300) {
      if(callCnt>=5) {
        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
        throw new Error(`API요청 횟수초과: 상태 코드 ${response?.status}`);
      }else {
        await waitFor(delayTime); 
        return apiCaller(url,postData,uploadFunction, callCnt+1); 
      }
    }
    //"result": true, "resultMsg": ""

    if(response?.result == false ) {
      EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
      throw new Error(`API 호출 실패: 상태 코드 ${response?.resultMsg}`);
    }
    // 성공적인 응답 데이터 반환
    EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
    return response?.data;
  }catch (error) {
    await waitFor(delayTime);
    if(callCnt>=5) {
      EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
      throw new Error('API요청 횟수를 초과했습니다.');
    }else {
      if (error.response) {
        // 서버 응답이 있으며 상태 코드가 2xx 범위 밖인 경우
        //throw new Error(`API 호출 실패: 상태 코드 ${error.response.status}, 메시지: ${error.response.data}`);
        if(callCnt>=5) {  
          EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
          throw new Error(`API 호출 실패: 상태 코드 ${error.response.status}`);
        }else {
          return apiCaller(url,postData,uploadFunction, callCnt+1);
        }
      
      } else if (error.request) {
    
        if (error.response) {
          // 서버 응답이 있으며 상태 코드가 2xx 범위 밖인 경우
          //throw new Error(`API 호출 실패: 상태 코드 ${error.response.status}, 메시지: ${error.response.data}`);
          if(callCnt>=5) {  
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
            throw new Error(`API 호출 실패: 상태 코드 ${errorOne.response.status}`);
          }else {
            return apiCaller(url,postData,uploadFunction, callCnt+1);
          }
        } else if (error.request) {
          if(callCnt>=5) {  
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
            throw new Error('API 응답을 받지 못했습니다.');
          }else {
            return apiCaller(url,postData,uploadFunction, callCnt+1);
          }
        }
        else {
          if(callCnt>=5) {  
            // 요청 설정 중 발생한 오류
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
            throw new Error(`API 호출 설정 오류: ${error.message}`);
          }else {
            return apiCaller(url,postData,uploadFunction, callCnt+1);
          }
        }
      }
    } 
  }
}



export async function callApiWithExceptionHandling(url,postData={}) {
    const delayTime = 5000;
    // Axios를 사용하여 API 호출
    const uploadFunction = () =>{
      EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
    }
    const optData = {timeout:1000*60*1, timeoutErrorMessage:'요청시간이 초과되었습니다.', onUploadProgress:uploadFunction, headers:{'content-type': 'multipart/form-data'}};
    try {
      // Axios를 사용하여 API 호출
      const response = await axios.post(url,postData, optData);
      // 응답 상태 코드가 2xx 범위가 아니라면 예외 발생
      if (response?.status < 200 || response?.status >= 300) {
        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
        throw new Error(`API 호출 실패: 상태 코드 ${response?.status}`);
      }
      //"result": true, "resultMsg": ""

      if(response?.result == false ) {
        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
        throw new Error(`API 호출 실패: 상태 코드 ${response?.resultMsg}`);
      }
      // 성공적인 응답 데이터 반환
      EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
      return response?.data;
    } catch (error) { 
      // Axios가 네트워크 에러 또는 타임아웃 등으로 인해 예외를 던졌을 경우
      if (error.response) {
        // 서버 응답이 있으며 상태 코드가 2xx 범위 밖인 경우
        //throw new Error(`API 호출 실패: 상태 코드 ${error.response.status}, 메시지: ${error.response.data}`);
        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
        throw new Error(`API 호출 실패: 상태 코드 ${error.response.status}`);
        
      } else if (error.request) {
        // 요청이 이루어졌으나 응답을 받지 못한 경우
        // 재요청
        //===================================================================================================
        //throw new Error('API 응답을 받지 못했습니다.');
        // 1차 재요청
        await waitFor(delayTime);
        try {
          // Axios를 사용하여 API 호출
          const responseOne = await axios.post(url,postData, optData);
          // 응답 상태 코드가 2xx 범위가 아니라면 예외 발생
          if (responseOne?.status < 200 || responseOne?.status >= 300) {
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
            throw new Error(`API 호출 실패: 상태 코드 ${responseOne?.status}`);
          }
          //"result": true, "resultMsg": ""
    
          if(responseOne?.result == false ) {
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
            throw new Error(`API 호출 실패: 상태 코드 ${responseOne?.resultMsg}`);
          }
          // 성공적인 응답 데이터 반환
          EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
          return responseOne?.data;
        } catch (errorOne) {
          // Axios가 네트워크 에러 또는 타임아웃 등으로 인해 예외를 던졌을 경우
          if (errorOne.response) {
            // 서버 응답이 있으며 상태 코드가 2xx 범위 밖인 경우
            //throw new Error(`API 호출 실패: 상태 코드 ${error.response.status}, 메시지: ${error.response.data}`);
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
            throw new Error(`API 호출 실패: 상태 코드 ${errorOne.response.status}`);
            
          } else if (errorOne.request) {
            // 요청이 이루어졌으나 응답을 받지 못한 경우
            // 재요청
            //===================================================================================================
            //throw new Error('API 응답을 받지 못했습니다.');
            //2차 재요청
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
            await waitFor(delayTime);
            try {
              // Axios를 사용하여 API 호출
              const responseTwo = await axios.post(url,postData, optData);
              // 응답 상태 코드가 2xx 범위가 아니라면 예외 발생
              if (responseTwo?.status < 200 || responseTwo?.status >= 300) {
                EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                throw new Error(`API 호출 실패: 상태 코드 ${responseTwo?.status}`);
              }
              //"result": true, "resultMsg": ""
        
              if(responseTwo?.result == false ) {
                EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                throw new Error(`API 호출 실패: 상태 코드 ${responseTwo?.resultMsg}`);
              }
              // 성공적인 응답 데이터 반환
              EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
              return responseTwo?.data;
            } catch (errorTwo) {
              // Axios가 네트워크 에러 또는 타임아웃 등으로 인해 예외를 던졌을 경우
              if (errorTwo.response) {
                // 서버 응답이 있으며 상태 코드가 2xx 범위 밖인 경우
                //throw new Error(`API 호출 실패: 상태 코드 ${error.response.status}, 메시지: ${error.response.data}`);
                EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                throw new Error(`API 호출 실패: 상태 코드 ${errorTwo.response.status}`);
                
              } else if (errorTwo.request) {
                // 요청이 이루어졌으나 응답을 받지 못한 경우
                // 재요청
                //===================================================================================================
                //throw new Error('API 응답을 받지 못했습니다.');
                //3차 재요청
                await waitFor(delayTime);
                try {
                  // Axios를 사용하여 API 호출
                  const responseThree = await axios.post(url,postData, optData);
                  // 응답 상태 코드가 2xx 범위가 아니라면 예외 발생
                  if (responseThree?.status < 200 || responseThree?.status >= 300) {
                    EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                    throw new Error(`API 호출 실패: 상태 코드 ${responseThree?.status}`);
                  }
                  //"result": true, "resultMsg": ""
            
                  if(responseThree?.result == false ) {
                    EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                    throw new Error(`API 호출 실패: 상태 코드 ${responseThree?.resultMsg}`);
                  }
                  // 성공적인 응답 데이터 반환
                  EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                  return responseThree?.data;
                } catch (errorThree) {
                  // Axios가 네트워크 에러 또는 타임아웃 등으로 인해 예외를 던졌을 경우
                  if (errorThree.response) {
                    // 서버 응답이 있으며 상태 코드가 2xx 범위 밖인 경우
                    //throw new Error(`API 호출 실패: 상태 코드 ${error.response.status}, 메시지: ${error.response.data}`);
                    EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                    throw new Error(`API 호출 실패: 상태 코드 ${errorThree.response.status}`);
                    
                  } else if (errorThree.request) {
                    // 요청이 이루어졌으나 응답을 받지 못한 경우
                    // 재요청
                    //===================================================================================================
                    //throw new Error('API 응답을 받지 못했습니다.');
                    //4차 재요청
                    await waitFor(delayTime);
                    try {
                      // Axios를 사용하여 API 호출
                      const responseFour = await axios.post(url,postData, optData);
                      // 응답 상태 코드가 2xx 범위가 아니라면 예외 발생
                      if (responseFour?.status < 200 || responseFour?.status >= 300) {
                        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                        throw new Error(`API 호출 실패: 상태 코드 ${responseFour?.status}`);
                      }
                      //"result": true, "resultMsg": ""
                
                      if(responseFour?.result == false ) {
                        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                        throw new Error(`API 호출 실패: 상태 코드 ${responseFour?.resultMsg}`);
                      }
                      // 성공적인 응답 데이터 반환
                      EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                      return responseFour?.data;
                    } catch (errorFour) {
                      // Axios가 네트워크 에러 또는 타임아웃 등으로 인해 예외를 던졌을 경우
                      EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                      if (errorFour.response) {
                        // 서버 응답이 있으며 상태 코드가 2xx 범위 밖인 경우
                        //throw new Error(`API 호출 실패: 상태 코드 ${error.response.status}, 메시지: ${error.response.data}`);
                        throw new Error(`API 호출 실패: 상태 코드 ${errorFour.response.status}`);
                        
                      } else if (errorFour.request) {
                        // 요청이 이루어졌으나 응답을 받지 못한 경우
                        // 재요청
                        //===================================================================================================
                        throw new Error('API 응답을 받지 못했습니다.');
                      } else {
                        // 요청 설정 중 발생한 오류
                        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                        throw new Error(`API 호출 설정 오류: ${errorFour.message}`);
                      }
                    }
                  } else {
                    // 요청 설정 중 발생한 오류
                    EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                    throw new Error(`API 호출 설정 오류: ${errorThree.message}`);
                  }
                }
                
        
        
        
        
              } else {
                // 요청 설정 중 발생한 오류
                EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
                throw new Error(`API 호출 설정 오류: ${errorTwo.message}`);
              }
            }
    
    
    
    
          } else {
            // 요청 설정 중 발생한 오류
            EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
            throw new Error(`API 호출 설정 오류: ${errorOne.message}`);
          }
        }




      } else {
        // 요청 설정 중 발생한 오류
        EventRegister.emit("showSpinner",{isSpinnerShow:false, msg:"", spinnerType:"",closeText:""});
        throw new Error(`API 호출 설정 오류: ${error.message}`);
      }
    }

}
