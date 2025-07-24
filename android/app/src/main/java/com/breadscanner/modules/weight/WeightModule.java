package com.breadscanner.modules.weight;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.hardware.usb.UsbManager;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;

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
    private static final String ACTION_USB_PERMISSION = "com.breadscanner.USB_PERMISSION";
    private ReactContext mContext = null;
    private UsbManager mUSBManager;
    private Boolean isContinue = true;

    private DeviceEventManagerModule.RCTDeviceEventEmitter mJSModule = null;


    private UsbManager usbManager;
    String TAG = "TEST WEIGHT";

    private Boolean isReading = true;
    UsbSerialPort port = null;

    WeightModule(ReactApplicationContext context) {
        super(context);
        mContext=context;
    }

    @NonNull
    @Override
    public String getName() {
        return "Weight";
    }

    @ReactMethod
    public void initiateWeight(int portNumber) {

        isReading=true;
        if(usbManager == null ){
            usbManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);
        }
        List<UsbSerialDriver> availableDrivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager);

        Common common = new Common();
        List<UsbSerialPort> ports = common.getCDCPorts(availableDrivers);

        // index 4 = port4
        for(int i=0; i<ports.size();i++) {
            if(portNumber == ports.get(i).getPortNumber()) {
                port = ports.get(i);
            }
        }
        UsbDeviceConnection connection = usbManager.openDevice(port.getDriver().getDevice());
        if (connection == null) {
            // 권한 요청 필요
            return;
        }
        System.out.println("port: "+port);
        try {
            port.open(connection);

            //port.setParameters(9600, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE);
            byte[] command = new byte[]{0x02, 0x52, 0x03}; // STX + 'R' + ETX
            String zeroCommand = "T\r\n";
            port.write(zeroCommand.getBytes(StandardCharsets.US_ASCII), 1000);
            Log.d("YaohuaA7", "Command sent: " + Arrays.toString(command));

            // 응답 읽기
            byte[] buffer = new byte[64];
                try {
                    Thread.sleep(1000);
                    int len = port.read(buffer, 1000);
                    if (len > 0) {
                        //Log.d("YaohuaA7", "Raw Data: " + Arrays.toString(buffer));
                        String response = new String(buffer, 0, len, StandardCharsets.UTF_8);
                        Log.d("YaohuaA7", "Raw Response: " + response);


                    } else {
                        Log.e("YaohuaA7", "No response received.");
                    }

                } catch (InterruptedException e) {
                    //throw new RuntimeException(e);
                }


        } catch (IOException e) {
            throw new RuntimeException(e);
        }


    }


    @ReactMethod
    public void closeSerialConnection() {
        isReading = false;
        port = null;
    }



    @ReactMethod
    public void connectDevice(int portNumber) {
        System.out.println("staart connect=====================");
        isReading=true;
        if(usbManager == null ){
            usbManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);
        }
        List<UsbSerialDriver> availableDrivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager);

        Common common = new Common();
        List<UsbSerialPort> ports = common.getCDCPorts(availableDrivers);

        // index 4 = port4
        /*
        for(int i=0; i<ports.size();i++) {
            if(portNumber == ports.get(i).getPortNumber()) {
                port = ports.get(i);
            }
        }

        */
        port = ports.get(3);
        UsbDeviceConnection connection = usbManager.openDevice(port.getDriver().getDevice());
        if (connection == null) {
            // 권한 요청 필요
            return;
        }
        System.out.println("port: "+port);

        try {
            port.open(connection);

            //port.setParameters(9600, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE);
            byte[] command = new byte[]{0x02, 0x52, 0x03}; // STX + 'R' + ETX
            port.write(command, 1000);
            Log.d("YaohuaA7", "Command sent: " + Arrays.toString(command));

            // 응답 읽기
            byte[] buffer = new byte[64];
            while (isReading) { // 데이터를 지속적으로 읽음
                if(port == null) {
                    break;
                }
                try {
                    Thread.sleep(1000);
                    int len = port.read(buffer, 1000);
                    if (len > 0) {
                        //Log.d("YaohuaA7", "Raw Data: " + Arrays.toString(buffer));
                        String response = new String(buffer, 0, len, StandardCharsets.UTF_8);
                        Log.d("YaohuaA7", "Raw Response: " + response);

                        if (mJSModule == null) {
                            mJSModule = mContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
                        }
                        WritableMap params = new WritableNativeMap();
                        params.putString("weight", response);
                        mJSModule.emit("onWeightChanged", params);
                        // 데이터 처리
                        //processResponse(buffer, len);
                    } else {
                        Log.e("YaohuaA7", "No response received.");
                    }

                } catch (InterruptedException e) {
                    //throw new RuntimeException(e);
                }

            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }


    }





    // serial port


























    private final BroadcastReceiver usbReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (ACTION_USB_PERMISSION.equals(action)) {
                synchronized (this) {
                    UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                    if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                        if (device != null) {
                            Log.d("USB", "start connect to device");
                            connectToDevice(device);
                        }
                    } else {
                        Log.d("USB", "Permission denied for device: " + device);
                    }
                }
            }
        }
    };
    @ReactMethod
    public void test() {
        System.out.println("testtesttesttesttesttesttest====================================================================================================");

    }
    @ReactMethod
    public void stopWeighing() {
        isContinue = false;
        mUSBManager = null;
    }
    @ReactMethod
    public void startWeighing(String vendorId, String productId) {
        System.out.println("device list====================================================================================================");


        mUSBManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);
        //mUSBManager = (UsbManager) getSystemService(Context.USB_SERVICE);
        UsbDevice availableDevice = null;

        System.out.println("device list====================================================================================================");
        for (String key : mUSBManager.getDeviceList().keySet()) {

            UsbDevice usbDevice = mUSBManager.getDeviceList().get(key);
            //System.out.println("************************************************************************************");
            //System.out.println("usb device");
            //System.out.println(usbDevice);
            if(usbDevice.getProductName() != null) {
                System.out.println("String.valueOf(usbDevice.getVendorId()): "+String.valueOf(usbDevice.getVendorId())+ "vendorId: "+vendorId);
                if(String.valueOf(usbDevice.getVendorId()).equals(vendorId) && String.valueOf(usbDevice.getProductId()).equals(productId)) {
                    availableDevice = usbDevice;
                    break;
                }



            }
        }
        //requestPermission(availableDevice);
        //connectToDevice(availableDevice);
        //startDataReadingThread(availableDevice);
        System.out.println("************************************************************************************");
        System.out.println(availableDevice);

        if(availableDevice != null ) {
            requestPermission(availableDevice);
            communicateWithYaohuaA7(availableDevice);
        }else {

        }
    }


    private void communicateWithYaohuaA7(UsbDevice device) {
        new Thread(() -> {
            System.out.println("Devices============================================================");
            System.out.println(device.getProductName());
            System.out.println(device.getVendorId());
            System.out.println(device.getProductId());
            UsbManager usbManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);

            // USB-Serial 드라이버 찾기
            UsbSerialProber prober = UsbSerialProber.getDefaultProber();
            UsbSerialDriver driver = prober.probeDevice(device);
            System.out.println("driver============================================");
            System.out.println(driver);
            if (driver == null) {
                Log.e("YaohuaA7", "No driver found for the device.");
                return;
            }

            UsbDeviceConnection connection = usbManager.openDevice(driver.getDevice());
            if (connection == null) {
                Log.e("YaohuaA7", "Cannot open connection to the device.");
                return;
            }

            // 포트 열기
            UsbSerialPort port = driver.getPorts().get(0);
            try {
                port.open(connection);
                port.setParameters(9600, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE);

                // 질량 요청 명령 전송
                byte[] command = new byte[]{0x02, 0x52, 0x03}; // STX + 'R' + ETX
                port.write(command, 1000);
                Log.d("YaohuaA7", "Command sent: " + Arrays.toString(command));

                // 응답 읽기
                byte[] buffer = new byte[64];
                while (isContinue) { // 데이터를 지속적으로 읽음
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        //throw new RuntimeException(e);
                    }
                    int len = port.read(buffer, 1000);
                    if (len > 0) {
                        //Log.d("YaohuaA7", "Raw Data: " + Arrays.toString(buffer));
                        String response = new String(buffer, 0, len, StandardCharsets.UTF_8);
                        //Log.d("YaohuaA7", "Raw Response: " + response);

                        if (mJSModule == null) {
                            mJSModule = mContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
                        }
                        WritableMap params = new WritableNativeMap();
                        params.putString("weight", response);
                        mJSModule.emit("onWeightChanged", params);
                        // 데이터 처리
                        //processResponse(buffer, len);
                    } else {
                        Log.e("YaohuaA7", "No response received.");
                    }
                }
            } catch (Exception e) {
                Log.e("YaohuaA7", "Error communicating with device.", e);
            } finally {
                try {
                    port.close();
                } catch (IOException e) {
                    Log.e("YaohuaA7", "Error closing port.", e);
                }
            }


        }).start();
    }


    public void connectToDevice(UsbDevice device) {
        UsbManager usbManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);

        // 첫 번째 인터페이스 가져오기
        UsbInterface usbInterface = device.getInterface(0);
        UsbEndpoint endpoint = usbInterface.getEndpoint(0); // 첫 번째 엔드포인트 (입출력 확인 필요)

        UsbDeviceConnection connection = usbManager.openDevice(device);

        if (connection != null && connection.claimInterface(usbInterface, true)) {
            Log.d("USB", "Connected to device.");

            // 데이터 전송 (예: Bulk Transfer)
            byte[] data = "Hello Device".getBytes();
            int result = connection.bulkTransfer(endpoint, data, data.length, 1000); // 타임아웃: 1000ms
            if (result >= 0) {
                Log.d("USB", "Data sent successfully!");
            } else {
                Log.d("USB", "Failed to send data.");
            }

            // 인터페이스 및 연결 해제
            connection.releaseInterface(usbInterface);
            connection.close();
        } else {
            Log.d("USB", "Failed to open connection.");
        }
    }

    private void requestPermission(UsbDevice device) {
        System.out.println("requestPermission======================================================================");

        mUSBManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);
        System.out.println("usbManager======================================================================");
        System.out.println(mUSBManager);
        if (!mUSBManager.hasPermission(device)) {
            PendingIntent permissionIntent = PendingIntent.getBroadcast(
                    mContext, 0, new Intent(ACTION_USB_PERMISSION), PendingIntent.FLAG_IMMUTABLE
            );
            mUSBManager.requestPermission(device, permissionIntent);
            IntentFilter filter = new IntentFilter(ACTION_USB_PERMISSION);
            ContextCompat.registerReceiver(mContext, usbReceiver, filter, ContextCompat.RECEIVER_EXPORTED);
            //mContext.registerReceiver(mContext, usbReceiver, filter, ContextCompat.RECEIVER_EXPORTED);
        } else {
            //connectToDevice(device);
        }
    }






}
