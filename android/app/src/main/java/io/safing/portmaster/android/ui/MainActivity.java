package io.safing.portmaster.android.ui;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;

import com.getcapacitor.BridgeActivity;

import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import java.util.List;

import engine.Engine;
import io.safing.android.R;
import io.safing.portmaster.android.connectivity.PortmasterTunnelService;
import io.safing.portmaster.android.go_interface.GoInterface;
import io.safing.portmaster.android.os.OSFunctions;
import io.safing.portmaster.android.util.AppDir;
import io.safing.portmaster.android.util.CancelNotification;
import io.safing.portmaster.android.os.NetworkAddresses;
import io.safing.portmaster.android.os.NetworkInterfaces;
import io.safing.portmaster.android.util.DebugInfoDialog;
import io.safing.portmaster.android.util.ShowNotification;
import io.safing.portmaster.android.os.PlatformInfo;
import io.safing.portmaster.android.util.ToggleTunnel;
import io.safing.portmaster.android.util.UIEvent;

public class MainActivity extends BridgeActivity {

  public static final int REQUEST_VPN_PERMISSION = 1;
  public static final int EXPORT_DEBUG_INFO = 3;

  public static final String CHANNEL_ID = "Portmaster";

  // Function objects that are called from go
  private ToggleTunnel toggleTunnel;
  private UIEvent sendUIEvent;
  private DebugInfoDialog getDebugInfoDialogFunction;

  private ShowNotification showNotification;
  private CancelNotification cancelNotification;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Register plugins for UI.
    registerPlugin(GoBridge.class);
    registerPlugin(JavaBridge.class);

    // Send OS functions to go.
    Engine.setOSFunctions(OSFunctions.get());

    super.onCreate(savedInstanceState);

    // Prepare UI functions
    GoInterface uiInterface = new GoInterface();

    // UI
    this.toggleTunnel = new ToggleTunnel("ToggleTunnel", this);
    uiInterface.registerFunction(this.toggleTunnel);

    this.sendUIEvent = new UIEvent("SendUIEvent", this.getBridge());
    uiInterface.registerFunction(this.sendUIEvent);

    // Debug info
    this.getDebugInfoDialogFunction = new DebugInfoDialog("ExportDebugInfo", this, EXPORT_DEBUG_INFO);
    uiInterface.registerFunction(this.getDebugInfoDialogFunction);

    // Notifications
    createNotificationChannel();
    this.showNotification = new ShowNotification("ShowNotification", this);
    uiInterface.registerFunction(this.showNotification);

    this.cancelNotification = new CancelNotification("CancelNotification", this);
    uiInterface.registerFunction(this.cancelNotification);

    Engine.setActivityFunctions(uiInterface);
    Engine.onCreate(this.getFilesDir().getAbsolutePath());
  }

  @Override
  public void onResume() {
    super.onResume();
  }

  @Override
  public void onPause() {
    super.onPause();
  }

  @Override
  public void onDestroy() {
    super.onDestroy();
    Engine.onActivityDestroy();
  }

  @Override
  protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);

    if (resultCode != RESULT_OK) {
      return;
    }

    if(requestCode == REQUEST_VPN_PERMISSION) {
      this.toggleTunnel.toggle("connect");
    }

    if(requestCode == EXPORT_DEBUG_INFO) {
      Uri uri = data.getData();
      getDebugInfoDialogFunction.writeToFile(uri);
    }
  }

  private void createNotificationChannel() {
    // Create the NotificationChannel, but only on API 26+ because
    // the NotificationChannel class is new and not in the support library
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      String name = getString(R.string.notification_channel_name);
      String description = getString(R.string.notification_channel_description);
      int importance = NotificationManager.IMPORTANCE_DEFAULT;
      NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
      channel.setDescription(description);
      // Register the channel with the system; you can't change the importance
      // or other notification behaviors after this
      NotificationManager notificationManager = getSystemService(NotificationManager.class);
      notificationManager.createNotificationChannel(channel);
    }
  }

}
