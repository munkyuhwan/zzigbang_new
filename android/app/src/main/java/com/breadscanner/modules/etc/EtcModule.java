package com.breadscanner.modules.etc;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.widget.Toast;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class EtcModule extends ReactContextBaseJavaModule {
    private Context mContext = null;

    EtcModule(ReactApplicationContext context) {
        super(context);
        mContext = context;
    }

    @NonNull
    @Override
    public String getName() {
        return "Etc";
    }

    @ReactMethod
    public void openManageIntent(String storeID, String storeName) {
        //co.kr.wooripos.zzigbbangmanager

        try {
            Intent intent = new Intent("co.kr.wooripos.zzigbbang_manager");
            intent.addCategory(Intent.CATEGORY_DEFAULT); // 보통 기본 카테고리 필요
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); // 다른 앱 실행 시 권장
            intent.putExtra("store_name", storeName);
            intent.putExtra("store_id", storeID);
            System.out.println(intent.getExtras());
            getReactApplicationContext().startActivity(intent);
        } catch (ActivityNotFoundException e) {
            e.printStackTrace();
            Toast.makeText(getReactApplicationContext(), "앱을 실행할 수 없습니다", Toast.LENGTH_SHORT).show();
        }
        /*
        intent.putExtra("store_name", storeName);
        intent.putExtra("store_id", storeID);
        intent.setType("text/plain");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        //intent.setPackage("co.kr.wooripos.zzigbbangmanager");
        //intent.setPackage("co.kr.wooripos.zzigbbang_manager");

        try {
            getReactApplicationContext().startActivity(intent);
        } catch (ActivityNotFoundException e) {
            System.out.print("exception===============================================================");
            e.printStackTrace();
            Toast.makeText(getReactApplicationContext(), "앱이 설치되어 있지 않습니다.", Toast.LENGTH_SHORT).show();
        }

         */

    }

}
