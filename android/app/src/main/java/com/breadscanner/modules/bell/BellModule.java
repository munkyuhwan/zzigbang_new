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
    private UsbSerialPort serialPort;
    private UsbDevice device;
    private DeviceEventManagerModule.RCTDeviceEventEmitter mJSModule = null;
    private static final byte LED_STX = 0x02;
    private static final byte ETX = 0x03;
    static boolean isRun = true;

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
    public void bellRing(String bellLan,String bellCorner,String bellNumber,String vendorId, String productId) {
        System.out.println("BELL TEST=============================");
        System.out.println(bellLan+","+bellCorner+","+bellNumber+","+vendorId+","+productId);

        isRun = true;
        usbManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);
        ContextCompat.registerReceiver(mContext, usbReceiver, new IntentFilter(ACTION_USB_PERMISSION), ContextCompat.RECEIVER_EXPORTED);

        findAndConnectUsbDevice(bellLan,bellCorner,bellNumber, vendorId,productId);




// LED1을 빨강으로 설정



    }
    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    @ReactMethod
    public void bellCancel(String bellLan,String bellCorner,String bellNumber,String vendorId, String productId, String numberStr) {
        System.out.println("BELL TEST=============================");

        usbManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);
        mContext.registerReceiver(usbReceiver, new IntentFilter(ACTION_USB_PERMISSION));

        findAndConnectUsbDevice(bellLan,bellCorner,bellNumber,vendorId,productId);


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

        for(int i=0;i<driver.getPorts().size();i++) {
            System.out.println("driaver ("+i+") :"+driver.getPorts().get(i));
            System.out.println("driaver ("+i+") :"+driver.getPorts().get(i).isOpen());
            System.out.println("=============================================================");

        }

        System.out.println("driver: " + driver);
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

        /*
        // 시작 바이트 (STX: 0x01)
        byte stx = 0x01;
        // 종료 바이트 (ETX: 0x03)
        byte etx = 0x03;

        // 언어 → ASCII 바이트 (예: "a" → 0x61)
        byte[] lanBytes = (bellLan != null && !bellLan.isEmpty())
                ? bellLan.getBytes(StandardCharsets.US_ASCII)
                : new byte[0];

        // 코너 → ASCII 바이트 (예: "AC" → 0x41 0x43)
        byte[] cornerBytes = (bellCorner != null && !bellCorner.isEmpty())
                ? bellCorner.getBytes(StandardCharsets.US_ASCII)
                : new byte[0];

        // 고객번호 → ASCII 바이트 (예: "1234" → 0x31 0x32 0x33 0x34)
        byte[] numberBytes = bellNumber.getBytes(StandardCharsets.US_ASCII);

        // 전체 명령 배열 = STX + 언어 + 코너들 + 고객번호 + ETX
        int length = 1 + lanBytes.length + cornerBytes.length + numberBytes.length + 1;
        byte[] command = new byte[length];

        int index = 0;
        command[index++] = stx;

        System.arraycopy(lanBytes, 0, command, index, lanBytes.length);
        index += lanBytes.length;

        System.arraycopy(cornerBytes, 0, command, index, cornerBytes.length);
        index += cornerBytes.length;

        System.arraycopy(numberBytes, 0, command, index, numberBytes.length);
        index += numberBytes.length;

        command[index] = etx;

         */

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
            while (isRun) {
                Log.d("RECEIVED=====","RUINNING===========================================");

                byte[] buffer = new byte[64];
                int len = 0; // 1초 대기

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
            }



        //}).start();
        // 응답 읽기 (별도 스레드에서)

        /*
        new Thread(() -> {

            try {
                while (isRun) {
                    byte[] buffer = new byte[64];
                    int len = serialPort.read(buffer, 3000); // 최대 5초 대기

                    if (len > 0) {
                        // 실제 받은 바이트 배열 (len 길이만큼 자르기)
                        byte[] response = Arrays.copyOf(buffer, len);

                        // HEX 문자열로 보기
                        String responseHex = bytesToHex(response);
                        Log.d("USB", "응답 HEX: " + responseHex);

                        // ASCII로 변환 (0x31 -> "1")
                        String responseAscii = new String(response, StandardCharsets.US_ASCII);
                        Log.d("USB", "응답 ASCII: " + responseAscii);


                        // 프로토콜 파싱 예시
                        if (response.length >= 3 && response[0] == 0x02 && response[response.length - 1] == 0x03) {
                            byte payload = response[1]; // 중간 값
                            String responseData = String.valueOf((char) payload);

                            if(responseData.equals("1")) {
                                sendResponse("{\"response\":\""+responseData+"\",\"msg\":\"정상 처리\",\"code\":\"0000\"}");
                                isRun = false;
                            }else  if(responseData.equals("2")) {
                                sendResponse("{\"response\":\""+responseData+"\",\"msg\":\"진동밸 픽업 대기중\",\"code\":\"0000\"}");
                            }else  if(responseData.equals("3")) {
                                sendResponse("{\"response\":\""+responseData+"\",\"msg\":\"픽업\",\"code\":\"0000\"}");
                            }
                            isRun = false;

                        }




                    } else {
                        Log.w("USB", "응답 없음 (timeout)");
                        sendResponse("{\"response\":\"error\",\"msg\":\"응답 없음\",\"code\":\"xxxx\"}");
                        isRun = false;
                    }
                }
            } catch (IOException e) {
                Log.e("USB", "응답 읽기 실패", e);
                isRun = false;


            }


        }).start();

         */



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

    private void startReadLoop() {
        new Thread(() -> {
            try {
                byte[] buffer = new byte[64];
                while (true) {
                    int len = serialPort.read(buffer, 0); // 블로킹 모드 (0은 무제한 대기)
                    if (len > 0) {
                        byte[] response = Arrays.copyOf(buffer, len);
                        handleResponse(response);
                    }
                }
            } catch (IOException e) {
                Log.e("USB", "Read loop error", e);
            }
        }).start();
    }

    private void handleResponse(byte[] response) {
        // HEX 로그
        Log.d("USB", "수신 HEX: " + bytesToHex(response));

        // 프로토콜 확인
        if (response.length >= 3 && response[0] == 0x02 && response[response.length - 1] == 0x03) {
            // payload 추출
            byte[] payload = Arrays.copyOfRange(response, 1, response.length - 1);
            String payloadStr = new String(payload, StandardCharsets.US_ASCII);

            Log.d("USB", "수신 데이터: " + payloadStr);
            // 여기서 "벨이 반납됨" 같은 이벤트 처리
        }
    }


    /**
     * LED1만 제어
     */
    public void controlLED1(boolean red, boolean green, boolean blue) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        buffer.write(LED_STX);
        buffer.write(boolToByte(red));
        buffer.write(boolToByte(green));
        buffer.write(boolToByte(blue));
        buffer.write(ETX);

        serialPort.write(buffer.toByteArray(), 1000);
    }

    /**
     * LED1 + LED2 제어
     */
    public void controlLED1AndLED2(boolean red1, boolean green1, boolean blue1,
                                       boolean red2, boolean green2, boolean blue2) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        buffer.write(LED_STX);
        buffer.write(boolToByte(red1));
        buffer.write(boolToByte(green1));
        buffer.write(boolToByte(blue1));
        buffer.write(boolToByte(red2));
        buffer.write(boolToByte(green2));
        buffer.write(boolToByte(blue2));
        buffer.write(ETX);

        serialPort.write(buffer.toByteArray(), 1000);
    }

    private byte boolToByte(boolean on) {
        return (byte) (on ? '1' : '0');  // '1' or '0'
    }




}

