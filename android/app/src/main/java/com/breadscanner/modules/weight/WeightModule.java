package com.breadscanner.modules.weight;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbManager;
import android.os.Handler;
import android.os.Looper;
import android.text.SpannableStringBuilder;
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
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import kotlin.text.Regex;

public class WeightModule extends ReactContextBaseJavaModule {
    private static final String ACTION_USB_PERMISSION = "com.android.example.USB_PERMISSION";
    private ReactContext mContext;
    private UsbManager usbManager;
    private DeviceEventManagerModule.RCTDeviceEventEmitter mJSModule;

    private UsbSerialPort port = null;
    private static volatile boolean isReading = false;

    private Integer baudRate = 9600;
    private SerialInputOutputManager usbIoManager=null;
    private String decimalStr; // 변환할 숫자 문자열 (input)
    private String trayStr;    // 트레이 무게 문자열 (input)
    private String weight;
    WeightModule(ReactApplicationContext context) {
        super(context);
        mContext = context;
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
        return "Weight";
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
                            //Log.d("WeightModule", "onNewData: "+data);
                            String serialStr = new String(data).trim();
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

                                    if (mJSModule == null) {
                                        mJSModule = mContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
                                    }

                                    WritableMap params = new WritableNativeMap();
                                    params.putString("weight", kg+"" );
                                    mJSModule.emit("onWeightChanged", params);
                                    // 3. trayStr이 null인지 확인하여 트레이 무게를 뺍니다.
                                    /*
                                    if (trayStr != null) {
                                        try {
                                            // trayStr을 long으로 변환합니다. (Kotlin: trayStr!!.toLong())
                                            long trayWeight = Long.parseLong(trayStr);

                                            // 최종 무게 = 전체 그램 - 트레이 그램, 결과를 String으로 저장합니다.
                                            weight = String.valueOf(grams - trayWeight);
                                        } catch (NumberFormatException e) {
                                            // trayStr이 유효한 숫자가 아닐 경우
                                            Log.e("WeightModule", "Error parsing trayStr: " + trayStr, e); // 에러 로그 추가
                                            weight = String.valueOf(grams); // 트레이 무게를 빼지 않고 전체 그램을 사용합니다.
                                        }
                                    } else {
                                        // trayStr이 null이면 grams을 그대로 사용하고 String으로 변환합니다.
                                        weight = String.valueOf(grams);
                                    }

                                     */
                                } catch (NumberFormatException e) {
                                    // decimalStr이 유효한 double이 아닐 경우
                                    Log.e("WeightModule", "Error parsing decimalStr to Double: " + decimalStr, e); // 에러 로그 추가
                                    // 필요에 따라 weight 변수에 기본값을 설정하거나 오류 처리를 할 수 있습니다.
                                }

                            }

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

    private final Handler readHandler = new Handler(Looper.getMainLooper());
    private Runnable readRunnable;
    private static final long READ_INTERVAL_MS = 10; // 300ms 주기 설정 (필요에 따라 조절)



    private void stopReading() {
        isReading = false;
        readHandler.removeCallbacks(readRunnable); // 예약된 모든 작업 제거
        Log.d("WeightModule", "Periodic reading stopped.");

        // 포트 닫기
        try {
            if (port != null) {
                port.close();
                port = null;
                Log.d("WeightModule", "Port closed by stopReading.");
            }
        } catch (IOException e) {
            Log.e("WeightModule", "Error closing port: " + e.getMessage());
        }
    }

    // 이벤트 전송 메서드 분리
    private void emitWeightEvent(String weight) {
        if (mJSModule == null) {
            mJSModule = mContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
        }
        if (mJSModule != null) {
            WritableMap params = new WritableNativeMap();
            params.putString("weight", weight);
            mJSModule.emit("onWeightChanged", params);
        }
    }

    private void startReading() {
        if (port == null) {
            Log.e("WeightModule", "Cannot start reading: port is null.");
            return;
        }

        if (readRunnable == null) {
            // Runnable 객체 정의: 실제로 데이터를 읽고 다음 작업을 예약하는 작업
            readRunnable = new Runnable() {
                @Override
                public void run() {
                    // USB I/O 작업은 메인 스레드에서 실행하면 안 됩니다.
                    // 따라서 이 Runnable은 새로운 백그라운드 스레드에서 실행되도록 스케줄링해야 합니다.
                    new Thread(() -> {
                        byte[] command = new byte[]{0x02, 0x52, 0x03}; // STX + 'R' + ETX
                        byte[] buffer = new byte[64];

                        try {
                            // 1. 명령 전송
                            port.write(command, 90);

                            // 2. 데이터 읽기 (100ms 타임아웃)
                            int len = port.read(buffer, 100);

                            if (len > 0) {
                                String response = new String(buffer, 0, len, StandardCharsets.UTF_8);
                                Common common = new Common();
                                String parsedWeight = String.valueOf(common.parseValue(response));

                                // 3. JS로 이벤트 전송 (이벤트는 어느 스레드에서든 보낼 수 있습니다)
                                Log.d("WeightModule", "Parsed Weight: " + parsedWeight);
                                emitWeightEvent(parsedWeight);
                            }
                        } catch (IOException e) {
                            Log.e("WeightModule", "I/O Error during reading (Device disconnected?): " + e.getMessage());
                            stopReading(); // 에러 발생 시 읽기 중단
                            return; // 다음 예약 작업을 건너뛰고 종료
                        } catch (Exception e) {
                            Log.e("WeightModule", "General error during reading: " + e.getMessage());
                        }

                        // 4. 다음 읽기 작업 예약: 설정된 주기(READ_INTERVAL_MS) 후 이 Runnable을 다시 실행합니다.
                        if (isReading) {
                            readHandler.postDelayed(this, READ_INTERVAL_MS);
                        }
                    }).start();
                }
            };
        }

        // 첫 작업 시작
        isReading = true;
        readHandler.post(readRunnable); // 즉시 첫 작업 실행
        Log.d("WeightModule", "Periodic reading started with interval: " + READ_INTERVAL_MS + "ms");
    }

    private void readWeightLoop() {
        byte[] command = new byte[]{0x02, 0x52, 0x03}; // STX + 'R' + ETX
        byte[] buffer = new byte[64];

        StringBuilder lineBuffer = new StringBuilder();

        try {
            port.write(command, 90);
            Log.d("WeightModule", "Command sent: " + Arrays.toString(command));

            while (isReading && port != null) {
                int len = port.read(buffer, 100);
                if (len > 0) {
                    String response = new String(buffer, 0, len, StandardCharsets.UTF_8);
                    Common common = new Common();
                    Log.d("WeightModule", "==========================================================");
                    Log.d("WeightModule", "Weight response: " + (response));
                    Log.d("WeightModule", "Weight response: " + common.parseValue(response));

                    if (mJSModule == null) {
                        mJSModule = mContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
                    }

                    WritableMap params = new WritableNativeMap();
                    params.putString("weight", common.parseValue(response)+"");
                    mJSModule.emit("onWeightChanged", params);
                }

                Thread.sleep(10); // 1초 주기
            }





        } catch (Exception e) {
            Log.e("WeightModule", "Error reading weight: " + e.getMessage());
        } finally {
            Log.e("WeightModule", "===================================finally Error reading weight===================================");

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
