package io.safing.portmaster.android.connectivity;

import android.app.PendingIntent;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.VpnService;
import android.os.Handler;
import android.os.Message;
import android.os.ParcelFileDescriptor;
import android.util.Log;
import android.util.Pair;
import android.widget.Toast;

import java.io.FileDescriptor;
import java.io.IOException;
import java.net.DatagramSocket;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import io.safing.android.R;
import io.safing.portmaster.android.ui.MainActivity;
import vpn.Vpn;
//import io.safing.portmaster.android.R;

public class PortmasterTunnelService extends VpnService implements Handler.Callback {

  public interface Prefs {
    String NAME = "connection";
    String SERVER_ADDRESS = "server.address";
    String SERVER_PORT = "server.port";
    String ALLOW = "allow";
    String PACKAGES = "packages";
  }

  private static final String TAG = PortmasterTunnelService.class.getSimpleName();
  public static final String ACTION_CONNECT = "io.safing.portmaster.vpn.START";
  public static final String ACTION_DISCONNECT = "io.safing.portmaster.vpn.STOP";
  private Handler mHandler;

  private static class Connection extends Pair<Thread, ParcelFileDescriptor> {
    public Connection(Thread thread, ParcelFileDescriptor pfd) {
      super(thread, pfd);
    }
  }

  private final AtomicReference<Thread> mConnectingThread = new AtomicReference<>();
  private final AtomicReference<Connection> mConnection = new AtomicReference<>();
  private AtomicInteger mNextConnectionId = new AtomicInteger(1);
  private PendingIntent mConfigureIntent;

  @Override
  public boolean protect(DatagramSocket socket) {
    ParcelFileDescriptor pfd = ParcelFileDescriptor.fromDatagramSocket(socket);
    FileDescriptor fd = pfd.getFileDescriptor();

    System.out.println("[VPN] protecting socket ... " + pfd.getFd());
    return super.protect(pfd.getFd());
  }

  @Override
  public void onCreate() {
    super.onCreate();

    // The handler is only used to show messages.
    if (mHandler == null) {
      mHandler = new Handler(this);
    }
    // Create the intent to "configure" the connection (just start PortmasterVPNService).
    mConfigureIntent = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class),
      PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE);
  }
  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    System.out.println("start received");
    if (intent != null && ACTION_DISCONNECT.equals(intent.getAction())) {
      disconnect();
      return START_NOT_STICKY;
    } else {
      connect();
      return START_STICKY;
    }
  }
  @Override
  public void onDestroy() {
    disconnect();
  }

  @Override
  public boolean handleMessage(Message message) {
    Toast.makeText(this, message.what, Toast.LENGTH_SHORT).show();

    if (message.what != R.string.disconnected) {
      updateForegroundNotification(message.what);
    }
    return true;
  }

  @Override
  public void onRevoke() {
    System.out.println("Revoked!");
    stopSelf();
  }

  private void connect() {

    // Become a foreground service. Background services can be VPN services too, but they can
    // be killed by background check before getting a chance to receive onRevoke().
    updateForegroundNotification(R.string.connecting);
    mHandler.sendEmptyMessage(R.string.connecting);
    // Extract information from the shared preferences.


    final SharedPreferences prefs = getSharedPreferences(Prefs.NAME, MODE_PRIVATE);
    final String server = prefs.getString(Prefs.SERVER_ADDRESS, "");
    final boolean allow = prefs.getBoolean(Prefs.ALLOW, true);
    final Set<String> packages = prefs.getStringSet(Prefs.PACKAGES, Collections.emptySet());

    startConnection(new PortmasterTunnel(
      this, mNextConnectionId.getAndIncrement(), server,
      allow, packages));
  }
  private void startConnection(final PortmasterTunnel connection) {
    System.out.println("starting portmaster tunnel thread");
    // Replace any existing connecting thread with the  new one.
    final Thread thread = new Thread(connection, "PortmasterTunnelThread");
    setConnectingThread(thread);
    // Handler to mark as connected once onEstablish is called.
    connection.setConfigureIntent(mConfigureIntent);
    connection.setOnEstablishListener(tunInterface -> {
      mHandler.sendEmptyMessage(R.string.connected);
      mConnectingThread.compareAndSet(thread, null);
      setConnection(new Connection(thread, tunInterface));
    });
    thread.start();
  }
  private void setConnectingThread(final Thread thread) {
    final Thread oldThread = mConnectingThread.getAndSet(thread);
    if (oldThread != null) {
      oldThread.interrupt();
    }
  }
  private void setConnection(final Connection connection) {
    final Connection oldConnection = mConnection.getAndSet(connection);
    if (oldConnection != null) {
      try {
        oldConnection.first.interrupt();
        oldConnection.second.close();
      } catch (IOException e) {
        Log.e(TAG, "Closing VPN interface", e);
      }
    }
  }
  private void disconnect() {
    Vpn.stop();
    mHandler.sendEmptyMessage(R.string.disconnected);
    setConnectingThread(null);
    setConnection(null);
    stopForeground(true);
  }

  private void updateForegroundNotification(final int message) {
//    final String NOTIFICATION_CHANNEL_ID = "PortmasterVpn";
//    NotificationManager mNotificationManager = (NotificationManager) getSystemService(
//      NOTIFICATION_SERVICE);
//    mNotificationManager.createNotificationChannel(new NotificationChannel(
//      NOTIFICATION_CHANNEL_ID, NOTIFICATION_CHANNEL_ID,
//      NotificationManager.IMPORTANCE_DEFAULT));
//    startForeground(1, new Notification.Builder(this, NOTIFICATION_CHANNEL_ID)
//      .setSmallIcon(R.drawable.ic_vpn)
//      .setContentText(getString(message))
//      .setContentIntent(mConfigureIntent)
//      .build());
  }
}
