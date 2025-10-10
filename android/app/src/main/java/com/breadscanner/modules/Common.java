package com.breadscanner.modules;

import android.util.Log;

import com.hoho.android.usbserial.driver.UsbSerialDriver;
import com.hoho.android.usbserial.driver.UsbSerialPort;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Common {

    public List<UsbSerialPort> getCDCPorts(List<UsbSerialDriver> availableDrivers) {
        List<UsbSerialPort> ports = null;
        for(var i=0;i<availableDrivers.size();i++ ) {
            if(availableDrivers.get(i).getDevice().getDeviceProtocol() == 1) {
                ports = availableDrivers.get(i).getPorts();
            }
        }
        return ports;
    }

    public static Double parseValue(String input) {
        if (input == null) return null;

        String[] parts = input.split(String.valueOf((char) 0x02)); // STX(0x02) 기준으로 자르기
        String lastPacket = null;

        for (String part : parts) {
            int etxIndex = part.indexOf((char) 0x03); // ETX(0x03) 위치 찾기
            if (etxIndex != -1) {
                lastPacket = part.substring(0, etxIndex).trim(); // STX~ETX 사이 텍스트
            }
        }

        if (lastPacket == null || lastPacket.isEmpty()) return 0.0;

        // 예: lastPacket = "AS 00.128kga"
        return parseWeightValue(lastPacket);

        /*
        // 정규식: 정수 또는 소수 (예: 123, 00.096, 45.7)
        Log.d("WeightModule", "input: " + input);

        Pattern pattern = Pattern.compile("\\d+\\.\\d+");
        Matcher matcher = pattern.matcher(input);

        if (matcher.find()) {
            return Double.parseDouble(matcher.group());
        }
        return null;

         */

    }
    private static Double parseWeightValue(String packet) {
        try {
            // 숫자, 소수점, 부호만 남기기
            String numeric = packet.replaceAll("[^0-9.\\-]", "");
            if (numeric.isEmpty()) return 0.0;
            return Double.parseDouble(numeric);
        } catch (Exception e) {
            return 0.0;
        }
    }




}
