package com.breadscanner.modules.weight;

import android.content.Context;
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
import com.hoho.android.usbserial.driver.UsbSerialDriver;
import com.hoho.android.usbserial.driver.UsbSerialPort;
import com.hoho.android.usbserial.driver.UsbSerialProber;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

public class WeightModule extends ReactContextBaseJavaModule {
    private ReactContext mContext;
    private UsbManager usbManager;
    private DeviceEventManagerModule.RCTDeviceEventEmitter mJSModule;

    private UsbSerialPort port = null;
    private static volatile boolean isReading = false;

    WeightModule(ReactApplicationContext context) {
        super(context);
        mContext = context;
    }

    @NonNull
    @Override
    public String getName() {
        return "Weight";
    }

    @ReactMethod
    public void connectDevice() {
        Log.d("WeightModule", "Starting connection...");
        usbManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);

        List<UsbSerialDriver> availableDrivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager);
        Common common = new Common();
        List<UsbSerialPort> ports = common.getCDCPorts(availableDrivers);

        if (ports.isEmpty()) {
            Log.e("WeightModule", "No USB CDC ports found.");
            return;
        }

        port = ports.get(3); // 특정 포트 선택 (필요시 인덱스 변경)

        UsbDeviceConnection connection = usbManager.openDevice(port.getDriver().getDevice());
        if (connection == null) {
            Log.e("WeightModule", "Failed to open USB device. Permission may be required.");
            return;
        }

        try {
            port.open(connection);
            isReading = true;
            new Thread(this::readWeightLoop).start();
            Log.d("WeightModule", "Connection opened and reading started.");
        } catch (IOException e) {
            Log.e("WeightModule", "Error opening port: " + e.getMessage());
        }
    }

    private void readWeightLoop() {
        byte[] command = new byte[]{0x02, 0x52, 0x03}; // STX + 'R' + ETX
        byte[] buffer = new byte[64];

        try {
            port.write(command, 1000);
            Log.d("WeightModule", "Command sent: " + Arrays.toString(command));

            while (isReading && port != null) {
                int len = port.read(buffer, 1000);
                if (len > 0) {
                    String response = new String(buffer, 0, len, StandardCharsets.UTF_8);
                    Log.d("WeightModule", "Weight response: " + response);

                    if (mJSModule == null) {
                        mJSModule = mContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
                    }

                    WritableMap params = new WritableNativeMap();
                    params.putString("weight", response);
                    mJSModule.emit("onWeightChanged", params);
                }

                Thread.sleep(1000); // 1초 주기
            }
        } catch (Exception e) {
            Log.e("WeightModule", "Error reading weight: " + e.getMessage());
        } finally {
            try {
                if (port != null) {
                    port.close();
                    port = null;
                }
            } catch (IOException e) {
                Log.e("WeightModule", "Error closing port: " + e.getMessage());
            }
            Log.d("WeightModule", "Reading loop stopped.");
        }
    }

    @ReactMethod
    public void closeSerialConnection() {
        isReading = false;
        if (port != null) {
            try {
                port.close();
                port = null;
                Log.d("WeightModule", "Port closed by closeSerialConnection.");
            } catch (IOException e) {
                Log.e("WeightModule", "Error closing port: " + e.getMessage());
            }
        }
    }
}
