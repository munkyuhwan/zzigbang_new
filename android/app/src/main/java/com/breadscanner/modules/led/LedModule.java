package com.breadscanner.modules.led;

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
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.hoho.android.usbserial.driver.UsbSerialDriver;
import com.hoho.android.usbserial.driver.UsbSerialPort;
import com.hoho.android.usbserial.driver.UsbSerialProber;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

public class LedModule extends ReactContextBaseJavaModule {
    private ReactContext mContext = null;
    private UsbManager usbManager;
    private DeviceEventManagerModule.RCTDeviceEventEmitter mJSModule;

    private UsbSerialPort port = null;
    private static volatile boolean isReading = false;

    LedModule(ReactApplicationContext context) {
        super(context);
        mContext=context;
    }


    @NonNull
    @Override
    public String getName() {
        return "LED";
    }

    @ReactMethod
    public void moduleTest() {
        System.out.println("LED Module-=-=------------------------------------------------");
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
        System.out.println("port: "+ports);

        // 1,2만 안됨 3은 저울
        port = ports.get(0); // 특정 포트 선택 (필요시 인덱스 변경)

        UsbDeviceConnection connection = usbManager.openDevice(port.getDriver().getDevice());
        if (connection == null) {
            Log.e("WeightModule", "Failed to open USB device. Permission may be required.");
            return;
        }
        System.out.println("connection: "+connection);
        try {
            port.open(connection);
            port.setParameters(9600, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        /*
        try {
            if(port != null) {
                port.open(connection);
                isReading = true;

                Log.d("WeightModule", "Connection opened and reading started.");
            }
        } catch (IOException e) {
            Log.e("WeightModule", "Error opening port: " + e.getMessage());
        }

         */
    }

    @ReactMethod
    public void sendLedCommand(boolean red, boolean green, boolean blue) throws Exception {
        // 패킷 구성: STX + 'L' + R + G + B + ETX
        byte stx = 0x02;
        byte etx = 0x03;
        byte[] data = new byte[]{
                stx,
                0x31,
                0x31,
                0x31,
                etx
        };

        port.write(data, 3000);

        byte[] buffer = new byte[64];
        int len = port.read(buffer, 3000);
        String response = new String(buffer, 0, len, StandardCharsets.UTF_8);
        System.out.println("response: "+response);

    }



}
