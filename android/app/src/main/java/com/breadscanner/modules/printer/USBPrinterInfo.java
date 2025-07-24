package com.breadscanner.modules.printer;


import android.hardware.usb.UsbDevice;

import com.sam4s.usb.driver.UsbPrinterPort;
import com.sam4s.usb.driver.UsbPrinterProber;

public class USBPrinterInfo extends PrinterInfo {

    private UsbPrinterPort mUsbPrinterPort;

    public USBPrinterInfo(UsbPrinterPort port) {
        this.mUsbPrinterPort = port;
        this.type = TYPE_USB;
    }
    public UsbPrinterPort getPort() {
        return this.mUsbPrinterPort;
    }

    public String getTitle()   {
        if (mUsbPrinterPort != null) {
            UsbDevice device = mUsbPrinterPort.getDriver().getDevice();
            return String.format("Vendor 0x%04X Product 0x%04X", device.getVendorId(), device.getProductId());
        }
        return "unknown";
    }

    public String getSubTitle() {
        if (mUsbPrinterPort != null) {
            return mUsbPrinterPort.getDriver().getClass().getSimpleName();
        }
        return "";
    }

    public boolean is203dpi() {
        return  UsbPrinterProber.is203dpi_supprot(mUsbPrinterPort.getDriver().getDevice());
    }

}
