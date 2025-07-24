package com.breadscanner.modules;

import com.hoho.android.usbserial.driver.UsbSerialDriver;
import com.hoho.android.usbserial.driver.UsbSerialPort;

import java.util.List;

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
}
