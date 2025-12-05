package com.breadscanner.modules.bell;

import android.annotation.SuppressLint;
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
import android.os.AsyncTask;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.loader.content.AsyncTaskLoader;

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

import org.json.JSONArray;
import org.json.JSONException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class BellModule extends ReactContextBaseJavaModule {
    private static final String ACTION_USB_PERMISSION = "com.breadscanner.USB_PERMISSION";
    private ReactContext mContext = null;
    private UsbManager usbManager;
    private static UsbSerialPort serialPort;
    private UsbDevice device;
    private DeviceEventManagerModule.RCTDeviceEventEmitter mJSModule = null;
    private static final byte LED_STX = 0x02;
    private static final byte ETX = 0x03;
    static boolean isRun = true;
    private Thread bellThread;

    private final BroadcastReceiver usbReceiver = new BroadcastReceiver() {
        public void onReceive(Context context, Intent intent) {
            if (ACTION_USB_PERMISSION.equals(intent.getAction())) {
                synchronized (this) {
                    device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                    if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                        //connectToDevice(device);
                    } else {
                        Toast.makeText(context, "USB 권한이 거부되었습니다", Toast.LENGTH_SHORT).show();
                    }
                }
            }
        }
    };

    BellModule(ReactApplicationContext context) {
        super(context);
        mContext=context;
    }

    @NonNull
    @Override
    public String getName() {
        return "Bell";
    }

    @ReactMethod
    public void stopBell() {
        System.out.println("STOP BELL=============================");
        isRun=false;
        if(bellThread!=null) {
            bellThread.interrupt();
        }

        bellThread=null;
        usbManager = null;
    }

    @ReactMethod
    public void bellRing(String bellLan,String bellCorner,String bellNumber,String vendorId, String productId) {
        System.out.println("BELL TEST=============================");
        System.out.println(bellLan+","+bellCorner+","+bellNumber+","+vendorId+","+productId);
        stopBell();
        isRun = true;
        usbManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);
        ContextCompat.registerReceiver(mContext, usbReceiver, new IntentFilter(ACTION_USB_PERMISSION), ContextCompat.RECEIVER_EXPORTED);

        findAndConnectUsbDevice(bellLan,bellCorner,bellNumber, vendorId,productId);




// LED1을 빨강으로 설정



    }
    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    @ReactMethod
    public void bellCancel() {
        System.out.println("BELL TEST=============================");

        usbManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);
        mContext.registerReceiver(usbReceiver, new IntentFilter(ACTION_USB_PERMISSION));
        isRun=false;

        //sendResponse("{\"response\":\"\",\"msg\":\"진동벨 할당 중지\",\"code\":\"0001\"}");
        //findAndConnectUsbDevice(bellLan,bellCorner,bellNumber,vendorId,productId);


// LED1을 빨강으로 설정
    }




    private void findAndConnectUsbDevice(String bellLan,String bellCorner,String bellNumber,String vendorId, String productId) {

        List<UsbSerialDriver> availableDrivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager);

        if (availableDrivers.isEmpty()) {
            Toast.makeText(mContext, "USB 시리얼 장치가 없습니다", Toast.LENGTH_SHORT).show();
            return;
        }
        UsbSerialDriver driver = availableDrivers.get(0);

        for(int i=0; i<availableDrivers.size();i++) {

            if(availableDrivers.get(i).getDevice().getVendorId() == Integer.parseInt(vendorId) &&
                    availableDrivers.get(i).getDevice().getProductId() == Integer.parseInt(productId)
            ){
                driver = availableDrivers.get(i);

            }
        }

        //if (!usbManager.hasPermission(driver.getDevice())) {
            //PendingIntent permissionIntent = PendingIntent.getBroadcast(mContext, 0, new Intent(ACTION_USB_PERMISSION), PendingIntent.FLAG_MUTABLE);
            //usbManager.requestPermission(driver.getDevice(), permissionIntent);
        //} else {
            // 이미 권한 있음. 통신 시작 가능
        connectToDevice(driver.getDevice(),bellLan,bellCorner,bellNumber);

        //}
    }

    private void connectToDevice(UsbDevice device, String bellLan,String bellCorner,String bellNumber) {
        System.out.println("connect to device ===================================================");
        List<UsbSerialDriver> drivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager);
        for (UsbSerialDriver driver : drivers) {
            if (driver.getDevice().equals(device)) {
                try {
                    serialPort = driver.getPorts().get(0);
                    System.out.println("serialPort: "+driver.getPorts());

                    serialPort.open(usbManager.openDevice(driver.getDevice()));
                    serialPort.setParameters(9600, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE);

                    sendCustomerNumber(bellLan,bellCorner, bellNumber);

                } catch (IOException e) {

                }
                break;
            }
        }


        //sendCommand(command); // 1234번 설정

    }

    public static byte toByteArray(String input) {
        if (input == null || input.length() == 0) {
            throw new IllegalArgumentException("입력값이 비어있습니다.");
        }

        // 한 글자인 경우 (예: "A")
        if (input.length() == 1) {
            return (byte) input.charAt(0);  // 'A' -> 0x41
        }

        // "0x41" 또는 "41" 같이 16진수 문자열인 경우
        if (input.startsWith("0x") || input.startsWith("0X")) {
            return (byte) Integer.parseInt(input.substring(2), 16);
        } else {
            return (byte) Integer.parseInt(input, 16);
        }
    }

    public void sendCustomerNumber(String bellLan,String bellCorner,String bellNumber) {

        List<String> corners = new ArrayList<>();

        try {
            JSONArray jsonArray = new JSONArray(bellCorner);
            for (int i = 0; i < jsonArray.length(); i++) {
                corners.add(jsonArray.getString(i)); // int면 Integer, 문자열이면 String으로 자동 변환
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }


        byte stx = 0x01;
        byte etx = 0x03;

        // 고객번호 → ASCII
        byte[] numberBytes = bellNumber.getBytes(StandardCharsets.US_ASCII);

        // 코너들 → ASCII (A~O)
        int cornerLength = 0;
        for (String c : corners) {
            cornerLength += c.getBytes(StandardCharsets.US_ASCII).length;
        }

        // 언어 → ASCII
        byte[] lanBytes = (bellLan != null && !bellLan.isEmpty())
                ? bellLan.getBytes(StandardCharsets.US_ASCII)
                : new byte[0];

        // 전체 길이 = STX + number + corners + language + ETX
        int length = 1 + numberBytes.length + cornerLength + lanBytes.length + 1;
        byte[] command = new byte[length];

        int index = 0;
        command[index++] = stx;

        // 고객번호 복사
        System.arraycopy(numberBytes, 0, command, index, numberBytes.length);
        index += numberBytes.length;

        // 코너 복사
        for (String c : corners) {
            byte[] cornerBytes = c.getBytes(StandardCharsets.US_ASCII);
            System.arraycopy(cornerBytes, 0, command, index, cornerBytes.length);
            index += cornerBytes.length;
        }

        // 언어 복사
        System.arraycopy(lanBytes, 0, command, index, lanBytes.length);
        index += lanBytes.length;

        // 종료 바이트
        command[index] = etx;




        // 전송
        sendCommand(command);

    }


    private void sendCommand(byte[] command) {
        System.out.println("command=================================================");
        System.out.println(command);

        // 명령 전송
        //new Thread(() -> {

            try {
                serialPort.write(command, 1000);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
            Log.d("USB", "보냄 HEX: " + bytesToHex(command));


            isRun = true;
            final int[] countDown = {2};
            bellThread = new Thread(()->{

                while (isRun) {
                    Log.d("RECEIVED=====","isRun: "+isRun);

                    Log.d("RECEIVED=====", countDown[0] +"RUINNING===========================================");
                    if(countDown[0] <= 0) {
                        stopBell();
                        sendResponse("{\"response\":\"1\",\"msg\":\"진동벨 할당 에러\",\"code\":\"0002\"}");
                        break;
                    }
                    countDown[0]--;
                    byte[] buffer = new byte[64];
                    int len = 0; // 1초 대기
                    if(!serialPort.isOpen()) {
                        break;
                    }

                    try {
                        len = serialPort.read(buffer, 2000);
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }

                    if (len > 0) {
                        // 실제 받은 데이터만 추출
                        byte[] received = Arrays.copyOf(buffer, len);

                        // HEX 로그
                        Log.d("RECEIVED=====", bytesToHex(received));

                        // STX~ETX 사이 페이로드 추출
                        //if (received.length >= 3 && received[0] == 0x02 && received[received.length - 1] == 0x03) {
                        if (received.length >= 2) {
                            byte[] payload = Arrays.copyOfRange(received, 1, received.length - 1);
                            String payloadStr = new String(payload, StandardCharsets.US_ASCII);
                            Log.d("RECEIVED=====", "payload = " + payloadStr);
                            if (payloadStr != null && !payloadStr.trim().isEmpty()) {
                                // null, "", "   " (공백만 있는 문자열) 전부 처리됨
                                                        // 👉 여기서 payloadStr이 바로 "2"
                                // 원하면 int 값으로 변환
                                int value = Integer.parseInt(payloadStr);
                                Log.d("RECEIVED=====", "value = " + value);
                                if (value == 1) {
                                    sendResponse("{\"response\":\"" + value + "\",\"msg\":\"정상 처리\",\"code\":\"0000\"}");
                                    //isRun = false;
                                    break;
                                } else if (value == 2) {
                                    sendResponse("{\"response\":\"" + value + "\",\"msg\":\"진동벨을 가져가 주세요...\",\"code\":\"0000\"}");
                                    //isRun = false;
                                } else if (value == 3) {
                                    sendResponse("{\"response\":\"" + value + "\",\"msg\":\"픽업\",\"code\":\"0000\"}");
                                    break;
                                } else {
                                    sendResponse("{\"response\":\"" + value + "\",\"msg\":\"진동벨 할당 에러\",\"code\":\"0001\"}");
                                    break;
                                }
                                init();
                            }

                        }
                    }else {
                        Log.d("RECEIVED=====", "no response = ");

                    }
                }
            });
            bellThread.start();
    }

    private void init() {
        //serialPort=null;
    }

    private void sendResponse(String responseData) {
        if (mJSModule == null) {
            mJSModule = mContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
        }

        WritableMap params = new WritableNativeMap();
        params.putString("response", responseData+"");
        mJSModule.emit("onBellChange", params);

    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("0x%02X ", b));
        }
        return sb.toString();
    }

}

