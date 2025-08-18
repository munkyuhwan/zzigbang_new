package com.breadscanner.modules;

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

        // 정규식: 정수 또는 소수 (예: 123, 00.096, 45.7)
        Pattern pattern = Pattern.compile("\\d+\\.\\d+");
        Matcher matcher = pattern.matcher(input);

        if (matcher.find()) {
            return Double.parseDouble(matcher.group());
        }
        return null;
    }



}
