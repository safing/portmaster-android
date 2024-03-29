package io.safing.portmaster.android.connectivity;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.VpnService;
import android.os.Build;
import android.os.Handler;
import android.os.Message;
import android.os.ParcelFileDescriptor;
import android.os.PowerManager;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;

import java.net.DatagramSocket;
import java.util.Set;

import engine.Engine;
import io.safing.portmaster.android.R;
import io.safing.portmaster.android.go_interface.Function;
import io.safing.portmaster.android.go_interface.GoInterface;
import io.safing.portmaster.android.os.NetworkProxy;
import io.safing.portmaster.android.os.OSFunctions;
import io.safing.portmaster.android.receiver.SystemIdleEventReceiver;
import io.safing.portmaster.android.settings.Settings;
import io.safing.portmaster.android.ui.MainActivity;
import io.safing.portmaster.android.util.CancelNotification;
import io.safing.portmaster.android.util.ConnectionOwner;
import io.safing.portmaster.android.util.GetAppUID;
import io.safing.portmaster.android.util.ShowNotification;
import io.safing.portmaster.android.util.VPNInit;
import io.safing.portmaster.android.util.VPNProtect;
import tunnel.Tunnel;

public class PortmasterTunnelService extends VpnService implements Handler.Callback {

  public static final String COMMAND_PREFIX = "io.safing.portmaster.tunnel.";
  public static final String ACTION_KEEP_ALIVE = COMMAND_PREFIX + "keep_alive";
  public static final String ACTION_SHUTDOWN = COMMAND_PREFIX + "shutdown";

  private PendingIntent mConfigureIntent;

  BroadcastReceiver systemIdleEventReceiver = null;
  ConnectivityManager.NetworkCallback networkCallback = null;

  private Function showNotification;
  private Function cancelNotification;
  private Function ignoreSocket;
  private Function connectionOwner;
  private Function vpnInit;
  private Function appUid;

  @Override
  public boolean protect(DatagramSocket socket) {
    ParcelFileDescriptor pfd = ParcelFileDescriptor.fromDatagramSocket(socket);

    System.out.println("[VPN] protecting socket ... " + pfd.getFd());
    return super.protect(pfd.getFd());
  }

  @Override
  public void onCreate() {
    // Send OS functions to go.
    Engine.setOSFunctions(OSFunctions.get());

    super.onCreate();

    // Register receivers for system events.
    registerEvents();

    // Create the intent to "configure" the connection (just start PortmasterVPNService).
    mConfigureIntent = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class),
      PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE);

    GoInterface uiInterface = new GoInterface();

    // VPN service init
    this.vpnInit = new VPNInit("VPNInit", this);
    uiInterface.registerFunction(this.vpnInit);

    // Notifications
    createNotificationChannel();
    this.showNotification = new ShowNotification("ShowNotification", this);
    uiInterface.registerFunction(this.showNotification);

    this.cancelNotification = new CancelNotification("CancelNotification", this);
    uiInterface.registerFunction(this.cancelNotification);

    // Set socket to not be routed trough the tunnel.
    this.ignoreSocket = new VPNProtect("IgnoreSocket", this);
    uiInterface.registerFunction(this.ignoreSocket);

    // Get uid get for a connection.
    ConnectivityManager connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
    this.connectionOwner = new ConnectionOwner("GetConnectionOwner", connectivityManager);
    uiInterface.registerFunction(this.connectionOwner);

    // Get current app uid
    this.appUid = new GetAppUID("GetAppUID", this);
    uiInterface.registerFunction(this.appUid);

    // Send reference to java the functions.
    Engine.setServiceFunctions(uiInterface);

    // Start go module with path to the data dir
    Log.v("PortmasterTunnelService", "Engine on Create from service");
    Engine.onCreate(this.getFilesDir().getAbsolutePath());
  }

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    if (intent != null && ACTION_SHUTDOWN.equals(intent.getAction())) {
      return START_NOT_STICKY;
    }

    // Everything that is not a shutdown command just enable the tunnel.
    Tunnel.enable();
    return START_STICKY;
  }

  @Override
  public void onDestroy() {
    unregisterSystemEvents();
    // Send destroy signal to go library, App may still be running
    Engine.onServiceDestroy();
    stopForeground(true);
  }

  @Override
  public boolean handleMessage(Message message) {
    Toast.makeText(this, message.what, Toast.LENGTH_SHORT).show();
    return true;
  }

  @Override
  public void onRevoke() {
    System.out.println("Revoked!");
    stopSelf();
  }

  public int InitVPN() {
    // Create tunnel interface.
    Builder builder = this.new Builder()
      .setMtu(1500)
      .addAddress("100.127.247.245", 30)
      .addRoute("0.0.0.0", 0)
      .addDnsServer("9.9.9.9");

    Set<String> disabledPackages = Settings.getDisabledApps(this);
    for (String packageName : disabledPackages) {
      try {
        builder.addDisallowedApplication(packageName);
      } catch (PackageManager.NameNotFoundException e) {
        e.printStackTrace();
      }
    }

    builder.setSession("spn-server");
    builder.setConfigureIntent(mConfigureIntent);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      // Setting metered to false will mimic metering of the active interface.
      builder.setMetered(false);
    }

    // Create a new interface using the builder and save the parameters.
    synchronized (this) {
      ParcelFileDescriptor fd = builder.establish();
      if(fd != null) {
        return fd.detachFd();
      }
    }

    return 0;
  }

  private void createNotificationChannel() {
    // Create the NotificationChannel, but only on API 26+ because
    // the NotificationChannel class is new and not in the support library
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      String name = getString(R.string.notification_channel_name);
      String description = getString(R.string.notification_channel_description);
      int importance = NotificationManager.IMPORTANCE_DEFAULT;
      NotificationChannel channel = new NotificationChannel(MainActivity.CHANNEL_ID, name, importance);
      channel.setDescription(description);
      // Register the channel with the system; you can't change the importance
      // or other notification behaviors after this
      NotificationManager notificationManager = getSystemService(NotificationManager.class);
      notificationManager.createNotificationChannel(channel);
    }
  }

  private void registerEvents() {
    // System sleep events
    systemIdleEventReceiver = new SystemIdleEventReceiver();

    IntentFilter filter = new IntentFilter(PowerManager.ACTION_DEVICE_IDLE_MODE_CHANGED);
    this.registerReceiver(systemIdleEventReceiver, filter);

    // Network interfaces change events
    networkCallback = new NetworkCallbacks();
    ConnectivityManager connectivityManager = null;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      connectivityManager = getApplicationContext().getSystemService(ConnectivityManager.class);
      connectivityManager.registerDefaultNetworkCallback(networkCallback);
    }
  }

  private void unregisterSystemEvents() {
    if(systemIdleEventReceiver != null) {
      this.unregisterReceiver(systemIdleEventReceiver);
      systemIdleEventReceiver = null;
    }

    if(networkCallback != null) {
      ConnectivityManager connectivityManager = null;
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        connectivityManager = getApplicationContext().getSystemService(ConnectivityManager.class);
        connectivityManager.registerDefaultNetworkCallback(networkCallback);
      }
      networkCallback = null;
    }
  }
}
