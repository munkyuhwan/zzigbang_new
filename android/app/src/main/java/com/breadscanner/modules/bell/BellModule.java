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

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
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

    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    @ReactMethod
    public void bellTest(String bellLan,String bellCorner,String bellNumber,String vendorId, String productId, String numberStr) {
        System.out.println("BELL TEST=============================");

        usbManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);
        mContext.registerReceiver(usbReceiver, new IntentFilter(ACTION_USB_PERMISSION));

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
        if(serialPort != null) {
            try {
                serialPort.close();
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }


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
                    //controlLED1(true,true,true);
                    //controlLED1AndLED2(true, true, false, false, false, true);
                    // 데이터 수신 콜백
                    SerialInputOutputManager ioManager = new SerialInputOutputManager(serialPort, new SerialInputOutputManager.Listener() {
                        @Override
                        public void onNewData(byte[] data) {
                            Log.d("RECEIVED", bytesToHex(data));
                        }

                        @Override
                        public void onRunError(Exception e) {
                            Log.e("USB", "에러", e);
                        }
                    });
                    new Thread(ioManager).start();

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
        // 시작 바이트 (ASCII 'S' → 0x53)
        //byte stx = 0x53;
        byte stx = 0x01;
        byte lan = toByteArray(bellLan);
        byte corner = toByteArray(bellCorner);
        // 종료 바이트 (ETX → 0x03)
        byte etx = 0x03;

        // 숫자 문자열을 바이트 배열로 변환 (예: "1234" → 0x31, 0x32, 0x33, 0x34)

        byte[] numberBytes = bellNumber.getBytes(StandardCharsets.US_ASCII);
        System.out.println("numberBytes: "+numberBytes);
        // 전체 명령 배열 구성: S + 숫자들 + ETX
        byte[] command = new byte[1 + 1 + 1 + numberBytes.length + 1];

        command[0] = stx;
        command[1] = lan;
        command[2] = corner;

        System.arraycopy(numberBytes, 0, command, 1, numberBytes.length);
        command[command.length - 1] = etx;

        // 전송
        sendCommand(command);
    }


    private void sendCommand(byte[] command) {
        try {
            serialPort.write(command, 1000);

            boolean isCheck = true;
            //while (isCheck) {
                byte[] buffer = new byte[64];
                int len = serialPort.read(buffer, 10000);
                String response = new String(buffer, 0, len, StandardCharsets.UTF_8);
                Log.d("USB", "보냄: " + bytesToHex(command));
                System.out.println("response: "+response);
            //    Thread.sleep(1000);
            //}

        } catch (IOException e) {
            Log.e("USB", "쓰기 실패", e);
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("0x%02X ", b));
        }
        return sb.toString();
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

