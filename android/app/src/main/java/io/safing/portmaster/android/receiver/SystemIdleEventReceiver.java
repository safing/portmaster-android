package io.safing.portmaster.android.receiver;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;

import engine.Engine;

public class SystemIdleEventReceiver extends BroadcastReceiver {

  @Override
  public void onReceive(Context context, Intent intent) {
    PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      Engine.onIdleModeChanged(pm.isDeviceIdleMode());
    }
  }
}
