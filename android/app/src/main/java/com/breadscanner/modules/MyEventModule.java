package com.breadscanner.modules;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class MyEventModule extends ReactContextBaseJavaModule {
    private static String scannedText = "";
    private ReactContext mReactContext;
    private DeviceEventManagerModule.RCTDeviceEventEmitter mJSModule = null;
    private static MyEventModule instance = null;
    public static MyEventModule initHWKeyboardEventModule(ReactApplicationContext reactContext) {
        instance = new MyEventModule(reactContext);
        return instance;
    }
    public static MyEventModule getInstance() {
        return instance;
    }
    public void keyPressed(String pressedKey) {
        /*
        WritableMap params = new WritableNativeMap();
        params.putString("pressedKey", pressedKey);
        //System.out.println("pressedKey: "+pressedKey+", "+"??".equals(pressedKey));
        if (!mReactContext.hasActiveCatalystInstance()) {
            return;
        }

        if (mJSModule == null) {
            mJSModule = mReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
        }
        mJSModule.emit("onMyKeyPressed", params);
        */
        WritableMap params = new WritableNativeMap();
        //System.out.println("pressedKey: "+pressedKey+", "+"??".equals(pressedKey));
        if (!mReactContext.hasActiveCatalystInstance()) {
            return;
        }

        if (mJSModule == null) {
            mJSModule = mReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
        }
        if(!pressedKey.equals("\n")) {
            scannedText = scannedText+pressedKey;
        }
        System.out.println("scanned text: "+scannedText);
        if(pressedKey.equals("\n")) {
            params.putString("pressedKey", scannedText);
            mJSModule.emit("onMyKeyPressed", params);
            scannedText = "";
        }


    };

    public void keyBackPressed() {

        if (mJSModule == null) {
            mJSModule = mReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
        }
        mJSModule.emit("onMyKeyBackPressed", null);
    };

    public MyEventModule(ReactApplicationContext reactContext) {
        super(reactContext);
        mReactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return "MyEvent";
    }
}
