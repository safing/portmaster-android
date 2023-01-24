package io.safing.portmaster.android.util;

import android.content.Context;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import io.safing.portmaster.android.go_interface.Function;
import io.safing.portmaster.android.go_interface.Result;

public class AppDir extends Function {

  private Context context;

  public AppDir(String name, Context context) {
      super(name);
      this.context = context;
  }

  @Override
  public byte[] call(byte[] args) throws Exception {
    String appDir = this.context.getFilesDir().getAbsolutePath();
    return appDir.getBytes(StandardCharsets.UTF_8);
  }
}
