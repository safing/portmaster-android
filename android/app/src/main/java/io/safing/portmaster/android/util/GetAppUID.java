package io.safing.portmaster.android.util;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;

import io.safing.portmaster.android.go_interface.Function;

public class GetAppUID extends Function {

  private Context context = null;
  public GetAppUID(String name, Context context) {
    super(name);
    this.context = context;
  }

  @Override
  public byte[] call(byte[] args) throws Exception {
    ApplicationInfo info = this.context.getPackageManager().getApplicationInfo(
            context.getPackageName(), 0);

    return this.toResultFromObject(info.uid);
  }
}
