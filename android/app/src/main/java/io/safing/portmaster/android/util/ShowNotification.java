package io.safing.portmaster.android.util;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;


import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import io.safing.portmaster.android.R;
import io.safing.portmaster.android.go_interface.Function;
import io.safing.portmaster.android.ui.MainActivity;

public class ShowNotification extends Function {

  public static class Args {
    public int ID;
    public String Title;
    public String Message;
  }

  private Context context;

  public ShowNotification(String name, Context context) {
    super(name);
    this.context = context;
  }

  @Override
  public byte[] call(byte[] args) throws Exception {
    Args notificationArgs = parseArguments(args, ShowNotification.Args.class);

    Intent intent = new Intent(this.context, MainActivity.class);
    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    PendingIntent pendingIntent = PendingIntent.getActivity(this.context, 0, intent, PendingIntent.FLAG_IMMUTABLE);
    NotificationCompat.Builder builder = new NotificationCompat.Builder(this.context, MainActivity.CHANNEL_ID)
      .setSmallIcon(R.drawable.notify_icon)
      .setContentTitle(notificationArgs.Title)
      .setContentText(notificationArgs.Message)
      .setPriority(NotificationCompat.PRIORITY_DEFAULT)
      .setContentIntent(pendingIntent)
      .setStyle(new NotificationCompat.BigTextStyle()
        .bigText(notificationArgs.Message))
      .setAutoCancel(true);
    NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this.context);
    notificationManager.notify(notificationArgs.ID, builder.build());
    return null;
  }
}
