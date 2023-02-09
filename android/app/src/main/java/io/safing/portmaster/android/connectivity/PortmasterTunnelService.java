package io.safing.portmaster.android.connectivity;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.VpnService;
import android.os.Build;
import android.os.Handler;
import android.os.Message;
import android.os.ParcelFileDescriptor;
import android.util.Log;
import android.widget.Toast;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import java.net.DatagramSocket;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import engine.Engine;
import io.safing.android.BuildConfig;
import io.safing.android.R;
import io.safing.portmaster.android.go_interface.Function;
import io.safing.portmaster.android.go_interface.GoInterface;
import io.safing.portmaster.android.os.OSFunctions;
import io.safing.portmaster.android.settings.Settings;
import io.safing.portmaster.android.ui.MainActivity;
import io.safing.portmaster.android.util.CancelNotification;
import io.safing.portmaster.android.util.ConnectionOwner;
import io.safing.portmaster.android.util.ShowNotification;
import io.safing.portmaster.android.util.VPNProtect;
import tunnel.Tunnel;

public class PortmasterTunnelService extends VpnService implements Handler.Callback {

  public static final String COMMAND_PREFIX = "io.safing.portmaster.tunnel.";
  public static final String ACTION_CONNECT = COMMAND_PREFIX + "connect";
  public static final String ACTION_DISCONNECT = COMMAND_PREFIX + "disconnect";
  public static final String ACTION_RECONNECT = COMMAND_PREFIX + "reconnect";

  private PendingIntent mConfigureIntent;

  private Function showNotification;
  private Function cancelNotification;
  private Function ignoreSocket;
  private Function connectionOwner;

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

    // Create the intent to "configure" the connection (just start PortmasterVPNService).
    mConfigureIntent = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class),
      PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE);

    GoInterface uiInterface = new GoInterface();
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

    // Send reference to java the functions.
    Engine.setServiceFunctions(uiInterface);

    // Start go module with path to the data dir
    Engine.onCreate(this.getFilesDir().getAbsolutePath());
  }

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    // Handle connect disconnect events.
    if (ACTION_DISCONNECT.equals(intent.getAction())) {
      Tunnel.onTunnelDisconnected();
      return START_NOT_STICKY;
    } else if(ACTION_CONNECT.equals(intent.getAction())) {
      int fd = setup();
      Tunnel.onTunnelConnected(fd);
      return START_STICKY;
    } else if (ACTION_RECONNECT.equals(intent.getAction())) {
      Tunnel.onTunnelDisconnected();
      int fd = setup();
      Tunnel.onTunnelConnected(fd);
      return START_STICKY;
    }

    // Probably an always-on vpn start request.
    if(!Tunnel.isActive()) {
      Log.v("TunnelService", "Always-on VPN start");
      int fd = setup();
      Tunnel.onTunnelConnected(fd);
      return START_STICKY;
    }

    // Unknown command. This should not happen.
    return START_NOT_STICKY;
  }

  @Override
  public void onDestroy() {
    // Send destroy signal to go library, App may still be running
    Engine.onServiceDestroy();
    disconnect();
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

  private int setup() {
    // Create tunnel interface.
    VpnService.Builder builder = this.new Builder()
      .setMtu(1500)
      .addAddress("10.0.2.15", 24)
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

    // Create a new interface using the builder and save the parameters.
    final ParcelFileDescriptor tunnelInterface;
    synchronized (this) {
      ParcelFileDescriptor fd = builder.establish();
      if(fd != null) {
        return fd.detachFd();
      }
    }

    return 0;
  }

  private void disconnect() {
    stopForeground(true);
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
}
