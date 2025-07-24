package com.breadscanner.modules.weight;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

public class ScaleModule extends ReactContextBaseJavaModule {
    private ReactContext mContext = null;

    ScaleModule(ReactApplicationContext context) {
        super(context);
        mContext=context;
    }

    @NonNull
    @Override
    public String getName() {
        return "Scale";
    }
}
