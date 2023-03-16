package io.safing.portmaster.android.os;

import android.os.Build;

import io.safing.portmaster.android.BuildConfig;
import io.safing.portmaster.android.go_interface.Function;
import io.safing.portmaster.android.go_interface.Result;

public class PlatformInfo extends Function {

  class Info {
    public String Model;
    public String Manufacturer;
    public String Brand;
    public String Board;
    public int SDK;
    public int VersionCode;
    public String VersionName;
    public String ApplicationID;
    public String BuildType;
  }

  public PlatformInfo(String name) {
    super(name);
  }

  @Override
  public byte[] call(byte[] args) throws Exception {
    Info info = new Info();
    info.Model = Build.MODEL;
    info.Manufacturer = Build.MANUFACTURER;
    info.Brand = Build.BRAND;
    info.Board = Build.BOARD;
    info.SDK = Build.VERSION.SDK_INT;
    info.VersionCode = BuildConfig.VERSION_CODE;
    info.VersionName = BuildConfig.VERSION_NAME;
    info.ApplicationID = BuildConfig.APPLICATION_ID;
    info.BuildType = BuildConfig.BUILD_TYPE;

    return toResultFromObject(info);
  }
}
