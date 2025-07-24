package com.breadscanner.modules.serial;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbManager;
import android.util.Log;

import androidx.annotation.NonNull;

import com.breadscanner.modules.Common;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.ftdi.j2xx.D2xxManager;
import com.ftdi.j2xx.FT_Device;
import com.hoho.android.usbserial.driver.UsbSerialDriver;
import com.hoho.android.usbserial.driver.UsbSerialPort;
import com.hoho.android.usbserial.driver.UsbSerialProber;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.DataOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;


public class SerialModule extends ReactContextBaseJavaModule {
    private static final String ACTION_USB_PERMISSION = "com.breadscanner.USB_PERMISSION";
    private ReactContext mContext = null;
    private UsbManager usbManager;
    String TAG = "TEST WEIGHT";
    private DeviceEventManagerModule.RCTDeviceEventEmitter mJSModule = null;

    private Boolean isReading = true;
    UsbSerialPort port = null;
    SerialModule(ReactApplicationContext context) {
        super(context);
        mContext=context;
    }
    @NonNull
    @Override
    public String getName() {
        return "Serial";
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public String getSerialPorts() {
        usbManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);
        List<UsbSerialDriver> availableDrivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager);
        if (availableDrivers.isEmpty()) {
            return ""; // CDC 장치 없음
        }

        JSONArray jsonArray = new JSONArray();
        Common common = new Common();
        List<UsbSerialPort> ports = common.getCDCPorts(availableDrivers);

        System.out.println("\n\n\n\n");
        System.out.println("-========================================================================");
        for(UsbSerialPort serialPort : ports) {
            System.out.println("ports: "+ports);

            JSONObject obj = new JSONObject();
            try {
                obj.put("device_name",serialPort.getDevice().getDeviceName());
                obj.put("device_id",serialPort.getDevice().getDeviceId());
                obj.put("product_id",serialPort.getDevice().getProductId());
                obj.put("port_number",serialPort.getPortNumber());
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }
            jsonArray.put(obj);
        }

        System.out.println("jsonArray: "+jsonArray);

        return jsonArray.toString();
        //return  availableDrivers.get(1).getPorts()
    }




}
