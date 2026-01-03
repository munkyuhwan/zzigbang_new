package com.breadscanner

import android.app.Application
import com.breadscanner.modules.MyEventPackage
import com.breadscanner.modules.bell.BellPackage
import com.breadscanner.modules.camera.CameraPackage
import com.breadscanner.modules.etc.EtcPackage
import com.breadscanner.modules.koces.KocesPayPackage
import com.breadscanner.modules.led.LedModule
import com.breadscanner.modules.led.LedPackage
import com.breadscanner.modules.printer.PrinterPackage
import com.breadscanner.modules.smartro.SmartroPayPackage
import com.breadscanner.modules.serial.SerialPackage
import com.breadscanner.modules.weight.ScalePackage
import com.breadscanner.modules.weight.WeightPackage
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
                add(KocesPayPackage())
                add(SmartroPayPackage())
                add(WeightPackage())
                add(PrinterPackage())
                add(CameraPackage())
                add(ScalePackage())
                add(BellPackage())
                add(SerialPackage())
                add(LedPackage())
                add(EtcPackage())
                add(MyEventPackage())
            }


        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }
  }
}
