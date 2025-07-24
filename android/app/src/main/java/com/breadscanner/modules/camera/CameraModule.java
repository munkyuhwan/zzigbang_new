package com.breadscanner.modules.camera;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.hardware.usb.UsbManager;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.ByteArrayOutputStream;

public class CameraModule extends ReactContextBaseJavaModule {

    private ReactContext mContext = null;
    private static final String ACTION_USB_PERMISSION = "com.breadscanner.USB_PERMISSION";
    private UsbManager usbManager;
    private DeviceEventManagerModule.RCTDeviceEventEmitter mJSModule = null;

    CameraModule(ReactApplicationContext context) {
        super(context);
        mContext = context;
    }
    @NonNull
    @Override
    public String getName() {
        return "Camera";
    }

    private final BroadcastReceiver usbReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            System.out.println("intent: "+intent.getData());
            String action = intent.getAction();
            if (ACTION_USB_PERMISSION.equals(action)) {
                synchronized (this) {
                    UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                    if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                        if (device != null) {
                            Log.d("USB", "start connect to device");
                            //connectToDevice(device);
                        }
                    } else {
                        Log.d("USB", "Permission denied for device: " + device);
                    }
                }
            }
        }
    };

    @ReactMethod
    public void isUSBHostSupported() {
        PackageManager pm = getReactApplicationContext().getPackageManager();
        boolean isSupported = pm.hasSystemFeature(PackageManager.FEATURE_USB_HOST);

        if (isSupported) {
            Log.d("USBHostChecker", "✅ 이 기기는 USB Host를 지원합니다.");
        } else {
            Log.d("USBHostChecker", "❌ 이 기기는 USB Host를 지원하지 않습니다.");
        }
    }

    @ReactMethod
    public void connectToCamera(int vendorID, int productID) {
        usbManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);
        UsbDevice availableDevice = null;

        System.out.println("vendor id: "+vendorID+" productID: "+productID);

        //System.out.println("device list====================================================================================================");
        for (String key : usbManager.getDeviceList().keySet()) {

            UsbDevice usbDevice = usbManager.getDeviceList().get(key);

            //System.out.println("************************************************************************************");
            //System.out.println("usb device");
            //System.out.println(usbDevice);
            if(usbDevice.getVendorId()==vendorID && usbDevice.getProductId()==productID) {
                availableDevice = usbDevice;
                break;

            }
        }
        if(availableDevice != null) {

            if(usbManager != null) {

                requestPermission(availableDevice);

                UsbDeviceConnection connection = usbManager.openDevice(availableDevice);
                UsbInterface usbInterface = availableDevice.getInterface(0);
                //UsbEndpoint usbEndpoint = usbInterface.getEndpoint(0);
                UsbEndpoint usbEndpoint = null;
                for (int i = 0; i < usbInterface.getEndpointCount(); i++) {
                    UsbEndpoint ep = usbInterface.getEndpoint(i);
                    if (ep.getDirection() == UsbConstants.USB_DIR_OUT) { // OUT 방향 확인
                        usbEndpoint = ep;
                        break;
                    }
                }
                System.out.println("usbEndpoint************************************************************************************");
                System.out.println(usbEndpoint);
                connection.claimInterface(usbInterface, true);


                connection.close();
            }
        }
    }

    @ReactMethod
    public void takePhoto() {
        System.out.println("take photo");

    }
    private void requestPermission(UsbDevice device) {
        System.out.println("requestPermission======================================================================");

        usbManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);
        System.out.println("usbManager======================================================================");
        System.out.println(usbManager);
        System.out.println(usbManager.hasPermission(device));
        if (!usbManager.hasPermission(device)) {
            PendingIntent permissionIntent = PendingIntent.getBroadcast(
                    mContext, 0, new Intent(ACTION_USB_PERMISSION), PendingIntent.FLAG_IMMUTABLE
            );

            //usbManager.requestPermission(device, permissionIntent);
            IntentFilter filter = new IntentFilter(ACTION_USB_PERMISSION);
            //ContextCompat.registerReceiver(mContext, usbReceiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED);
            mContext.registerReceiver(usbReceiver, new IntentFilter("com.breadscanner.USB_PERMISSION"));
            usbManager.requestPermission(device, permissionIntent);


            //mContext.registerReceiver(mContext, usbReceiver, filter, ContextCompat.RECEIVER_EXPORTED);
        } else {
            //connectToDevice(device);
        }
    }
}
