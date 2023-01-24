package io.safing.portmaster.android.util;

import android.os.Build;

import io.safing.portmaster.android.go_interface.Function;
import io.safing.portmaster.android.go_interface.Result;

public class PlatformInfo extends Function {

  class Info {
    public String Model;
    public String Manufacturer;
    public String Brand;
    public String Board;
    public int Base;
    public String Incremental;
    public int SDK;
    public String VersionCode;
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
    info.Base = Build.VERSION_CODES.BASE;
    info.Incremental = Build.VERSION.INCREMENTAL;
    info.SDK = Build.VERSION.SDK_INT;
    info.VersionCode =  Build.VERSION.RELEASE;

    return toResultFromObject(info);
  }
}
