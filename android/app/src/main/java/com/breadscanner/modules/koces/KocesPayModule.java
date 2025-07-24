package com.breadscanner.modules.koces;


import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.os.Build;
import android.os.Environment;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.HashMap;

public class KocesPayModule extends ReactContextBaseJavaModule {
    private ReactApplicationContext mContext = null;
    private int KOCES_REQUEST_CODE = 1910;

    // Koces result code
    private String KOCES_SUCCESS_CODE = "0000";

    private static Callback successCallback = null;
    private static Callback errorCallback = null;

    private final ActivityEventListener mActivityEventListener = new BaseActivityEventListener(){
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, @Nullable Intent data) {
            super.onActivityResult(activity, requestCode, resultCode, data);
            //System.out.println("================================on activity result================================");
            //System.out.println("intent====="+requestCode);
            //System.out.println(data);


            if(data != null) {
                //Object hashData = data.getExtras().get("hashMap");
                HashMap<String, String> hashData = (HashMap<String, String>) data.getSerializableExtra("hashMap");
                //System.out.println("hashData====================================================");
                //System.out.println(hashData);

                if(hashData != null) {

                    String Result ="{";
                    String ansCode = null;
                    for (String _key: hashData.keySet()) {
                        String strValue = hashData.get(_key);
                        if(_key.equals("AnsCode") ) {
                            ansCode=strValue;
                        }
                        Result +="\""+_key + "\":\"" + strValue + "\",";
                    }
                    Result = Result.substring(0,Result.length()-1);
                    Result += "}";
                    /*
                    JSONObject result = new JSONObject();
                    Date date = new Date(System.currentTimeMillis());
                    SimpleDateFormat format = new SimpleDateFormat("yyyyMMddhhmmss");
                    String time = format.format(date);
                    SimpleDateFormat formatFileName = new SimpleDateFormat("yyyyMMdd");
                    String timeFileName = formatFileName.format(date);
                    String logString = "["+time+"] "+"REQUEST PAY RESULT DATA\n"+ Result + "\n======================================================================================================================================\n\n";
                    dataSaveLog(logString, timeFileName+"_log");
                    */
                    //System.out.println("result string====================================================");
                    //System.out.println(Result);
                    //JSONObject jObj = new JSONObject((Map) hashData);

                    if(ansCode != null) {
                        if (ansCode.equals(KOCES_SUCCESS_CODE)) {
                            // 정상 리스폰스
                            if(successCallback != null) {

                                successCallback.invoke(Result);
                            }else{

                                errorCallback.invoke("{\"error\":\"successCallbackNone\"}");
                            }
                        }else {
                            // 실패 리스폰스
                            if(errorCallback != null) {

                                errorCallback.invoke(Result);
                            }
                        }
                    }
                }else {

                }
            }else {

                errorCallback.invoke(data.toString());
            }

        }
    };

    KocesPayModule(ReactApplicationContext context) {
        super(context);
        mContext=context;
    }

    @NonNull
    @Override
    public String getName() {
        return "KocesPay";
    }

    @ReactMethod
    public void prepareKocesPay(ReadableMap data, Callback errorCallback, Callback successCallback) {
        System.out.println("==============================prepare koces pay==============================");
        getReactApplicationContext().removeActivityEventListener(mActivityEventListener);
        getReactApplicationContext().addActivityEventListener(mActivityEventListener);

        this.errorCallback = errorCallback;
        this.successCallback = successCallback;

        HashMap dataHash = data.toHashMap();
        HashMap<String, String> hashMap = new HashMap<>();
        Intent intent = new Intent();
        if (Build.VERSION.SDK_INT < 33) {
            intent.addCategory(Intent.CATEGORY_LAUNCHER);
        }
        ComponentName componentName = new ComponentName("com.koces.androidpos","com.koces.androidpos.AppToAppActivity");
        intent.setComponent(componentName);
        intent.setPackage(mContext.getPackageName());
        intent.addFlags(Intent.FLAG_FROM_BACKGROUND);
        // 데이터 담기

        if(dataHash != null) {
            for (Object key : dataHash.keySet()) {
                hashMap.put(key.toString(),(dataHash.get(key) != null ? dataHash.get(key).toString() : "NULL") );
            }
        }
        intent.putExtra("hashMap",hashMap);
        intent.setType("text/plain");

        mContext.startActivityForResult(intent, KOCES_REQUEST_CODE, null);

    }


    public static void dataSaveLog(String _log, String _fileName) {
        /* SD CARD 하위에 LOG 폴더를 생성하기 위해 미리 dirPath에 생성 할 폴더명을 추가 */
        String dirPath = Environment.getExternalStorageDirectory().getAbsolutePath() + "/Download/LOG/";
        File fileDir = new File(dirPath);
        File file = new File(dirPath+_fileName+".txt");

        // 일치하는 폴더가 없으면 생성
        if (!fileDir.exists()) {
            fileDir.mkdirs();
        }
        if(file.exists()) {

        }

        try {
            FileWriter writer = new FileWriter(file, true);
            writer.write(_log);
            writer.flush();
            writer.close();

        } catch (IOException e) {
            throw new RuntimeException(e);
        }


    }
}
