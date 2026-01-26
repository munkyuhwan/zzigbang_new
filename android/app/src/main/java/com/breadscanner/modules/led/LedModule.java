package com.breadscanner.modules.led;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
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
import com.hoho.android.usbserial.util.SerialInputOutputManager;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class LedModule extends ReactContextBaseJavaModule {
    private static final String ACTION_USB_PERMISSION = "com.android.example.USB_PERMISSION";
    private ReactContext mContext = null;
    private UsbManager usbManager;
    private DeviceEventManagerModule.RCTDeviceEventEmitter mJSModule;
    private SerialInputOutputManager usbIoManager=null;
    private Integer baudRate = 9600;

    private UsbSerialPort port = null;
    private static volatile boolean isReading = false;

    LedModule(ReactApplicationContext context) {
        super(context);
        mContext=context;
    }
    BroadcastReceiver mUsbReceiver = new BroadcastReceiver() {
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (ACTION_USB_PERMISSION.equals(action)) {
                synchronized (this) {
                    UsbDevice device = (UsbDevice)intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                    if(device != null) {

                        if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                            Log.d("LOG_TAG", "Permission granted - " + device);
                        }
                        else {
                            Log.d("LOG_TAG", "Permission denied - " + device);
                        }

                    }
                    else {
                        Log.d("LOG_TAG", "No device");
                    }
                }
            }
        }
    };


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
    public void sendLed1Color(String portNumber, boolean r, boolean g, boolean b) throws IOException {
        usbManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);

        List<UsbSerialDriver> availableDrivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager);
        Common common = new Common();
        List<UsbSerialPort> ports = common.getCDCPorts(availableDrivers);

        if (ports.isEmpty()) {
            Log.e("WeightModule", "No USB CDC ports found.");
            return;
        }

        port = ports.get(Integer.parseInt(portNumber));
        requestPermission(port.getDriver().getDevice());
        UsbDeviceConnection connection = usbManager.openDevice(port.getDriver().getDevice());

        System.out.println("port:"+port);
        try {
            port.open(connection);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        if (port == null || !port.isOpen()) {
            Log.e("LED", "Serial port not opened");
            return;
        }

        byte STX = 0x02;
        byte ETX = 0x03;

        byte[] command = new byte[] {
                STX,
                'L',
                (byte) (r ? '1' : '0'),
                (byte) (g ? '1' : '0'),
                (byte) (b ? '1' : '0'),
                ETX
        };

        port.write(command, 1000);
        Log.d("LED", bytesToHexWithAscii(command));
    }

    @ReactMethod
    public void sendRgbLedCommand(String portNumber, String color) {
        usbManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);

        List<UsbSerialDriver> availableDrivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager);
        Common common = new Common();
        List<UsbSerialPort> ports = common.getCDCPorts(availableDrivers);

        if (ports.isEmpty()) {
            Log.e("WeightModule", "No USB CDC ports found.");
            return;
        }

        port = ports.get(Integer.parseInt(portNumber));
        requestPermission(port.getDriver().getDevice());
        UsbDeviceConnection connection = usbManager.openDevice(port.getDriver().getDevice());

        System.out.println("port:"+port);
        try {
            port.open(connection);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        if (port == null || !port.isOpen()) {
            Log.e("LED", "Serial port not opened");
            return;
        }

        try {
            byte STX = 0x02; // 필요시 0x01로 변경 테스트
            byte ETX = 0x03;

            String body = "RGB:" + color; // 예: RGB:RED
            byte[] bodyBytes = body.getBytes(StandardCharsets.US_ASCII);

            byte[] command = new byte[1 + bodyBytes.length + 1];
            int idx = 0;
            command[idx++] = STX;
            System.arraycopy(bodyBytes, 0, command, idx, bodyBytes.length);
            idx += bodyBytes.length;
            command[idx] = ETX;

            port.write(command, 1000);

            Log.d("LED", "SEND HEX: " + bytesToHexWithAscii(command));

            Thread.sleep(100); // MCU 처리 시간

        } catch (Exception e) {
            Log.e("LED", "sendRgbLedCommand error", e);
        }
    }
    public static String bytesToHexWithAscii(byte[] bytes) {
        if (bytes == null) return "null";

        StringBuilder hex = new StringBuilder();
        StringBuilder ascii = new StringBuilder();

        for (byte b : bytes) {
            // HEX 부분
            hex.append(String.format("%02X ", b));

            // ASCII 부분 (출력 가능한 문자만)
            if (b >= 0x20 && b <= 0x7E) {
                ascii.append((char) b);
            } else {
                ascii.append(".");
            }
        }

        return "HEX: [" + hex.toString().trim() + "] | ASCII: [" + ascii + "]";
    }

    public static String bytesToHex(byte[] bytes) {
        if (bytes == null) return "";

        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X ", b));
        }
        return sb.toString().trim();
    }

    @ReactMethod
    public void connectDevice(String portNumber) {
        if (port != null) {
            try {
                port.close();
                port = null;
                Log.d("WeightModule", "Port closed by closeSerialConnection.");
            } catch (IOException e) {
                Log.e("WeightModule", "Error closing port: " + e.getMessage());
            }
        }

        if(portNumber != null) {
            Log.d("WeightModule", "Starting connection...");
            Log.d("WeightModule", "portNumber: " + portNumber);
            usbManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);

            List<UsbSerialDriver> availableDrivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager);
            Common common = new Common();
            List<UsbSerialPort> ports = common.getCDCPorts(availableDrivers);

            if (ports.isEmpty()) {
                Log.e("WeightModule", "No USB CDC ports found.");
                return;
            }

            port = ports.get(Integer.parseInt(portNumber)); // 특정 포트 선택 (필요시 인덱스 변경)
            requestPermission(port.getDriver().getDevice());
            UsbDeviceConnection connection = usbManager.openDevice(port.getDriver().getDevice());
            Log.e("WeightModule", "port.getDriver().getDevice(): "+port.getDriver());

            if (connection == null) {
                Log.e("WeightModule", "Failed to open USB device. Permission may be required.");
                return;
            }

            try {
                if (port != null) {
                    port.open(connection);
                    port.setParameters(baudRate, 8, 1, UsbSerialPort.PARITY_NONE);
                    isReading = true;
                    //new Thread(this::readWeightLoop).start();
                    //readWeightLoop();
                    usbIoManager = new SerialInputOutputManager(port, new SerialInputOutputManager.Listener() {
                        @Override
                        public void onNewData(byte[] data) {
                            String serialStr = new String(data).trim();
                            Log.d("WeightModule", "serialStr: "+serialStr);
                            /*
                            String decimalStr = firstDecimalOrNull(serialStr);
                            if(decimalStr != null) {
                                try {
                                    // 1. kg 문자열을 double로 변환합니다. (Kotlin: decimalStr.toDouble())
                                    double kg = Double.parseDouble(decimalStr);

                                    // 2. kg을 long 타입 grams으로 변환합니다. (Kotlin: (kg * 1000).toLong())
                                    // long으로 캐스팅하기 전에 Math.round()를 사용하여 정확한 반올림을 적용하는 것이 좋습니다.
                                    // 여기서는 Kotlin의 toLong()이 일반적으로 수행하는 '버림' 대신 정확도를 위해 Math.round를 사용합니다.
                                    long grams = Math.round(kg * 1000);
                                    //Log.d("WeightModule", "grams: "+kg);
                                    Common common = new Common();
                                    //Log.d("WeightModule", "==========================================================");
                                    //Log.d("WeightModule", "Weight response: " + (kg));
                                    //Log.d("WeightModule", "Weight response: " + ""+kg);

                                } catch (NumberFormatException e) {
                                    // decimalStr이 유효한 double이 아닐 경우
                                    Log.e("WeightModule", "Error parsing decimalStr to Double: " + decimalStr, e); // 에러 로그 추가
                                    // 필요에 따라 weight 변수에 기본값을 설정하거나 오류 처리를 할 수 있습니다.
                                }

                            }

                             */

                        }

                        @Override
                        public void onRunError(Exception e) {
                            Log.e("WeightModule", "onRunError: " +  e.getStackTrace()); // 에러 로그 추가

                        }
                    });
                    usbIoManager.start();
                    //startReading();

                    Log.d("WeightModule", "Connection opened and reading started.");
                }
            } catch (IOException e) {
                Log.e("WeightModule", "Error opening port: " + e.getMessage());
            }
        }
        /*
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
        port = ports.get(Integer.parseInt(portNumber)); // 특정 포트 선택 (필요시 인덱스 변경)

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

    private void requestPermission(UsbDevice device) {
        System.out.println("requestPermission======================================================================");

        usbManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);
        System.out.println("usbManager======================================================================");
        System.out.println(usbManager);
        System.out.println("usbManager.hasPermission(device): "+usbManager.hasPermission(device));
        //if (!usbManager.hasPermission(device)) {
        PendingIntent permissionIntent = PendingIntent.getBroadcast(
                mContext, 9898, new Intent(ACTION_USB_PERMISSION), PendingIntent.FLAG_IMMUTABLE
        );
        IntentFilter filter = new IntentFilter(ACTION_USB_PERMISSION);
        usbManager.requestPermission(device, permissionIntent);

        ContextCompat.registerReceiver(getReactApplicationContext(), mUsbReceiver, filter, ContextCompat.RECEIVER_EXPORTED);
        //mContext.registerReceiver(mContext, usbReceiver, filter, ContextCompat.RECEIVER_EXPORTED);
        //} else {
        //connectToDevice(device);
        //}
    }
    private String firstDecimalOrNull(String str) {
        String regexString = "[+-]?\\d+(?:\\.\\d+)?";
        Pattern regex = Pattern.compile(regexString);

        // 2. Matcher 객체 생성
        // Matcher는 패턴을 입력 문자열에 적용하는 역할을 합니다.
        Matcher matcher = regex.matcher(str);

        // 3. 가장 먼저 일치하는 부분 찾기 (Kotlin의 regex.find(str) 역할)
        if (matcher.find()) {
            // 일치하는 부분을 찾았다면, 해당 값을 반환합니다.
            return matcher.group();
        } else {
            // 일치하는 부분이 없다면, null을 반환합니다. (Kotlin의 ?.value 역할)
            return null;
        }
    }

}
