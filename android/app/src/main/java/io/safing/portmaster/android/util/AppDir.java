package io.safing.portmaster.android.util;

import android.content.Context;

import io.safing.portmaster.android.go_interface.Function;
import io.safing.portmaster.android.go_interface.Result;

public class AppDir extends Function {

  private Context context;

  public AppDir(String name, Context context) {
      super(name);
      this.context = context;
  }

  @Override
  public Result call(byte[] args) {
    String appDir = this.context.getFilesDir().getAbsolutePath();
    return toResultFromString(appDir);
  }
}
