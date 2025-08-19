package com.breadscanner.modules.printer;

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
import android.os.Build;
import android.os.SystemClock;
import android.print.PrinterInfo;
import android.util.DisplayMetrics;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.sam4s.printer.Sam4sBuilder;
import com.sam4s.printer.Sam4sFinder;
import com.sam4s.printer.Sam4sPrint;
import com.sam4s.usb.driver.UsbPrinterDriver;
import com.sam4s.usb.driver.UsbPrinterPort;
import com.sam4s.usb.driver.UsbPrinterProber;
import com.sam4s.usb.util.CommunicationManager;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.text.DecimalFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Objects;

public class PrinterModule extends ReactContextBaseJavaModule {

    private ReactContext mContext = null;
    private static final String ACTION_USB_PERMISSION = "com.android.example.USB_PERMISSION";
    private UsbManager usbManager;
    private DeviceEventManagerModule.RCTDeviceEventEmitter mJSModule = null;
    //private String printer_model = "gcube-102";
    private String printer_model = "gcube-100s";
    final static  int[] codenumber = {
            Sam4sBuilder.CHARACTER_CODE_PC437, Sam4sBuilder.CHARACTER_CODE_PC737, Sam4sBuilder.CHARACTER_CODE_PC775,  Sam4sBuilder.CHARACTER_CODE_PC850,
            Sam4sBuilder.CHARACTER_CODE_PC852, Sam4sBuilder.CHARACTER_CODE_PC855, Sam4sBuilder.CHARACTER_CODE_PC858, Sam4sBuilder.CHARACTER_CODE_PC860,
            Sam4sBuilder.CHARACTER_CODE_PC862, Sam4sBuilder.CHARACTER_CODE_PC863, Sam4sBuilder.CHARACTER_CODE_PC864, Sam4sBuilder.CHARACTER_CODE_PC865,
            Sam4sBuilder.CHARACTER_CODE_PC866, Sam4sBuilder.CHARACTER_CODE_WPC1250, Sam4sBuilder.CHARACTER_CODE_WPC1251, Sam4sBuilder.CHARACTER_CODE_WPC1252,
            Sam4sBuilder.CHARACTER_CODE_WPC1253, Sam4sBuilder.CHARACTER_CODE_WPC1255, Sam4sBuilder.CHARACTER_CODE_WPC1256, Sam4sBuilder.CHARACTER_CODE_WPC1257
    };
    private CommunicationManager mManager;
    private UsbPrinterPort mUsbPort;
    private USBPrinterInfo mUSBPrinterInfo;

    // 영수증 포지션
    int ITEM_NAME_POSITION = 0;
    int ITEM_AMT_POSITION = 320;
    int ITEM_AMT_COLUMN_TITLE_POSITION = 300;
    int ITEM_PRICE_POSITION = 420;

    PrinterModule(ReactApplicationContext context) {
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


    BroadcastReceiver mUsbAttachReceiver = new BroadcastReceiver() {
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (UsbManager.ACTION_USB_DEVICE_ATTACHED.equals(action)) {
                refreshDeviceList();
            }
        }
    };

    BroadcastReceiver mUsbDetachReceiver = new BroadcastReceiver() {
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (UsbManager.ACTION_USB_DEVICE_DETACHED.equals(action)) {
                //ClosePrinter();
                //mOpened = false;

                //mBtnOpenPort.setEnabled(true);
                //mBtnClosePort.setEnabled(false);

                refreshDeviceList();
            }
        }
    };

    @SuppressLint("StaticFieldLeak")
    private void refreshDeviceList() {

        final AsyncTask<Void, Void, List<UsbPrinterPort>> execute = new AsyncTask<Void, Void, List<UsbPrinterPort>>() {
            @Override
            protected List<UsbPrinterPort> doInBackground(Void... params) {
                SystemClock.sleep(100);

                final List<UsbPrinterDriver> drivers =
                        UsbPrinterProber.getDefaultProber().findAllDrivers((UsbManager) Objects.requireNonNull(getCurrentActivity().getSystemService(Context.USB_SERVICE)));

                final List<UsbPrinterPort> result = new ArrayList<UsbPrinterPort>();
                for (final UsbPrinterDriver driver : drivers) {
                    final List<UsbPrinterPort> ports = driver.getPorts();
                    result.addAll(ports);
                }
                return result;
            }

            @Override
            protected void onPostExecute(List<UsbPrinterPort> result) {

                List<PrinterInfo> list = new ArrayList<PrinterInfo>();
                for(UsbPrinterPort port : result) {
                    //port.getSerial();
                    System.out.println(port.getSerial());
                    //list.add(new USBPrinterInfo(port));
                }

                //mDeviceAdapter.setData(list);
                //mDeviceAdapter.notifyDataSetChanged();
                //ShowDeviceCount(String.format("%s device(s) found", mEntries.size() ));
            }
        }.execute((Void) null);
    }

    @NonNull
    @Override
    public String getName() {
        return "Printer";
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
    public void testSerial () {
        Sam4sFinder ef = new Sam4sFinder();

        String [] deviceList = null;
        try {
            deviceList = ef.getResult();
        }catch (Exception e) {
            e.getStackTrace();
        }
        System.out.println("device list: "+deviceList);

    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public String getAllUsbDeviceList() {

        mManager = new CommunicationManager(mContext, mUsbPort);

        usbManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);
        JSONArray jsonArray = new JSONArray();
        int index=0;
        System.out.println("************************************************************************************");
        System.out.println(usbManager.getDeviceList().keySet().size());

        for (String key : usbManager.getDeviceList().keySet()) {

            UsbDevice usbDevice = usbManager.getDeviceList().get(key);
            System.out.println("************************************************************************************");
            System.out.println("usb device");
            //System.out.println(usbDevice.getProductName());
            System.out.println(usbDevice.getDeviceName());
            //System.out.println(usbDevice.getVendorId());
            //System.out.println(usbDevice.getProductId());
            //System.out.println(usbDevice.getSerialNumber() );
            //System.out.println(usbDevice.getDeviceId() );
            //System.out.println(usbDevice );
            JSONObject jsonObject = new JSONObject();
            try {
                jsonObject.put("productName",usbDevice.getProductName());
                jsonObject.put("deviceName",usbDevice.getDeviceName());
                jsonObject.put("vendorId",usbDevice.getVendorId());
                jsonObject.put("productId",usbDevice.getProductId());
                jsonArray.put(index,jsonObject);
                index++;
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }

        }
        return jsonArray.toString();

    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public String usbDeviceList() {

        final List<UsbPrinterDriver> drivers = UsbPrinterProber.getDefaultProber().findAllDrivers((UsbManager) Objects.requireNonNull(mContext.getSystemService(Context.USB_SERVICE)));

        Log.d("SAM4S",drivers.toString());

        return "";

    }

    @ReactMethod
    public void TestPrint() {
        System.out.println("TEST PRINT");

        final List<UsbPrinterDriver> drivers = UsbPrinterProber.getDefaultProber().findAllDrivers((UsbManager) Objects.requireNonNull(mContext.getSystemService(Context.USB_SERVICE)));
        Log.d("SAM4S", "drivers: "+drivers );
        final List<UsbPrinterPort> result = new ArrayList<UsbPrinterPort>();
        Log.d("SAM4S", String.valueOf(result));

        for (final UsbPrinterDriver driver : drivers) {
            final List<UsbPrinterPort> ports = driver.getPorts();
            Log.d("SAM4S", ports.toString());
            result.addAll(ports);
        }


        if(result.size() > 0) {
            mUSBPrinterInfo = (USBPrinterInfo) new USBPrinterInfo(result.get(0));
            mUsbPort = mUSBPrinterInfo.getPort();     // 2024.06.12 sjsim

            boolean retBool = OpenPrinter();

            String name = printer_model;
            Sam4sBuilder builder = null;
            builder = new Sam4sBuilder(name.trim(), 0);

            try {
                builder.addTextFont(Sam4sBuilder.FONT_A);          // Sam4sBuilder.FONT_B

                //addTextAlign
                //builder.addTextAlign(Sam4sBuilder.ALIGN_CENTER);   // Sam4sBuilder.ALIGN_LEFT, Sam4sBuilder.ALIGN_RIGHT, Sam4sBuilder.ALIGN_CENTER

                //addTextPosition
                builder.addTextPosition(0);

                //addTextLang
                builder.addTextLang(Sam4sBuilder.LANG_KO);         // Sam4sBuilder.LANG_EN

                //addTextSize
                builder.addTextSize(1, 1);
                builder.addTextStyle(false, false, false, Sam4sBuilder.COLOR_1);

                //addText
                builder.addTextCodepage(codenumber[0]);
                //builder.addText(testString, "Cp437");
                builder.addTextLineSpace(50);
                builder.addTextSize(3, 3);
                builder.addText("testtest\n");
                builder.addCut(Sam4sBuilder.CUT_NO_FEED);           // Sam4sBuilder.CUT_FEED

                //addFeedUnit
                builder.addFeedUnit(0);
                try {
                    PrintData(builder);
                } catch (Exception e) {
                    e.getStackTrace();
                }

                // remove builder
                if (builder != null) {
                    try {
                        builder.clearCommandBuffer();
                        builder = null;
                    } catch (Exception e) {
                        builder = null;
                    }
                }


            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }



        //addTextStyle

    }

    private int getAlign(int value) {
        if(value < 10 && value >= 0 ) {
            return (ITEM_PRICE_POSITION+65);
        }else if(value < 100 && value >= 10 ) {
            return (ITEM_PRICE_POSITION+55);
        }else if(value < 1000 && value >= 100 ) {
            return (ITEM_PRICE_POSITION+47);
        }else if(value < 10000 && value >= 1000) {
            return (ITEM_PRICE_POSITION+20);
        }else if(value < 100000 && value >= 10000) {
            return (ITEM_PRICE_POSITION+15);
        }else {
            return (ITEM_PRICE_POSITION+10);
        }
    }
    public static String formatBizNo(String input) {
        // 숫자만 추출
        String digits = input.replaceAll("\\D", "");
        // 10자리면 하이픈 포맷 적용
        if (digits.length() == 10) {
            return digits.replaceFirst("^(\\d{3})(\\d{2})(\\d{5})$", "$1-$2-$3");
        }
        // 그 외 길이는 그대로 반환(또는 예외 처리)
        return input;
    }
    public static String formatDateTime(String input) {
        SimpleDateFormat inputFormat = new SimpleDateFormat("yyMMddHHmmss");
        SimpleDateFormat outputFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        try {
            Date date = inputFormat.parse(input);
            return outputFormat.format(date);
        } catch (ParseException e) {
            e.printStackTrace();
            return input; // 변환 실패 시 원본 반환
        }
    }


    @ReactMethod
    public void Sam4sStartPrint(String finalOrderData, String itemData,String payResultData, String businessData, String storeName, String orderNo) {
        /*Log.d("SAM4S", "item data: "+itemData );
        Log.d("SAM4S", "business Data: "+businessData );
        Log.d("SAM4S", "payResultData: "+payResultData );
        Log.d("SAM4S", "orderNo: "+orderNo );

         */


        if(!itemData.equals("")) {
            try {
                DecimalFormat df = new DecimalFormat("#,###");
                JSONArray jsonArray = new JSONArray(itemData);
                JSONObject finalData = new JSONObject(finalOrderData);

                JSONObject bData = new JSONObject(businessData);
                JSONObject payData = new JSONObject(payResultData);
                if (jsonArray.length() > 0) {
                    final List<UsbPrinterDriver> drivers = UsbPrinterProber.getDefaultProber().findAllDrivers((UsbManager) Objects.requireNonNull(mContext.getSystemService(Context.USB_SERVICE)));
                    final List<UsbPrinterPort> result = new ArrayList<UsbPrinterPort>();
                    for (final UsbPrinterDriver driver : drivers) {
                        final List<UsbPrinterPort> ports = driver.getPorts();
                        Log.d("SAM4S", ports.toString());
                        result.addAll(ports);
                    }

                    Log.d("SAM4S", result.get(0).toString());

                    mUSBPrinterInfo = (USBPrinterInfo) new USBPrinterInfo(result.get(0));
                    mUsbPort = mUSBPrinterInfo.getPort();     // 2024.06.12 sjsim
                    boolean retBool = OpenPrinter();
                    Log.d("SAM4S", "retBool: " + retBool);
                    Log.d("SAM4S","payData: "+payData);
                    String name = printer_model;
                    Sam4sBuilder builder = null;
                    builder = new Sam4sBuilder(name.trim(), 0);       // LANG_EN = 0
                    try {
                        //add command
                        //addTextFont
                        // 사업자 정보
                        builder.addTextFont(Sam4sBuilder.FONT_A);          // Sam4sBuilder.FONT_B
                        //addTextAlign
                        //builder.addTextAlign(Sam4sBuilder.ALIGN_CENTER);   // Sam4sBuilder.ALIGN_LEFT, Sam4sBuilder.ALIGN_RIGHT, Sam4sBuilder.ALIGN_CENTER
                        //addTextPosition
                        builder.addTextPosition(0);
                        //addTextLang
                        builder.addTextLang(Sam4sBuilder.LANG_KO);         // Sam4sBuilder.LANG_EN
                        //addTextSize
                        builder.addTextSize(1, 1);
                        //addTextStyle
                        builder.addTextStyle(false, false, false, Sam4sBuilder.COLOR_1);
                        //addText
                        builder.addTextAlign(Sam4sBuilder.ALIGN_LEFT);
                        builder.addTextCodepage(codenumber[0]);
                        //builder.addText(testString, "Cp437");



                        builder.addTextAlign(Sam4sBuilder.ALIGN_CENTER);
                        builder.addTextSize(2, 2);
                        builder.addTextBold(true);
                        builder.addText("영수증\n");

                        ///  사업자 정보 영역
                        builder.addTextAlign(Sam4sBuilder.ALIGN_LEFT);

                        builder.addTextSize(1, 1);
                        //builder.addText(testString);
                        int COLUMN_POSITION = 150;
                        int BUSNISSINFO_POSITION = 180;
                        builder.addTextLineSpace(70);
                        builder.addText("------------------------------------------\n");

                        builder.addTextBold(true);
                        // 사업자명
                        builder.addText("상 호");
                        builder.addTextPosition(COLUMN_POSITION);
                        builder.addText(":");
                        builder.addTextPosition(BUSNISSINFO_POSITION);
                        builder.addText(storeName+"\n");
                        // 연락처
                        builder.addText("연락처");
                        builder.addTextPosition(COLUMN_POSITION);
                        builder.addText(":");
                        builder.addTextPosition(BUSNISSINFO_POSITION);
                        builder.addText(bData.getString("ShpTel")+"\n");
                        builder.addTextBold(false);

                        // 주 소
                        builder.addText("주 소");
                        builder.addTextPosition(COLUMN_POSITION);
                        builder.addText(":");
                        builder.addTextPosition(BUSNISSINFO_POSITION);
                        builder.addText(bData.getString("ShpAdr")+"\n");

                        builder.addText("사업자번호");
                        builder.addTextPosition(COLUMN_POSITION);

                        builder.addText(":");
                        builder.addTextPosition(BUSNISSINFO_POSITION);
                        builder.addText(formatBizNo(bData.getString("BsnNo"))+"\n");

                        builder.addText("날짜");
                        builder.addTextPosition(COLUMN_POSITION);
                        builder.addText(":");
                        builder.addTextPosition(BUSNISSINFO_POSITION);
                        builder.addText(formatDateTime(payData.getString("TrdDate"))+"\n");




                        ///  결제 내역 영역
                        builder.addTextLineSpace(40);
                        builder.addText("------------------------------------------\n");
                        builder.addTextPosition(ITEM_NAME_POSITION);
                        builder.addText("\n품명");
                        builder.addTextPosition(ITEM_AMT_COLUMN_TITLE_POSITION);
                        builder.addText("수량");
                        builder.addTextPosition(ITEM_PRICE_POSITION);
                        builder.addText("금액\n");
                        builder.addText("------------------------------------------\n");
                        builder.addTextLineSpace(80);
                        Log.d("SAM4S", "finalData: "+finalData );
                        Log.d("SAM4S", "ITEM_INFO: "+finalData.getJSONArray("ITEM_INFO") );
                        JSONArray itemInfo = finalData.getJSONArray("ITEM_INFO");
                        if(itemInfo.length()>0) {
                            for (int i=0;i<itemInfo.length();i++) {
                                JSONObject itemDetail = itemInfo.getJSONObject(i);

                                builder.addTextPosition(ITEM_NAME_POSITION);
                                builder.addText((i+1)+"."+itemDetail.getString("ITEM_NM"));
                                builder.addTextPosition(ITEM_AMT_POSITION);
                                builder.addText(itemDetail.getString("ITEM_QTY"));
                                builder.addTextPosition(ITEM_PRICE_POSITION);

                                builder.addTextPosition(getAlign(Integer.parseInt(itemDetail.getString("ITEM_AMT"))) );

                                builder.addText(df.format(Integer.parseInt(itemDetail.getString("ITEM_AMT")) )+"\n");

                                // 옵션 가격
                                Log.d("SAM4S", "itemDetail: "+itemDetail );

                                JSONArray setItemInfo = itemDetail.getJSONArray("SETITEM_INFO");
                                Log.d("SAM4S", "setItemInfo: "+setItemInfo );

                                if(setItemInfo.length()>0) {
                                    for(int j=0;j<setItemInfo.length();j++) {
                                        builder.addTextPosition(ITEM_NAME_POSITION);
                                        builder.addText("->"+setItemInfo.getJSONObject(j).getString("PROD_I_NM"));
                                        builder.addTextPosition(ITEM_AMT_POSITION);
                                        builder.addText(setItemInfo.getJSONObject(j).getString("QTY"));
                                        builder.addTextPosition(getAlign( Integer.parseInt(setItemInfo.getJSONObject(j).getString("AMT"))+Integer.parseInt(setItemInfo.getJSONObject(j).getString("VAT"))  ));
                                        builder.addText(df.format(Integer.parseInt(setItemInfo.getJSONObject(j).getString("AMT"))+Integer.parseInt(setItemInfo.getJSONObject(j).getString("VAT")) )+"\n");

                                    }
                                }

                            }
                        }
                        builder.addTextLineSpace(40);

                        builder.addText("------------------------------------------\n");
                        builder.addTextSize(1, 2);
                        builder.addTextBold(true);
                        builder.addTextLineSpace(100);
                        builder.addTextPosition(ITEM_NAME_POSITION);
                        builder.addText("소  계");
                        builder.addTextPosition(getAlign(Integer.parseInt(payData.getString("TrdAmt"))+Integer.parseInt(payData.getString("TaxAmt"))) );
                        builder.addText(df.format(Integer.parseInt(payData.getString("TrdAmt"))+Integer.parseInt(payData.getString("TaxAmt"))) +"\n");

                        builder.addTextLineSpace(70);
                        builder.addTextSize(1, 1);
                        builder.addTextPosition(ITEM_NAME_POSITION);
                        builder.addText("순 매 출");
                        builder.addTextPosition(ITEM_PRICE_POSITION);
                        builder.addTextPosition(getAlign(Integer.parseInt(payData.getString("TrdAmt"))) );
                        builder.addText(df.format(Integer.parseInt(payData.getString("TrdAmt"))) +"\n");

                        builder.addTextSize(1, 1);
                        builder.addTextPosition(ITEM_NAME_POSITION);
                        builder.addText("부 가 세");
                        builder.addTextPosition(ITEM_PRICE_POSITION);
                        builder.addTextPosition(getAlign(Integer.parseInt(payData.getString("TaxAmt"))) );
                        builder.addText(df.format(Integer.parseInt(payData.getString("TaxAmt"))) +"\n");

                        builder.addTextLineSpace(100);
                        builder.addTextSize(1, 2);
                        builder.addTextPosition(ITEM_NAME_POSITION);
                        builder.addText("매출합계");
                        builder.addTextPosition(ITEM_PRICE_POSITION);
                        builder.addTextPosition(getAlign(Integer.parseInt(payData.getString("TrdAmt"))+Integer.parseInt(payData.getString("TaxAmt"))) );
                        builder.addText(df.format(Integer.parseInt(payData.getString("TrdAmt"))+Integer.parseInt(payData.getString("TaxAmt"))) +"\n");


                        builder.addTextSize(1, 1);
                        builder.addTextBold(false);

                        // 결제 승인 정보
                        builder.addTextSize(1, 1);
                        //builder.addText(testString);
                        int PAY_COLUMN_POSITION = 150;
                        int PAY_INFO_POSITION = 180;
                        builder.addText("------------------------------------------\n");

                        // 카드정보
                        builder.addTextLineSpace(80);
                        builder.addTextAlign(Sam4sBuilder.ALIGN_LEFT);

                        builder.addText("[카 드 번 호]");
                        builder.addTextPosition(PAY_COLUMN_POSITION);
                        builder.addText(":");
                        builder.addTextPosition(PAY_INFO_POSITION);
                        builder.addText(payData.getString("CardNo")+"\n");

                        // 할부개월
                        builder.addText("[할 부 개 월]");
                        builder.addTextPosition(PAY_COLUMN_POSITION);
                        builder.addText(":");
                        builder.addTextPosition(PAY_INFO_POSITION);
                        builder.addText(payData.getString("Month")+"\n");

                        // 카드사명
                        builder.addText("[카 드 사 명]");
                        builder.addTextPosition(PAY_COLUMN_POSITION);
                        builder.addText(":");
                        builder.addTextPosition(PAY_INFO_POSITION);
                        builder.addText(payData.getString("InpNm")+"\n");

                        // 승인번호
                        builder.addText("[승 인 번 호]");
                        builder.addTextPosition(PAY_COLUMN_POSITION);
                        builder.addText(":");
                        builder.addTextPosition(PAY_INFO_POSITION);
                        builder.addText(payData.getString("AuNo")+"\n");

                        // 결제금액
                        builder.addText("[결 제 금 액]");
                        builder.addTextPosition(PAY_COLUMN_POSITION);
                        builder.addText(":");
                        builder.addTextPosition(PAY_INFO_POSITION);
                        builder.addText(df.format(Integer.parseInt(payData.getString("TrdAmt"))+Integer.parseInt(payData.getString("TaxAmt")))+"\n");






                        builder.addText("                                                \n");
                        builder.addTextAlign(Sam4sBuilder.ALIGN_CENTER);
                        builder.addText("주문번호\n");
                        builder.addTextSize(3, 3);
                        builder.addText(orderNo+"\n");

                        builder.addTextSize(1, 1);
                        builder.addText("                                                \n");
                        builder.addText("                                                \n");
                        builder.addCut(Sam4sBuilder.CUT_NO_FEED); // Sam4sBuilder.CUT_FEED

                        //addFeedUnit
                        builder.addFeedUnit(0);

                        try {
                            PrintData(builder);
                        } catch (Exception e) {
                            e.getStackTrace();
                        }

                        // remove builder
                        if (builder != null) {
                            try {
                                builder.clearCommandBuffer();
                                builder = null;
                            } catch (Exception e) {
                                builder = null;
                            }
                        }

                    } catch (Exception e) {
                        Log.d("SAM4S", e.getMessage());
                    }
                }
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }

        }

    }




    @ReactMethod
    public void Sam4sDeviceList() {

        final List<UsbPrinterDriver> drivers = UsbPrinterProber.getDefaultProber().findAllDrivers((UsbManager) Objects.requireNonNull(mContext.getSystemService(Context.USB_SERVICE)));
        final List<UsbPrinterPort> result = new ArrayList<UsbPrinterPort>();
        for (final UsbPrinterDriver driver : drivers) {
            final List<UsbPrinterPort> ports = driver.getPorts();
            Log.d("SAM4S",ports.toString());

            result.addAll(ports);
        }

        Log.d("SAM4S",result.get(0).toString());
        mUSBPrinterInfo  = (USBPrinterInfo) new USBPrinterInfo(result.get(0));

        mUsbPort = mUSBPrinterInfo.getPort();     // 2024.06.12 sjsim

        boolean retBool = OpenPrinter();

        Log.d("SAM4S","retBool: "+retBool);

        String name = printer_model;
        Sam4sBuilder builder = null;
        builder = new Sam4sBuilder(name.trim(), 0);       // LANG_EN = 0
        try {
            //add command
            //addTextFont
            builder.addTextFont(Sam4sBuilder.FONT_A);          // Sam4sBuilder.FONT_B

            //addTextAlign
            //builder.addTextAlign(Sam4sBuilder.ALIGN_CENTER);   // Sam4sBuilder.ALIGN_LEFT, Sam4sBuilder.ALIGN_RIGHT, Sam4sBuilder.ALIGN_CENTER

            //addTextPosition
            builder.addTextPosition(0);


            //addTextLang
            builder.addTextLang(Sam4sBuilder.LANG_KO);         // Sam4sBuilder.LANG_EN

            //addTextSize
            builder.addTextSize(1, 1);

            //addTextStyle
            builder.addTextStyle(false , false , false, Sam4sBuilder.COLOR_1);

            //addText
            builder.addTextCodepage(codenumber[0]);
            //builder.addText(testString, "Cp437");
            //builder.addText(testString);
            builder.addText("================================================\n");
            builder.addText(" 사업자번호 : 000-00-00000                     \n");
            builder.addText(" 전화번호         : (02) 999-9999                    \n");
            builder.addText(" Address     : Seoul Geumcheon-Gu Gasan         \n");
            builder.addText(" Date        : 2024/10/23 11:23:35              \n");
            builder.addText(" Number      : 1000001                          \n");
            builder.addText("================================================\n");
            builder.addText(" 1.Chicken salad               x1         $21.00\n");
            builder.addText(" 2.Ice cream                   x2          $7.00\n");
            builder.addText(" 3.Steak                       x1         $32.00\n");
            builder.addText(" 4.Cappuccino                  x1          $2.00\n");
            builder.addText(" 5.Coke                        x1          $1.00\n");
            builder.addText(" 6.Apple Pie                   x1          $3.00\n");
            builder.addText(" 7.Pork rib                    x1         $25.00\n");
            builder.addText(" 8.Lunch Set                   x1         $32.00\n");
            builder.addText("------------------------------------------------\n");
            builder.addText(" CASH                                    $123.00\n");
            builder.addText("================================================\n");
            builder.addText("                                                \n");
            builder.addText("                                                \n");
            builder.addText("                                                \n");
            builder.addText("                                                \n");
            builder.addText("                                                \n");
            builder.addCut(Sam4sBuilder.CUT_NO_FEED);           // Sam4sBuilder.CUT_FEED

            //addFeedUnit
            builder.addFeedUnit(0);

            try {
                PrintData(builder);
            } catch (Exception e) {
                e.getStackTrace();
            }

            // remove builder
            if (builder != null) {
                try {
                    builder.clearCommandBuffer();
                    builder = null;
                } catch (Exception e) {
                    builder = null;
                }
            }

        } catch(Exception e) {
            Log.d("SAM4S", e.getMessage());
        }

    }


    public boolean OpenPrinter() {

        System.out.println(" open printer=====================================");
        boolean retBool;
        System.out.println("mContext: "+mContext);
        System.out.println("mUsbPort: "+mUsbPort);

        if (mContext == null) {
            return false;
        }
        if (mUsbPort == null) {
            return false;
        }

        mManager = new CommunicationManager(mContext, mUsbPort);
        retBool = mManager.open();
        System.out.println("mManager: "+mManager);
        System.out.println("retBool: "+retBool);


        return retBool;
    }

    public int PrintData(Sam4sBuilder builder) {
        int iret = -1;

        try {
            if(mManager != null) {
                iret = mManager.write(builder.getDataOutputStreamEx().toByteArray());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return iret;
    }

    @ReactMethod
    public void printWithID(int vendorID, int productID) {
        //usbManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);
        //UsbDevice availableDevice = null;


        final List<UsbPrinterDriver> drivers = UsbPrinterProber.getDefaultProber().findAllDrivers((UsbManager) Objects.requireNonNull(mContext.getSystemService(Context.USB_SERVICE)));

        Log.d("SAM4S",drivers.toString());


    }

    @ReactMethod
    public void getDeviceList() {
        usbManager = (UsbManager) mContext.getSystemService(Context.USB_SERVICE);
        UsbDevice availableDevice = null;

        System.out.println("device list====================================================================================================");
        for (String key : usbManager.getDeviceList().keySet()) {

            UsbDevice usbDevice = usbManager.getDeviceList().get(key);

            System.out.println("************************************************************************************");
            System.out.println("usb device");
            System.out.println(usbDevice);
            if(usbDevice.getVendorId()==1027 && usbDevice.getProductId()==24597) {
                availableDevice = usbDevice;
                requestPermission(availableDevice);

            }
            System.out.println(" ");
            System.out.println(" ");
            System.out.println(" ");

        }

        if(availableDevice != null) {

            if(usbManager != null) {

                //requestPermission(availableDevice);

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

                if(usbEndpoint != null) {

                    connection.claimInterface(usbInterface, true);

                    // 영수증 내용
                    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

                    String title = "★★★ 매장 영수증 ★★★\n";
                    String item1 = "콜라          1개   1,500원\n";
                    String item2 = "햄버거        1개   5,000원\n";
                    String total = "합계:         6,500원\n";
                    String thanks = "감사합니다!\n\n";


                    // 종이 자르기
                    byte[] initPrinter = {0x1B, 0x40}; // 프린터 초기화
                    byte[] enableKoreanFont = {0x1C, 0x13}; // 한글 폰트 활성화
                    byte[] setKoreanEncoding = {0x1B, 0x74, 0x13}; // 한글 코드페이지 설정
                    byte[] disableChinese = {0x1C, 0x2E}; // 중국어 코드페이지 해제

                    byte[] boldOn = {0x1B, 0x45, 0x01}; // 굵게 설정
                    byte[] boldOff = {0x1B, 0x45, 0x00}; // 굵기 해제
                    byte[] alignCenter = {0x1B, 0x61, 0x01}; // 가운데 정렬
                    byte[] alignLeft = {0x1B, 0x61, 0x00}; // 왼쪽 정렬
                    byte[] alignRight = {0x1B, 0x61, 0x02}; // 오른쪽 정렬
                    byte[] newLine = {0x0A}; // 한 줄 내리기
                    byte[] cutPaper = {0x1D, 0x56, 0x41, 0x10}; // 용지 절단

                    // byte[] printBytes = printData.getBytes();
                    //byte[] printBytes = {0x1B, 0x40};  // 프린터 초기화 명령
                    try {
                        outputStream.write(initPrinter);
                        outputStream.write(disableChinese);  // 중국어 코드 해제
                        outputStream.write(enableKoreanFont);
                        outputStream.write(setKoreanEncoding);
                        outputStream.write(alignCenter);
                        outputStream.write(boldOn);
                        outputStream.write(title.getBytes("EUC-KR"));
                        outputStream.write(boldOff);
                        outputStream.write(alignLeft);

                        outputStream.write(cutPaper);
                    } catch (Exception e) {

                    }
                    byte[] printBytes = outputStream.toByteArray();


                    int sentBytes = connection.bulkTransfer(usbEndpoint, printBytes, printBytes.length, 12000);
                    if (sentBytes > 0) {
                        Log.d("USB_PRINT", "전송 성공: " + sentBytes + " bytes");
                    } else {
                        Log.e("USB_PRINT", "전송 실패");
                    }

                    connection.close();
                }else {
                    Log.e("USB_PRINT", "엔드포인트를 찾을 수 없음.");

                }
            }
        }
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

            ContextCompat.registerReceiver(getReactApplicationContext(), usbReceiver, filter, ContextCompat.RECEIVER_EXPORTED);
            //mContext.registerReceiver(mContext, usbReceiver, filter, ContextCompat.RECEIVER_EXPORTED);
        //} else {
            //connectToDevice(device);
        //}
    }



}
