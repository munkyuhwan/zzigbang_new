package com.breadscanner.modules.printer;

public class PrinterInfo {
    public static final int TYPE_ETHERNET = 0;
    public static final int TYPE_BLUETOOTH = 1;
    public static final int TYPE_SERIAL = 2;
    public static final int TYPE_USB = 4;

    public int type;
    public String mPrintername;

    public int getType() {
        return this.type;
    }

    public String getTitle()   {
        return null;
    }

    public String getSubTitle() {
        return null;
    }

    public boolean is203dpi() {
        return false;
    }
    public void setPrintername(String name) {
        this.mPrintername = name;
    }

    public String getPrinterName() {
        return this.mPrintername;
    }

}
