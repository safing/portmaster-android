package io.safing.portmaster.android.util;

import android.content.Context;

import androidx.core.app.NotificationManagerCompat;

import io.safing.portmaster.android.go_interface.Function;

public class CancelNotification extends Function {
  private Context context;

  public CancelNotification(String name, Context context) {
    super(name);
    this.context = context;
  }

  @Override
  public byte[] call(byte[] args) throws Exception {
    int deleteId = parseArguments(args, int.class);
    NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this.context);
    notificationManager.cancel(deleteId);
    return null;
  }
}
