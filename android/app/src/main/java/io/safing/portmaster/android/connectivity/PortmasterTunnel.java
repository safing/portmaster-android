package io.safing.portmaster.android.connectivity;

import android.app.PendingIntent;
import android.content.pm.PackageManager;
import android.net.VpnService;
import android.os.ParcelFileDescriptor;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.net.InterfaceAddress;
import java.net.NetworkInterface;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import io.safing.android.BuildConfig;
import tunnel.Tunnel;

public class PortmasterTunnel implements Runnable {
  /**
   * Callback interface to let the {@link PortmasterTunnelService} know about new connections
   * and update the foreground notification with connection status.
   */
  public interface OnEstablishListener {
    void onEstablish(ParcelFileDescriptor tunInterface);
  }
  /** Maximum packet size is constrained by the MTU, which is given as a signed short. */
  private static final int MAX_PACKET_SIZE = Short.MAX_VALUE;
  /** Time to wait in between losing the connection and retrying. */
  private static final long RECONNECT_WAIT_MS = TimeUnit.SECONDS.toMillis(3);
  /** Time between keepalives if there is no traffic at the moment.
   *
   * TODO: don't do this; it's much better to let the connection die and then reconnect when
   *       necessary instead of keeping the network hardware up for hours on end in between.
   **/
  private static final long KEEPALIVE_INTERVAL_MS = TimeUnit.SECONDS.toMillis(15);
  /** Time to wait without receiving any response before assuming the server is gone. */
  private static final long RECEIVE_TIMEOUT_MS = TimeUnit.SECONDS.toMillis(20);
  /**
   * Time between polling the VPN interface for new traffic, since it's non-blocking.
   *
   * TODO: really don't do this; a blocking read on another thread is much cleaner.
   */
  private static final long IDLE_INTERVAL_MS = TimeUnit.MILLISECONDS.toMillis(100);
  /**
   * Number of periods of length {@IDLE_INTERVAL_MS} to wait before declaring the handshake a
   * complete and abject failure.
   *
   * TODO: use a higher-level protocol; hand-rolling is a fun but pointless exercise.
   */
  private static final int MAX_HANDSHAKE_ATTEMPTS = 50;

  private final VpnService mService;
  private final int mConnectionId;
  private final String mServerName;
  private PendingIntent mConfigureIntent;
  private OnEstablishListener mOnEstablishListener;

  // Allowed/Disallowed packages for VPN usage
  private final boolean mAllow;
  private final Set<String> disabledPackages;

  public PortmasterTunnel(final VpnService service, final int connectionId,
                          final String serverName,
                          boolean allow, final Set<String> packages) {
    mService = service;
    mConnectionId = connectionId;
    mServerName = serverName;
    mAllow = allow;
    disabledPackages = packages;
  }
  /**
   * Optionally, set an intent to configure the VPN. This is {@code null} by default.
   */
  public void setConfigureIntent(PendingIntent intent) {
    mConfigureIntent = intent;
  }
  public void setOnEstablishListener(OnEstablishListener listener) {
    mOnEstablishListener = listener;
  }
  @Override
  public void run() {
    try {
      Log.i(getTag(), "Connecting...");
      // We can enable tunneling even if there is no internet access
      ParcelFileDescriptor vpnInterface = startVPN();
      Tunnel.start(vpnInterface.getFd());
    } catch (Exception e) {
      Log.e(getTag(), "Connection failed, exiting", e);
    }

    // Sleep while the connection is active
    // TODO: Can this be handled with an event?
    while(Tunnel.isActive()) {
      try {
        Thread.sleep(500);
      } catch (InterruptedException e) {
        // ignore error
      }
    }
  }

  private ParcelFileDescriptor startVPN() throws IllegalArgumentException {
    // Configure a builder while parsing the parameters.
    // TODO(ppacher): for a real VPN, those settings are normally pushed
    //                by the VPN server.
    VpnService.Builder builder = mService.new Builder()
      .setMtu(1500)
      .addAddress("10.0.2.15", 24)
      .addRoute("0.0.0.0", 0)
      .addDnsServer("9.9.9.9");

    try {
      // Disable routing this app traffic through the tunnel interface
      builder.addDisallowedApplication(BuildConfig.APPLICATION_ID);

      // Disable routing for user selected applications
      for (String packageName : this.disabledPackages) {
          builder.addDisallowedApplication(packageName);
      }
    }catch (PackageManager.NameNotFoundException ex) {
      Log.v(getTag(), ex.toString());
    }
//    Activity.getApplicationContext();
//    Settings.getDisabledApps(getActivity());

    builder.setSession(mServerName).setConfigureIntent(mConfigureIntent);

    // Create a new interface using the builder and save the parameters.
    final ParcelFileDescriptor tunnelInterface;
    synchronized (mService) {
      tunnelInterface = builder.establish();
      if (mOnEstablishListener != null) {
        mOnEstablishListener.onEstablish(tunnelInterface);
      }
    }
    Log.i(getTag(), "New tunnel interface: " + tunnelInterface);

    return tunnelInterface;
  }

  private final String getTag() {
    return PortmasterTunnel.class.getSimpleName() + "[" + mConnectionId + "]";
  }
}
