package io.safing.portmaster.android.util;

import android.app.Activity;
import io.safing.portmaster.android.go_interface.Function;

public class MinimizeApp extends Function {

  private Activity activity;

  public MinimizeApp(String name, Activity activity) {
      super(name);
      this.activity = activity;
  }

  @Override
  public byte[] call(byte[] args) throws Exception {
    this.activity.moveTaskToBack(false);
    return null;
  }
}
