package io.safing.portmaster.android.util;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.VpnService;
import android.os.ParcelFileDescriptor;
import android.util.Log;

import java.io.IOException;

import io.safing.android.BuildConfig;
import io.safing.portmaster.android.connectivity.PortmasterTunnelService;
import io.safing.portmaster.android.go_interface.Function;
import io.safing.portmaster.android.go_interface.Result;
import io.safing.portmaster.android.ui.MainActivity;

public class ToggleTunnel extends Function {

  private MainActivity activity;


  public ToggleTunnel(String name, MainActivity activity) {
    super(name);
    this.activity = activity;
  }

  @Override
  public byte[] call(byte[] args) throws Exception {
    boolean enabled = parseArguments(args, boolean.class);
    this.toggle(enabled);

    return null;
  }

  public void toggle(boolean enabled) {
    Intent intent = VpnService.prepare(activity.getApplicationContext());
    if(intent == null) {
      // Already prepared, send the command
      intent = new Intent(activity, PortmasterTunnelService.class);
      if (enabled) {
        intent.setAction(PortmasterTunnelService.ACTION_CONNECT);
      } else {
        intent.setAction(PortmasterTunnelService.ACTION_DISCONNECT);
      }
      activity.startService(intent);
    } else {
      // It doesn't make sens to request permission for disconnecting the vpn.
      if(!enabled) {
        return;
      }
      // request user permissions
      activity.startActivityForResult(intent, MainActivity.REQUEST_VPN_PERMISSION);
    }
  }
}
